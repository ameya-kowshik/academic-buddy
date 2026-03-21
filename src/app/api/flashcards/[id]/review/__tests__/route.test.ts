import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import { flashcardService } from '@/lib/services/flashcard.service';

// Mock the flashcard service
vi.mock('@/lib/services/flashcard.service', () => ({
  flashcardService: {
    recordReview: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Flashcard Review API Route', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockContext = {
    params: {
      id: 'flashcard-1',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/flashcards/[id]/review', () => {
    it('should record a flashcard review', async () => {
      const mockFlashcard = {
        id: 'flashcard-1',
        title: 'Test Card',
        question: 'What is 2+2?',
        answer: '4',
        grouping: 'Math',
        difficulty: 1,
        reviewCount: 4,
        lastReviewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
        tags: [],
      };

      vi.mocked(flashcardService.recordReview).mockResolvedValue(mockFlashcard);

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1/review', {
        method: 'POST',
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('flashcard-1');
      expect(data.reviewCount).toBe(4);
      expect(data.lastReviewed).toBeDefined();
      expect(flashcardService.recordReview).toHaveBeenCalledWith(mockUser.id, 'flashcard-1');
    });

    it('should increment review count on multiple reviews', async () => {
      const mockFlashcard = {
        id: 'flashcard-1',
        title: 'Test Card',
        question: 'What is 2+2?',
        answer: '4',
        grouping: 'Math',
        difficulty: 1,
        reviewCount: 10,
        lastReviewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
        tags: [],
      };

      vi.mocked(flashcardService.recordReview).mockResolvedValue(mockFlashcard);

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1/review', {
        method: 'POST',
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.reviewCount).toBe(10);
    });

    it('should return 404 when flashcard not found', async () => {
      vi.mocked(flashcardService.recordReview).mockRejectedValue(
        new Error('Flashcard not found')
      );

      const request = new NextRequest('http://localhost:3000/api/flashcards/nonexistent/review', {
        method: 'POST',
      });

      const response = await POST(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Flashcard not found');
    });

    it('should handle review recording errors gracefully', async () => {
      vi.mocked(flashcardService.recordReview).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1/review', {
        method: 'POST',
      });

      const response = await POST(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to record flashcard review');
      expect(data.details).toBe('Database error');
    });
  });
});
