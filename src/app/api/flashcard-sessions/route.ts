import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';

// POST /api/flashcard-sessions - Record a completed flashcard review session
export const POST = withRateLimit(requireAuth(async (request: NextRequest, _context: unknown, user: User) => {
  try {
    const body = await request.json();
    const { grouping, cardCount, sessionStartedAt, sessionCompletedAt } = body;

    const session = await prisma.flashcardSession.create({
      data: {
        userId: user.id,
        grouping: grouping ?? null,
        cardCount: cardCount ?? 0,
        sessionStartedAt: new Date(sessionStartedAt),
        sessionCompletedAt: sessionCompletedAt ? new Date(sessionCompletedAt) : null,
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
