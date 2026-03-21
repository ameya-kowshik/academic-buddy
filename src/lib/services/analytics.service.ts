import { prisma } from '@/lib/prisma';

/**
 * Study analytics data for a date range
 */
export interface StudyAnalytics {
  flashcardsReviewed: number;
  quizzesCompleted: number;
  averageQuizScore: number;
  totalStudyTime: number; // from focus sessions
  dailyBreakdown: DailyAnalytics[];
}

/**
 * Daily analytics breakdown
 */
export interface DailyAnalytics {
  date: Date;
  flashcardsReviewed: number;
  quizzesCompleted: number;
}

/**
 * Weak area identification result
 */
export interface WeakArea {
  type: 'difficulty' | 'grouping';
  identifier: string | number;
  averageScore: number;
  attemptCount: number;
  recommendations: string[];
}

/**
 * Study material focus time aggregation
 */
export interface StudyMaterialFocusTime {
  flashcardGroupings: Record<string, number>; // grouping -> total minutes
  quizzes: Record<string, { quizId: string; title: string; totalMinutes: number }>; // quizId -> data
}

/**
 * Service for tracking study performance and analytics
 * Handles flashcard/quiz tracking and weak area identification
 */
export class AnalyticsService {
  /**
   * Record a flashcard review in daily analytics
   * @param userId - User ID who reviewed the flashcard
   * @param date - Date of the review (defaults to today)
   */
  async recordFlashcardReview(userId: string, date: Date = new Date()): Promise<void> {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Upsert analytics record for the date
    await prisma.analytics.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: {
        flashcardsReviewed: {
          increment: 1,
        },
      },
      create: {
        userId,
        date: normalizedDate,
        flashcardsReviewed: 1,
      },
    });
  }

  /**
   * Record a quiz completion in daily analytics
   * @param userId - User ID who completed the quiz
   * @param date - Date of the completion (defaults to today)
   */
  async recordQuizCompletion(userId: string, date: Date = new Date()): Promise<void> {
    // Normalize date to start of day
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Upsert analytics record for the date
    await prisma.analytics.upsert({
      where: {
        userId_date: {
          userId,
          date: normalizedDate,
        },
      },
      update: {
        quizzesCompleted: {
          increment: 1,
        },
      },
      create: {
        userId,
        date: normalizedDate,
        quizzesCompleted: 1,
      },
    });
  }

  /**
   * Get study analytics for a date range
   * @param userId - User ID to retrieve analytics for
   * @param startDate - Start date of the range
   * @param endDate - End date of the range
   * @returns Study analytics with daily breakdown
   */
  async getStudyAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StudyAnalytics> {
    // Normalize dates to start of day
    const normalizedStart = new Date(startDate);
    normalizedStart.setHours(0, 0, 0, 0);
    const normalizedEnd = new Date(endDate);
    normalizedEnd.setHours(23, 59, 59, 999);

    // Fetch analytics records for date range
    const analyticsRecords = await prisma.analytics.findMany({
      where: {
        userId,
        date: {
          gte: normalizedStart,
          lte: normalizedEnd,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate totals
    const flashcardsReviewed = analyticsRecords.reduce(
      (sum, record) => sum + record.flashcardsReviewed,
      0
    );
    const quizzesCompleted = analyticsRecords.reduce(
      (sum, record) => sum + record.quizzesCompleted,
      0
    );

    // Calculate average quiz score from attempts in date range
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: {
          userId,
        },
        completedAt: {
          gte: normalizedStart,
          lte: normalizedEnd,
          not: null,
        },
      },
      select: {
        score: true,
      },
    });

    const averageQuizScore =
      quizAttempts.length > 0
        ? quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / quizAttempts.length
        : 0;

    // Calculate total study time from focus sessions
    const focusSessions = await prisma.pomodoroLog.findMany({
      where: {
        userId,
        startedAt: {
          gte: normalizedStart,
          lte: normalizedEnd,
        },
        completedAt: {
          not: null,
        },
      },
      select: {
        duration: true,
      },
    });

    const totalStudyTime = focusSessions.reduce((sum, session) => sum + session.duration, 0);

    // Build daily breakdown
    const dailyBreakdown: DailyAnalytics[] = analyticsRecords.map((record) => ({
      date: record.date,
      flashcardsReviewed: record.flashcardsReviewed,
      quizzesCompleted: record.quizzesCompleted,
    }));

    return {
      flashcardsReviewed,
      quizzesCompleted,
      averageQuizScore,
      totalStudyTime,
      dailyBreakdown,
    };
  }

  /**
   * Identify weak areas based on quiz performance
   * @param userId - User ID to analyze
   * @returns Array of weak areas with recommendations
   */
  async identifyWeakAreas(userId: string): Promise<WeakArea[]> {
    const weakAreas: WeakArea[] = [];

    // Analyze by difficulty level
    const difficultyStats = await this.calculateDifficultyStats(userId);
    for (const [difficulty, stats] of Object.entries(difficultyStats)) {
      if (stats.averageScore < 70 && stats.attemptCount > 0) {
        weakAreas.push({
          type: 'difficulty',
          identifier: parseInt(difficulty),
          averageScore: stats.averageScore,
          attemptCount: stats.attemptCount,
          recommendations: [
            `Review flashcards with difficulty level ${difficulty}`,
            `Practice more quizzes at difficulty level ${difficulty}`,
            `Focus on understanding concepts at this difficulty level`,
          ],
        });
      }
    }

    // Analyze by grouping
    const groupingStats = await this.calculateGroupingStats(userId);
    for (const [grouping, stats] of Object.entries(groupingStats)) {
      if (stats.averageScore < 70 && stats.attemptCount > 0) {
        weakAreas.push({
          type: 'grouping',
          identifier: grouping,
          averageScore: stats.averageScore,
          attemptCount: stats.attemptCount,
          recommendations: [
            `Review flashcards in the "${grouping}" grouping`,
            `Retake quizzes in the "${grouping}" grouping`,
            `Spend more time studying "${grouping}" materials`,
          ],
        });
      }
    }

    return weakAreas;
  }

  /**
   * Aggregate focus time by study material
   * @param userId - User ID to analyze
   * @param startDate - Optional start date for filtering
   * @param endDate - Optional end date for filtering
   * @returns Aggregated focus time by flashcard grouping and quiz
   */
  async getStudyMaterialFocusTime(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<StudyMaterialFocusTime> {
    // Build where clause
    const whereClause: any = {
      userId,
      completedAt: {
        not: null,
      },
    };

    if (startDate || endDate) {
      whereClause.startedAt = {};
      if (startDate) {
        const normalizedStart = new Date(startDate);
        normalizedStart.setHours(0, 0, 0, 0);
        whereClause.startedAt.gte = normalizedStart;
      }
      if (endDate) {
        const normalizedEnd = new Date(endDate);
        normalizedEnd.setHours(23, 59, 59, 999);
        whereClause.startedAt.lte = normalizedEnd;
      }
    }

    // Fetch focus sessions with study material links
    const focusSessions = await prisma.pomodoroLog.findMany({
      where: {
        ...whereClause,
        OR: [
          { flashcardGrouping: { not: null } },
          { quizId: { not: null } },
        ],
      },
      select: {
        duration: true,
        flashcardGrouping: true,
        quizId: true,
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Aggregate by flashcard grouping
    const flashcardGroupings: Record<string, number> = {};
    for (const session of focusSessions) {
      if (session.flashcardGrouping) {
        if (!flashcardGroupings[session.flashcardGrouping]) {
          flashcardGroupings[session.flashcardGrouping] = 0;
        }
        flashcardGroupings[session.flashcardGrouping] += session.duration;
      }
    }

    // Aggregate by quiz
    const quizzes: Record<string, { quizId: string; title: string; totalMinutes: number }> = {};
    for (const session of focusSessions) {
      if (session.quizId && session.quiz) {
        if (!quizzes[session.quizId]) {
          quizzes[session.quizId] = {
            quizId: session.quiz.id,
            title: session.quiz.title,
            totalMinutes: 0,
          };
        }
        quizzes[session.quizId].totalMinutes += session.duration;
      }
    }

    return {
      flashcardGroupings,
      quizzes,
    };
  }

  /**
   * Calculate average scores by difficulty level
   * @param userId - User ID to analyze
   * @returns Map of difficulty level to stats
   */
  private async calculateDifficultyStats(
    userId: string
  ): Promise<Record<number, { averageScore: number; attemptCount: number }>> {
    // Get all quiz attempts with quiz difficulty
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: {
          userId,
        },
        completedAt: {
          not: null,
        },
      },
      include: {
        quiz: {
          select: {
            difficulty: true,
          },
        },
      },
    });

    // Group by difficulty and calculate averages
    const difficultyMap: Record<number, { totalScore: number; count: number }> = {};

    for (const attempt of attempts) {
      const difficulty = attempt.quiz.difficulty;
      if (!difficultyMap[difficulty]) {
        difficultyMap[difficulty] = { totalScore: 0, count: 0 };
      }
      difficultyMap[difficulty].totalScore += attempt.score;
      difficultyMap[difficulty].count += 1;
    }

    // Calculate averages
    const stats: Record<number, { averageScore: number; attemptCount: number }> = {};
    for (const [difficulty, data] of Object.entries(difficultyMap)) {
      stats[parseInt(difficulty)] = {
        averageScore: data.totalScore / data.count,
        attemptCount: data.count,
      };
    }

    return stats;
  }

  /**
   * Calculate average scores by grouping
   * @param userId - User ID to analyze
   * @returns Map of grouping to stats
   */
  private async calculateGroupingStats(
    userId: string
  ): Promise<Record<string, { averageScore: number; attemptCount: number }>> {
    // Get all quiz attempts with quiz grouping
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: {
          userId,
          grouping: {
            not: null,
          },
        },
        completedAt: {
          not: null,
        },
      },
      include: {
        quiz: {
          select: {
            grouping: true,
          },
        },
      },
    });

    // Group by grouping and calculate averages
    const groupingMap: Record<string, { totalScore: number; count: number }> = {};

    for (const attempt of attempts) {
      const grouping = attempt.quiz.grouping;
      if (!grouping) continue;

      if (!groupingMap[grouping]) {
        groupingMap[grouping] = { totalScore: 0, count: 0 };
      }
      groupingMap[grouping].totalScore += attempt.score;
      groupingMap[grouping].count += 1;
    }

    // Calculate averages
    const stats: Record<string, { averageScore: number; attemptCount: number }> = {};
    for (const [grouping, data] of Object.entries(groupingMap)) {
      stats[grouping] = {
        averageScore: data.totalScore / data.count,
        attemptCount: data.count,
      };
    }

    return stats;
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
