import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { prisma } from '@/lib/prisma';

// Mock the middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/validation', () => ({
  withValidation: (schema: any, handler: any) => async (req: NextRequest, context: any, user: any) => {
    const body = await req.json();
    return handler(req, context, user, body);
  },
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pomodoroLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    task: {
      findUnique: vi.fn(),
    },
    quiz: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Focus Sessions - Study Material Linking', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockQuiz = {
    id: 'quiz-123',
    title: 'Test Quiz',
    userId: 'user-123',
    difficulty: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/focus-sessions - Create with study material links', () => {
    it('should create focus session with flashcard grouping', async () => {
      const sessionData = {
        duration: 25,
        sessionType: 'POMODORO',
        focusScore: 8,
        notes: 'Studying flashcards',
        flashcardGrouping: 'Biology Chapter 1',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const mockSession = {
        id: 'session-123',
        ...sessionData,
        userId: mockUser.id,
        taskId: null,
        tagId: null,
        projectId: null,
        quizId: null,
        task: null,
        tag: null,
        project: null,
        quiz: null,
      };

      vi.mocked(prisma.pomodoroLog.create).mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });

      const response = await POST(request, {}, mockUser as any, sessionData);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.flashcardGrouping).toBe('Biology Chapter 1');
      expect(prisma.pomodoroLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            flashcardGrouping: 'Biology Chapter 1',
            quizId: null,
          }),
        })
      );
    });

    it('should create focus session with quiz link', async () => {
      const sessionData = {
        duration: 30,
        sessionType: 'STOPWATCH',
        focusScore: 9,
        notes: 'Taking quiz',
        quizId: 'quiz-123',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const mockSession = {
        id: 'session-456',
        ...sessionData,
        userId: mockUser.id,
        taskId: null,
        tagId: null,
        projectId: null,
        flashcardGrouping: null,
        task: null,
        tag: null,
        project: null,
        quiz: mockQuiz,
      };

      vi.mocked(prisma.quiz.findUnique).mockResolvedValue(mockQuiz as any);
      vi.mocked(prisma.pomodoroLog.create).mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });

      const response = await POST(request, {}, mockUser as any, sessionData);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.quizId).toBe('quiz-123');
      expect(data.quiz).toEqual(mockQuiz);
      expect(prisma.quiz.findUnique).toHaveBeenCalledWith({
        where: { id: 'quiz-123' },
      });
    });

    it('should create focus session with both flashcard grouping and quiz', async () => {
      const sessionData = {
        duration: 45,
        sessionType: 'POMODORO',
        flashcardGrouping: 'Math Formulas',
        quizId: 'quiz-123',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const mockSession = {
        id: 'session-789',
        ...sessionData,
        userId: mockUser.id,
        focusScore: null,
        notes: null,
        taskId: null,
        tagId: null,
        projectId: null,
        task: null,
        tag: null,
        project: null,
        quiz: mockQuiz,
      };

      vi.mocked(prisma.quiz.findUnique).mockResolvedValue(mockQuiz as any);
      vi.mocked(prisma.pomodoroLog.create).mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });

      const response = await POST(request, {}, mockUser as any, sessionData);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.flashcardGrouping).toBe('Math Formulas');
      expect(data.quizId).toBe('quiz-123');
    });

    it('should reject focus session with invalid quiz ownership', async () => {
      const sessionData = {
        duration: 25,
        sessionType: 'POMODORO',
        quizId: 'quiz-999',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const otherUserQuiz = {
        id: 'quiz-999',
        title: 'Other User Quiz',
        userId: 'other-user-456',
        difficulty: 2,
      };

      vi.mocked(prisma.quiz.findUnique).mockResolvedValue(otherUserQuiz as any);

      const request = new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });

      const response = await POST(request, {}, mockUser as any, sessionData);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Quiz not found or does not belong to user');
    });

    it('should reject focus session with non-existent quiz', async () => {
      const sessionData = {
        duration: 25,
        sessionType: 'POMODORO',
        quizId: 'non-existent-quiz',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      vi.mocked(prisma.quiz.findUnique).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/focus-sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });

      const response = await POST(request, {}, mockUser as any, sessionData);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Quiz not found or does not belong to user');
    });
  });

  describe('GET /api/focus-sessions - Retrieve with study material links', () => {
    it('should return focus sessions with flashcard grouping and quiz data', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          duration: 25,
          sessionType: 'POMODORO',
          focusScore: 8,
          notes: 'Study session',
          startedAt: new Date(),
          completedAt: new Date(),
          taskId: null,
          tagId: null,
          projectId: null,
          flashcardGrouping: 'Biology Chapter 1',
          quizId: null,
          task: null,
          tag: null,
          project: null,
          quiz: null,
        },
        {
          id: 'session-2',
          duration: 30,
          sessionType: 'STOPWATCH',
          focusScore: 9,
          notes: 'Quiz practice',
          startedAt: new Date(),
          completedAt: new Date(),
          taskId: null,
          tagId: null,
          projectId: null,
          flashcardGrouping: null,
          quizId: 'quiz-123',
          task: null,
          tag: null,
          project: null,
          quiz: mockQuiz,
        },
      ];

      vi.mocked(prisma.pomodoroLog.count).mockResolvedValue(2);
      vi.mocked(prisma.pomodoroLog.findMany).mockResolvedValue(mockSessions as any);

      const request = new NextRequest('http://localhost:3000/api/focus-sessions');
      const response = await GET(request, {}, mockUser as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessions).toHaveLength(2);
      expect(data.sessions[0].flashcardGrouping).toBe('Biology Chapter 1');
      expect(data.sessions[1].quizId).toBe('quiz-123');
      expect(data.sessions[1].quiz).toEqual(mockQuiz);
    });
  });
});
