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

  // Add day of week for more varied insights
  const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  const prompt = `You are a supportive productivity coach. Today is ${dayOfWeek}. Based on these productivity analytics, generate a unique, encouraging, and personalized insight (2-3 sentences max):

Analytics:
- Total focus sessions: ${analytics.totalSessions}
- Total focus time: ${analytics.totalFocusTime} hours
- Current streak: ${analytics.currentStreak} days
- Longest streak: ${analytics.longestStreak} days
- Average session duration: ${analytics.averageSessionDuration} minutes
- Sessions this week: ${analytics.sessionsThisWeek}
- Focus score average: ${analytics.focusScoreAverage}%
- Top focus area: ${analytics.topTag || 'General'}
- Weekly trend: ${analytics.weeklyTrend}

Requirements:
1. Acknowledge their specific progress (mention actual numbers)
2. Provide ONE actionable, specific suggestion based on their data
3. Keep it motivational but genuine (avoid generic praise)
4. Make it feel personal and unique to their situation
5. Consider the day of the week in your suggestion

Generate a fresh, unique insight that would be different from yesterday's.`;

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
            role: 'system',
            content: 'You are a supportive productivity coach who provides personalized, data-driven insights. Keep responses concise and actionable.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8, // Higher temperature for more variety
        max_tokens: 200,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GROQ API error:', response.status, errorText);
      return "Keep up your amazing focus sessions! You're building great habits.";
    }

    const data = await response.json();
    const insight = data.choices[0]?.message?.content?.trim();
    
    if (!insight) {
      console.error('No insight generated from GROQ API');
      return "Keep up your amazing focus sessions! You're building great habits.";
    }
    
    return insight;
  } catch (error) {
    console.error('Error generating AI insight:', error);
    return "Keep up your amazing focus sessions! You're building great habits.";
  }
}

// GET /api/profile/insights - Get user analytics and AI insights
export const GET = withRateLimit(requireAuth(async (_request: NextRequest, _context, user: User) => {
  try {
    // Get today's date as a string (YYYY-MM-DD) to ensure daily regeneration
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = generateCacheKey(CACHE_PREFIX.ANALYTICS, `insights:${user.id}:${today}`);
    
    // Try to get from cache (cached until end of day)
    const cachedInsights = await cache.get<{
      analytics: AnalyticsData;
      insight: string;
      generatedAt: string;
    }>(cacheKey);

    if (cachedInsights) {
      console.log('Returning cached insights for', today);
      return NextResponse.json(cachedInsights);
    }

    console.log('Generating new insights for', today);

    // Calculate analytics
    const analytics = await calculateAnalytics(user.id);

    // Generate AI insight (only if user has sessions)
    let insight = "Start your first focus session to get personalized insights!";
    if (analytics.totalSessions > 0) {
      insight = await generateAIInsight(analytics);
    }

    const response = {
      analytics,
      insight,
      generatedAt: new Date().toISOString()
    };

    // Calculate seconds until end of day for cache expiration
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const secondsUntilEndOfDay = Math.floor((endOfDay.getTime() - now.getTime()) / 1000);

    // Cache until end of day (so it regenerates tomorrow)
    await cache.set(cacheKey, response, secondsUntilEndOfDay);

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
