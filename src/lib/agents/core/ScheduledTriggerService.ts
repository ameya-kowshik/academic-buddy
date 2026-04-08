import { prisma } from '@/lib/prisma';
import { AgentEventType } from '../base/Agent';
import { EventBus } from './EventBus';

export class ScheduledTriggerService {
  constructor(private readonly eventBus: EventBus) {}

  /**
   * Triggers WEEKLY_TRIGGER for all users with activity in the past 7 days.
   * Activity = at least one PomodoroLog or QuizAttempt.
   */
  async runWeekly(): Promise<{ userCount: number }> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const timestamp = new Date();

    const userIds = await this.getActiveUserIds(since);

    console.log(`[ScheduledTrigger] weekly — ${userIds.length} active users since ${since.toISOString()}`);

    for (const userId of userIds) {
      void this.eventBus.publishEvent({
        type: AgentEventType.WEEKLY_TRIGGER,
        userId,
        timestamp,
        payload: { triggeredAt: timestamp.toISOString() },
      });
    }

    return { userCount: userIds.length };
  }

  /**
   * Triggers MONTHLY_TRIGGER for all users with activity in the past 30 days.
   */
  async runMonthly(): Promise<{ userCount: number }> {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const timestamp = new Date();

    const userIds = await this.getActiveUserIds(since);

    console.log(`[ScheduledTrigger] monthly — ${userIds.length} active users since ${since.toISOString()}`);

    for (const userId of userIds) {
      void this.eventBus.publishEvent({
        type: AgentEventType.MONTHLY_TRIGGER,
        userId,
        timestamp,
        payload: { triggeredAt: timestamp.toISOString() },
      });
    }

    return { userCount: userIds.length };
  }

  private async getActiveUserIds(since: Date): Promise<string[]> {
    const [pomodoroUsers, quizUsers] = await Promise.all([
      prisma.pomodoroLog.findMany({
        where: { createdAt: { gte: since } },
        select: { userId: true },
        distinct: ['userId'],
      }),
      // QuizAttempt has no direct userId — resolve through the Quiz relation
      prisma.quizAttempt.findMany({
        where: { startedAt: { gte: since } },
        select: { quiz: { select: { userId: true } } },
        distinct: ['quizId'],
      }),
    ]);

    const ids = new Set<string>([
      ...pomodoroUsers.map((r) => r.userId),
      ...quizUsers.map((r) => r.quiz.userId).filter(Boolean),
    ]);

    return Array.from(ids);
  }
}
