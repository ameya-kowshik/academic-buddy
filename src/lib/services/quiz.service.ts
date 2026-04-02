import { prisma } from '@/lib/prisma';
import { Quiz, QuizQuestion, QuizAttempt, QuizQuestionAttempt } from '@prisma/client';
import { analyticsService } from './analytics.service';

/**
 * Input type for creating a quiz
 */
export interface CreateQuizInput {
  title: string;
  description?: string;
  grouping?: string;
  difficulty: number;
  sourceMaterialId?: string;
  tags?: string[];
}

/**
 * Input type for updating a quiz
 */
export interface UpdateQuizInput {
  title?: string;
  description?: string;
  grouping?: string;
  difficulty?: number;
  sourceMaterialId?: string;
  tags?: string[];
}

/**
 * Filter options for listing quizzes
 */
export interface QuizFilters {
  grouping?: string;
  difficulty?: number;
  sourceMaterialId?: string;
  tags?: string[];
}

/**
 * Input type for creating a quiz question
 */
export interface CreateQuestionInput {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  order: number;
}

/**
 * Input type for updating a quiz question
 */
export interface UpdateQuestionInput {
  questionText?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  order?: number;
}

/**
 * Quiz with questions included
 */
export interface QuizWithQuestions extends Quiz {
  questions: QuizQuestion[];
}

/**
 * Service for managing quizzes
 * Handles CRUD operations for Quiz records
 */
export class QuizService {
  /**
   * Create a new quiz with validation
   * @param userId - User ID who owns the quiz
   * @param data - Quiz data
   * @returns Created Quiz record
   * @throws Error if validation fails
   */
  async createQuiz(userId: string, data: CreateQuizInput): Promise<Quiz> {
    // Validate difficulty level (1-5)
    if (data.difficulty < 1 || data.difficulty > 5) {
      throw new Error('Difficulty must be between 1 and 5');
    }

    // Validate required fields
    if (!data.title) {
      throw new Error('Title is required');
    }

    // Create quiz record
    const quiz = await prisma.quiz.create({
      data: {
        title: data.title,
        description: data.description || null,
        grouping: data.grouping || null,
        difficulty: data.difficulty,
        sourceMaterialId: data.sourceMaterialId || null,
        tags: data.tags || [],
        userId,
      },
    });

    return quiz;
  }

  /**
   * Update an existing quiz with ownership check
   * @param userId - User ID requesting the update
   * @param id - Quiz ID to update
   * @param data - Updated quiz data
   * @returns Updated Quiz record
   * @throws Error if quiz not found or unauthorized
   */
  async updateQuiz(userId: string, id: string, data: UpdateQuizInput): Promise<Quiz> {
    // Check ownership
    const existing = await prisma.quiz.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Quiz not found');
    }

    // Validate difficulty if provided
    if (data.difficulty !== undefined && (data.difficulty < 1 || data.difficulty > 5)) {
      throw new Error('Difficulty must be between 1 and 5');
    }

    // Update quiz
    const quiz = await prisma.quiz.update({
      where: {
        id,
      },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.grouping !== undefined && { grouping: data.grouping }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.sourceMaterialId !== undefined && { sourceMaterialId: data.sourceMaterialId }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });

