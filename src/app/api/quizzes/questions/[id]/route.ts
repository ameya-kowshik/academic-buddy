import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';
import { updateQuestionSchema } from '@/schemas/quiz.schema';

// PUT /api/quizzes/questions/[id] - Update a quiz question
export const PUT = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('PUT /api/quizzes/questions/[id] called for question:', id);

      const body = await request.json();

      // Validate request body
      const validatedData = updateQuestionSchema.parse(body);

      // Update question
      const question = await quizService.updateQuestion(user.id, id, validatedData);

      console.log('Question updated successfully:', question.id);
      return NextResponse.json(question);
    } catch (error) {
      console.error('Error updating question:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid question data', details: error.message },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'Question not found') {
        return NextResponse.json(
          { error: 'Question not found' },
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
          error: 'Failed to update question',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);

// DELETE /api/quizzes/questions/[id] - Delete a quiz question
export const DELETE = withRateLimit(
  requireAuth(async (_request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('DELETE /api/quizzes/questions/[id] called for question:', id);

      await quizService.deleteQuestion(user.id, id);

      console.log('Question deleted successfully:', id);
      return NextResponse.json({ message: 'Question deleted successfully' });
    } catch (error) {
      console.error('Error deleting question:', error);

      if (error instanceof Error && error.message === 'Question not found') {
        return NextResponse.json(
          { error: 'Question not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to delete question',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
