import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { quizService } from '@/lib/services/quiz.service';

// Mock the quiz service
vi.mock('@/lib/services/quiz.service', () => ({
  quizService: {
    listQuizzes: vi.fn(),
    createQuiz: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Quiz API Routes', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/quizzes', () => {
    it('should return all user quizzes', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Math Quiz',
          description: 'Basic math questions',
          grouping: 'Math',
          difficulty: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: null,
        },
        {
          id: 'quiz-2',
          title: 'History Quiz',
          description: 'World history',
          grouping: 'History',
          difficulty: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: 'doc-1',
        },
      ];

      vi.mocked(quizService.listQuizzes).mockResolvedValue(mockQuizzes);

      const request = new NextRequest('http://localhost:3000/api/quizzes');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quizzes).toHaveLength(2);
      expect(data.quizzes[0].id).toBe('quiz-1');
      expect(quizService.listQuizzes).toHaveBeenCalledWith(mockUser.id, {});
    });

    it('should filter quizzes by grouping', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Math Quiz',
          description: 'Basic math questions',
          grouping: 'Math',
          difficulty: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: null,
        },
      ];

      vi.mocked(quizService.listQuizzes).mockResolvedValue(mockQuizzes);

      const request = new NextRequest('http://localhost:3000/api/quizzes?grouping=Math');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quizzes).toHaveLength(1);
      expect(quizService.listQuizzes).toHaveBeenCalledWith(mockUser.id, {
        grouping: 'Math',
      });
    });

    it('should filter quizzes by difficulty', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Advanced Math Quiz',
          description: 'Advanced math questions',
          grouping: 'Math',
          difficulty: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: null,
        },
      ];

      vi.mocked(quizService.listQuizzes).mockResolvedValue(mockQuizzes);

      const request = new NextRequest('http://localhost:3000/api/quizzes?difficulty=4');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quizzes).toHaveLength(1);
      expect(quizService.listQuizzes).toHaveBeenCalledWith(mockUser.id, {
        difficulty: 4,
      });
    });

    it('should filter quizzes by sourceMaterialId', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Document Quiz',
          description: 'Quiz from document',
          grouping: 'Study',
          difficulty: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: 'doc-1',
        },
      ];

      vi.mocked(quizService.listQuizzes).mockResolvedValue(mockQuizzes);

      const request = new NextRequest('http://localhost:3000/api/quizzes?sourceMaterialId=doc-1');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quizzes).toHaveLength(1);
      expect(quizService.listQuizzes).toHaveBeenCalledWith(mockUser.id, {
        sourceMaterialId: 'doc-1',
      });
    });

    it('should return empty array when user has no quizzes', async () => {
      vi.mocked(quizService.listQuizzes).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/quizzes');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.quizzes).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(quizService.listQuizzes).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/quizzes');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch quizzes');
      expect(data.details).toBe('Database error');
    });
  });

  describe('POST /api/quizzes', () => {
    it('should create a valid quiz', async () => {
      const mockQuiz = {
        id: 'new-quiz-id',
        title: 'New Quiz',
        description: 'A new quiz',
        grouping: 'Science',
        difficulty: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
      };

      vi.mocked(quizService.createQuiz).mockResolvedValue(mockQuiz);

      const requestBody = {
        title: 'New Quiz',
        description: 'A new quiz',
        grouping: 'Science',
        difficulty: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('new-quiz-id');
      expect(data.title).toBe('New Quiz');
      expect(quizService.createQuiz).toHaveBeenCalledWith(
        mockUser.id,
        requestBody
      );
    });

    it('should create a quiz with sourceMaterialId', async () => {
      const mockQuiz = {
        id: 'new-quiz-id',
        title: 'Document Quiz',
        description: 'Quiz from document',
        grouping: 'Study',
        difficulty: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: 'doc-1',
      };

      vi.mocked(quizService.createQuiz).mockResolvedValue(mockQuiz);

      const requestBody = {
        title: 'Document Quiz',
        description: 'Quiz from document',
        grouping: 'Study',
        difficulty: 2,
        sourceMaterialId: 'doc-1',
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.sourceMaterialId).toBe('doc-1');
    });

    it('should reject quiz with missing title', async () => {
      const requestBody = {
        description: 'A quiz without title',
        difficulty: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid quiz data');
      expect(quizService.createQuiz).not.toHaveBeenCalled();
    });

    it('should reject quiz with invalid difficulty (too low)', async () => {
      const requestBody = {
        title: 'Invalid Quiz',
        difficulty: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid quiz data');
      expect(quizService.createQuiz).not.toHaveBeenCalled();
    });

    it('should reject quiz with invalid difficulty (too high)', async () => {
      const requestBody = {
        title: 'Invalid Quiz',
        difficulty: 6,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid quiz data');
      expect(quizService.createQuiz).not.toHaveBeenCalled();
    });

    it('should handle creation errors gracefully', async () => {
      vi.mocked(quizService.createQuiz).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        title: 'New Quiz',
        difficulty: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/quizzes', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create quiz');
      expect(data.details).toBe('Database error');
    });
  });
});
