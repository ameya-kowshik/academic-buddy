import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { outputStorageService } from '@/lib/agents';

// GET /api/agents/outputs/[id]
export const GET = requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    const { id } = await context.params;
    const output = await outputStorageService.getOutputById(id, user.id);

    if (!output) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    return NextResponse.json({ output });
  } catch (error) {
    console.error('Error fetching agent output:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent output' },
      { status: 500 }
    );
  }
});
