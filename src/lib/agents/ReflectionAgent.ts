import { prisma } from '@/lib/prisma';
import {
  Agent,
  AgentEvent,
  AgentEventType,
  AgentInput,
  AgentOutput,
  AgentOutputType,
} from './base/Agent';
import { OutputStorageService } from './core/OutputStorageService';

type PeriodType = 'WEEKLY' | 'MONTHLY';

interface FocusMetrics {
  totalSessions: number;
  totalFocusHours: number;
  avgFocusScore: number;
  dailyHours: Record<string, number>; // ISO date string → hours
}

interface StudyMetrics {
  quizzesCompleted: number;
  avgQuizScore: number;
  flashcardSessions: number;
  dailyQuizScores: Record<string, number[]>; // ISO date string → scores
}

interface PriorAgentOutput {
  agentId: string;
  outputType: string;
  content: Record<string, unknown>;
  createdAt: Date;
}

interface ReflectionContext {
  periodType: PeriodType;
  periodStart: Date;
  periodEnd: Date;
  currentFocus: FocusMetrics;
  currentStudy: StudyMetrics;
  previousFocus: FocusMetrics;
  previousStudy: StudyMetrics;
  agentOutputs: PriorAgentOutput[];
}

interface ReflectionResult {
  period: { type: PeriodType; startDate: string; endDate: string };
  summary: {
    highlights: string[];
    challenges: string[];
    patterns: string[];
    recommendations: string[];
  };
  metrics: {
    totalFocusHours: number;
    totalStudyTimeMinutes: number;
    quizzesCompleted: number;
    avgQuizScore: number;
    flashcardSessions: number;
  };
  comparison?: {
    improvements: string[];
    regressions: string[];
    percentageChanges: Record<string, number>;
  };
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function computeFocusMetrics(
  sessions: Array<{
    id: string;
    duration: number;
    focusScore: number | null;
    startedAt: Date;
  }>
): FocusMetrics {
  const dailyHours: Record<string, number> = {};
  let totalMinutes = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  for (const s of sessions) {
    const day = isoDate(s.startedAt);
    dailyHours[day] = (dailyHours[day] ?? 0) + s.duration / 60;
    totalMinutes += s.duration;
    if (s.focusScore !== null) {
      scoreSum += s.focusScore;
      scoreCount++;
    }
  }

  return {
    totalSessions: sessions.length,
    totalFocusHours: totalMinutes / 60,
    avgFocusScore: scoreCount > 0 ? scoreSum / scoreCount : 0,
    dailyHours,
  };
}

function computeStudyMetrics(
  quizAttempts: Array<{ id: string; score: number; completedAt: Date | null }>,
  flashcardSessions: Array<{ id: string; sessionStartedAt: Date }>
): StudyMetrics {
  const dailyQuizScores: Record<string, number[]> = {};

  for (const a of quizAttempts) {
    const day = isoDate(a.completedAt ?? new Date());
    if (!dailyQuizScores[day]) dailyQuizScores[day] = [];
    dailyQuizScores[day].push(a.score);
  }

  const avgQuizScore =
    quizAttempts.length > 0
      ? quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length
      : 0;

  return {
    quizzesCompleted: quizAttempts.length,
    avgQuizScore,
    flashcardSessions: flashcardSessions.length,
    dailyQuizScores,
  };
}

/** Pearson correlation between two equal-length arrays. Returns null if insufficient data. */
function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 3) return null;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let xDen = 0;
  let yDen = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - xMean;
    const dy = ys[i] - yMean;
    num += dx * dy;
    xDen += dx * dx;
    yDen += dy * dy;
  }
  const den = Math.sqrt(xDen * yDen);
  return den === 0 ? null : num / den;
}

export class ReflectionAgent extends Agent {
  readonly id = 'reflection';
  readonly name = 'Reflection Agent';

  constructor(private readonly outputStorage: OutputStorageService) {
    super();
  }

