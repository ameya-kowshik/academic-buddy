import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { flashcardService } from '@/lib/services/flashcard.service';
import { updateFlashcardSchema } from '@/schemas/flashcard.schema';

// GET /api/flashcards/[id] - Get a specific flashcard
export const GET = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('GET /api/flashcards/[id] called for flashcard:', id);

      const flashcard = await flashcardService.getFlashcard(user.id, id);

      if (!flashcard) {
        return NextResponse.json(
          { error: 'Flashcard not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(flashcard);
    } catch (error) {
      console.error('Error fetching flashcard:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch flashcard',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);

// PUT /api/flashcards/[id] - Update a flashcard
export const PUT = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('PUT /api/flashcards/[id] called for flashcard:', id);

      const body = await request.json();

      // Validate request body
      const validatedData = updateFlashcardSchema.parse(body);

      // Update flashcard
      const flashcard = await flashcardService.updateFlashcard(user.id, id, validatedData);

      console.log('Flashcard updated successfully:', flashcard.id);
      return NextResponse.json(flashcard);
    } catch (error) {
      console.error('Error updating flashcard:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid flashcard data', details: error.message },
          { status: 400 }
        );
      }

      if (error instanceof Error && error.message === 'Flashcard not found') {
        return NextResponse.json(
          { error: 'Flashcard not found' },
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
          error: 'Failed to update flashcard',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);

// DELETE /api/flashcards/[id] - Delete a flashcard
export const DELETE = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('DELETE /api/flashcards/[id] called for flashcard:', id);

      await flashcardService.deleteFlashcard(user.id, id);

      console.log('Flashcard deleted successfully:', id);
      return NextResponse.json({ message: 'Flashcard deleted successfully' });
    } catch (error) {
      console.error('Error deleting flashcard:', error);

      if (error instanceof Error && error.message === 'Flashcard not found') {
        return NextResponse.json(
          { error: 'Flashcard not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to delete flashcard',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
