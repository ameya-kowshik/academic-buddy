import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { flashcardService } from '@/lib/services/flashcard.service';

// Mock the flashcard service
vi.mock('@/lib/services/flashcard.service', () => ({
  flashcardService: {
    listFlashcards: vi.fn(),
    createFlashcard: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Flashcard API Routes', () => {
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

  describe('GET /api/flashcards', () => {
    it('should return all user flashcards', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test Card 1',
          question: 'What is 2+2?',
          answer: '4',
          grouping: 'Math',
          difficulty: 1,
          reviewCount: 0,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: null,
        },
        {
          id: 'flashcard-2',
          title: 'Test Card 2',
          question: 'What is the capital of France?',
          answer: 'Paris',
          grouping: 'Geography',
          difficulty: 2,
          reviewCount: 5,
          lastReviewed: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: 'doc-1',
        },
      ];

      vi.mocked(flashcardService.listFlashcards).mockResolvedValue(mockFlashcards);

      const request = new NextRequest('http://localhost:3000/api/flashcards');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcards).toHaveLength(2);
      expect(data.flashcards[0].id).toBe('flashcard-1');
      expect(flashcardService.listFlashcards).toHaveBeenCalledWith(mockUser.id, {});
    });

    it('should filter flashcards by grouping', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test Card 1',
          question: 'What is 2+2?',
          answer: '4',
          grouping: 'Math',
          difficulty: 1,
          reviewCount: 0,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: null,
        },
      ];

      vi.mocked(flashcardService.listFlashcards).mockResolvedValue(mockFlashcards);

      const request = new NextRequest('http://localhost:3000/api/flashcards?grouping=Math');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcards).toHaveLength(1);
      expect(flashcardService.listFlashcards).toHaveBeenCalledWith(mockUser.id, {
        grouping: 'Math',
      });
    });

    it('should filter flashcards by difficulty', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test Card 1',
          question: 'What is 2+2?',
          answer: '4',
          grouping: 'Math',
          difficulty: 3,
          reviewCount: 0,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: null,
        },
      ];

      vi.mocked(flashcardService.listFlashcards).mockResolvedValue(mockFlashcards);

      const request = new NextRequest('http://localhost:3000/api/flashcards?difficulty=3');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcards).toHaveLength(1);
      expect(flashcardService.listFlashcards).toHaveBeenCalledWith(mockUser.id, {
        difficulty: 3,
      });
    });

    it('should filter flashcards by sourceMaterialId', async () => {
      const mockFlashcards = [
        {
          id: 'flashcard-1',
          title: 'Test Card 1',
          question: 'What is 2+2?',
          answer: '4',
          grouping: 'Math',
          difficulty: 1,
          reviewCount: 0,
          lastReviewed: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
          sourceMaterialId: 'doc-1',
        },
      ];

      vi.mocked(flashcardService.listFlashcards).mockResolvedValue(mockFlashcards);

      const request = new NextRequest('http://localhost:3000/api/flashcards?sourceMaterialId=doc-1');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcards).toHaveLength(1);
      expect(flashcardService.listFlashcards).toHaveBeenCalledWith(mockUser.id, {
        sourceMaterialId: 'doc-1',
      });
    });

    it('should return empty array when user has no flashcards', async () => {
      vi.mocked(flashcardService.listFlashcards).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/flashcards');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcards).toHaveLength(0);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(flashcardService.listFlashcards).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/flashcards');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch flashcards');
      expect(data.details).toBe('Database error');
    });
  });

  describe('POST /api/flashcards', () => {
    it('should create a valid flashcard', async () => {
      const mockFlashcard = {
        id: 'new-flashcard-id',
        title: 'New Card',
        question: 'What is the answer?',
        answer: '42',
        grouping: 'Philosophy',
        difficulty: 3,
        reviewCount: 0,
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: null,
      };

      vi.mocked(flashcardService.createFlashcard).mockResolvedValue(mockFlashcard);

      const requestBody = {
        title: 'New Card',
        question: 'What is the answer?',
        answer: '42',
        grouping: 'Philosophy',
        difficulty: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.id).toBe('new-flashcard-id');
      expect(data.title).toBe('New Card');
      expect(flashcardService.createFlashcard).toHaveBeenCalledWith(
        mockUser.id,
        requestBody
      );
    });

    it('should create a flashcard with sourceMaterialId', async () => {
      const mockFlashcard = {
        id: 'new-flashcard-id',
        title: 'New Card',
        question: 'What is the answer?',
        answer: '42',
        grouping: 'Philosophy',
        difficulty: 3,
        reviewCount: 0,
        lastReviewed: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: mockUser.id,
        sourceMaterialId: 'doc-1',
      };

      vi.mocked(flashcardService.createFlashcard).mockResolvedValue(mockFlashcard);

      const requestBody = {
        title: 'New Card',
        question: 'What is the answer?',
        answer: '42',
        grouping: 'Philosophy',
        difficulty: 3,
        sourceMaterialId: 'doc-1',
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.sourceMaterialId).toBe('doc-1');
    });

    it('should reject flashcard with missing required fields', async () => {
      const requestBody = {
        title: 'New Card',
        // Missing question and answer
        difficulty: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid flashcard data');
      expect(flashcardService.createFlashcard).not.toHaveBeenCalled();
    });

    it('should reject flashcard with invalid difficulty (too low)', async () => {
      const requestBody = {
        title: 'New Card',
        question: 'What is the answer?',
        answer: '42',
        difficulty: 0,
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid flashcard data');
      expect(flashcardService.createFlashcard).not.toHaveBeenCalled();
    });

    it('should reject flashcard with invalid difficulty (too high)', async () => {
      const requestBody = {
        title: 'New Card',
        question: 'What is the answer?',
        answer: '42',
        difficulty: 6,
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid flashcard data');
      expect(flashcardService.createFlashcard).not.toHaveBeenCalled();
    });

    it('should handle creation errors gracefully', async () => {
      vi.mocked(flashcardService.createFlashcard).mockRejectedValue(
        new Error('Database error')
      );

      const requestBody = {
        title: 'New Card',
        question: 'What is the answer?',
        answer: '42',
        difficulty: 3,
      };

      const request = new NextRequest('http://localhost:3000/api/flashcards', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create flashcard');
      expect(data.details).toBe('Database error');
    });
  });
});
