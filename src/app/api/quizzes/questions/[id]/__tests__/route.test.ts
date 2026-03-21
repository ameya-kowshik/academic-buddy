import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PUT, DELETE } from '../route';
import { quizService } from '@/lib/services/quiz.service';

// Mock the quiz service
vi.mock('@/lib/services/quiz.service', () => ({
  quizService: {
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Quiz Question [id] API Routes', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContext = {
    params: { id: 'question-1' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PUT /api/quizzes/questions/[id]', () => {
    it('should update question successfully', async () => {
      const mockQuestion = {
        id: 'question-1',
        questionText: 'Updated question?',
        options: ['A', 'B', 'C', 'D'],
        correctAnswer: 'B',
        explanation: 'Updated explanation',
        order: 0,
        quizId: 'quiz-1',
        createdAt: new Date(),
      };

      vi.mocked(quizService.updateQuestion).mockResolvedValue(mockQuestion);

      const requestBody = {
        questionText: 'Updated question?',
        explanation: 'Updated explanation',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/question-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.questionText).toBe('Updated question?');
      expect(quizService.updateQuestion).toHaveBeenCalledWith(
        mockUser.id,
        'question-1',
        requestBody
      );
    });

    it('should update question options and correct answer', async () => {
      const mockQuestion = {
        id: 'question-1',
        questionText: 'What is 2+2?',
        options: ['2', '3', '4', '5'],
        correctAnswer: '4',
        explanation: 'Basic addition',
        order: 0,
        quizId: 'quiz-1',
        createdAt: new Date(),
      };

      vi.mocked(quizService.updateQuestion).mockResolvedValue(mockQuestion);

      const requestBody = {
        options: ['2', '3', '4', '5'],
        correctAnswer: '4',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/question-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.options).toEqual(['2', '3', '4', '5']);
      expect(data.correctAnswer).toBe('4');
    });

    it('should return 404 when question not found', async () => {
      vi.mocked(quizService.updateQuestion).mockRejectedValue(
        new Error('Question not found')
      );

      const requestBody = {
        questionText: 'Updated question?',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Question not found');
    });

    it('should reject update with less than 2 options', async () => {
      const requestBody = {
        options: ['A'],
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/question-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid question data');
      expect(quizService.updateQuestion).not.toHaveBeenCalled();
    });

    it('should reject when correct answer not in options', async () => {
      vi.mocked(quizService.updateQuestion).mockRejectedValue(
        new Error('Correct answer must be one of the options')
      );

      const requestBody = {
        options: ['A', 'B', 'C'],
        correctAnswer: 'D',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/question-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Correct answer must be one of the options');
    });

    it('should handle update errors gracefully', async () => {
      vi.mocked(quizService.updateQuestion).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        questionText: 'Updated question?',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/question-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update question');
      expect(data.details).toBe('Database error');
    });
  });

  describe('DELETE /api/quizzes/questions/[id]', () => {
    it('should delete question successfully', async () => {
      vi.mocked(quizService.deleteQuestion).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/question-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Question deleted successfully');
      expect(quizService.deleteQuestion).toHaveBeenCalledWith(mockUser.id, 'question-1');
    });

    it('should return 404 when question not found', async () => {
      vi.mocked(quizService.deleteQuestion).mockRejectedValue(
        new Error('Question not found')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Question not found');
    });

    it('should handle deletion errors gracefully', async () => {
      vi.mocked(quizService.deleteQuestion).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/questions/question-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete question');
      expect(data.details).toBe('Database error');
    });
  });
});
