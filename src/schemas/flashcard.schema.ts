import { z } from 'zod';

/**
 * Schema for creating a flashcard
 */
export const createFlashcardSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
  grouping: z.string().optional(),
  difficulty: z.number().int().min(1, 'Difficulty must be at least 1').max(5, 'Difficulty must be at most 5'),
  sourceMaterialId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Schema for updating a flashcard
 */
export const updateFlashcardSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  question: z.string().min(1, 'Question is required').optional(),
  answer: z.string().min(1, 'Answer is required').optional(),
  grouping: z.string().optional(),
  difficulty: z.number().int().min(1, 'Difficulty must be at least 1').max(5, 'Difficulty must be at most 5').optional(),
  sourceMaterialId: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Schema for flashcard filters
 */
export const flashcardFiltersSchema = z.object({
  grouping: z.string().optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  sourceMaterialId: z.string().optional(),
  tags: z.string().optional(), // Comma-separated tags
});

export type CreateFlashcardInput = z.infer<typeof createFlashcardSchema>;
export type UpdateFlashcardInput = z.infer<typeof updateFlashcardSchema>;
export type FlashcardFilters = z.infer<typeof flashcardFiltersSchema>;