    return quiz;
  }

  /**
   * Delete a quiz with ownership check and cascading question deletion
   * @param userId - User ID requesting deletion
   * @param id - Quiz ID to delete
   * @throws Error if quiz not found or unauthorized
   */
  async deleteQuiz(userId: string, id: string): Promise<void> {
    // Check ownership
    const existing = await prisma.quiz.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Quiz not found');
    }

    // Delete quiz (questions will cascade delete due to Prisma schema)
    await prisma.quiz.delete({
      where: {
        id,
      },
    });
  }

  /**
   * Retrieve a quiz by ID with questions in order
   * @param userId - User ID requesting the quiz
   * @param id - Quiz ID to retrieve
   * @returns Quiz with questions or null if not found/unauthorized
   */
  async getQuiz(userId: string, id: string): Promise<QuizWithQuestions | null> {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return quiz;
  }

  /**
   * List quizzes with optional filtering
   * @param userId - User ID to retrieve quizzes for
   * @param filters - Optional filters for grouping, difficulty, sourceMaterialId, tags
   * @returns Array of Quiz records
   */
  async listQuizzes(userId: string, filters?: QuizFilters): Promise<Quiz[]> {
    const quizzes = await prisma.quiz.findMany({
      where: {
        userId,
        ...(filters?.grouping && { grouping: filters.grouping }),
        ...(filters?.difficulty && { difficulty: filters.difficulty }),
        ...(filters?.sourceMaterialId && { sourceMaterialId: filters.sourceMaterialId }),
        ...(filters?.tags && filters.tags.length > 0 && {
          tags: {
            hasSome: filters.tags,
          },
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return quizzes;
  }

  /**
   * Add a question to a quiz with validation
   * @param userId - User ID who owns the quiz
   * @param quizId - Quiz ID to add question to
   * @param data - Question data
   * @returns Created QuizQuestion record
   * @throws Error if validation fails or quiz not found/unauthorized
   */
  async addQuestion(userId: string, quizId: string, data: CreateQuestionInput): Promise<QuizQuestion> {
    // Check quiz ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Validate question has at least 2 options
    if (!data.options || data.options.length < 2) {
      throw new Error('Question must have at least 2 options');
    }

    // Validate correct answer is one of the options
    if (!data.options.includes(data.correctAnswer)) {
      throw new Error('Correct answer must be one of the options');
    }

    // Validate required fields
    if (!data.questionText) {
      throw new Error('Question text is required');
    }

    // Create question
    const question = await prisma.quizQuestion.create({
      data: {
        questionText: data.questionText,
        options: data.options,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation || null,
        order: data.order,
        quizId,
      },
    });

    return question;
  }

  /**
   * Update a quiz question with ownership check
   * @param userId - User ID requesting the update
   * @param questionId - Question ID to update
   * @param data - Updated question data
   * @returns Updated QuizQuestion record
   * @throws Error if question not found or unauthorized
   */
  async updateQuestion(userId: string, questionId: string, data: UpdateQuestionInput): Promise<QuizQuestion> {
    // Check ownership through quiz relationship
    const existing = await prisma.quizQuestion.findFirst({
      where: {
        id: questionId,
      },
      include: {
        quiz: true,
      },
    });

    if (!existing || existing.quiz.userId !== userId) {
      throw new Error('Question not found');
    }

    // Validate options if provided
    if (data.options !== undefined && data.options.length < 2) {
      throw new Error('Question must have at least 2 options');
    }

    // Validate correct answer if options or correctAnswer are being updated
    const finalOptions = data.options !== undefined ? data.options : (existing.options as string[]);
    const finalCorrectAnswer = data.correctAnswer !== undefined ? data.correctAnswer : existing.correctAnswer;

    if (!finalOptions.includes(finalCorrectAnswer)) {
      throw new Error('Correct answer must be one of the options');
    }

    // Update question
    const question = await prisma.quizQuestion.update({
      where: {
        id: questionId,
      },
      data: {
        ...(data.questionText !== undefined && { questionText: data.questionText }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.correctAnswer !== undefined && { correctAnswer: data.correctAnswer }),
        ...(data.explanation !== undefined && { explanation: data.explanation }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });

    return question;
  }

  /**
   * Delete a quiz question with ownership check
   * @param userId - User ID requesting deletion
   * @param questionId - Question ID to delete
   * @throws Error if question not found or unauthorized
   */
  async deleteQuestion(userId: string, questionId: string): Promise<void> {
    // Check ownership through quiz relationship
    const existing = await prisma.quizQuestion.findFirst({
      where: {
        id: questionId,
      },
      include: {
        quiz: true,
      },
    });

    if (!existing || existing.quiz.userId !== userId) {
      throw new Error('Question not found');
    }

    // Delete question
    await prisma.quizQuestion.delete({
      where: {
        id: questionId,
      },
    });
  }

  /**
   * Start a new quiz attempt
   * @param userId - User ID taking the quiz
   * @param quizId - Quiz ID to attempt
   * @returns Created QuizAttempt record
   * @throws Error if quiz not found or unauthorized
   */
  async startAttempt(userId: string, quizId: string): Promise<QuizAttempt> {
    // Check quiz ownership and get question count
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
      include: {
        questions: true,
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Create quiz attempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        score: 0,
        totalQuestions: quiz.questions.length,
        correctAnswers: 0,
        startedAt: new Date(),
      },
    });

    return attempt;
  }

  /**
   * Submit an answer for a quiz question
   * @param attemptId - Quiz attempt ID
   * @param questionId - Question ID being answered
   * @param answer - Selected answer
   * @returns Created QuizQuestionAttempt record with correctness
   * @throws Error if attempt or question not found
   */
  async submitAnswer(
    attemptId: string,
    questionId: string,
    answer: string
  ): Promise<QuizQuestionAttempt> {
    // Verify attempt exists
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
      },
    });

    if (!attempt) {
      throw new Error('Quiz attempt not found');
    }

    // Get question to check correct answer
    const question = await prisma.quizQuestion.findUnique({
      where: {
        id: questionId,
      },
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Check if answer is correct
    const isCorrect = answer === question.correctAnswer;

    // Create question attempt record
    const questionAttempt = await prisma.quizQuestionAttempt.create({
      data: {
        quizAttemptId: attemptId,
        quizQuestionId: questionId,
        selectedAnswer: answer,
        isCorrect,
        attemptedAt: new Date(),
      },
    });

    return questionAttempt;
  }

  /**
   * Complete a quiz attempt and calculate final score
   * @param attemptId - Quiz attempt ID to complete
   * @returns Updated QuizAttempt record with score
   * @throws Error if attempt not found
   */
  async completeAttempt(attemptId: string): Promise<QuizAttempt> {
    // Get attempt with all question attempts
    const attempt = await prisma.quizAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        questionAttempts: true,
        quiz: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new Error('Quiz attempt not found');
    }

    // Calculate correct answers
    const correctAnswers = attempt.questionAttempts.filter((qa) => qa.isCorrect).length;

    // Calculate score as percentage
    const score = attempt.totalQuestions > 0 
      ? (correctAnswers / attempt.totalQuestions) * 100 
      : 0;

    // Calculate time spent in seconds
    const completedAt = new Date();
    const timeSpentSeconds = Math.floor((completedAt.getTime() - attempt.startedAt.getTime()) / 1000);
    const timeSpent = timeSpentSeconds;

    // Update attempt with final score and completion time
    const updatedAttempt = await prisma.quizAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        score,
        correctAnswers,
        timeSpent,
        completedAt,
      },
    });

    // Record in analytics
    await analyticsService.recordQuizCompletion(attempt.quiz.userId, completedAt);

    return updatedAttempt;
  }

  /**
   * Get a single attempt with full question review data
   * @param userId - User ID requesting the attempt
   * @param attemptId - Attempt ID to retrieve
   * @returns QuizAttempt with questionAttempts and question details
   */
  async getAttemptWithReview(userId: string, attemptId: string) {
    const attempt = await prisma.quizAttempt.findFirst({
      where: {
        id: attemptId,
        quiz: { userId },
      },
      include: {
        quiz: {
          select: { id: true, title: true, description: true, difficulty: true },
        },
        questionAttempts: {
          include: {
            quizQuestion: {
              select: {
                id: true,
                questionText: true,
                options: true,
                correctAnswer: true,
                explanation: true,
                order: true,
              },
            },
          },
          orderBy: { quizQuestion: { order: 'asc' } },
        },
      },
    });

    return attempt;
  }

  /**
   * @param userId - User ID requesting history
   * @param quizId - Quiz ID to get attempts for
   * @returns Array of QuizAttempt records ordered by start time
   * @throws Error if quiz not found or unauthorized
   */
  async getAttemptHistory(userId: string, quizId: string): Promise<QuizAttempt[]> {
    // Check quiz ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId,
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Get last 5 attempts for this quiz
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        quizId,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: 5,
    });

    return attempts;
  }
}

// Export singleton instance
export const quizService = new QuizService();
