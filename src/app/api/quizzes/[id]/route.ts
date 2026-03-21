import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';
import { updateQuizSchema } from '@/schemas/quiz.schema';

// GET /api/quizzes/[id] - Get a specific quiz with questions
export const GET = withRateLimit(
  requireAuth(async (_request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('GET /api/quizzes/[id] called for quiz:', id);

      const quiz = await quizService.getQuiz(user.id, id);

      if (!quiz) {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(quiz);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch quiz',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);

// PUT /api/quizzes/[id] - Update a quiz
export const PUT = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('PUT /api/quizzes/[id] called for quiz:', id);

      const body = await request.json();

      // Validate request body
      const validatedData = updateQuizSchema.parse(body);

      // Update quiz
      const quiz = await quizService.updateQuiz(user.id, id, validatedData);

      console.log('Quiz updated successfully:', quiz.id);
      return NextResponse.json(quiz);
    } catch (error) {
      console.error('Error updating quiz:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid quiz data', details: error.message },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      if (error instanceof Error && error.message.includes('Difficulty')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to update quiz',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);

// DELETE /api/quizzes/[id] - Delete a quiz
export const DELETE = withRateLimit(
  requireAuth(async (_request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('DELETE /api/quizzes/[id] called for quiz:', id);

      await quizService.deleteQuiz(user.id, id);

      console.log('Quiz deleted successfully:', id);
      return NextResponse.json({ message: 'Quiz deleted successfully' });
    } catch (error) {
      console.error('Error deleting quiz:', error);

      if (error instanceof Error && error.message === 'Quiz not found') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to delete quiz',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
