import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';

// POST /api/quizzes/[id]/attempts - Start a quiz attempt
export const POST = withRateLimit(
  requireAuth(async (_request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('POST /api/quizzes/[id]/attempts called for quiz:', id);

      const attempt = await quizService.startAttempt(user.id, id);

      console.log('Quiz attempt started successfully:', attempt.id);
      return NextResponse.json(attempt, { status: 201 });
    } catch (error) {
      console.error('Error starting quiz attempt:', error);

      if (error instanceof Error && error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to start quiz attempt',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);

// GET /api/quizzes/[id]/attempts - Get attempt history for a quiz
export const GET = withRateLimit(
  requireAuth(async (_request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('GET /api/quizzes/[id]/attempts called for quiz:', id);

      const attempts = await quizService.getAttemptHistory(user.id, id);

      console.log(`Found ${attempts.length} attempts for quiz`);
      return NextResponse.json(attempts);
    } catch (error) {
      console.error('Error fetching quiz attempts:', error);

      if (error instanceof Error && error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch quiz attempt history',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);
