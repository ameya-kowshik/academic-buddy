import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FlashcardService } from '../flashcard.service';
import { prisma } from '@/lib/prisma';
import { analyticsService } from '../analytics.service';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    flashcard: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('../analytics.service', () => ({
  analyticsService: {
    recordFlashcardReview: vi.fn(),
  },
}));

describe('FlashcardService', () => {
  let flashcardService: FlashcardService;
  const mockUserId = 'user-123';
  const mockFlashcardId = 'flashcard-123';

  beforeEach(() => {
    flashcardService = new FlashcardService();
    vi.clearAllMocks();
  });

  describe('createFlashcard', () => {
    it('should create flashcard with valid data', async () => {
      const mockInput = {
        title: 'Test Flashcard',
        question: 'What is 2+2?',
        answer: '4',
        difficulty: 3,
        grouping: 'Math',
        sourceMaterialId: 'doc-123',
      };

      const mockFlashcard = {
        id: mockFlashcardId,
        ...mockInput,
        reviewCount: 0,
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      vi.mocked(prisma.flashcard.create).mockResolvedValue(mockFlashcard);

      const result = await flashcardService.createFlashcard(mockUserId, mockInput);

      expect(prisma.flashcard.create).toHaveBeenCalledWith({
        data: {
          title: mockInput.title,
          question: mockInput.question,
          answer: mockInput.answer,
          grouping: mockInput.grouping,
          difficulty: mockInput.difficulty,
          sourceMaterialId: mockInput.sourceMaterialId,
          userId: mockUserId,
          tags: [],
        },
      });
      expect(result).toEqual(mockFlashcard);
    });

    it('should create flashcard without optional fields', async () => {
      const mockInput = {
        title: 'Test Flashcard',
        question: 'What is 2+2?',
        answer: '4',
        difficulty: 1,
      };

      const mockFlashcard = {
        id: mockFlashcardId,
        ...mockInput,
        grouping: null,
        sourceMaterialId: null,
        reviewCount: 0,
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      vi.mocked(prisma.flashcard.create).mockResolvedValue(mockFlashcard);

      const result = await flashcardService.createFlashcard(mockUserId, mockInput);

      expect(prisma.flashcard.create).toHaveBeenCalledWith({
        data: {
          title: mockInput.title,
          question: mockInput.question,
          answer: mockInput.answer,
          grouping: null,
          difficulty: mockInput.difficulty,
          sourceMaterialId: null,
          userId: mockUserId,
          tags: [],
        },
      });
      expect(result).toEqual(mockFlashcard);
    });

    it('should throw error if difficulty is below 1', async () => {
      const mockInput = {
        title: 'Test Flashcard',
        question: 'What is 2+2?',
        answer: '4',
        difficulty: 0,
      };

      await expect(flashcardService.createFlashcard(mockUserId, mockInput)).rejects.toThrow(
        'Difficulty must be between 1 and 5'
      );

      expect(prisma.flashcard.create).not.toHaveBeenCalled();
    });

    it('should throw error if difficulty is above 5', async () => {
      const mockInput = {
        title: 'Test Flashcard',
        question: 'What is 2+2?',
        answer: '4',
        difficulty: 6,
      };

      await expect(flashcardService.createFlashcard(mockUserId, mockInput)).rejects.toThrow(
        'Difficulty must be between 1 and 5'
      );

      expect(prisma.flashcard.create).not.toHaveBeenCalled();
    });

    it('should throw error if title is missing', async () => {
      const mockInput = {
        title: '',
        question: 'What is 2+2?',
        answer: '4',
        difficulty: 3,
      };

      await expect(flashcardService.createFlashcard(mockUserId, mockInput)).rejects.toThrow(
        'Title, question, and answer are required'
      );

      expect(prisma.flashcard.create).not.toHaveBeenCalled();
    });

    it('should throw error if question is missing', async () => {
      const mockInput = {
        title: 'Test',
        question: '',
        answer: '4',
        difficulty: 3,
      };

      await expect(flashcardService.createFlashcard(mockUserId, mockInput)).rejects.toThrow(
        'Title, question, and answer are required'
      );

      expect(prisma.flashcard.create).not.toHaveBeenCalled();
    });

    it('should throw error if answer is missing', async () => {
      const mockInput = {
        title: 'Test',
        question: 'What is 2+2?',
        answer: '',
        difficulty: 3,
      };

      await expect(flashcardService.createFlashcard(mockUserId, mockInput)).rejects.toThrow(
        'Title, question, and answer are required'
      );

      expect(prisma.flashcard.create).not.toHaveBeenCalled();
    });
  });

  describe('updateFlashcard', () => {
    it('should update flashcard with ownership check', async () => {
      const existingFlashcard = {
        id: mockFlashcardId,
        title: 'Old Title',
        question: 'Old Question',
        answer: 'Old Answer',
        difficulty: 2,
        grouping: 'Old Group',
        sourceMaterialId: null,
        reviewCount: 5,
        lastReviewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      const updateData = {
        title: 'New Title',
        difficulty: 4,
      };

      const updatedFlashcard = {
        ...existingFlashcard,
        ...updateData,
        updatedAt: new Date(),
      };

      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(existingFlashcard);
      vi.mocked(prisma.flashcard.update).mockResolvedValue(updatedFlashcard);

      const result = await flashcardService.updateFlashcard(mockUserId, mockFlashcardId, updateData);

      expect(prisma.flashcard.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockFlashcardId,
          userId: mockUserId,
        },
      });
      expect(prisma.flashcard.update).toHaveBeenCalledWith({
        where: {
          id: mockFlashcardId,
        },
        data: {
          title: updateData.title,
          difficulty: updateData.difficulty,
        },
      });
      expect(result).toEqual(updatedFlashcard);
    });

    it('should throw error if flashcard not found', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      await expect(
        flashcardService.updateFlashcard(mockUserId, 'non-existent', { title: 'New Title' })
      ).rejects.toThrow('Flashcard not found');

      expect(prisma.flashcard.update).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own flashcard', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      await expect(
        flashcardService.updateFlashcard('other-user', mockFlashcardId, { title: 'New Title' })
      ).rejects.toThrow('Flashcard not found');

      expect(prisma.flashcard.update).not.toHaveBeenCalled();
    });

    it('should throw error if difficulty is invalid', async () => {
      const existingFlashcard = {
        id: mockFlashcardId,
        title: 'Test',
        question: 'Test?',
        answer: 'Test',
        difficulty: 3,
        grouping: null,
        sourceMaterialId: null,
        reviewCount: 0,
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(existingFlashcard);

      await expect(
        flashcardService.updateFlashcard(mockUserId, mockFlashcardId, { difficulty: 10 })
      ).rejects.toThrow('Difficulty must be between 1 and 5');

      expect(prisma.flashcard.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteFlashcard', () => {
    it('should delete flashcard with ownership check', async () => {
      const mockFlashcard = {
        id: mockFlashcardId,
        title: 'Test',
        question: 'Test?',
        answer: 'Test',
        difficulty: 3,
        grouping: null,
        sourceMaterialId: null,
        reviewCount: 0,
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(mockFlashcard);
      vi.mocked(prisma.flashcard.delete).mockResolvedValue(mockFlashcard);

      await flashcardService.deleteFlashcard(mockUserId, mockFlashcardId);

      expect(prisma.flashcard.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockFlashcardId,
          userId: mockUserId,
        },
      });
      expect(prisma.flashcard.delete).toHaveBeenCalledWith({
        where: {
          id: mockFlashcardId,
        },
      });
    });

    it('should throw error if flashcard not found', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      await expect(
        flashcardService.deleteFlashcard(mockUserId, 'non-existent')
      ).rejects.toThrow('Flashcard not found');

      expect(prisma.flashcard.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own flashcard', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      await expect(
        flashcardService.deleteFlashcard('other-user', mockFlashcardId)
      ).rejects.toThrow('Flashcard not found');

      expect(prisma.flashcard.delete).not.toHaveBeenCalled();
    });
  });

  describe('getFlashcard', () => {
    it('should retrieve flashcard with ownership check', async () => {
      const mockFlashcard = {
        id: mockFlashcardId,
        title: 'Test',
        question: 'Test?',
        answer: 'Test',
        difficulty: 3,
        grouping: 'Math',
        sourceMaterialId: 'doc-123',
        reviewCount: 5,
        lastReviewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
      };

      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(mockFlashcard);

      const result = await flashcardService.getFlashcard(mockUserId, mockFlashcardId);

      expect(prisma.flashcard.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockFlashcardId,
          userId: mockUserId,
        },
      });
      expect(result).toEqual(mockFlashcard);
    });

    it('should return null if flashcard not found', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      const result = await flashcardService.getFlashcard(mockUserId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should return null if user does not own flashcard', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      const result = await flashcardService.getFlashcard('other-user', mockFlashcardId);

      expect(result).toBeNull();
    });
  });

  describe('listFlashcards', () => {
    it('should retrieve all user flashcards ordered by creation date', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test 1',
          question: 'Question 1',
          answer: 'Answer 1',
          difficulty: 3,
          grouping: 'Math',
          sourceMaterialId: null,
          reviewCount: 2,
          lastReviewed: new Date(),
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date(),
          userId: mockUserId,
        },
        {
          id: 'flashcard-2',
          title: 'Test 2',
          question: 'Question 2',
          answer: 'Answer 2',
          difficulty: 1,
          grouping: 'Science',
          sourceMaterialId: 'doc-123',
          reviewCount: 0,
          lastReviewed: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date(),
          userId: mockUserId,
        },
      ];

      vi.mocked(prisma.flashcard.findMany).mockResolvedValue(mockFlashcards);

      const result = await flashcardService.listFlashcards(mockUserId);

      expect(prisma.flashcard.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockFlashcards);
    });

    it('should filter flashcards by grouping', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test 1',
          question: 'Question 1',
          answer: 'Answer 1',
          difficulty: 3,
          grouping: 'Math',
          sourceMaterialId: null,
          reviewCount: 2,
          lastReviewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUserId,
        },
      ];

      vi.mocked(prisma.flashcard.findMany).mockResolvedValue(mockFlashcards);

      const result = await flashcardService.listFlashcards(mockUserId, { grouping: 'Math' });

      expect(prisma.flashcard.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          grouping: 'Math',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockFlashcards);
    });

    it('should filter flashcards by difficulty', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test 1',
          question: 'Question 1',
          answer: 'Answer 1',
          difficulty: 5,
          grouping: 'Math',
          sourceMaterialId: null,
          reviewCount: 2,
          lastReviewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUserId,
        },
      ];

      vi.mocked(prisma.flashcard.findMany).mockResolvedValue(mockFlashcards);

      const result = await flashcardService.listFlashcards(mockUserId, { difficulty: 5 });

      expect(prisma.flashcard.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          difficulty: 5,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockFlashcards);
    });

    it('should filter flashcards by sourceMaterialId', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test 1',
          question: 'Question 1',
          answer: 'Answer 1',
          difficulty: 3,
          grouping: 'Math',
          sourceMaterialId: 'doc-123',
          reviewCount: 2,
          lastReviewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUserId,
        },
      ];

      vi.mocked(prisma.flashcard.findMany).mockResolvedValue(mockFlashcards);

      const result = await flashcardService.listFlashcards(mockUserId, {
        sourceMaterialId: 'doc-123',
      });

      expect(prisma.flashcard.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          sourceMaterialId: 'doc-123',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockFlashcards);
    });

    it('should filter flashcards by multiple criteria', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test 1',
          question: 'Question 1',
          answer: 'Answer 1',
          difficulty: 3,
          grouping: 'Math',
          sourceMaterialId: 'doc-123',
          reviewCount: 2,
          lastReviewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUserId,
        },
      ];

      vi.mocked(prisma.flashcard.findMany).mockResolvedValue(mockFlashcards);

      const result = await flashcardService.listFlashcards(mockUserId, {
        grouping: 'Math',
        difficulty: 3,
        sourceMaterialId: 'doc-123',
      });

      expect(prisma.flashcard.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          grouping: 'Math',
          difficulty: 3,
          sourceMaterialId: 'doc-123',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockFlashcards);
    });

    it('should return empty array if user has no flashcards', async () => {
      vi.mocked(prisma.flashcard.findMany).mockResolvedValue([]);

      const result = await flashcardService.listFlashcards(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('recordReview', () => {
    it('should increment review count and update timestamp', async () => {
      const existingFlashcard = {
        id: mockFlashcardId,
        title: 'Test',
        question: 'Test?',
        answer: 'Test',
        difficulty: 3,
        grouping: null,
        sourceMaterialId: null,
        reviewCount: 5,
        lastReviewed: new Date('2024-01-01'),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUserId,
        tags: [],
      };

      const updatedFlashcard = {
        ...existingFlashcard,
        reviewCount: 6,
        lastReviewed: new Date(),
      };

      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(existingFlashcard);
      vi.mocked(prisma.flashcard.update).mockResolvedValue(updatedFlashcard);
      vi.mocked(analyticsService.recordFlashcardReview).mockResolvedValue(undefined);

      const result = await flashcardService.recordReview(mockUserId, mockFlashcardId);

      expect(prisma.flashcard.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockFlashcardId,
          userId: mockUserId,
        },
      });
      expect(prisma.flashcard.update).toHaveBeenCalledWith({
        where: {
          id: mockFlashcardId,
        },
        data: {
          reviewCount: {
            increment: 1,
          },
          lastReviewed: expect.any(Date),
        },
      });
      expect(analyticsService.recordFlashcardReview).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Date)
      );
      expect(result.reviewCount).toBe(6);
      expect(result.lastReviewed).toBeInstanceOf(Date);
    });

    it('should throw error if flashcard not found', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      await expect(
        flashcardService.recordReview(mockUserId, 'non-existent')
      ).rejects.toThrow('Flashcard not found');

      expect(prisma.flashcard.update).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own flashcard', async () => {
      vi.mocked(prisma.flashcard.findFirst).mockResolvedValue(null);

      await expect(
        flashcardService.recordReview('other-user', mockFlashcardId)
      ).rejects.toThrow('Flashcard not found');

      expect(prisma.flashcard.update).not.toHaveBeenCalled();
    });
  });
});
