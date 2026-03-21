import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { quizService } from '@/lib/services/quiz.service';
import { createQuizSchema, quizFiltersSchema } from '@/schemas/quiz.schema';

// GET /api/quizzes - List quizzes with optional filters
export const GET = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      console.log('GET /api/quizzes called for user:', user.id);

      // Parse query parameters for filters
      const { searchParams } = new URL(request.url);
      const filters = {
        grouping: searchParams.get('grouping') || undefined,
        difficulty: searchParams.get('difficulty') || undefined,
        sourceMaterialId: searchParams.get('sourceMaterialId') || undefined,
        tags: searchParams.get('tags') || undefined,
      };

      // Validate filters
      const validatedFilters = quizFiltersSchema.parse(filters);

      // Convert comma-separated tags string to array
      const processedFilters = {
        ...validatedFilters,
        tags: validatedFilters.tags ? validatedFilters.tags.split(',').map(t => t.trim()) : undefined,
      };

      const quizzes = await quizService.listQuizzes(user.id, processedFilters);

      console.log(`Found ${quizzes.length} quizzes for user`);
      return NextResponse.json({ quizzes });
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid filter parameters', details: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to fetch quizzes',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);

// POST /api/quizzes - Create a quiz
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      console.log('POST /api/quizzes called for user:', user.id);

      const body = await request.json();

      // Validate request body
      const validatedData = createQuizSchema.parse(body);

      // Create quiz
      const quiz = await quizService.createQuiz(user.id, validatedData);

      console.log('Quiz created successfully:', quiz.id);
      return NextResponse.json(quiz, { status: 201 });
    } catch (error) {
      console.error('Error creating quiz:', error);

      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json(
          { error: 'Invalid quiz data', details: error.message },
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
          error: 'Failed to create quiz',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
