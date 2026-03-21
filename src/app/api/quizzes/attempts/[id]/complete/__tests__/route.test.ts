import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { quizService } from '@/lib/services/quiz.service';

// Mock the quiz service
vi.mock('@/lib/services/quiz.service', () => ({
  quizService: {
    completeAttempt: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Complete Attempt API Route', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContext = {
    params: { id: 'attempt-1' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/quizzes/attempts/[id]/complete', () => {
    it('should complete a quiz attempt successfully', async () => {
      const mockCompletedAttempt = {
        id: 'attempt-1',
        quizId: 'quiz-1',
        score: 80,
        totalQuestions: 5,
        correctAnswers: 4,
        timeSpent: 300,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:05:00Z'),
      };

      vi.mocked(quizService.completeAttempt).mockResolvedValue(mockCompletedAttempt);

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/complete', {
        method: 'POST',
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('attempt-1');
      expect(data.score).toBe(80);
      expect(data.correctAnswers).toBe(4);
      expect(data.timeSpent).toBe(300);
      expect(data.completedAt).toBeTruthy();
      expect(quizService.completeAttempt).toHaveBeenCalledWith('attempt-1');
    });

    it('should handle perfect score', async () => {
      const mockCompletedAttempt = {
        id: 'attempt-2',
        quizId: 'quiz-1',
        score: 100,
        totalQuestions: 5,
        correctAnswers: 5,
        timeSpent: 250,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:04:10Z'),
      };

      vi.mocked(quizService.completeAttempt).mockResolvedValue(mockCompletedAttempt);

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-2/complete', {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: 'attempt-2' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBe(100);
      expect(data.correctAnswers).toBe(5);
    });

    it('should handle zero score', async () => {
      const mockCompletedAttempt = {
        id: 'attempt-3',
        quizId: 'quiz-1',
        score: 0,
        totalQuestions: 5,
        correctAnswers: 0,
        timeSpent: 180,
        startedAt: new Date('2024-01-01T10:00:00Z'),
        completedAt: new Date('2024-01-01T10:03:00Z'),
      };

      vi.mocked(quizService.completeAttempt).mockResolvedValue(mockCompletedAttempt);

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-3/complete', {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: 'attempt-3' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.score).toBe(0);
      expect(data.correctAnswers).toBe(0);
    });

    it('should return 404 when attempt not found', async () => {
      vi.mocked(quizService.completeAttempt).mockRejectedValue(
        new Error('Quiz attempt not found')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/nonexistent/complete', {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz attempt not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(quizService.completeAttempt).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/complete', {
        method: 'POST',
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to complete quiz attempt');
      expect(data.details).toBe('Database error');
    });
  });
});
