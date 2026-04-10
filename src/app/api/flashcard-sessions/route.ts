import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { z } from 'zod';

const flashcardSessionSchema = z.object({
  grouping: z.string().optional().nullable(),
  cardCount: z.number().int().min(0).optional().default(0),
  sessionStartedAt: z.string().datetime({ message: 'sessionStartedAt must be a valid ISO datetime' }),
  sessionCompletedAt: z.string().datetime().optional().nullable(),
});

// POST /api/flashcard-sessions - Record a completed flashcard review session
export const POST = withRateLimit(requireAuth(async (request: NextRequest, _context: unknown, user: User) => {
  try {
    const body = await request.json();

    const parsed = flashcardSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid session data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { grouping, cardCount, sessionStartedAt, sessionCompletedAt } = parsed.data;

    const startDate = new Date(sessionStartedAt);
    const endDate = sessionCompletedAt ? new Date(sessionCompletedAt) : null;
    const durationSeconds = endDate
      ? Math.round((endDate.getTime() - startDate.getTime()) / 1000)
      : null;

    const session = await prisma.flashcardSession.create({
      data: {
        userId: user.id,
        grouping: grouping ?? null,
        cardCount: cardCount ?? 0,
        durationSeconds,
        sessionStartedAt: startDate,
        sessionCompletedAt: endDate,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating flashcard session:', error);
    return NextResponse.json(
      { error: 'Failed to create flashcard session' },
      { status: 500 }
    );
  }
}), 'write');
