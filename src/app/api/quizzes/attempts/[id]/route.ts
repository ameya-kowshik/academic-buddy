import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';

// GET /api/quizzes/attempts/[id] - Get a single attempt with full review data
export const GET = withRateLimit(
  requireAuth(async (_request: NextRequest, context, user: User) => {
    try {
      const { id: attemptId } = await context.params;

      const attempt = await quizService.getAttemptWithReview(user.id, attemptId);

      if (!attempt) {
        return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
      }

      return NextResponse.json(attempt);
    } catch (error) {
      console.error('Error fetching quiz attempt:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attempt', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }),
  'read'
);
