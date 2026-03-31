/**
 * Utility functions for identifying weak areas from study session data.
 * Works client-side from quiz attempt history and focus session data.
 */

export interface SessionWeakArea {
  topic: string;
  averageScore: number;
  attemptCount: number;
  trend: 'improving' | 'declining' | 'stable';
  lastAttemptScore: number;
  recommendation: string;
}

export interface QuizAttemptSummary {
  quizTitle: string;
  score: number;
  completedAt: string | Date;
  difficulty?: number;
  grouping?: string | null;
}

/**
 * Identifies weak areas from a list of quiz attempts.
 * Groups by quiz title/topic and computes average scores.
 * A topic is "weak" if average score < threshold (default 70%).
 */
export function identifyWeakAreasFromAttempts(
  attempts: QuizAttemptSummary[],
  threshold = 70
): SessionWeakArea[] {
  if (!attempts || attempts.length === 0) return [];

  // Group attempts by topic (quiz title or grouping)
  const topicMap = new Map<string, QuizAttemptSummary[]>();

  for (const attempt of attempts) {
    const topic = attempt.grouping || attempt.quizTitle;
    if (!topicMap.has(topic)) topicMap.set(topic, []);
    topicMap.get(topic)!.push(attempt);
  }

  const weakAreas: SessionWeakArea[] = [];

  for (const [topic, topicAttempts] of topicMap.entries()) {
    // Sort by date ascending to compute trend
    const sorted = [...topicAttempts].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );

    const avgScore =
      sorted.reduce((sum, a) => sum + a.score, 0) / sorted.length;

    if (avgScore >= threshold) continue; // Not a weak area

    // Compute trend: compare first half avg vs second half avg
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, Math.max(1, mid));
    const secondHalf = sorted.slice(Math.max(1, mid));

    const firstAvg = firstHalf.reduce((s, a) => s + a.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, a) => s + a.score, 0) / secondHalf.length;

    let trend: SessionWeakArea['trend'] = 'stable';
    if (secondAvg - firstAvg > 5) trend = 'improving';
    else if (firstAvg - secondAvg > 5) trend = 'declining';

    const lastScore = sorted[sorted.length - 1].score;

    weakAreas.push({
      topic,
      averageScore: Math.round(avgScore),
      attemptCount: sorted.length,
      trend,
      lastAttemptScore: Math.round(lastScore),
      recommendation: buildRecommendation(topic, avgScore, trend),
    });
  }

  // Sort by average score ascending (worst first)
  return weakAreas.sort((a, b) => a.averageScore - b.averageScore);
}

/**
 * Identifies weak areas from focus session data.
 * Uses flashcardGrouping and linked quiz titles to find under-studied topics.
 */
export interface FocusSessionSummary {
  duration: number; // minutes
  flashcardGrouping?: string | null;
  quizTitle?: string | null;
  completedAt?: string | Date | null;
}

export function identifyUnderStudiedTopics(
  sessions: FocusSessionSummary[],
  minMinutesThreshold = 10
): { topic: string; totalMinutes: number; sessionCount: number }[] {
  if (!sessions || sessions.length === 0) return [];

  const topicMap = new Map<string, { totalMinutes: number; count: number }>();

  for (const session of sessions) {
    const topic = session.flashcardGrouping || session.quizTitle;
    if (!topic) continue;

    if (!topicMap.has(topic)) topicMap.set(topic, { totalMinutes: 0, count: 0 });
    const entry = topicMap.get(topic)!;
    entry.totalMinutes += session.duration;
    entry.count += 1;
  }

  return Array.from(topicMap.entries())
    .filter(([, v]) => v.totalMinutes < minMinutesThreshold)
    .map(([topic, v]) => ({
      topic,
      totalMinutes: v.totalMinutes,
      sessionCount: v.count,
    }))
    .sort((a, b) => a.totalMinutes - b.totalMinutes);
}

/**
 * Merges quiz-based weak areas with under-studied topics into a unified list.
 */
export function mergeWeakAreaInsights(
  quizWeakAreas: SessionWeakArea[],
  underStudied: { topic: string; totalMinutes: number; sessionCount: number }[]
): SessionWeakArea[] {
  const merged = [...quizWeakAreas];
  const existingTopics = new Set(quizWeakAreas.map((w) => w.topic));

  for (const us of underStudied) {
    if (!existingTopics.has(us.topic)) {
      merged.push({
        topic: us.topic,
        averageScore: 0, // No quiz data yet
        attemptCount: 0,
        trend: 'stable',
        lastAttemptScore: 0,
        recommendation: `You've only spent ${us.totalMinutes} minute(s) on "${us.topic}". Consider dedicating more focus sessions to this topic.`,
      });
    }
  }

  return merged;
}

function buildRecommendation(
  topic: string,
  avgScore: number,
  trend: SessionWeakArea['trend']
): string {
  if (trend === 'improving') {
    return `You're improving in "${topic}" (avg ${Math.round(avgScore)}%). Keep practicing to push past 70%.`;
  }
  if (trend === 'declining') {
    return `Your performance in "${topic}" is declining (avg ${Math.round(avgScore)}%). Review the material and retry quizzes.`;
  }
  return `"${topic}" needs attention (avg ${Math.round(avgScore)}%). Review flashcards and retake quizzes for this topic.`;
}