  async prepareInput(event: AgentEvent): Promise<AgentInput<ReflectionContext>> {
    const now = new Date(event.timestamp);
    const userId = event.userId;

    let periodType: PeriodType;
    let periodStart: Date;
    let periodEnd: Date;
    let prevStart: Date;
    let prevEnd: Date;

    if (event.type === AgentEventType.MONTHLY_TRIGGER) {
      periodType = 'MONTHLY';
      // Current month: past 30 days
      periodEnd = now;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 30);
      periodStart.setHours(0, 0, 0, 0);
      // Previous month: 30–60 days ago
      prevEnd = new Date(periodStart);
      prevStart = new Date(periodStart);
      prevStart.setDate(prevStart.getDate() - 30);
    } else {
      // WEEKLY_TRIGGER (default)
      periodType = 'WEEKLY';
      periodEnd = now;
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodStart.setHours(0, 0, 0, 0);
      prevEnd = new Date(periodStart);
      prevStart = new Date(periodStart);
      prevStart.setDate(prevStart.getDate() - 7);
    }

    const [
      currentFocusSessions,
      previousFocusSessions,
      currentQuizAttempts,
      previousQuizAttempts,
      currentFlashcardSessions,
      previousFlashcardSessions,
      agentOutputRecords,
    ] = await Promise.all([
      prisma.pomodoroLog.findMany({
        where: { userId, startedAt: { gte: periodStart, lt: periodEnd } },
        select: { id: true, duration: true, focusScore: true, startedAt: true },
        orderBy: { startedAt: 'asc' },
      }),
      prisma.pomodoroLog.findMany({
        where: { userId, startedAt: { gte: prevStart, lt: prevEnd } },
        select: { id: true, duration: true, focusScore: true, startedAt: true },
        orderBy: { startedAt: 'asc' },
      }),
      prisma.quizAttempt.findMany({
        where: { quiz: { userId }, completedAt: { gte: periodStart, lt: periodEnd } },
        select: { id: true, score: true, completedAt: true },
      }),
      prisma.quizAttempt.findMany({
        where: { quiz: { userId }, completedAt: { gte: prevStart, lt: prevEnd } },
        select: { id: true, score: true, completedAt: true },
      }),
      prisma.flashcardSession.findMany({
        where: { userId, sessionStartedAt: { gte: periodStart, lt: periodEnd } },
        select: { id: true, sessionStartedAt: true },
      }),
      prisma.flashcardSession.findMany({
        where: { userId, sessionStartedAt: { gte: prevStart, lt: prevEnd } },
        select: { id: true, sessionStartedAt: true },
      }),
      prisma.agentOutput.findMany({
        where: {
          userId,
          agentId: { in: ['focus-coach', 'productivity-analyst', 'study-companion'] },
          createdAt: { gte: periodStart, lt: periodEnd },
        },
        select: { agentId: true, outputType: true, content: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const currentFocus = computeFocusMetrics(currentFocusSessions);
    const previousFocus = computeFocusMetrics(previousFocusSessions);
    const currentStudy = computeStudyMetrics(currentQuizAttempts, currentFlashcardSessions);
    const previousStudy = computeStudyMetrics(previousQuizAttempts, previousFlashcardSessions);

    const agentOutputs: PriorAgentOutput[] = agentOutputRecords.map((r) => ({
      agentId: r.agentId,
      outputType: r.outputType,
      content: r.content as Record<string, unknown>,
      createdAt: r.createdAt,
    }));

    return {
      userId,
      event,
      context: {
        periodType,
        periodStart,
        periodEnd,
        currentFocus,
        currentStudy,
        previousFocus,
        previousStudy,
        agentOutputs,
      },
    };
  }

  async execute(input: AgentInput<ReflectionContext>): Promise<AgentOutput> {
    const {
      periodType,
      periodStart,
      periodEnd,
      currentFocus,
      currentStudy,
      previousFocus,
      previousStudy,
      agentOutputs,
    } = input.context;

    const highlights: string[] = [];
    const challenges: string[] = [];
    const patterns: string[] = [];
    const recommendations: string[] = [];

    // --- Highlights ---
    if (currentFocus.totalFocusHours > 0) {
      highlights.push(
        `Logged ${currentFocus.totalFocusHours.toFixed(1)} hours of focused work this ${periodType === 'MONTHLY' ? 'month' : 'week'}.`
      );
    }
    if (currentStudy.quizzesCompleted > 0) {
      highlights.push(
        `Completed ${currentStudy.quizzesCompleted} quiz${currentStudy.quizzesCompleted > 1 ? 'zes' : ''} with an average score of ${currentStudy.avgQuizScore.toFixed(0)}%.`
      );
    }
    if (currentStudy.flashcardSessions > 0) {
      highlights.push(
        `Reviewed flashcards in ${currentStudy.flashcardSessions} session${currentStudy.flashcardSessions > 1 ? 's' : ''}.`
      );
    }

    // Synthesize highlights from other agents
    for (const output of agentOutputs) {
      if (output.agentId === 'productivity-analyst') {
        const c = output.content as { weeklyScore?: number; trend?: string };
        if (c.weeklyScore !== undefined && c.weeklyScore >= 70) {
          highlights.push(`Productivity score of ${c.weeklyScore.toFixed(0)}/100 — strong week.`);
        }
      }
    }

    // --- Challenges ---
    if (currentFocus.totalFocusHours === 0) {
      challenges.push('No focus sessions recorded this period.');
    } else if (currentFocus.totalFocusHours < previousFocus.totalFocusHours * 0.7) {
      challenges.push(
        `Focus time dropped significantly compared to the previous ${periodType === 'MONTHLY' ? 'month' : 'week'}.`
      );
    }

    if (currentStudy.avgQuizScore > 0 && currentStudy.avgQuizScore < 60) {
      challenges.push(
        `Quiz performance is below 60% — consider revisiting source materials.`
      );
    }

    for (const output of agentOutputs) {
      if (output.agentId === 'productivity-analyst') {
        const c = output.content as { burnoutWarning?: boolean; burnoutDetails?: string };
        if (c.burnoutWarning) {
          challenges.push(c.burnoutDetails ?? 'Burnout risk detected this period.');
        }
      }
      if (output.agentId === 'study-companion') {
        const c = output.content as { topicsNeedingAttention?: string[] };
        if (c.topicsNeedingAttention && c.topicsNeedingAttention.length > 0) {
          challenges.push(
            `Topics needing attention: ${c.topicsNeedingAttention.slice(0, 3).join(', ')}.`
          );
        }
      }
    }

    // --- Cross-domain patterns (correlation) ---
    const allDays = new Set([
      ...Object.keys(currentFocus.dailyHours),
      ...Object.keys(currentStudy.dailyQuizScores),
    ]);

    const focusArr: number[] = [];
    const quizArr: number[] = [];

    for (const day of allDays) {
      const fh = currentFocus.dailyHours[day] ?? 0;
      const scores = currentStudy.dailyQuizScores[day];
      if (scores && scores.length > 0) {
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        focusArr.push(fh);
        quizArr.push(avgScore);
      }
    }

    const correlation = pearsonCorrelation(focusArr, quizArr);
    if (correlation !== null) {
      if (correlation > 0.5) {
        patterns.push(
          `Strong positive correlation (r=${correlation.toFixed(2)}) between daily focus hours and quiz scores — more focused study leads to better results.`
        );
      } else if (correlation < -0.3) {
        patterns.push(
          `Negative correlation (r=${correlation.toFixed(2)}) between focus hours and quiz scores — high-volume days may be reducing retention quality.`
        );
      } else {
        patterns.push(
          `No strong correlation between focus hours and quiz scores this period — performance appears consistent regardless of session length.`
        );
      }
    }

    if (currentFocus.totalSessions > 0 && currentStudy.quizzesCompleted > 0) {
      const ratio = currentStudy.quizzesCompleted / currentFocus.totalSessions;
      if (ratio > 0.5) {
        patterns.push('High quiz-to-session ratio — you are actively testing your knowledge alongside focused study.');
      }
    }

    // --- Recommendations ---
    if (currentFocus.totalFocusHours < 5) {
      recommendations.push('Aim for at least 1 hour of focused work per day to build a consistent habit.');
    }
    if (currentStudy.quizzesCompleted === 0) {
      recommendations.push('Try completing at least one quiz this period to reinforce your learning.');
    }
    if (currentStudy.avgQuizScore > 0 && currentStudy.avgQuizScore < 70) {
      recommendations.push('Review source materials for topics where quiz scores are below 70%.');
    }
    if (currentStudy.flashcardSessions === 0 && currentStudy.quizzesCompleted > 0) {
      recommendations.push('Add flashcard review sessions to complement your quiz practice.');
    }

    // Synthesize recommendations from other agents
    for (const output of agentOutputs) {
      if (output.agentId === 'focus-coach') {
        const c = output.content as { suggestions?: Array<{ message: string; priority: string }> };
        const highPriority = c.suggestions?.find((s) => s.priority === 'HIGH');
        if (highPriority) {
          recommendations.push(`Focus Coach: ${highPriority.message}`);
        }
      }
    }

    // --- Period comparison ---
    const focusHoursChange = percentChange(currentFocus.totalFocusHours, previousFocus.totalFocusHours);
    const quizScoreChange = percentChange(currentStudy.avgQuizScore, previousStudy.avgQuizScore);
    const sessionsChange = percentChange(currentFocus.totalSessions, previousFocus.totalSessions);

    const improvements: string[] = [];
    const regressions: string[] = [];

    if (focusHoursChange > 10) improvements.push(`Focus hours up ${focusHoursChange.toFixed(0)}%`);
    else if (focusHoursChange < -10) regressions.push(`Focus hours down ${Math.abs(focusHoursChange).toFixed(0)}%`);

    if (quizScoreChange > 5) improvements.push(`Quiz scores up ${quizScoreChange.toFixed(0)}%`);
    else if (quizScoreChange < -5) regressions.push(`Quiz scores down ${Math.abs(quizScoreChange).toFixed(0)}%`);

    if (sessionsChange > 10) improvements.push(`Session count up ${sessionsChange.toFixed(0)}%`);
    else if (sessionsChange < -10) regressions.push(`Session count down ${Math.abs(sessionsChange).toFixed(0)}%`);

    // Ensure non-empty sections
    if (highlights.length === 0) highlights.push('Keep going — every session counts.');
    if (challenges.length === 0) challenges.push('No major challenges identified this period.');
    if (patterns.length === 0) patterns.push('Not enough data yet to identify cross-domain patterns.');
    if (recommendations.length === 0) recommendations.push('Maintain your current pace and keep building consistency.');

    const result: ReflectionResult = {
      period: {
        type: periodType,
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      },
      summary: { highlights, challenges, patterns, recommendations },
      metrics: {
        totalFocusHours: Math.round(currentFocus.totalFocusHours * 10) / 10,
        totalStudyTimeMinutes: currentStudy.flashcardSessions * 15, // rough estimate
        quizzesCompleted: currentStudy.quizzesCompleted,
        avgQuizScore: Math.round(currentStudy.avgQuizScore * 10) / 10,
        flashcardSessions: currentStudy.flashcardSessions,
      },
      comparison: {
        improvements,
        regressions,
        percentageChanges: {
          focusHours: Math.round(focusHoursChange * 10) / 10,
          quizScore: Math.round(quizScoreChange * 10) / 10,
          sessions: Math.round(sessionsChange * 10) / 10,
        },
      },
    };

    const dataSourceIds = [
      ...agentOutputs.map((o) => `${o.agentId}:${o.createdAt.toISOString()}`),
    ];

    return {
      agentId: this.id,
      userId: input.userId,
      outputType: AgentOutputType.REFLECTION,
      content: result as unknown as Record<string, unknown>,
      explainability: {
        reasoning: `${periodType} reflection covering ${periodStart.toDateString()} – ${periodEnd.toDateString()}. Focus: ${currentFocus.totalSessions} sessions / ${currentFocus.totalFocusHours.toFixed(1)}h. Study: ${currentStudy.quizzesCompleted} quizzes, ${currentStudy.flashcardSessions} flashcard sessions. Synthesized ${agentOutputs.length} prior agent outputs.`,
        dataSourcesUsed: dataSourceIds,
        analysisMethod: 'cross-domain-correlation + narrative-synthesis + period-comparison',
        keyFactors: {
          periodType,
          focusSessions: currentFocus.totalSessions,
          focusHours: currentFocus.totalFocusHours,
          quizzesCompleted: currentStudy.quizzesCompleted,
          avgQuizScore: currentStudy.avgQuizScore,
          flashcardSessions: currentStudy.flashcardSessions,
          priorAgentOutputsUsed: agentOutputs.length,
          correlationCoefficient: correlation,
        },
      },
      timestamp: new Date(),
      confidence:
        currentFocus.totalSessions >= 5 && currentStudy.quizzesCompleted >= 2
          ? 0.85
          : currentFocus.totalSessions >= 2 || currentStudy.quizzesCompleted >= 1
          ? 0.6
          : 0.35,
    };
  }
}
