import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { quizService } from '@/lib/services/quiz.service';

// Mock the quiz service
vi.mock('@/lib/services/quiz.service', () => ({
  quizService: {
    addQuestion: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Quiz Questions API Routes', () => {
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

  describe('POST /api/quizzes/[id]/questions', () => {
    it('should add question to quiz successfully', async () => {
      const mockQuestion = {
        id: 'question-1',
        questionText: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic addition',
        order: 0,
        quizId: 'quiz-1',
        createdAt: new Date(),
      };

      vi.mocked(quizService.addQuestion).mockResolvedValue(mockQuestion);

      const requestBody = {
        questionText: 'What is 2+2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic addition',
        order: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/questions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('question-1');
      expect(data.questionText).toBe('What is 2+2?');
      expect(quizService.addQuestion).toHaveBeenCalledWith(
        mockUser.id,
        'quiz-1',
        requestBody
      );
    });

    it('should add question without explanation', async () => {
      const mockQuestion = {
        id: 'question-1',
        questionText: 'What is 3*3?',
        options: ['6', '9', '12'],
        correctAnswer: '9',
        explanation: null,
        order: 1,
        quizId: 'quiz-1',
        createdAt: new Date(),
      };

      vi.mocked(quizService.addQuestion).mockResolvedValue(mockQuestion);

      const requestBody = {
        questionText: 'What is 3*3?',
        options: ['6', '9', '12'],
        correctAnswer: '9',
        order: 1,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/questions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.explanation).toBeNull();
    });

    it('should return 404 when quiz not found', async () => {
      vi.mocked(quizService.addQuestion).mockRejectedValue(
        new Error('Quiz not found')
      );

      const requestBody = {
        questionText: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        order: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/nonexistent/questions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Quiz not found');
    });

    it('should reject question with less than 2 options', async () => {
      const requestBody = {
        questionText: 'What is 2+2?',
        options: ['4'],
        correctAnswer: '4',
        order: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/questions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid question data');
      expect(quizService.addQuestion).not.toHaveBeenCalled();
    });

    it('should reject question with missing questionText', async () => {
      const requestBody = {
        options: ['3', '4', '5'],
        correctAnswer: '4',
        order: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/questions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid question data');
      expect(quizService.addQuestion).not.toHaveBeenCalled();
    });

    it('should reject question when correct answer not in options', async () => {
      vi.mocked(quizService.addQuestion).mockRejectedValue(
        new Error('Correct answer must be one of the options')
      );

      const requestBody = {
        questionText: 'What is 2+2?',
        options: ['3', '5', '6'],
        correctAnswer: '4',
        order: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/questions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Correct answer must be one of the options');
    });

    it('should handle creation errors gracefully', async () => {
      vi.mocked(quizService.addQuestion).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        questionText: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        order: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes/quiz-1/questions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to add question');
      expect(data.details).toBe('Database error');
    });
  });
});
