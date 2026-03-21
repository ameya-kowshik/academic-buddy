import { prisma } from '@/lib/prisma';
import { Flashcard } from '@prisma/client';
import { analyticsService } from './analytics.service';

/**
 * Input type for creating a flashcard
 */
export interface CreateFlashcardInput {
  title: string;
  question: string;
  answer: string;
  grouping?: string;
  difficulty: number;
  sourceMaterialId?: string;
  tags?: string[];
}

/**
 * Input type for updating a flashcard
 */
export interface UpdateFlashcardInput {
  title?: string;
  question?: string;
  answer?: string;
  grouping?: string;
  difficulty?: number;
  sourceMaterialId?: string;
  tags?: string[];
}

/**
 * Filter options for listing flashcards
 */
export interface FlashcardFilters {
  grouping?: string;
  difficulty?: number;
  sourceMaterialId?: string;
  tags?: string[];
}

/**
 * Service for managing flashcards
 * Handles CRUD operations and review tracking for Flashcard records
 */
export class FlashcardService {
  /**
   * Create a new flashcard with validation
   * @param userId - User ID who owns the flashcard
   * @param data - Flashcard data
   * @returns Created Flashcard record
   * @throws Error if validation fails
   */
  async createFlashcard(userId: string, data: CreateFlashcardInput): Promise<Flashcard> {
    // Validate difficulty level (1-5)
    if (data.difficulty < 1 || data.difficulty > 5) {
      throw new Error('Difficulty must be between 1 and 5');
    }

    // Validate required fields
    if (!data.title || !data.question || !data.answer) {
      throw new Error('Title, question, and answer are required');
    }

    // Create flashcard record
    const flashcard = await prisma.flashcard.create({
      data: {
        title: data.title,
        question: data.question,
        answer: data.answer,
        grouping: data.grouping || null,
        difficulty: data.difficulty,
        sourceMaterialId: data.sourceMaterialId || null,
        tags: data.tags || [],
        userId,
      },
    });

    return flashcard;
  }

  /**
   * Update an existing flashcard with ownership check
   * @param userId - User ID requesting the update
   * @param id - Flashcard ID to update
   * @param data - Updated flashcard data
   * @returns Updated Flashcard record
   * @throws Error if flashcard not found or unauthorized
   */
  async updateFlashcard(
    userId: string,
    id: string,
    data: UpdateFlashcardInput
  ): Promise<Flashcard> {
    // Check ownership
    const existing = await prisma.flashcard.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Flashcard not found');
    }

    // Validate difficulty if provided
    if (data.difficulty !== undefined && (data.difficulty < 1 || data.difficulty > 5)) {
      throw new Error('Difficulty must be between 1 and 5');
    }

    // Update flashcard
    const flashcard = await prisma.flashcard.update({
      where: {
        id,
      },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.question !== undefined && { question: data.question }),
        ...(data.answer !== undefined && { answer: data.answer }),
        ...(data.grouping !== undefined && { grouping: data.grouping }),
        ...(data.difficulty !== undefined && { difficulty: data.difficulty }),
        ...(data.sourceMaterialId !== undefined && { sourceMaterialId: data.sourceMaterialId }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });

    return flashcard;
  }

  /**
   * Delete a flashcard with ownership check
   * @param userId - User ID requesting deletion
   * @param id - Flashcard ID to delete
   * @throws Error if flashcard not found or unauthorized
   */
  async deleteFlashcard(userId: string, id: string): Promise<void> {
    // Check ownership
    const existing = await prisma.flashcard.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Flashcard not found');
    }

    // Delete flashcard
    await prisma.flashcard.delete({
      where: {
        id,
      },
    });
  }

  /**
   * Retrieve a flashcard by ID with ownership check
   * @param userId - User ID requesting the flashcard
   * @param id - Flashcard ID to retrieve
   * @returns Flashcard record or null if not found/unauthorized
   */
  async getFlashcard(userId: string, id: string): Promise<Flashcard | null> {
    const flashcard = await prisma.flashcard.findFirst({
      where: {
        id,
        userId,
      },
    });

    return flashcard;
  }

  /**
   * List flashcards with optional filtering
   * @param userId - User ID to retrieve flashcards for
   * @param filters - Optional filters for grouping, difficulty, sourceMaterialId, tags
   * @returns Array of Flashcard records
   */
  async listFlashcards(userId: string, filters?: FlashcardFilters): Promise<Flashcard[]> {
    const flashcards = await prisma.flashcard.findMany({
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

    return flashcards;
  }

  /**
   * Record a flashcard review (increment count and update timestamp)
   * @param userId - User ID reviewing the flashcard
   * @param id - Flashcard ID to record review for
   * @returns Updated Flashcard record
   * @throws Error if flashcard not found or unauthorized
   */
  async recordReview(userId: string, id: string): Promise<Flashcard> {
    // Check ownership
    const existing = await prisma.flashcard.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existing) {
      throw new Error('Flashcard not found');
    }

    const reviewDate = new Date();

    // Increment review count and update lastReviewed timestamp
    const flashcard = await prisma.flashcard.update({
      where: {
        id,
      },
      data: {
        reviewCount: {
          increment: 1,
        },
        lastReviewed: reviewDate,
      },
    });

    // Record in analytics
    await analyticsService.recordFlashcardReview(userId, reviewDate);

    return flashcard;
  }
}

// Export singleton instance
export const flashcardService = new FlashcardService();
