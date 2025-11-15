import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { cache, CACHE_TTL, CACHE_PREFIX, generateCacheKey } from '@/lib/cache';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface AnalyticsData {
  totalSessions: number;
  totalFocusTime: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  topTag: string | null;
  focusScoreAverage: number;
  weeklyTrend: 'improving' | 'declining' | 'stable';
}

async function calculateAnalytics(userId: string): Promise<AnalyticsData> {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get all sessions for the user
  const allSessions = await prisma.pomodoroLog.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    select: {
      duration: true,
      focusScore: true,
      completedAt: true,
      tagId: true,
      tag: {
        select: {
          name: true
        }
      }
    }
  });

  // Get this week's sessions
  const weekSessions = allSessions.filter(s => s.completedAt && s.completedAt >= weekAgo);
  
  // Calculate metrics
  const totalSessions = allSessions.length;
  const totalFocusTime = Math.round(allSessions.reduce((sum, s) => sum + s.duration, 0) / 60);
  const averageSessionDuration = totalSessions > 0 
    ? Math.round(allSessions.reduce((sum, s) => sum + s.duration, 0) / totalSessions)
    : 0;
  const sessionsThisWeek = weekSessions.length;
  const focusScoreAverage = allSessions.length > 0
    ? Math.round(allSessions.filter(s => s.focusScore).reduce((sum, s) => sum + (s.focusScore || 0), 0) / allSessions.filter(s => s.focusScore).length)
    : 0;

  // Calculate streaks
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const sortedByDate = [...allSessions].sort((a, b) => {
    const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return dateB - dateA;
  });

  let lastDate: Date | null = null;
  for (const session of sortedByDate) {
    if (!session.completedAt) continue;
    
    const sessionDate = new Date(session.completedAt);
    sessionDate.setHours(0, 0, 0, 0);

    if (!lastDate) {
      lastDate = sessionDate;
      tempStreak = 1;
      currentStreak = 1;
    } else {
      const dayDiff = (lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24);
      if (dayDiff === 1) {
        tempStreak++;
        currentStreak = tempStreak;
      } else if (dayDiff > 1) {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      lastDate = sessionDate;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  // Get top tag
  const tagCounts = new Map<string, number>();
  allSessions.forEach(s => {
    if (s.tag?.name) {
      tagCounts.set(s.tag.name, (tagCounts.get(s.tag.name) || 0) + 1);
    }
  });
  const topTag = tagCounts.size > 0
    ? Array.from(tagCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Calculate weekly trend
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const thisWeekCount = weekSessions.length;
  const lastWeekCount = allSessions.filter(s => s.completedAt && s.completedAt >= twoWeeksAgo && s.completedAt < weekAgo).length;
  
  let weeklyTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (thisWeekCount > lastWeekCount * 1.1) weeklyTrend = 'improving';
  else if (thisWeekCount < lastWeekCount * 0.9) weeklyTrend = 'declining';

  return {
    totalSessions,
    totalFocusTime,
    currentStreak,
    longestStreak,
    averageSessionDuration,
    sessionsThisWeek,
    topTag,
    focusScoreAverage,
    weeklyTrend
  };
}

async function generateAIInsight(analytics: AnalyticsData): Promise<string> {
  if (!GROQ_API_KEY) {
    return "Keep up your amazing focus sessions! You're building great habits.";
  }

  const prompt = `Based on these productivity analytics, generate a short, encouraging, and personalized insight (2-3 sentences max):
- Total focus sessions: ${analytics.totalSessions}
- Total focus time: ${analytics.totalFocusTime} hours
- Current streak: ${analytics.currentStreak} days
- Average session duration: ${analytics.averageSessionDuration} minutes
- Sessions this week: ${analytics.sessionsThisWeek}
- Focus score average: ${analytics.focusScoreAverage}%
- Top focus area: ${analytics.topTag || 'General'}
- Weekly trend: ${analytics.weeklyTrend}

Generate an insight that acknowledges their progress and provides one actionable suggestion. Keep it motivational and concise.`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error('GROQ API error:', response.statusText);
      return "Keep up your amazing focus sessions! You're building great habits.";
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Keep up your amazing focus sessions! You're building great habits.";
  } catch (error) {
    console.error('Error generating AI insight:', error);
    return "Keep up your amazing focus sessions! You're building great habits.";
  }
}

// GET /api/profile/insights - Get user analytics and AI insights
export const GET = withRateLimit(requireAuth(async (_request: NextRequest, _context, user: User) => {
  try {
    // Try to get from cache (cache for 24 hours)
    const cacheKey = generateCacheKey(CACHE_PREFIX.ANALYTICS, `insights:${user.id}`);
    const cachedInsights = await cache.get<{
      analytics: AnalyticsData;
      insight: string;
      generatedAt: string;
    }>(cacheKey);

    if (cachedInsights) {
      return NextResponse.json(cachedInsights);
    }

    // Calculate analytics
    const analytics = await calculateAnalytics(user.id);

    // Generate AI insight
    const insight = await generateAIInsight(analytics);

    const response = {
      analytics,
      insight,
      generatedAt: new Date().toISOString()
    };

    // Cache for 24 hours
    await cache.set(cacheKey, response, CACHE_TTL.ANALYTICS * 144); // 24 hours

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}), 'read');
