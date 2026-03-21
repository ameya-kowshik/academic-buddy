import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { flashcardService } from '@/lib/services/flashcard.service';
import { createFlashcardSchema, flashcardFiltersSchema } from '@/schemas/flashcard.schema';

// GET /api/flashcards - List flashcards with optional filters
export const GET = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      console.log('GET /api/flashcards called for user:', user.id);

      // Parse query parameters for filters
      const { searchParams } = new URL(request.url);
      const filters = {
        grouping: searchParams.get('grouping') || undefined,
        difficulty: searchParams.get('difficulty') || undefined,
        sourceMaterialId: searchParams.get('sourceMaterialId') || undefined,
        tags: searchParams.get('tags') || undefined,
      };

      // Validate filters
      const validatedFilters = flashcardFiltersSchema.parse(filters);

      // Convert comma-separated tags string to array
      const processedFilters = {
        ...validatedFilters,
        tags: validatedFilters.tags ? validatedFilters.tags.split(',').map(t => t.trim()) : undefined,
      };

      const flashcards = await flashcardService.listFlashcards(user.id, processedFilters);

      console.log(`Found ${flashcards.length} flashcards for user`);
      return NextResponse.json({ flashcards });
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid filter parameters', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch flashcards',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);

// POST /api/flashcards - Create a flashcard
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      console.log('POST /api/flashcards called for user:', user.id);

      const body = await request.json();

      // Validate request body
      const validatedData = createFlashcardSchema.parse(body);

      // Create flashcard
      const flashcard = await flashcardService.createFlashcard(user.id, validatedData);

      console.log('Flashcard created successfully:', flashcard.id);
      return NextResponse.json(flashcard, { status: 201 });
    } catch (error) {
      console.error('Error creating flashcard:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid flashcard data', details: error.message },
          { status: 400 }
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
          error: 'Failed to create flashcard',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
