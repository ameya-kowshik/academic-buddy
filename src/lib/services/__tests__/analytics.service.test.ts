import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../analytics.service';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    analytics: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    quizAttempt: {
      findMany: vi.fn(),
    },
    pomodoroLog: {
      findMany: vi.fn(),
    },
  },
}));

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    analyticsService = new AnalyticsService();
    vi.clearAllMocks();
  });

  describe('recordFlashcardReview', () => {
    it('should increment flashcardsReviewed for existing analytics record', async () => {
      const mockDate = new Date('2024-01-15T10:30:00Z');
      const normalizedDate = new Date(mockDate);
      normalizedDate.setHours(0, 0, 0, 0);

      const mockAnalytics = {
        id: 'analytics-123',
        userId: mockUserId,
        date: normalizedDate,
        flashcardsReviewed: 5,
        quizzesCompleted: 2,
        tasksCompleted: 0,
        pomodoroSessions: 0,
        focusHours: 0,
        aiSuggestionsAccepted: 0,
        aiSuggestionsRejected: 0,
      };

      vi.mocked(prisma.analytics.upsert).mockResolvedValue(mockAnalytics);

      await analyticsService.recordFlashcardReview(mockUserId, mockDate);

      expect(prisma.analytics.upsert).toHaveBeenCalledWith({
        where: {
          userId_date: {
            userId: mockUserId,
            date: normalizedDate,
          },
        },
        update: {
          flashcardsReviewed: {
            increment: 1,
          },
        },
        create: {
          userId: mockUserId,
          date: normalizedDate,
          flashcardsReviewed: 1,
        },
      });
    });

    it('should create new analytics record if none exists', async () => {
      const mockDate = new Date('2024-01-15T10:30:00Z');
      const normalizedDate = new Date(mockDate);
      normalizedDate.setHours(0, 0, 0, 0);

      const mockAnalytics = {
        id: 'analytics-123',
        userId: mockUserId,
        date: normalizedDate,
        flashcardsReviewed: 1,
        quizzesCompleted: 0,
        tasksCompleted: 0,
        pomodoroSessions: 0,
        focusHours: 0,
        aiSuggestionsAccepted: 0,
        aiSuggestionsRejected: 0,
      };

      vi.mocked(prisma.analytics.upsert).mockResolvedValue(mockAnalytics);

      await analyticsService.recordFlashcardReview(mockUserId, mockDate);

      expect(prisma.analytics.upsert).toHaveBeenCalled();
    });

    it('should use current date if no date provided', async () => {
      const mockAnalytics = {
        id: 'analytics-123',
        userId: mockUserId,
        date: expect.any(Date),
        flashcardsReviewed: 1,
        quizzesCompleted: 0,
        tasksCompleted: 0,
        pomodoroSessions: 0,
        focusHours: 0,
        aiSuggestionsAccepted: 0,
        aiSuggestionsRejected: 0,
      };

      vi.mocked(prisma.analytics.upsert).mockResolvedValue(mockAnalytics);

      await analyticsService.recordFlashcardReview(mockUserId);

      expect(prisma.analytics.upsert).toHaveBeenCalled();
    });
  });

  describe('recordQuizCompletion', () => {
    it('should increment quizzesCompleted for existing analytics record', async () => {
      const mockDate = new Date('2024-01-15T10:30:00Z');
      const normalizedDate = new Date(mockDate);
      normalizedDate.setHours(0, 0, 0, 0);

      const mockAnalytics = {
        id: 'analytics-123',
        userId: mockUserId,
        date: normalizedDate,
        flashcardsReviewed: 5,
        quizzesCompleted: 3,
        tasksCompleted: 0,
        pomodoroSessions: 0,
        focusHours: 0,
        aiSuggestionsAccepted: 0,
        aiSuggestionsRejected: 0,
      };

      vi.mocked(prisma.analytics.upsert).mockResolvedValue(mockAnalytics);

      await analyticsService.recordQuizCompletion(mockUserId, mockDate);

      expect(prisma.analytics.upsert).toHaveBeenCalledWith({
        where: {
          userId_date: {
            userId: mockUserId,
            date: normalizedDate,
          },
        },
        update: {
          quizzesCompleted: {
            increment: 1,
          },
        },
        create: {
          userId: mockUserId,
          date: normalizedDate,
          quizzesCompleted: 1,
        },
      });
    });

    it('should create new analytics record if none exists', async () => {
      const mockDate = new Date('2024-01-15T10:30:00Z');
      const normalizedDate = new Date(mockDate);
      normalizedDate.setHours(0, 0, 0, 0);

      const mockAnalytics = {
        id: 'analytics-123',
        userId: mockUserId,
        date: normalizedDate,
        flashcardsReviewed: 0,
        quizzesCompleted: 1,
        tasksCompleted: 0,
        pomodoroSessions: 0,
        focusHours: 0,
        aiSuggestionsAccepted: 0,
        aiSuggestionsRejected: 0,
      };

      vi.mocked(prisma.analytics.upsert).mockResolvedValue(mockAnalytics);

      await analyticsService.recordQuizCompletion(mockUserId, mockDate);

      expect(prisma.analytics.upsert).toHaveBeenCalled();
    });

    it('should use current date if no date provided', async () => {
      const mockAnalytics = {
        id: 'analytics-123',
        userId: mockUserId,
        date: expect.any(Date),
        flashcardsReviewed: 0,
        quizzesCompleted: 1,
        tasksCompleted: 0,
        pomodoroSessions: 0,
        focusHours: 0,
        aiSuggestionsAccepted: 0,
        aiSuggestionsRejected: 0,
      };

      vi.mocked(prisma.analytics.upsert).mockResolvedValue(mockAnalytics);

      await analyticsService.recordQuizCompletion(mockUserId);

      expect(prisma.analytics.upsert).toHaveBeenCalled();
    });
  });

  describe('getStudyAnalytics', () => {
    it('should retrieve study analytics for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockAnalyticsRecords = [
        {
          id: 'analytics-1',
          userId: mockUserId,
          date: new Date('2024-01-15'),
          flashcardsReviewed: 10,
          quizzesCompleted: 2,
          tasksCompleted: 0,
          pomodoroSessions: 0,
          focusHours: 0,
          aiSuggestionsAccepted: 0,
          aiSuggestionsRejected: 0,
        },
        {
          id: 'analytics-2',
          userId: mockUserId,
          date: new Date('2024-01-20'),
          flashcardsReviewed: 5,
          quizzesCompleted: 1,
          tasksCompleted: 0,
          pomodoroSessions: 0,
          focusHours: 0,
          aiSuggestionsAccepted: 0,
          aiSuggestionsRejected: 0,
        },
      ];

      const mockQuizAttempts = [
        { score: 80 },
        { score: 90 },
        { score: 70 },
      ];

      const mockFocusSessions = [
        { duration: 25 },
        { duration: 25 },
        { duration: 30 },
      ];

      vi.mocked(prisma.analytics.findMany).mockResolvedValue(mockAnalyticsRecords);
      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue(mockQuizAttempts as any);
      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockFocusSessions as any);

      const result = await analyticsService.getStudyAnalytics(mockUserId, startDate, endDate);

      expect(result.flashcardsReviewed).toBe(15);
      expect(result.quizzesCompleted).toBe(3);
      expect(result.averageQuizScore).toBe(80);
      expect(result.totalStudyTime).toBe(80);
      expect(result.dailyBreakdown).toHaveLength(2);
      expect(result.dailyBreakdown[0].flashcardsReviewed).toBe(10);
      expect(result.dailyBreakdown[1].quizzesCompleted).toBe(1);
    });

    it('should return zero values when no data exists', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      vi.mocked(prisma.analytics.findMany).mockResolvedValue([]);
      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue([]);

      const result = await analyticsService.getStudyAnalytics(mockUserId, startDate, endDate);

      expect(result.flashcardsReviewed).toBe(0);
      expect(result.quizzesCompleted).toBe(0);
      expect(result.averageQuizScore).toBe(0);
      expect(result.totalStudyTime).toBe(0);
      expect(result.dailyBreakdown).toEqual([]);
    });

    it('should handle single day date range', async () => {
      const date = new Date('2024-01-15');

      const mockAnalyticsRecords = [
        {
          id: 'analytics-1',
          userId: mockUserId,
          date: new Date('2024-01-15'),
          flashcardsReviewed: 10,
          quizzesCompleted: 2,
          tasksCompleted: 0,
          pomodoroSessions: 0,
          focusHours: 0,
          aiSuggestionsAccepted: 0,
          aiSuggestionsRejected: 0,
        },
      ];

      vi.mocked(prisma.analytics.findMany).mockResolvedValue(mockAnalyticsRecords);
      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue([]);
      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue([]);

      const result = await analyticsService.getStudyAnalytics(mockUserId, date, date);

      expect(result.flashcardsReviewed).toBe(10);
      expect(result.quizzesCompleted).toBe(2);
      expect(result.dailyBreakdown).toHaveLength(1);
    });
  });

  describe('identifyWeakAreas', () => {
    it('should identify weak difficulty levels (below 70%)', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          score: 60,
          quiz: { difficulty: 3 },
          completedAt: new Date(),
        },
        {
          id: 'attempt-2',
          score: 65,
          quiz: { difficulty: 3 },
          completedAt: new Date(),
        },
        {
          id: 'attempt-3',
          score: 85,
          quiz: { difficulty: 1 },
          completedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue(mockAttempts as any);

      const result = await analyticsService.identifyWeakAreas(mockUserId);

      const weakDifficulty = result.find((area) => area.type === 'difficulty' && area.identifier === 3);
      expect(weakDifficulty).toBeDefined();
      expect(weakDifficulty?.averageScore).toBe(62.5);
      expect(weakDifficulty?.attemptCount).toBe(2);
      expect(weakDifficulty?.recommendations).toContain('Review flashcards with difficulty level 3');
    });

    it('should identify weak groupings (below 70%)', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          score: 55,
          quiz: { difficulty: 2, grouping: 'Math' },
          completedAt: new Date(),
        },
        {
          id: 'attempt-2',
          score: 65,
          quiz: { difficulty: 2, grouping: 'Math' },
          completedAt: new Date(),
        },
        {
          id: 'attempt-3',
          score: 90,
          quiz: { difficulty: 2, grouping: 'Science' },
          completedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue(mockAttempts as any);

      const result = await analyticsService.identifyWeakAreas(mockUserId);

      const weakGrouping = result.find((area) => area.type === 'grouping' && area.identifier === 'Math');
      expect(weakGrouping).toBeDefined();
      expect(weakGrouping?.averageScore).toBe(60);
      expect(weakGrouping?.attemptCount).toBe(2);
      expect(weakGrouping?.recommendations).toContain('Review flashcards in the "Math" grouping');
    });

    it('should not identify areas with scores above 70%', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          score: 80,
          quiz: { difficulty: 2, grouping: 'Math' },
          completedAt: new Date(),
        },
        {
          id: 'attempt-2',
          score: 85,
          quiz: { difficulty: 2, grouping: 'Math' },
          completedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue(mockAttempts as any);

      const result = await analyticsService.identifyWeakAreas(mockUserId);

      expect(result).toEqual([]);
    });

    it('should return empty array when no quiz attempts exist', async () => {
      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue([]);

      const result = await analyticsService.identifyWeakAreas(mockUserId);

      expect(result).toEqual([]);
    });

    it('should handle multiple weak areas', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          score: 60,
          quiz: { difficulty: 3, grouping: 'Math' },
          completedAt: new Date(),
        },
        {
          id: 'attempt-2',
          score: 65,
          quiz: { difficulty: 3, grouping: 'Math' },
          completedAt: new Date(),
        },
        {
          id: 'attempt-3',
          score: 55,
          quiz: { difficulty: 5, grouping: 'Science' },
          completedAt: new Date(),
        },
        {
          id: 'attempt-4',
          score: 60,
          quiz: { difficulty: 5, grouping: 'Science' },
          completedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue(mockAttempts as any);

      const result = await analyticsService.identifyWeakAreas(mockUserId);

      expect(result.length).toBeGreaterThan(0);
      const weakDifficulties = result.filter((area) => area.type === 'difficulty');
      const weakGroupings = result.filter((area) => area.type === 'grouping');
      expect(weakDifficulties.length).toBeGreaterThan(0);
      expect(weakGroupings.length).toBeGreaterThan(0);
    });
  });
});
