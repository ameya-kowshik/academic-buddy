import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuizService } from '../quiz.service';
import { prisma } from '@/lib/prisma';
import { analyticsService } from '../analytics.service';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    quiz: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    quizQuestion: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    quizAttempt: {
      create: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    quizQuestionAttempt: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../analytics.service', () => ({
  analyticsService: {
    recordQuizCompletion: vi.fn(),
  },
}));

describe('QuizService', () => {
  let quizService: QuizService;
  const mockUserId = 'user-123';
  const mockQuizId = 'quiz-456';

  beforeEach(() => {
    quizService = new QuizService();
    vi.clearAllMocks();
  });

  describe('createQuiz', () => {
    it('should create a quiz with valid data', async () => {
      const input = {
        title: 'JavaScript Basics',
        description: 'Test your JS knowledge',
        grouping: 'programming',
        difficulty: 3,
        sourceMaterialId: 'doc-789',
      };

      const mockQuiz = {
        id: mockQuizId,
        ...input,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.quiz.create).mockResolvedValue(mockQuiz);

      const result = await quizService.createQuiz(mockUserId, input);

      expect(result).toEqual(mockQuiz);
      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          description: input.description,
          grouping: input.grouping,
          difficulty: input.difficulty,
          sourceMaterialId: input.sourceMaterialId,
          userId: mockUserId,
          tags: [],
        },
      });
    });

    it('should create a quiz with minimal data', async () => {
      const input = {
        title: 'Quick Quiz',
        difficulty: 1,
      };

      const mockQuiz = {
        id: mockQuizId,
        title: input.title,
        description: null,
        grouping: null,
        difficulty: input.difficulty,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.quiz.create).mockResolvedValue(mockQuiz);

      const result = await quizService.createQuiz(mockUserId, input);

      expect(result).toEqual(mockQuiz);
      expect(prisma.quiz.create).toHaveBeenCalledWith({
        data: {
          title: input.title,
          description: null,
          grouping: null,
          difficulty: input.difficulty,
          sourceMaterialId: null,
          userId: mockUserId,
          tags: [],
        },
      });
    });

    it('should reject difficulty below 1', async () => {
      const input = {
        title: 'Test Quiz',
        difficulty: 0,
      };

      await expect(quizService.createQuiz(mockUserId, input)).rejects.toThrow(
        'Difficulty must be between 1 and 5'
      );
      expect(prisma.quiz.create).not.toHaveBeenCalled();
    });

    it('should reject difficulty above 5', async () => {
      const input = {
        title: 'Test Quiz',
        difficulty: 6,
      };

      await expect(quizService.createQuiz(mockUserId, input)).rejects.toThrow(
        'Difficulty must be between 1 and 5'
      );
      expect(prisma.quiz.create).not.toHaveBeenCalled();
    });

    it('should reject missing title', async () => {
      const input = {
        title: '',
        difficulty: 3,
      };

      await expect(quizService.createQuiz(mockUserId, input)).rejects.toThrow(
        'Title is required'
      );
      expect(prisma.quiz.create).not.toHaveBeenCalled();
    });
  });

  describe('updateQuiz', () => {
    it('should update a quiz with valid data', async () => {
      const existingQuiz = {
        id: mockQuizId,
        title: 'Old Title',
        description: 'Old description',
        grouping: 'old-group',
        difficulty: 2,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updateData = {
        title: 'New Title',
        difficulty: 4,
      };

      const updatedQuiz = {
        ...existingQuiz,
        ...updateData,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(existingQuiz);
      vi.mocked(prisma.quiz.update).mockResolvedValue(updatedQuiz);

      const result = await quizService.updateQuiz(mockUserId, mockQuizId, updateData);

      expect(result).toEqual(updatedQuiz);
      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuizId, userId: mockUserId },
      });
      expect(prisma.quiz.update).toHaveBeenCalledWith({
        where: { id: mockQuizId },
        data: {
          title: updateData.title,
          difficulty: updateData.difficulty,
        },
      });
    });

    it('should reject update for non-existent quiz', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(
        quizService.updateQuiz(mockUserId, mockQuizId, { title: 'New Title' })
      ).rejects.toThrow('Quiz not found');
      expect(prisma.quiz.update).not.toHaveBeenCalled();
    });

    it('should reject update with invalid difficulty', async () => {
      const existingQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(existingQuiz);

      await expect(
        quizService.updateQuiz(mockUserId, mockQuizId, { difficulty: 7 })
      ).rejects.toThrow('Difficulty must be between 1 and 5');
      expect(prisma.quiz.update).not.toHaveBeenCalled();
    });

    it('should enforce ownership check', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(
        quizService.updateQuiz('different-user', mockQuizId, { title: 'Hacked' })
      ).rejects.toThrow('Quiz not found');
    });
  });

  describe('deleteQuiz', () => {
    it('should delete a quiz with ownership check', async () => {
      const existingQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(existingQuiz);
      vi.mocked(prisma.quiz.delete).mockResolvedValue(existingQuiz);

      await quizService.deleteQuiz(mockUserId, mockQuizId);

      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuizId, userId: mockUserId },
      });
      expect(prisma.quiz.delete).toHaveBeenCalledWith({
        where: { id: mockQuizId },
      });
    });

    it('should reject delete for non-existent quiz', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(quizService.deleteQuiz(mockUserId, mockQuizId)).rejects.toThrow(
        'Quiz not found'
      );
      expect(prisma.quiz.delete).not.toHaveBeenCalled();
    });

    it('should enforce ownership check on delete', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(quizService.deleteQuiz('different-user', mockQuizId)).rejects.toThrow(
        'Quiz not found'
      );
      expect(prisma.quiz.delete).not.toHaveBeenCalled();
    });
  });

  describe('getQuiz', () => {
    it('should retrieve a quiz with questions in order', async () => {
      const mockQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: 'A test quiz',
        grouping: 'test-group',
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [
          {
            id: 'q1',
            questionText: 'Question 1',
            options: ['A', 'B', 'C'],
            correctAnswer: 'A',
            explanation: 'Explanation 1',
            order: 1,
            quizId: mockQuizId,
            createdAt: new Date(),
          },
          {
            id: 'q2',
            questionText: 'Question 2',
            options: ['X', 'Y', 'Z'],
            correctAnswer: 'Y',
            explanation: 'Explanation 2',
            order: 2,
            quizId: mockQuizId,
            createdAt: new Date(),
          },
        ],
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(mockQuiz);

      const result = await quizService.getQuiz(mockUserId, mockQuizId);

      expect(result).toEqual(mockQuiz);
      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuizId, userId: mockUserId },
        include: {
          questions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });

    it('should return null for non-existent quiz', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      const result = await quizService.getQuiz(mockUserId, mockQuizId);

      expect(result).toBeNull();
    });

    it('should enforce ownership check', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      const result = await quizService.getQuiz('different-user', mockQuizId);

      expect(result).toBeNull();
      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuizId, userId: 'different-user' },
        include: {
          questions: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });
    });
  });

  describe('listQuizzes', () => {
    it('should list all quizzes for a user', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          description: null,
          grouping: null,
          difficulty: 2,
          sourceMaterialId: null,
          userId: mockUserId,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
        {
          id: 'quiz-2',
          title: 'Quiz 2',
          description: 'Description',
          grouping: 'group-a',
          difficulty: 4,
          sourceMaterialId: 'doc-1',
          userId: mockUserId,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      vi.mocked(prisma.quiz.findMany).mockResolvedValue(mockQuizzes);

      const result = await quizService.listQuizzes(mockUserId);

      expect(result).toEqual(mockQuizzes);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter quizzes by grouping', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Quiz 1',
          description: null,
          grouping: 'math',
          difficulty: 3,
          sourceMaterialId: null,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quiz.findMany).mockResolvedValue(mockQuizzes);

      const result = await quizService.listQuizzes(mockUserId, { grouping: 'math' });

      expect(result).toEqual(mockQuizzes);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, grouping: 'math' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter quizzes by difficulty', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Easy Quiz',
          description: null,
          grouping: null,
          difficulty: 1,
          sourceMaterialId: null,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quiz.findMany).mockResolvedValue(mockQuizzes);

      const result = await quizService.listQuizzes(mockUserId, { difficulty: 1 });

      expect(result).toEqual(mockQuizzes);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, difficulty: 1 },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter quizzes by sourceMaterialId', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Document Quiz',
          description: null,
          grouping: null,
          difficulty: 3,
          sourceMaterialId: 'doc-123',
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quiz.findMany).mockResolvedValue(mockQuizzes);

      const result = await quizService.listQuizzes(mockUserId, {
        sourceMaterialId: 'doc-123',
      });

      expect(result).toEqual(mockQuizzes);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId, sourceMaterialId: 'doc-123' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should apply multiple filters', async () => {
      const mockQuizzes = [
        {
          id: 'quiz-1',
          title: 'Filtered Quiz',
          description: null,
          grouping: 'science',
          difficulty: 4,
          sourceMaterialId: 'doc-456',
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.quiz.findMany).mockResolvedValue(mockQuizzes);

      const result = await quizService.listQuizzes(mockUserId, {
        grouping: 'science',
        difficulty: 4,
        sourceMaterialId: 'doc-456',
      });

      expect(result).toEqual(mockQuizzes);
      expect(prisma.quiz.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          grouping: 'science',
          difficulty: 4,
          sourceMaterialId: 'doc-456',
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return empty array when no quizzes exist', async () => {
      vi.mocked(prisma.quiz.findMany).mockResolvedValue([]);

      const result = await quizService.listQuizzes(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('addQuestion', () => {
    const mockQuestionId = 'question-123';

    it('should add a question to a quiz with valid data', async () => {
      const mockQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const input = {
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: 'Basic arithmetic',
        order: 1,
      };

      const mockQuestion = {
        id: mockQuestionId,
        ...input,
        quizId: mockQuizId,
        createdAt: new Date(),
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(mockQuiz);
      vi.mocked(prisma.quizQuestion.create).mockResolvedValue(mockQuestion);

      const result = await quizService.addQuestion(mockUserId, mockQuizId, input);

      expect(result).toEqual(mockQuestion);
      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuizId, userId: mockUserId },
      });
      expect(prisma.quizQuestion.create).toHaveBeenCalledWith({
        data: {
          questionText: input.questionText,
          options: input.options,
          correctAnswer: input.correctAnswer,
          explanation: input.explanation,
          order: input.order,
          quizId: mockQuizId,
        },
      });
    });

    it('should reject question with less than 2 options', async () => {
      const mockQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const input = {
        questionText: 'Invalid question',
        options: ['Only one option'],
        correctAnswer: 'Only one option',
        order: 1,
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(mockQuiz);

      await expect(quizService.addQuestion(mockUserId, mockQuizId, input)).rejects.toThrow(
        'Question must have at least 2 options'
      );
      expect(prisma.quizQuestion.create).not.toHaveBeenCalled();
    });

    it('should reject question with correct answer not in options', async () => {
      const mockQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const input = {
        questionText: 'What is the answer?',
        options: ['A', 'B', 'C'],
        correctAnswer: 'D',
        order: 1,
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(mockQuiz);

      await expect(quizService.addQuestion(mockUserId, mockQuizId, input)).rejects.toThrow(
        'Correct answer must be one of the options'
      );
      expect(prisma.quizQuestion.create).not.toHaveBeenCalled();
    });

    it('should reject question for non-existent quiz', async () => {
      const input = {
        questionText: 'Test question',
        options: ['A', 'B'],
        correctAnswer: 'A',
        order: 1,
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(quizService.addQuestion(mockUserId, mockQuizId, input)).rejects.toThrow(
        'Quiz not found'
      );
      expect(prisma.quizQuestion.create).not.toHaveBeenCalled();
    });

    it('should enforce ownership check', async () => {
      const input = {
        questionText: 'Test question',
        options: ['A', 'B'],
        correctAnswer: 'A',
        order: 1,
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(
        quizService.addQuestion('different-user', mockQuizId, input)
      ).rejects.toThrow('Quiz not found');
    });
  });

  describe('updateQuestion', () => {
    const mockQuestionId = 'question-123';

    it('should update a question with valid data', async () => {
      const existingQuestion = {
        id: mockQuestionId,
        questionText: 'Old question',
        options: ['A', 'B', 'C'],
        correctAnswer: 'A',
        explanation: 'Old explanation',
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
        quiz: {
          id: mockQuizId,
          title: 'Test Quiz',
          description: null,
          grouping: null,
          difficulty: 3,
          sourceMaterialId: null,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      const updateData = {
        questionText: 'Updated question',
        explanation: 'Updated explanation',
      };

      const updatedQuestion = {
        ...existingQuestion,
        ...updateData,
      };

      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(existingQuestion);
      vi.mocked(prisma.quizQuestion.update).mockResolvedValue(updatedQuestion);

      const result = await quizService.updateQuestion(mockUserId, mockQuestionId, updateData);

      expect(result).toEqual(updatedQuestion);
      expect(prisma.quizQuestion.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuestionId },
        include: { quiz: true },
      });
      expect(prisma.quizQuestion.update).toHaveBeenCalledWith({
        where: { id: mockQuestionId },
        data: {
          questionText: updateData.questionText,
          explanation: updateData.explanation,
        },
      });
    });

    it('should reject update with less than 2 options', async () => {
      const existingQuestion = {
        id: mockQuestionId,
        questionText: 'Test question',
        options: ['A', 'B', 'C'],
        correctAnswer: 'A',
        explanation: null,
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
        quiz: {
          id: mockQuizId,
          title: 'Test Quiz',
          description: null,
          grouping: null,
          difficulty: 3,
          sourceMaterialId: null,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(existingQuestion);

      await expect(
        quizService.updateQuestion(mockUserId, mockQuestionId, { options: ['Only one'] })
      ).rejects.toThrow('Question must have at least 2 options');
      expect(prisma.quizQuestion.update).not.toHaveBeenCalled();
    });

    it('should reject update with correct answer not in options', async () => {
      const existingQuestion = {
        id: mockQuestionId,
        questionText: 'Test question',
        options: ['A', 'B', 'C'],
        correctAnswer: 'A',
        explanation: null,
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
        quiz: {
          id: mockQuizId,
          title: 'Test Quiz',
          description: null,
          grouping: null,
          difficulty: 3,
          sourceMaterialId: null,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(existingQuestion);

      await expect(
        quizService.updateQuestion(mockUserId, mockQuestionId, {
          options: ['X', 'Y', 'Z'],
          correctAnswer: 'A',
        })
      ).rejects.toThrow('Correct answer must be one of the options');
      expect(prisma.quizQuestion.update).not.toHaveBeenCalled();
    });

    it('should reject update for non-existent question', async () => {
      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(null);

      await expect(
        quizService.updateQuestion(mockUserId, mockQuestionId, { questionText: 'New text' })
      ).rejects.toThrow('Question not found');
      expect(prisma.quizQuestion.update).not.toHaveBeenCalled();
    });

    it('should enforce ownership check', async () => {
      const existingQuestion = {
        id: mockQuestionId,
        questionText: 'Test question',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: null,
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
        quiz: {
          id: mockQuizId,
          title: 'Test Quiz',
          description: null,
          grouping: null,
          difficulty: 3,
          sourceMaterialId: null,
          userId: 'different-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(existingQuestion);

      await expect(
        quizService.updateQuestion(mockUserId, mockQuestionId, { questionText: 'Hacked' })
      ).rejects.toThrow('Question not found');
      expect(prisma.quizQuestion.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteQuestion', () => {
    const mockQuestionId = 'question-123';

    it('should delete a question with ownership check', async () => {
      const existingQuestion = {
        id: mockQuestionId,
        questionText: 'Test question',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: null,
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
        quiz: {
          id: mockQuizId,
          title: 'Test Quiz',
          description: null,
          grouping: null,
          difficulty: 3,
          sourceMaterialId: null,
          userId: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(existingQuestion);
      vi.mocked(prisma.quizQuestion.delete).mockResolvedValue(existingQuestion);

      await quizService.deleteQuestion(mockUserId, mockQuestionId);

      expect(prisma.quizQuestion.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuestionId },
        include: { quiz: true },
      });
      expect(prisma.quizQuestion.delete).toHaveBeenCalledWith({
        where: { id: mockQuestionId },
      });
    });

    it('should reject delete for non-existent question', async () => {
      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(null);

      await expect(quizService.deleteQuestion(mockUserId, mockQuestionId)).rejects.toThrow(
        'Question not found'
      );
      expect(prisma.quizQuestion.delete).not.toHaveBeenCalled();
    });

    it('should enforce ownership check on delete', async () => {
      const existingQuestion = {
        id: mockQuestionId,
        questionText: 'Test question',
        options: ['A', 'B'],
        correctAnswer: 'A',
        explanation: null,
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
        quiz: {
          id: mockQuizId,
          title: 'Test Quiz',
          description: null,
          grouping: null,
          difficulty: 3,
          sourceMaterialId: null,
          userId: 'different-user',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };

      vi.mocked(prisma.quizQuestion.findFirst).mockResolvedValue(existingQuestion);

      await expect(quizService.deleteQuestion(mockUserId, mockQuestionId)).rejects.toThrow(
        'Question not found'
      );
      expect(prisma.quizQuestion.delete).not.toHaveBeenCalled();
    });
  });

  describe('startAttempt', () => {
    it('should create a quiz attempt with correct initial values', async () => {
      const mockQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        questions: [
          {
            id: 'q1',
            questionText: 'Question 1',
            options: ['A', 'B'],
            correctAnswer: 'A',
            explanation: null,
            order: 1,
            quizId: mockQuizId,
            createdAt: new Date(),
          },
          {
            id: 'q2',
            questionText: 'Question 2',
            options: ['X', 'Y'],
            correctAnswer: 'X',
            explanation: null,
            order: 2,
            quizId: mockQuizId,
            createdAt: new Date(),
          },
        ],
      };

      const mockAttempt = {
        id: 'attempt-123',
        quizId: mockQuizId,
        score: 0,
        totalQuestions: 2,
        correctAnswers: 0,
        timeSpent: null,
        startedAt: new Date(),
        completedAt: null,
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(mockQuiz);
      vi.mocked(prisma.quizAttempt.create).mockResolvedValue(mockAttempt);

      const result = await quizService.startAttempt(mockUserId, mockQuizId);

      expect(result).toEqual(mockAttempt);
      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuizId, userId: mockUserId },
        include: { questions: true },
      });
      expect(prisma.quizAttempt.create).toHaveBeenCalledWith({
        data: {
          quizId: mockQuizId,
          score: 0,
          totalQuestions: 2,
          correctAnswers: 0,
          startedAt: expect.any(Date),
        },
      });
    });

    it('should reject attempt for non-existent quiz', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(quizService.startAttempt(mockUserId, mockQuizId)).rejects.toThrow(
        'Quiz not found'
      );
      expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
    });

    it('should enforce ownership check', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(quizService.startAttempt('different-user', mockQuizId)).rejects.toThrow(
        'Quiz not found'
      );
      expect(prisma.quizAttempt.create).not.toHaveBeenCalled();
    });
  });

  describe('submitAnswer', () => {
    const mockAttemptId = 'attempt-123';
    const mockQuestionId = 'question-456';

    it('should record a correct answer', async () => {
      const mockAttempt = {
        id: mockAttemptId,
        quizId: mockQuizId,
        score: 0,
        totalQuestions: 2,
        correctAnswers: 0,
        timeSpent: null,
        startedAt: new Date(),
        completedAt: null,
      };

      const mockQuestion = {
        id: mockQuestionId,
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        explanation: 'Basic math',
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
      };

      const mockQuestionAttempt = {
        id: 'qa-123',
        quizAttemptId: mockAttemptId,
        quizQuestionId: mockQuestionId,
        selectedAnswer: '4',
        isCorrect: true,
        timeSpent: null,
        attemptedAt: new Date(),
      };

      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(mockAttempt);
      vi.mocked(prisma.quizQuestion.findUnique).mockResolvedValue(mockQuestion);
      vi.mocked(prisma.quizQuestionAttempt.create).mockResolvedValue(mockQuestionAttempt);

      const result = await quizService.submitAnswer(mockAttemptId, mockQuestionId, '4');

      expect(result).toEqual(mockQuestionAttempt);
      expect(result.isCorrect).toBe(true);
      expect(prisma.quizQuestionAttempt.create).toHaveBeenCalledWith({
        data: {
          quizAttemptId: mockAttemptId,
          quizQuestionId: mockQuestionId,
          selectedAnswer: '4',
          isCorrect: true,
          attemptedAt: expect.any(Date),
        },
      });
    });

    it('should record an incorrect answer', async () => {
      const mockAttempt = {
        id: mockAttemptId,
        quizId: mockQuizId,
        score: 0,
        totalQuestions: 2,
        correctAnswers: 0,
        timeSpent: null,
        startedAt: new Date(),
        completedAt: null,
      };

      const mockQuestion = {
        id: mockQuestionId,
        questionText: 'What is 2 + 2?',
        options: ['3', '4', '5'],
        correctAnswer: '4',
        explanation: 'Basic math',
        order: 1,
        quizId: mockQuizId,
        createdAt: new Date(),
      };

      const mockQuestionAttempt = {
        id: 'qa-123',
        quizAttemptId: mockAttemptId,
        quizQuestionId: mockQuestionId,
        selectedAnswer: '5',
        isCorrect: false,
        timeSpent: null,
        attemptedAt: new Date(),
      };

      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(mockAttempt);
      vi.mocked(prisma.quizQuestion.findUnique).mockResolvedValue(mockQuestion);
      vi.mocked(prisma.quizQuestionAttempt.create).mockResolvedValue(mockQuestionAttempt);

      const result = await quizService.submitAnswer(mockAttemptId, mockQuestionId, '5');

      expect(result).toEqual(mockQuestionAttempt);
      expect(result.isCorrect).toBe(false);
    });

    it('should reject answer for non-existent attempt', async () => {
      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(null);

      await expect(
        quizService.submitAnswer(mockAttemptId, mockQuestionId, 'answer')
      ).rejects.toThrow('Quiz attempt not found');
      expect(prisma.quizQuestionAttempt.create).not.toHaveBeenCalled();
    });

    it('should reject answer for non-existent question', async () => {
      const mockAttempt = {
        id: mockAttemptId,
        quizId: mockQuizId,
        score: 0,
        totalQuestions: 2,
        correctAnswers: 0,
        timeSpent: null,
        startedAt: new Date(),
        completedAt: null,
      };

      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(mockAttempt);
      vi.mocked(prisma.quizQuestion.findUnique).mockResolvedValue(null);

      await expect(
        quizService.submitAnswer(mockAttemptId, mockQuestionId, 'answer')
      ).rejects.toThrow('Question not found');
      expect(prisma.quizQuestionAttempt.create).not.toHaveBeenCalled();
    });
  });

  describe('completeAttempt', () => {
    const mockAttemptId = 'attempt-123';

    it('should calculate score correctly with all correct answers', async () => {
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const mockAttempt = {
        id: mockAttemptId,
        quizId: mockQuizId,
        score: 0,
        totalQuestions: 3,
        correctAnswers: 0,
        timeSpent: null,
        startedAt,
        completedAt: null,
        quiz: {
          userId: mockUserId,
        },
        questionAttempts: [
          {
            id: 'qa1',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q1',
            selectedAnswer: 'A',
            isCorrect: true,
            timeSpent: null,
            attemptedAt: new Date(),
          },
          {
            id: 'qa2',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q2',
            selectedAnswer: 'B',
            isCorrect: true,
            timeSpent: null,
            attemptedAt: new Date(),
          },
          {
            id: 'qa3',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q3',
            selectedAnswer: 'C',
            isCorrect: true,
            timeSpent: null,
            attemptedAt: new Date(),
          },
        ],
      };

      const updatedAttempt = {
        ...mockAttempt,
        score: 100,
        correctAnswers: 3,
        timeSpent: 300,
        completedAt: new Date('2024-01-01T10:05:00Z'),
      };

      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(mockAttempt as any);
      vi.mocked(prisma.quizAttempt.update).mockResolvedValue(updatedAttempt as any);
      vi.mocked(analyticsService.recordQuizCompletion).mockResolvedValue(undefined);

      const result = await quizService.completeAttempt(mockAttemptId);

      expect(result.score).toBe(100);
      expect(result.correctAnswers).toBe(3);
      expect(result.completedAt).toBeDefined();
      expect(result.timeSpent).toBeDefined();
      expect(prisma.quizAttempt.update).toHaveBeenCalledWith({
        where: { id: mockAttemptId },
        data: {
          score: 100,
          correctAnswers: 3,
          timeSpent: expect.any(Number),
          completedAt: expect.any(Date),
        },
      });
      expect(analyticsService.recordQuizCompletion).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Date)
      );
    });

    it('should calculate score correctly with partial correct answers', async () => {
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const mockAttempt = {
        id: mockAttemptId,
        quizId: mockQuizId,
        score: 0,
        totalQuestions: 4,
        correctAnswers: 0,
        timeSpent: null,
        startedAt,
        completedAt: null,
        quiz: {
          userId: mockUserId,
        },
        questionAttempts: [
          {
            id: 'qa1',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q1',
            selectedAnswer: 'A',
            isCorrect: true,
            timeSpent: null,
            attemptedAt: new Date(),
          },
          {
            id: 'qa2',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q2',
            selectedAnswer: 'B',
            isCorrect: false,
            timeSpent: null,
            attemptedAt: new Date(),
          },
          {
            id: 'qa3',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q3',
            selectedAnswer: 'C',
            isCorrect: true,
            timeSpent: null,
            attemptedAt: new Date(),
          },
          {
            id: 'qa4',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q4',
            selectedAnswer: 'D',
            isCorrect: false,
            timeSpent: null,
            attemptedAt: new Date(),
          },
        ],
      };

      const updatedAttempt = {
        ...mockAttempt,
        score: 50,
        correctAnswers: 2,
        timeSpent: 180,
        completedAt: new Date('2024-01-01T10:03:00Z'),
      };

      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(mockAttempt as any);
      vi.mocked(prisma.quizAttempt.update).mockResolvedValue(updatedAttempt as any);
      vi.mocked(analyticsService.recordQuizCompletion).mockResolvedValue(undefined);

      const result = await quizService.completeAttempt(mockAttemptId);

      expect(result.score).toBe(50);
      expect(result.correctAnswers).toBe(2);
      expect(prisma.quizAttempt.update).toHaveBeenCalledWith({
        where: { id: mockAttemptId },
        data: {
          score: 50,
          correctAnswers: 2,
          timeSpent: expect.any(Number),
          completedAt: expect.any(Date),
        },
      });
    });

    it('should calculate score correctly with no correct answers', async () => {
      const startedAt = new Date('2024-01-01T10:00:00Z');
      const mockAttempt = {
        id: mockAttemptId,
        quizId: mockQuizId,
        score: 0,
        totalQuestions: 2,
        correctAnswers: 0,
        timeSpent: null,
        startedAt,
        completedAt: null,
        quiz: {
          userId: mockUserId,
        },
        questionAttempts: [
          {
            id: 'qa1',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q1',
            selectedAnswer: 'A',
            isCorrect: false,
            timeSpent: null,
            attemptedAt: new Date(),
          },
          {
            id: 'qa2',
            quizAttemptId: mockAttemptId,
            quizQuestionId: 'q2',
            selectedAnswer: 'B',
            isCorrect: false,
            timeSpent: null,
            attemptedAt: new Date(),
          },
        ],
      };

      const updatedAttempt = {
        ...mockAttempt,
        score: 0,
        correctAnswers: 0,
        timeSpent: 120,
        completedAt: new Date('2024-01-01T10:02:00Z'),
      };

      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(mockAttempt as any);
      vi.mocked(prisma.quizAttempt.update).mockResolvedValue(updatedAttempt as any);
      vi.mocked(analyticsService.recordQuizCompletion).mockResolvedValue(undefined);

      const result = await quizService.completeAttempt(mockAttemptId);

      expect(result.score).toBe(0);
      expect(result.correctAnswers).toBe(0);
    });

    it('should reject completion for non-existent attempt', async () => {
      vi.mocked(prisma.quizAttempt.findUnique).mockResolvedValue(null);

      await expect(quizService.completeAttempt(mockAttemptId)).rejects.toThrow(
        'Quiz attempt not found'
      );
      expect(prisma.quizAttempt.update).not.toHaveBeenCalled();
    });
  });

  describe('getAttemptHistory', () => {
    it('should retrieve all attempts for a quiz', async () => {
      const mockQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAttempts = [
        {
          id: 'attempt-1',
          quizId: mockQuizId,
          score: 80,
          totalQuestions: 5,
          correctAnswers: 4,
          timeSpent: 300,
          startedAt: new Date('2024-01-02T10:00:00Z'),
          completedAt: new Date('2024-01-02T10:05:00Z'),
        },
        {
          id: 'attempt-2',
          quizId: mockQuizId,
          score: 60,
          totalQuestions: 5,
          correctAnswers: 3,
          timeSpent: 400,
          startedAt: new Date('2024-01-01T10:00:00Z'),
          completedAt: new Date('2024-01-01T10:06:40Z'),
        },
      ];

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(mockQuiz);
      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue(mockAttempts);

      const result = await quizService.getAttemptHistory(mockUserId, mockQuizId);

      expect(result).toEqual(mockAttempts);
      expect(prisma.quiz.findFirst).toHaveBeenCalledWith({
        where: { id: mockQuizId, userId: mockUserId },
      });
      expect(prisma.quizAttempt.findMany).toHaveBeenCalledWith({
        where: { quizId: mockQuizId },
        orderBy: { startedAt: 'desc' },
      });
    });

    it('should return empty array when no attempts exist', async () => {
      const mockQuiz = {
        id: mockQuizId,
        title: 'Test Quiz',
        description: null,
        grouping: null,
        difficulty: 3,
        sourceMaterialId: null,
        userId: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(mockQuiz);
      vi.mocked(prisma.quizAttempt.findMany).mockResolvedValue([]);

      const result = await quizService.getAttemptHistory(mockUserId, mockQuizId);

      expect(result).toEqual([]);
    });

    it('should reject history for non-existent quiz', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(quizService.getAttemptHistory(mockUserId, mockQuizId)).rejects.toThrow(
        'Quiz not found'
      );
      expect(prisma.quizAttempt.findMany).not.toHaveBeenCalled();
    });

    it('should enforce ownership check', async () => {
      vi.mocked(prisma.quiz.findFirst).mockResolvedValue(null);

      await expect(
        quizService.getAttemptHistory('different-user', mockQuizId)
      ).rejects.toThrow('Quiz not found');
      expect(prisma.quizAttempt.findMany).not.toHaveBeenCalled();
    });
  });
});
