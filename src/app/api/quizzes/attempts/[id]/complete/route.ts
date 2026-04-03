import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';

// POST /api/quizzes/attempts/[id]/complete - Complete a quiz attempt
export const POST = withRateLimit(
  requireAuth(async (_request: NextRequest, context, _user: User) => {
    try {
      const { id: attemptId } = await context.params as unknown as { id: string };
      const attempt = await quizService.completeAttempt(attemptId);
      return NextResponse.json(attempt);
    } catch (error) {
      console.error('Error completing quiz attempt:', error);
      if (error instanceof Error && error.message === 'Quiz attempt not found') {
        return NextResponse.json({ error: 'Quiz attempt not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to complete quiz attempt', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }),
  'write'
);
