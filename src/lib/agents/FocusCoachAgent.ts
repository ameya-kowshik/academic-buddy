import { prisma } from '@/lib/prisma';
import {
  Agent,
  AgentEvent,
  AgentInput,
  AgentOutput,
  AgentOutputType,
} from './base/Agent';
import { OutputStorageService } from './core/OutputStorageService';

interface FocusCoachContext {
  sessions: Array<{
    id: string;
    duration: number;
    focusScore: number | null;
    sessionType: string;
    startedAt: Date;
  }>;
  baseline: {
    avgDuration: number;
    avgFocusScore: number;
  };
}

type Suggestion = {
  type: 'SESSION_LENGTH' | 'BREAK_TIMING' | 'FOCUS_IMPROVEMENT';
  message: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
};

export class FocusCoachAgent extends Agent {
  readonly id = 'focus-coach';
  readonly name = 'Focus Coach';

  constructor(private readonly outputStorage: OutputStorageService) {
    super();
  }

  async prepareInput(event: AgentEvent): Promise<AgentInput<FocusCoachContext>> {
    const sessions = await prisma.pomodoroLog.findMany({
      where: { userId: event.userId },
      orderBy: { startedAt: 'desc' },
      take: 7,
      select: {
        id: true,
        duration: true,
        focusScore: true,
        sessionType: true,
        startedAt: true,
      },
    });

    const avgDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0;

    const scoredSessions = sessions.filter((s) => s.focusScore !== null);
    const avgFocusScore =
      scoredSessions.length > 0
        ? scoredSessions.reduce((sum, s) => sum + (s.focusScore ?? 0), 0) /
          scoredSessions.length
        : 0;

    return {
      userId: event.userId,
      event,
      context: {
        sessions,
        baseline: { avgDuration, avgFocusScore },
      },
    };
  }

  async execute(input: AgentInput<FocusCoachContext>): Promise<AgentOutput> {
    const { sessions, baseline } = input.context;
    const suggestions: Suggestion[] = [];
    const detectedPatterns: string[] = [];

    const limitedData = sessions.length < 3;

    // --- Pattern 1: Declining scores (HIGH priority) ---
    const last3 = sessions.slice(0, 3);
    const last3WithScores = last3.filter((s) => s.focusScore !== null);
    if (last3WithScores.length === 3) {
      const [a, b, c] = last3WithScores;
      if (
        (a.focusScore ?? 0) < (b.focusScore ?? 0) &&
        (b.focusScore ?? 0) < (c.focusScore ?? 0)
      ) {
        detectedPatterns.push('Declining focus scores detected in last 3 sessions');
        if (suggestions.length < 3) {
          suggestions.push({
            type: 'SESSION_LENGTH',
            message:
              'Your focus scores have been declining. Consider shortening your session length to maintain quality focus.',
            priority: 'HIGH',
          });
        }
      }
    }

    // --- Pattern 2: Duration variance (MEDIUM priority) ---
    if (sessions.length >= 2) {
      const mean = baseline.avgDuration;
      const variance =
        sessions.reduce((sum, s) => sum + Math.pow(s.duration - mean, 2), 0) /
        sessions.length;
      const stddev = Math.sqrt(variance);
      const stddevRatio = mean > 0 ? stddev / mean : 0;

      if (stddevRatio > 0.3) {
        detectedPatterns.push(
          `High duration variance detected (stddev: ${stddev.toFixed(1)} min, ${(stddevRatio * 100).toFixed(0)}% of mean)`
        );
        if (suggestions.length < 3) {
          suggestions.push({
            type: 'SESSION_LENGTH',
            message:
              'Your session durations vary significantly. Try to keep sessions more consistent for better focus habits.',
            priority: 'MEDIUM',
          });
        }
      }
    }

    // --- Pattern 3: Break frequency (MEDIUM priority) ---
    const breakCount = sessions.filter((s) => s.sessionType !== 'POMODORO').length;
    const breakRatio = sessions.length > 0 ? breakCount / sessions.length : 0;
    if (breakRatio < 0.5) {
      detectedPatterns.push(
        `Low break frequency: ${breakCount} breaks in last ${sessions.length} sessions`
      );
      if (suggestions.length < 3) {
        suggestions.push({
          type: 'BREAK_TIMING',
          message:
            'You are not taking enough breaks. Aim for at least one break for every two focus sessions to avoid burnout.',
          priority: 'MEDIUM',
        });
      }
    }

    // --- Trend direction ---
    let trendDirection: 'IMPROVING' | 'DECLINING' | 'STABLE' = 'STABLE';
    const scoredAll = sessions.filter((s) => s.focusScore !== null);
    if (scoredAll.length >= 2) {
      const recent = scoredAll.slice(0, Math.ceil(scoredAll.length / 2));
      const older = scoredAll.slice(Math.ceil(scoredAll.length / 2));
      const recentAvg =
        recent.reduce((s, x) => s + (x.focusScore ?? 0), 0) / recent.length;
      const olderAvg =
        older.reduce((s, x) => s + (x.focusScore ?? 0), 0) / older.length;
      if (recentAvg > olderAvg + 0.5) trendDirection = 'IMPROVING';
      else if (recentAvg < olderAvg - 0.5) trendDirection = 'DECLINING';
    }

    // --- Consistency score (0-100) ---
    const mean = baseline.avgDuration;
    const variance =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + Math.pow(s.duration - mean, 2), 0) /
          sessions.length
        : 0;
    const stddev = Math.sqrt(variance);
    const stddevRatio = mean > 0 ? stddev / mean : 0;
    const consistencyScore = Math.max(0, Math.round((1 - stddevRatio) * 100));

    // --- Reasoning ---
    let reasoning =
      detectedPatterns.length > 0
        ? detectedPatterns.join('; ')
        : 'No significant patterns detected.';
    if (limitedData) {
      reasoning = `Limited data: fewer than 3 sessions available. ${reasoning}`;
    }

    return {
      agentId: this.id,
      userId: input.userId,
      outputType: AgentOutputType.SUGGESTION,
      content: {
        suggestions,
        patterns: {
          trendDirection,
          consistencyScore,
        },
      },
      explainability: {
        reasoning,
        dataSourcesUsed: sessions.map((s) => s.id),
        analysisMethod: 'pattern-detection',
        keyFactors: {
          sessionCount: sessions.length,
          avgDuration: baseline.avgDuration,
          avgFocusScore: baseline.avgFocusScore,
          stddevDuration: Math.sqrt(variance),
        },
      },
      timestamp: new Date(),
      confidence: sessions.length >= 7 ? 0.85 : sessions.length >= 3 ? 0.6 : 0.3,
    };
  }
}
