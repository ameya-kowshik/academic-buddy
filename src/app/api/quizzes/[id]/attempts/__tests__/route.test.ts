import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { quizService } from '@/lib/services/quiz.service';

// Mock the quiz service
vi.mock('@/lib/services/quiz.service', () => ({
  quizService: {
    startAttempt: vi.fn(),
    getAttemptHistory: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Quiz Attempts API Routes', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContext = {
    params: { id: 'quiz-1' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/quizzes/[id]/attempts', () => {
    it('should start a new quiz attempt', async () => {
      const mockAttempt = {
        id: 'attempt-1',
        quizId: 'quiz-1',
        score: 0,
        totalQuestions: 5,
        correctAnswers: 0,
        timeSpent: null,
        startedAt: new Date(),
        completedAt: null,
      };

      vi.mocked(quizService.startAttempt).mockResolvedValue(mockAttempt);

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/attempts', {
        method: 'POST',
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('attempt-1');
      expect(data.quizId).toBe('quiz-1');
      expect(data.totalQuestions).toBe(5);
      expect(quizService.startAttempt).toHaveBeenCalledWith(mockUser.id, 'quiz-1');
    });

    it('should return 404 when quiz not found', async () => {
      vi.mocked(quizService.startAttempt).mockRejectedValue(
        new Error('Quiz not found')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/nonexistent/attempts', {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(quizService.startAttempt).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/attempts', {
        method: 'POST',
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to start quiz attempt');
      expect(data.details).toBe('Database error');
    });
  });

  describe('GET /api/quizzes/[id]/attempts', () => {
    it('should return attempt history for a quiz', async () => {
      const mockAttempts = [
        {
          id: 'attempt-1',
          quizId: 'quiz-1',
          score: 80,
          totalQuestions: 5,
          correctAnswers: 4,
          timeSpent: 300,
          startedAt: new Date('2024-01-01T10:00:00Z'),
          completedAt: new Date('2024-01-01T10:05:00Z'),
        },
        {
          id: 'attempt-2',
          quizId: 'quiz-1',
          score: 60,
          totalQuestions: 5,
          correctAnswers: 3,
          timeSpent: 400,
          startedAt: new Date('2024-01-02T10:00:00Z'),
          completedAt: new Date('2024-01-02T10:06:40Z'),
        },
      ];

      vi.mocked(quizService.getAttemptHistory).mockResolvedValue(mockAttempts);

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/attempts');
      const response = await GET(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].score).toBe(80);
      expect(data[1].score).toBe(60);
      expect(quizService.getAttemptHistory).toHaveBeenCalledWith(mockUser.id, 'quiz-1');
    });

    it('should return empty array when no attempts exist', async () => {
      vi.mocked(quizService.getAttemptHistory).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/attempts');
      const response = await GET(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(0);
    });

    it('should return 404 when quiz not found', async () => {
      vi.mocked(quizService.getAttemptHistory).mockRejectedValue(
        new Error('Quiz not found')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/nonexistent/attempts');
      const response = await GET(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(quizService.getAttemptHistory).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/attempts');
      const response = await GET(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch quiz attempt history');
      expect(data.details).toBe('Database error');
    });
  });
});
