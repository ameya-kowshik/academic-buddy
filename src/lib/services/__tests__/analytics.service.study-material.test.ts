import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analyticsService } from '../analytics.service';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pomodoroLog: {
      findMany: vi.fn(),
    },
  },
}));

describe('AnalyticsService - Study Material Focus Time', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getStudyMaterialFocusTime', () => {
    it('should aggregate focus time by flashcard grouping', async () => {
      const mockSessions = [
        {
          duration: 25,
          flashcardGrouping: 'Biology Chapter 1',
          quizId: null,
          quiz: null,
        },
        {
          duration: 30,
          flashcardGrouping: 'Biology Chapter 1',
          quizId: null,
          quiz: null,
        },
        {
          duration: 20,
          flashcardGrouping: 'Math Formulas',
          quizId: null,
          quiz: null,
        },
      ];

      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockSessions as any);

      const result = await analyticsService.getStudyMaterialFocusTime(mockUserId);

      expect(result.flashcardGroupings).toEqual({
        'Biology Chapter 1': 55,
        'Math Formulas': 20,
      });
      expect(result.quizzes).toEqual({});
    });

    it('should aggregate focus time by quiz', async () => {
      const mockSessions = [
        {
          duration: 30,
          flashcardGrouping: null,
          quizId: 'quiz-1',
          quiz: { id: 'quiz-1', title: 'Biology Quiz' },
        },
        {
          duration: 25,
          flashcardGrouping: null,
          quizId: 'quiz-1',
          quiz: { id: 'quiz-1', title: 'Biology Quiz' },
        },
        {
          duration: 40,
          flashcardGrouping: null,
          quizId: 'quiz-2',
          quiz: { id: 'quiz-2', title: 'Math Quiz' },
        },
      ];

      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockSessions as any);

      const result = await analyticsService.getStudyMaterialFocusTime(mockUserId);

      expect(result.flashcardGroupings).toEqual({});
      expect(result.quizzes).toEqual({
        'quiz-1': {
          quizId: 'quiz-1',
          title: 'Biology Quiz',
          totalMinutes: 55,
        },
        'quiz-2': {
          quizId: 'quiz-2',
          title: 'Math Quiz',
          totalMinutes: 40,
        },
      });
    });

    it('should aggregate focus time by both flashcard grouping and quiz', async () => {
      const mockSessions = [
        {
          duration: 25,
          flashcardGrouping: 'Biology Chapter 1',
          quizId: null,
          quiz: null,
        },
        {
          duration: 30,
          flashcardGrouping: null,
          quizId: 'quiz-1',
          quiz: { id: 'quiz-1', title: 'Biology Quiz' },
        },
        {
          duration: 20,
          flashcardGrouping: 'Math Formulas',
          quizId: null,
          quiz: null,
        },
        {
          duration: 35,
          flashcardGrouping: null,
          quizId: 'quiz-2',
          quiz: { id: 'quiz-2', title: 'Math Quiz' },
        },
      ];

      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockSessions as any);

      const result = await analyticsService.getStudyMaterialFocusTime(mockUserId);

      expect(result.flashcardGroupings).toEqual({
        'Biology Chapter 1': 25,
        'Math Formulas': 20,
      });
      expect(result.quizzes).toEqual({
        'quiz-1': {
          quizId: 'quiz-1',
          title: 'Biology Quiz',
          totalMinutes: 30,
        },
        'quiz-2': {
          quizId: 'quiz-2',
          title: 'Math Quiz',
          totalMinutes: 35,
        },
      });
    });

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockSessions = [
        {
          duration: 25,
          flashcardGrouping: 'Biology Chapter 1',
          quizId: null,
          quiz: null,
        },
      ];

      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockSessions as any);

      await analyticsService.getStudyMaterialFocusTime(mockUserId, startDate, endDate);

      expect(prisma.pomodoroLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            completedAt: { not: null },
            startedAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should return empty results when no sessions with study materials exist', async () => {
      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue([]);

      const result = await analyticsService.getStudyMaterialFocusTime(mockUserId);

      expect(result.flashcardGroupings).toEqual({});
      expect(result.quizzes).toEqual({});
    });

    it('should handle sessions with both flashcard grouping and quiz', async () => {
      const mockSessions = [
        {
          duration: 45,
          flashcardGrouping: 'Combined Study',
          quizId: 'quiz-1',
          quiz: { id: 'quiz-1', title: 'Combined Quiz' },
        },
      ];

      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockSessions as any);

      const result = await analyticsService.getStudyMaterialFocusTime(mockUserId);

      // Session should be counted in both aggregations
      expect(result.flashcardGroupings).toEqual({
        'Combined Study': 45,
      });
      expect(result.quizzes).toEqual({
        'quiz-1': {
          quizId: 'quiz-1',
          title: 'Combined Quiz',
          totalMinutes: 45,
        },
      });
    });

    it('should accumulate multiple sessions for the same study material', async () => {
      const mockSessions = [
        {
          duration: 15,
          flashcardGrouping: 'Physics',
          quizId: null,
          quiz: null,
        },
        {
          duration: 20,
          flashcardGrouping: 'Physics',
          quizId: null,
          quiz: null,
        },
        {
          duration: 25,
          flashcardGrouping: 'Physics',
          quizId: null,
          quiz: null,
        },
      ];

      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockSessions as any);

      const result = await analyticsService.getStudyMaterialFocusTime(mockUserId);

      expect(result.flashcardGroupings).toEqual({
        Physics: 60, // 15 + 20 + 25
      });
    });
  });
});
