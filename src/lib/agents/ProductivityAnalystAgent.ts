import { prisma } from '@/lib/prisma';
import {
  Agent,
  AgentEvent,
  AgentInput,
  AgentOutput,
  AgentOutputType,
} from './base/Agent';
import { OutputStorageService } from './core/OutputStorageService';

interface PomodoroLogEntry {
  id: string;
  duration: number;
  focusScore: number | null;
  sessionType: string;
  startedAt: Date;
  completedAt: Date | null;
}

interface ProductivityAnalystContext {
  currentWeekSessions: PomodoroLogEntry[];
  previousWeekSessions: PomodoroLogEntry[];
}

type Trend = 'INCREASING' | 'DECREASING' | 'STABLE';
type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

interface Insight {
  type: string;
  severity: Severity;
  message: string;
}

interface ProductivityAnalystResult {
  weeklyScore: number;
  trend: Trend;
  burnoutWarning: boolean;
  burnoutDetails?: string;
  weekOverWeek: {
    focusHoursChange: number;
    sessionsChange: number;
    avgScoreChange: number;
  };
  insights: Insight[];
}

/** Compute daily focus hours (in hours) for a 7-day window starting at `windowStart`. */
function computeDailyFocusHours(
  sessions: PomodoroLogEntry[],
  windowStart: Date
): number[] {
  const daily = new Array<number>(7).fill(0);
  for (const s of sessions) {
    const dayIndex = Math.floor(
      (s.startedAt.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayIndex >= 0 && dayIndex < 7) {
      daily[dayIndex] += s.duration / 60; // minutes → hours
    }
  }
  return daily;
}

/** Linear regression slope over an array of values. */
function linearRegressionSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

/** Detect burnout: 5+ consecutive days with >4h focus AND <10% break ratio. */
function detectBurnout(
  sessions: PomodoroLogEntry[],
  windowStart: Date
): { burnout: boolean; details?: string } {
  // Group sessions by day index
  const byDay: Map<number, PomodoroLogEntry[]> = new Map();
  for (const s of sessions) {
    const dayIndex = Math.floor(
      (s.startedAt.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayIndex >= 0 && dayIndex < 7) {
      if (!byDay.has(dayIndex)) byDay.set(dayIndex, []);
      byDay.get(dayIndex)!.push(s);
    }
  }

  let consecutive = 0;
  let burnoutStartDay = -1;

  for (let d = 0; d < 7; d++) {
    const daySessions = byDay.get(d) ?? [];
    const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration, 0);
    const totalHours = totalMinutes / 60;
    const breakCount = daySessions.filter((s) => s.sessionType !== 'POMODORO').length;
    const breakRatio = daySessions.length > 0 ? breakCount / daySessions.length : 1;

    if (totalHours > 4 && breakRatio < 0.1) {
      if (consecutive === 0) burnoutStartDay = d;
      consecutive++;
      if (consecutive >= 5) {
        return {
          burnout: true,
          details: `${consecutive} consecutive days of high focus (>4h) with insufficient breaks detected starting day ${burnoutStartDay + 1}.`,
        };
      }
    } else {
      consecutive = 0;
    }
  }

  return { burnout: false };
}

function avgFocusScore(sessions: PomodoroLogEntry[]): number {
  const scored = sessions.filter((s) => s.focusScore !== null);
  if (scored.length === 0) return 0;
  return scored.reduce((sum, s) => sum + (s.focusScore ?? 0), 0) / scored.length;
}

function totalHours(sessions: PomodoroLogEntry[]): number {
  return sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export class ProductivityAnalystAgent extends Agent {
  readonly id = 'productivity-analyst';
  readonly name = 'Productivity Analyst';

  constructor(private readonly outputStorage: OutputStorageService) {
    super();
  }

  async prepareInput(
    event: AgentEvent
  ): Promise<AgentInput<ProductivityAnalystContext>> {
    const now = new Date(event.timestamp);
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - 7);
    currentWeekStart.setHours(0, 0, 0, 0);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    const [currentWeekSessions, previousWeekSessions] = await Promise.all([
      prisma.pomodoroLog.findMany({
        where: {
          userId: event.userId,
          startedAt: { gte: currentWeekStart, lt: now },
        },
        orderBy: { startedAt: 'asc' },
        select: {
          id: true,
          duration: true,
          focusScore: true,
          sessionType: true,
          startedAt: true,
          completedAt: true,
        },
      }),
      prisma.pomodoroLog.findMany({
        where: {
          userId: event.userId,
          startedAt: { gte: previousWeekStart, lt: currentWeekStart },
        },
        orderBy: { startedAt: 'asc' },
        select: {
          id: true,
          duration: true,
          focusScore: true,
          sessionType: true,
          startedAt: true,
          completedAt: true,
        },
      }),
    ]);

    return {
      userId: event.userId,
      event,
      context: { currentWeekSessions, previousWeekSessions },
    };
  }

  async execute(
    input: AgentInput<ProductivityAnalystContext>
  ): Promise<AgentOutput> {
    const { currentWeekSessions, previousWeekSessions } = input.context;

    const now = new Date(input.event.timestamp);
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - 7);
    currentWeekStart.setHours(0, 0, 0, 0);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    // --- Daily focus hours & trend ---
    const dailyHours = computeDailyFocusHours(currentWeekSessions, currentWeekStart);
    const slope = linearRegressionSlope(dailyHours);
    const trend: Trend =
      slope > 0.1 ? 'INCREASING' : slope < -0.1 ? 'DECREASING' : 'STABLE';

    // --- Burnout detection ---
    const { burnout, details: burnoutDetails } = detectBurnout(
      currentWeekSessions,
      currentWeekStart
    );

    // --- Weekly score ---
    const daysWithSessions = dailyHours.filter((h) => h > 0).length;
    const consistency = daysWithSessions / 7;
    const targetHours = 14;
    const currentTotalHours = totalHours(currentWeekSessions);
    const currentAvgScore = avgFocusScore(currentWeekSessions);

    const weeklyScore = Math.min(
      100,
      Math.max(
        0,
        (consistency * 0.4 +
          (currentTotalHours / targetHours) * 0.4 +
          (currentAvgScore / 10) * 0.2) *
          100
      )
    );

    // --- Week-over-week ---
    const prevTotalHours = totalHours(previousWeekSessions);
    const prevAvgScore = avgFocusScore(previousWeekSessions);

    const weekOverWeek = {
      focusHoursChange: percentChange(currentTotalHours, prevTotalHours),
      sessionsChange: percentChange(
        currentWeekSessions.length,
        previousWeekSessions.length
      ),
      avgScoreChange: percentChange(currentAvgScore, prevAvgScore),
    };

    // --- Insights ---
    const insights: Insight[] = [];

    if (burnout) {
      insights.push({
        type: 'BURNOUT_RISK',
        severity: 'CRITICAL',
        message: burnoutDetails ?? 'Burnout risk detected.',
      });
    }

    if (trend === 'INCREASING') {
      insights.push({
        type: 'TREND',
        severity: 'INFO',
        message: 'Your daily focus hours are trending upward this week. Great momentum!',
      });
    } else if (trend === 'DECREASING') {
      insights.push({
        type: 'TREND',
        severity: 'WARNING',
        message:
          'Your daily focus hours are declining this week. Consider reviewing your schedule.',
      });
    }

    if (consistency < 0.5) {
      insights.push({
        type: 'CONSISTENCY',
        severity: 'WARNING',
        message: `You only had focus sessions on ${daysWithSessions} out of 7 days. Try to build a more consistent daily habit.`,
      });
    }

    if (weekOverWeek.focusHoursChange < -20) {
      insights.push({
        type: 'WEEK_OVER_WEEK',
        severity: 'WARNING',
        message: `Focus hours dropped ${Math.abs(weekOverWeek.focusHoursChange).toFixed(0)}% compared to last week.`,
      });
    } else if (weekOverWeek.focusHoursChange > 20) {
      insights.push({
        type: 'WEEK_OVER_WEEK',
        severity: 'INFO',
        message: `Focus hours increased ${weekOverWeek.focusHoursChange.toFixed(0)}% compared to last week. Keep it up!`,
      });
    }

    if (currentWeekSessions.length === 0) {
      insights.push({
        type: 'NO_DATA',
        severity: 'INFO',
        message: 'No focus sessions recorded this week.',
      });
    }

    const result: ProductivityAnalystResult = {
      weeklyScore: Math.round(weeklyScore * 10) / 10,
      trend,
      burnoutWarning: burnout,
      ...(burnoutDetails ? { burnoutDetails } : {}),
      weekOverWeek,
      insights,
    };

    return {
      agentId: this.id,
      userId: input.userId,
      outputType: AgentOutputType.INSIGHT,
      content: result as unknown as Record<string, unknown>,
      explainability: {
        reasoning: `Analyzed ${currentWeekSessions.length} sessions over the past 7 days. Trend slope: ${slope.toFixed(3)}. Consistency: ${(consistency * 100).toFixed(0)}%. Weekly score formula: (consistency*0.4 + totalHours/14*0.4 + avgScore/10*0.2)*100.`,
        dataSourcesUsed: [
          ...currentWeekSessions.map((s) => s.id),
          ...previousWeekSessions.map((s) => s.id),
        ],
        analysisMethod: 'linear-regression-trend + burnout-detection + weekly-score',
        keyFactors: {
          currentWeekSessions: currentWeekSessions.length,
          previousWeekSessions: previousWeekSessions.length,
          currentTotalHours,
          prevTotalHours,
          consistency,
          slope,
          weeklyScore: result.weeklyScore,
        },
      },
      timestamp: new Date(),
      confidence:
        currentWeekSessions.length >= 7
          ? 0.9
          : currentWeekSessions.length >= 3
          ? 0.7
          : 0.4,
    };
  }
}
