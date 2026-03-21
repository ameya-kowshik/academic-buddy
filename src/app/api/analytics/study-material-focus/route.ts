import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { analyticsService } from '@/lib/services/analytics.service';

/**
 * GET /api/analytics/study-material-focus
 * Get aggregated focus time by study material (flashcard groupings and quizzes)
 */
export const GET = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const focusTime = await analyticsService.getStudyMaterialFocusTime(
        user.id,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );

      return NextResponse.json(focusTime);
    } catch (error) {
      console.error('Error fetching study material focus time:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch study material focus time',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);
