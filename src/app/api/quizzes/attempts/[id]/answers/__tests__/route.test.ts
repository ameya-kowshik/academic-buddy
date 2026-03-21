import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { quizService } from '@/lib/services/quiz.service';

// Mock the quiz service
vi.mock('@/lib/services/quiz.service', () => ({
  quizService: {
    submitAnswer: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Submit Answer API Route', () => {
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

  describe('POST /api/quizzes/attempts/[id]/answers', () => {
    it('should submit an answer successfully', async () => {
      const mockQuestionAttempt = {
        id: 'qa-1',
        quizAttemptId: 'attempt-1',
        quizQuestionId: 'question-1',
        selectedAnswer: '4',
        isCorrect: true,
        timeSpent: null,
        attemptedAt: new Date(),
      };

      vi.mocked(quizService.submitAnswer).mockResolvedValue(mockQuestionAttempt);

      const requestBody = {
        questionId: 'question-1',
        answer: '4',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('qa-1');
      expect(data.selectedAnswer).toBe('4');
      expect(data.isCorrect).toBe(true);
      expect(quizService.submitAnswer).toHaveBeenCalledWith('attempt-1', 'question-1', '4');
    });

    it('should handle incorrect answers', async () => {
      const mockQuestionAttempt = {
        id: 'qa-2',
        quizAttemptId: 'attempt-1',
        quizQuestionId: 'question-1',
        selectedAnswer: '3',
        isCorrect: false,
        timeSpent: null,
        attemptedAt: new Date(),
      };

      vi.mocked(quizService.submitAnswer).mockResolvedValue(mockQuestionAttempt);

      const requestBody = {
        questionId: 'question-1',
        answer: '3',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.isCorrect).toBe(false);
    });

    it('should return 400 for missing questionId', async () => {
      const requestBody = {
        answer: '4',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid answer data');
      expect(quizService.submitAnswer).not.toHaveBeenCalled();
    });

    it('should return 400 for missing answer', async () => {
      const requestBody = {
        questionId: 'question-1',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid answer data');
      expect(quizService.submitAnswer).not.toHaveBeenCalled();
    });

    it('should return 404 when attempt not found', async () => {
      vi.mocked(quizService.submitAnswer).mockRejectedValue(
        new Error('Quiz attempt not found')
      );

      const requestBody = {
        questionId: 'question-1',
        answer: '4',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/nonexistent/answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz attempt not found');
    });

    it('should return 404 when question not found', async () => {
      vi.mocked(quizService.submitAnswer).mockRejectedValue(
        new Error('Question not found')
      );

      const requestBody = {
        questionId: 'nonexistent',
        answer: '4',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Question not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(quizService.submitAnswer).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        questionId: 'question-1',
        answer: '4',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/attempts/attempt-1/answers', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to submit answer');
      expect(data.details).toBe('Database error');
    });
  });
});
