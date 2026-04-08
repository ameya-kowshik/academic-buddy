import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { outputStorageService } from '@/lib/agents';

// PATCH /api/agents/outputs/[id]/interact
export const PATCH = requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { type } = body as { type: 'viewed' | 'dismissed' };

    if (type !== 'viewed' && type !== 'dismissed') {
      return NextResponse.json(
        { error: 'type must be "viewed" or "dismissed"' },
        { status: 400 }
      );
    }

    // Verify the output belongs to this user before updating
    const output = await outputStorageService.getOutputById(id, user.id);
    if (!output) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    await outputStorageService.markInteraction(id, user.id, type);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error updating agent output interaction:', error);
    return NextResponse.json(
      { error: 'Failed to update interaction' },
      { status: 500 }
    );
  }
});
