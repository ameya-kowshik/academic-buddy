import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { analyticsService } from '@/lib/services/analytics.service';

/**
 * GET /api/analytics/study
 * Get study analytics for a date range
 * Query params: startDate (ISO string), endDate (ISO string)
 */
export const GET = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');

      // Validate date parameters
      if (!startDateParam || !endDateParam) {
        return NextResponse.json(
          { error: 'startDate and endDate query parameters are required' },
          { status: 400 }
        );
      }

      const startDate = new Date(startDateParam);
      const endDate = new Date(endDateParam);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)' },
          { status: 400 }
        );
      }

      if (startDate > endDate) {
        return NextResponse.json(
          { error: 'startDate must be before or equal to endDate' },
          { status: 400 }
        );
      }

      console.log('GET /api/analytics/study called for user:', user.id);

      const analytics = await analyticsService.getStudyAnalytics(user.id, startDate, endDate);

      return NextResponse.json(analytics);
    } catch (error) {
      console.error('Error fetching study analytics:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch study analytics',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);
