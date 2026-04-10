import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';
import { z } from 'zod';

// Schema for submitting an answer
const submitAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  answer: z.string().min(1, 'Answer is required'),
});

// POST /api/quizzes/attempts/[id]/answers - Submit an answer for a quiz question
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id: attemptId } = await context.params;
      console.log('POST /api/quizzes/attempts/[id]/answers called for attempt:', attemptId);

      const body = await request.json();

      // Validate request body
      const validatedData = submitAnswerSchema.parse(body);

      // Submit answer
      const questionAttempt = await quizService.submitAnswer(
        user.id,
        attemptId,
        validatedData.questionId,
        validatedData.answer
      );

      console.log('Answer submitted successfully:', questionAttempt.id);
      return NextResponse.json(questionAttempt, { status: 201 });
    } catch (error) {
      console.error('Error submitting answer:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid answer data', details: error.message },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'Quiz attempt not found') {
        return NextResponse.json(
          { error: 'Quiz attempt not found' },
          { status: 404 }
        );
      }

      if (error instanceof Error && error.message === 'Question not found') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to submit answer',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
