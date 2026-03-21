import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { aiService } from '@/lib/services/ai.service';
import { prisma } from '@/lib/prisma';

// POST /api/ai/analyze-weak-areas - Analyze weak areas from quiz attempts
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, _context, user: User) => {
    try {
      console.log('POST /api/ai/analyze-weak-areas called for user:', user.id);

      // Fetch all quiz attempts for the user with quiz metadata
      const attempts = await prisma.quizAttempt.findMany({
        where: {
          quiz: {
            userId: user.id,
          },
        },
        include: {
          quiz: {
            select: {
              grouping: true,
              difficulty: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (attempts.length === 0) {
        return NextResponse.json(
          { error: 'No quiz attempts found. Complete some quizzes first.' },
          { status: 400 }
        );
      }

      // Analyze weak areas using AI
      const analysis = await aiService.analyzeWeakAreas(attempts);

      console.log(`Analyzed ${attempts.length} quiz attempts for weak areas`);
      return NextResponse.json({ analysis, attemptCount: attempts.length }, { status: 200 });
    } catch (error) {
      console.error('Error analyzing weak areas:', error);

      if (error instanceof Error && error.message.includes('AI service is not configured')) {
        return NextResponse.json(
          { error: 'AI service is not available. Please contact administrator.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to analyze weak areas',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);
