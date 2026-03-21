import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { flashcardService } from '@/lib/services/flashcard.service';

// POST /api/flashcards/[id]/review - Record a flashcard review
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      const { id } = await context.params;
      console.log('POST /api/flashcards/[id]/review called for flashcard:', id);

      // Record the review
      const flashcard = await flashcardService.recordReview(user.id, id);

      console.log('Flashcard review recorded successfully:', flashcard.id);
      return NextResponse.json(flashcard);
    } catch (error) {
      console.error('Error recording flashcard review:', error);

      if (error instanceof Error && error.message === 'Flashcard not found') {
        return NextResponse.json(
          { error: 'Flashcard not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to record flashcard review',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
