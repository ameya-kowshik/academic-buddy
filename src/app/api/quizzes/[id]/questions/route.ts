import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';
import { createQuestionSchema } from '@/schemas/quiz.schema';

// POST /api/quizzes/[id]/questions - Add a question to a quiz
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id: quizId } = await context.params;
      console.log('POST /api/quizzes/[id]/questions called for quiz:', quizId);

      const body = await request.json();

      // Validate request body
      const validatedData = createQuestionSchema.parse(body);

      // Add question to quiz
      const question = await quizService.addQuestion(user.id, quizId, validatedData);

      console.log('Question added successfully:', question.id);
      return NextResponse.json(question, { status: 201 });
    } catch (error) {
      console.error('Error adding question:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid question data', details: error.message },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      if (error instanceof Error && (
        error.message.includes('options') ||
        error.message.includes('correct answer')
      )) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to add question',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
