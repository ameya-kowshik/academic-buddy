import { z } from 'zod';

/**
 * Schema for creating a quiz
 */
export const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  grouping: z.string().optional(),
  difficulty: z.number().int().min(1, 'Difficulty must be at least 1').max(5, 'Difficulty must be at most 5'),
  sourceMaterialId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Schema for updating a quiz
 */
export const updateQuizSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().optional(),
  grouping: z.string().optional(),
  difficulty: z.number().int().min(1, 'Difficulty must be at least 1').max(5, 'Difficulty must be at most 5').optional(),
  sourceMaterialId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Schema for quiz filters
 */
export const quizFiltersSchema = z.object({
  grouping: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  sourceMaterialId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
});

/**
 * Schema for creating a quiz question
 */
export const createQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).min(2, 'Question must have at least 2 options'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  explanation: z.string().optional(),
  order: z.number().int().min(0, 'Order must be non-negative'),
});

/**
 * Schema for updating a quiz question
 */
export const updateQuestionSchema = z.object({
  questionText: z.string().min(1, 'Question text is required').optional(),
  options: z.array(z.string()).min(2, 'Question must have at least 2 options').optional(),
  correctAnswer: z.string().min(1, 'Correct answer is required').optional(),
  explanation: z.string().optional(),
  order: z.number().int().min(0, 'Order must be non-negative').optional(),
});

/**
 * Schema for submitting an answer to a quiz question
 */
export const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type QuizFilters = z.infer<typeof quizFiltersSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
