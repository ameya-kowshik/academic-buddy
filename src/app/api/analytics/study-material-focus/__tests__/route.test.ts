import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { analyticsService } from '@/lib/services/analytics.service';

// Mock the middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

// Mock the analytics service
vi.mock('@/lib/services/analytics.service', () => ({
  analyticsService: {
    getStudyMaterialFocusTime: vi.fn(),
  },
}));

describe('GET /api/analytics/study-material-focus', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return aggregated focus time by study material', async () => {
    const mockFocusTime = {
      flashcardGroupings: {
        'Biology Chapter 1': 55,
        'Math Formulas': 20,
      },
      quizzes: {
        'quiz-1': {
          quizId: 'quiz-1',
          title: 'Biology Quiz',
          totalMinutes: 30,
        },
      },
    };

    vi.mocked(analyticsService.getStudyMaterialFocusTime).mockResolvedValue(mockFocusTime);

    const request = new NextRequest('http://localhost:3000/api/analytics/study-material-focus');
    const response = await GET(request, {}, mockUser as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockFocusTime);
    expect(analyticsService.getStudyMaterialFocusTime).toHaveBeenCalledWith(
      mockUser.id,
      undefined,
      undefined
    );
  });

  it('should filter by date range when provided', async () => {
    const mockFocusTime = {
      flashcardGroupings: {
        'Biology Chapter 1': 25,
      },
      quizzes: {},
    };

    vi.mocked(analyticsService.getStudyMaterialFocusTime).mockResolvedValue(mockFocusTime);

    const startDate = '2024-01-01';
    const endDate = '2024-01-31';
    const request = new NextRequest(
      `http://localhost:3000/api/analytics/study-material-focus?startDate=${startDate}&endDate=${endDate}`
    );
    const response = await GET(request, {}, mockUser as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockFocusTime);
    expect(analyticsService.getStudyMaterialFocusTime).toHaveBeenCalledWith(
      mockUser.id,
      new Date(startDate),
      new Date(endDate)
    );
  });

  it('should return empty results when no study material sessions exist', async () => {
    const mockFocusTime = {
      flashcardGroupings: {},
      quizzes: {},
    };

    vi.mocked(analyticsService.getStudyMaterialFocusTime).mockResolvedValue(mockFocusTime);

    const request = new NextRequest('http://localhost:3000/api/analytics/study-material-focus');
    const response = await GET(request, {}, mockUser as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockFocusTime);
  });

  it('should handle errors gracefully', async () => {
    vi.mocked(analyticsService.getStudyMaterialFocusTime).mockRejectedValue(
      new Error('Database error')
    );

    const request = new NextRequest('http://localhost:3000/api/analytics/study-material-focus');
    const response = await GET(request, {}, mockUser as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch study material focus time');
    expect(data.details).toBe('Database error');
  });

  it('should only filter by start date when end date is not provided', async () => {
    const mockFocusTime = {
      flashcardGroupings: {
        'Physics': 40,
      },
      quizzes: {},
    };

    vi.mocked(analyticsService.getStudyMaterialFocusTime).mockResolvedValue(mockFocusTime);

    const startDate = '2024-01-01';
    const request = new NextRequest(
      `http://localhost:3000/api/analytics/study-material-focus?startDate=${startDate}`
    );
    const response = await GET(request, {}, mockUser as any);

    expect(response.status).toBe(200);
    expect(analyticsService.getStudyMaterialFocusTime).toHaveBeenCalledWith(
      mockUser.id,
      new Date(startDate),
      undefined
    );
  });

  it('should only filter by end date when start date is not provided', async () => {
    const mockFocusTime = {
      flashcardGroupings: {},
      quizzes: {
        'quiz-2': {
          quizId: 'quiz-2',
          title: 'Chemistry Quiz',
          totalMinutes: 50,
        },
      },
    };

    vi.mocked(analyticsService.getStudyMaterialFocusTime).mockResolvedValue(mockFocusTime);

    const endDate = '2024-01-31';
    const request = new NextRequest(
      `http://localhost:3000/api/analytics/study-material-focus?endDate=${endDate}`
    );
    const response = await GET(request, {}, mockUser as any);

    expect(response.status).toBe(200);
    expect(analyticsService.getStudyMaterialFocusTime).toHaveBeenCalledWith(
      mockUser.id,
      undefined,
      new Date(endDate)
    );
  });
});
