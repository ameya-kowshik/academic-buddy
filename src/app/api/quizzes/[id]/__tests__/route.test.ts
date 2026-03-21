import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { quizService } from '@/lib/services/quiz.service';

// Mock the quiz service
vi.mock('@/lib/services/quiz.service', () => ({
  quizService: {
    getQuiz: vi.fn(),
    updateQuiz: vi.fn(),
    deleteQuiz: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Quiz [id] API Routes', () => {
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

  describe('GET /api/quizzes/[id]', () => {
    it('should return quiz with questions', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        title: 'Math Quiz',
        description: 'Basic math questions',
        grouping: 'Math',
        difficulty: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
        questions: [
          {
            id: 'q1',
            questionText: 'What is 2+2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4',
            explanation: 'Basic addition',
            order: 0,
            quizId: 'quiz-1',
            createdAt: new Date(),
          },
          {
            id: 'q2',
            questionText: 'What is 3*3?',
            options: ['6', '9', '12', '15'],
            correctAnswer: '9',
            explanation: 'Basic multiplication',
            order: 1,
            quizId: 'quiz-1',
            createdAt: new Date(),
          },
        ],
      };

      vi.mocked(quizService.getQuiz).mockResolvedValue(mockQuiz);

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1');
      const response = await GET(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('quiz-1');
      expect(data.questions).toHaveLength(2);
      expect(data.questions[0].questionText).toBe('What is 2+2?');
      expect(quizService.getQuiz).toHaveBeenCalledWith(mockUser.id, 'quiz-1');
    });

    it('should return 404 when quiz not found', async () => {
      vi.mocked(quizService.getQuiz).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/quizzes/nonexistent');
      const response = await GET(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(quizService.getQuiz).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1');
      const response = await GET(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch quiz');
      expect(data.details).toBe('Database error');
    });
  });

  describe('PUT /api/quizzes/[id]', () => {
    it('should update quiz successfully', async () => {
      const mockQuiz = {
        id: 'quiz-1',
        title: 'Updated Quiz',
        description: 'Updated description',
        grouping: 'Math',
        difficulty: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
      };

      vi.mocked(quizService.updateQuiz).mockResolvedValue(mockQuiz);

      const requestBody = {
        title: 'Updated Quiz',
        description: 'Updated description',
        difficulty: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Quiz');
      expect(quizService.updateQuiz).toHaveBeenCalledWith(
        mockUser.id,
        'quiz-1',
        requestBody
      );
    });

    it('should return 404 when quiz not found', async () => {
      vi.mocked(quizService.updateQuiz).mockRejectedValue(
        new Error('Quiz not found')
      );

      const requestBody = {
        title: 'Updated Quiz',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz not found');
    });

    it('should reject invalid difficulty', async () => {
      const requestBody = {
        difficulty: 10,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid quiz data');
      expect(quizService.updateQuiz).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      vi.mocked(quizService.updateQuiz).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        title: 'Updated Quiz',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update quiz');
      expect(data.details).toBe('Database error');
    });
  });

  describe('DELETE /api/quizzes/[id]', () => {
    it('should delete quiz successfully', async () => {
      vi.mocked(quizService.deleteQuiz).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Quiz deleted successfully');
      expect(quizService.deleteQuiz).toHaveBeenCalledWith(mockUser.id, 'quiz-1');
    });

    it('should return 404 when quiz not found', async () => {
      vi.mocked(quizService.deleteQuiz).mockRejectedValue(
        new Error('Quiz not found')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz not found');
    });

    it('should handle deletion errors gracefully', async () => {
      vi.mocked(quizService.deleteQuiz).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete quiz');
      expect(data.details).toBe('Database error');
    });
  });
});
