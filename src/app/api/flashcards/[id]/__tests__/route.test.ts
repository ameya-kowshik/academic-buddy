import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { flashcardService } from '@/lib/services/flashcard.service';

// Mock the flashcard service
vi.mock('@/lib/services/flashcard.service', () => ({
  flashcardService: {
    getFlashcard: vi.fn(),
    updateFlashcard: vi.fn(),
    deleteFlashcard: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Flashcard [id] API Routes', () => {
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

  describe('GET /api/flashcards/[id]', () => {
    it('should return a flashcard by id', async () => {
      const mockFlashcard = {
        id: 'flashcard-1',
        title: 'Test Card',
        question: 'What is 2+2?',
        answer: '4',
        grouping: 'Math',
        difficulty: 1,
        reviewCount: 3,
        lastReviewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
      };

      vi.mocked(flashcardService.getFlashcard).mockResolvedValue(mockFlashcard);

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1');
      const response = await GET(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('flashcard-1');
      expect(data.title).toBe('Test Card');
      expect(flashcardService.getFlashcard).toHaveBeenCalledWith(mockUser.id, 'flashcard-1');
    });

    it('should return 404 when flashcard not found', async () => {
      vi.mocked(flashcardService.getFlashcard).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/flashcards/nonexistent');
      const response = await GET(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Flashcard not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(flashcardService.getFlashcard).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1');
      const response = await GET(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch flashcard');
      expect(data.details).toBe('Database error');
    });
  });

  describe('PUT /api/flashcards/[id]', () => {
    it('should update a flashcard', async () => {
      const mockFlashcard = {
        id: 'flashcard-1',
        title: 'Updated Card',
        question: 'What is 3+3?',
        answer: '6',
        grouping: 'Math',
        difficulty: 2,
        reviewCount: 3,
        lastReviewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
      };

      vi.mocked(flashcardService.updateFlashcard).mockResolvedValue(mockFlashcard);

      const requestBody = {
        title: 'Updated Card',
        question: 'What is 3+3?',
        answer: '6',
        difficulty: 2,
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Card');
      expect(flashcardService.updateFlashcard).toHaveBeenCalledWith(
        mockUser.id,
        'flashcard-1',
        requestBody
      );
    });

    it('should update only specified fields', async () => {
      const mockFlashcard = {
        id: 'flashcard-1',
        title: 'Updated Title',
        question: 'What is 2+2?',
        answer: '4',
        grouping: 'Math',
        difficulty: 1,
        reviewCount: 3,
        lastReviewed: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
      };

      vi.mocked(flashcardService.updateFlashcard).mockResolvedValue(mockFlashcard);

      const requestBody = {
        title: 'Updated Title',
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
    });

    it('should return 404 when flashcard not found', async () => {
      vi.mocked(flashcardService.updateFlashcard).mockRejectedValue(
        new Error('Flashcard not found')
      );

      const requestBody = {
        title: 'Updated Card',
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Flashcard not found');
    });

    it('should reject invalid difficulty', async () => {
      const requestBody = {
        difficulty: 10,
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid flashcard data');
      expect(flashcardService.updateFlashcard).not.toHaveBeenCalled();
    });

    it('should handle update errors gracefully', async () => {
      vi.mocked(flashcardService.updateFlashcard).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        title: 'Updated Card',
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
      });

      const response = await PUT(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to update flashcard');
      expect(data.details).toBe('Database error');
    });
  });

  describe('DELETE /api/flashcards/[id]', () => {
    it('should delete a flashcard', async () => {
      vi.mocked(flashcardService.deleteFlashcard).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Flashcard deleted successfully');
      expect(flashcardService.deleteFlashcard).toHaveBeenCalledWith(mockUser.id, 'flashcard-1');
    });

    it('should return 404 when flashcard not found', async () => {
      vi.mocked(flashcardService.deleteFlashcard).mockRejectedValue(
        new Error('Flashcard not found')
      );

      const request = new NextRequest('http://localhost:3000/api/flashcards/nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: { id: 'nonexistent' } }, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Flashcard not found');
    });

    it('should handle deletion errors gracefully', async () => {
      vi.mocked(flashcardService.deleteFlashcard).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/flashcards/flashcard-1', {
        method: 'DELETE',
      });

      const response = await DELETE(request, mockContext, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete flashcard');
      expect(data.details).toBe('Database error');
    });
  });
});
