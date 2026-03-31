import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { analyticsService } from '@/lib/services/analytics.service';

/**
 * GET /api/analytics/weak-areas
 * Get identified weak areas based on quiz performance
 */
export const GET = withRateLimit(
  requireAuth(async (_request: NextRequest, _context, user: User) => {
    try {
      console.log('GET /api/analytics/weak-areas called for user:', user.id);

      const weakAreas = await analyticsService.identifyWeakAreas(user.id);

      return NextResponse.json({ weakAreas });
    } catch (error) {
      console.error('Error identifying weak areas:', error);
      return NextResponse.json(
        {
          error: 'Failed to identify weak areas',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);
