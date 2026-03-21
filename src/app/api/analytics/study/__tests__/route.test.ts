import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { analyticsService } from '@/lib/services/analytics.service';

// Mock the analytics service
vi.mock('@/lib/services/analytics.service', () => ({
  analyticsService: {
    getStudyAnalytics: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Analytics Study API Routes', () => {
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

  describe('GET /api/analytics/study', () => {
    it('should return study analytics for valid date range', async () => {
      const mockAnalytics = {
        flashcardsReviewed: 25,
        quizzesCompleted: 5,
        averageQuizScore: 82.5,
        totalStudyTime: 120,
        dailyBreakdown: [
          {
            date: new Date('2024-01-15'),
            flashcardsReviewed: 10,
            quizzesCompleted: 2,
          },
          {
            date: new Date('2024-01-16'),
            flashcardsReviewed: 15,
            quizzesCompleted: 3,
          },
        ],
      };

      vi.mocked(analyticsService.getStudyAnalytics).mockResolvedValue(mockAnalytics);

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=2024-01-15&endDate=2024-01-16'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcardsReviewed).toBe(25);
      expect(data.quizzesCompleted).toBe(5);
      expect(data.averageQuizScore).toBe(82.5);
      expect(data.totalStudyTime).toBe(120);
      expect(data.dailyBreakdown).toHaveLength(2);
      expect(analyticsService.getStudyAnalytics).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should return empty analytics when no data exists', async () => {
      const mockAnalytics = {
        flashcardsReviewed: 0,
        quizzesCompleted: 0,
        averageQuizScore: 0,
        totalStudyTime: 0,
        dailyBreakdown: [],
      };

      vi.mocked(analyticsService.getStudyAnalytics).mockResolvedValue(mockAnalytics);

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcardsReviewed).toBe(0);
      expect(data.quizzesCompleted).toBe(0);
      expect(data.averageQuizScore).toBe(0);
      expect(data.totalStudyTime).toBe(0);
      expect(data.dailyBreakdown).toEqual([]);
    });

    it('should reject request without startDate parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?endDate=2024-01-31'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('startDate and endDate query parameters are required');
      expect(analyticsService.getStudyAnalytics).not.toHaveBeenCalled();
    });

    it('should reject request without endDate parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=2024-01-01'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('startDate and endDate query parameters are required');
      expect(analyticsService.getStudyAnalytics).not.toHaveBeenCalled();
    });

    it('should reject request with invalid startDate format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=invalid-date&endDate=2024-01-31'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
      expect(analyticsService.getStudyAnalytics).not.toHaveBeenCalled();
    });

    it('should reject request with invalid endDate format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=2024-01-01&endDate=invalid-date'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid date format. Use ISO 8601 format (YYYY-MM-DD)');
      expect(analyticsService.getStudyAnalytics).not.toHaveBeenCalled();
    });

    it('should reject request where startDate is after endDate', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=2024-01-31&endDate=2024-01-01'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('startDate must be before or equal to endDate');
      expect(analyticsService.getStudyAnalytics).not.toHaveBeenCalled();
    });

    it('should handle single day date range', async () => {
      const mockAnalytics = {
        flashcardsReviewed: 10,
        quizzesCompleted: 2,
        averageQuizScore: 85,
        totalStudyTime: 30,
        dailyBreakdown: [
          {
            date: new Date('2024-01-15'),
            flashcardsReviewed: 10,
            quizzesCompleted: 2,
          },
        ],
      };

      vi.mocked(analyticsService.getStudyAnalytics).mockResolvedValue(mockAnalytics);

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=2024-01-15&endDate=2024-01-15'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.flashcardsReviewed).toBe(10);
      expect(data.dailyBreakdown).toHaveLength(1);
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(analyticsService.getStudyAnalytics).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/study?startDate=2024-01-01&endDate=2024-01-31'
      );
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch study analytics');
      expect(data.details).toBe('Database error');
    });
  });
});
