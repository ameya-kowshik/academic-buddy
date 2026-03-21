import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { analyticsService } from '@/lib/services/analytics.service';

// Mock the analytics service
vi.mock('@/lib/services/analytics.service', () => ({
  analyticsService: {
    identifyWeakAreas: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Analytics Weak Areas API Routes', () => {
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

  describe('GET /api/analytics/weak-areas', () => {
    it('should return identified weak areas', async () => {
      const mockWeakAreas = [
        {
          type: 'difficulty' as const,
          identifier: 3,
          averageScore: 62.5,
          attemptCount: 4,
          recommendations: [
            'Review flashcards with difficulty level 3',
            'Practice more quizzes at difficulty level 3',
            'Focus on understanding concepts at this difficulty level',
          ],
        },
        {
          type: 'grouping' as const,
          identifier: 'Math',
          averageScore: 65.0,
          attemptCount: 6,
          recommendations: [
            'Review flashcards in the "Math" grouping',
            'Retake quizzes in the "Math" grouping',
            'Spend more time studying "Math" materials',
          ],
        },
      ];

      vi.mocked(analyticsService.identifyWeakAreas).mockResolvedValue(mockWeakAreas);

      const request = new NextRequest('http://localhost:3000/api/analytics/weak-areas');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(2);
      expect(data[0].type).toBe('difficulty');
      expect(data[0].identifier).toBe(3);
      expect(data[0].averageScore).toBe(62.5);
      expect(data[0].attemptCount).toBe(4);
      expect(data[0].recommendations).toHaveLength(3);
      expect(data[1].type).toBe('grouping');
      expect(data[1].identifier).toBe('Math');
      expect(analyticsService.identifyWeakAreas).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return empty array when no weak areas exist', async () => {
      vi.mocked(analyticsService.identifyWeakAreas).mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/analytics/weak-areas');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
      expect(analyticsService.identifyWeakAreas).toHaveBeenCalledWith(mockUser.id);
    });

    it('should return weak difficulty areas only', async () => {
      const mockWeakAreas = [
        {
          type: 'difficulty' as const,
          identifier: 5,
          averageScore: 55.0,
          attemptCount: 3,
          recommendations: [
            'Review flashcards with difficulty level 5',
            'Practice more quizzes at difficulty level 5',
            'Focus on understanding concepts at this difficulty level',
          ],
        },
      ];

      vi.mocked(analyticsService.identifyWeakAreas).mockResolvedValue(mockWeakAreas);

      const request = new NextRequest('http://localhost:3000/api/analytics/weak-areas');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].type).toBe('difficulty');
      expect(data[0].identifier).toBe(5);
    });

    it('should return weak grouping areas only', async () => {
      const mockWeakAreas = [
        {
          type: 'grouping' as const,
          identifier: 'Science',
          averageScore: 68.0,
          attemptCount: 5,
          recommendations: [
            'Review flashcards in the "Science" grouping',
            'Retake quizzes in the "Science" grouping',
            'Spend more time studying "Science" materials',
          ],
        },
      ];

      vi.mocked(analyticsService.identifyWeakAreas).mockResolvedValue(mockWeakAreas);

      const request = new NextRequest('http://localhost:3000/api/analytics/weak-areas');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].type).toBe('grouping');
      expect(data[0].identifier).toBe('Science');
    });

    it('should return multiple weak areas of different types', async () => {
      const mockWeakAreas = [
        {
          type: 'difficulty' as const,
          identifier: 3,
          averageScore: 60.0,
          attemptCount: 2,
          recommendations: [
            'Review flashcards with difficulty level 3',
            'Practice more quizzes at difficulty level 3',
            'Focus on understanding concepts at this difficulty level',
          ],
        },
        {
          type: 'difficulty' as const,
          identifier: 5,
          averageScore: 55.0,
          attemptCount: 3,
          recommendations: [
            'Review flashcards with difficulty level 5',
            'Practice more quizzes at difficulty level 5',
            'Focus on understanding concepts at this difficulty level',
          ],
        },
        {
          type: 'grouping' as const,
          identifier: 'Math',
          averageScore: 65.0,
          attemptCount: 4,
          recommendations: [
            'Review flashcards in the "Math" grouping',
            'Retake quizzes in the "Math" grouping',
            'Spend more time studying "Math" materials',
          ],
        },
      ];

      vi.mocked(analyticsService.identifyWeakAreas).mockResolvedValue(mockWeakAreas);

      const request = new NextRequest('http://localhost:3000/api/analytics/weak-areas');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      const difficultyAreas = data.filter((area: any) => area.type === 'difficulty');
      const groupingAreas = data.filter((area: any) => area.type === 'grouping');
      expect(difficultyAreas).toHaveLength(2);
      expect(groupingAreas).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(analyticsService.identifyWeakAreas).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/analytics/weak-areas');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to identify weak areas');
      expect(data.details).toBe('Database error');
    });

    it('should include recommendations for each weak area', async () => {
      const mockWeakAreas = [
        {
          type: 'difficulty' as const,
          identifier: 4,
          averageScore: 69.0,
          attemptCount: 2,
          recommendations: [
            'Review flashcards with difficulty level 4',
            'Practice more quizzes at difficulty level 4',
            'Focus on understanding concepts at this difficulty level',
          ],
        },
      ];

      vi.mocked(analyticsService.identifyWeakAreas).mockResolvedValue(mockWeakAreas);

      const request = new NextRequest('http://localhost:3000/api/analytics/weak-areas');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data[0].recommendations).toBeDefined();
      expect(data[0].recommendations).toHaveLength(3);
      expect(data[0].recommendations[0]).toContain('Review flashcards');
    });
  });
});
