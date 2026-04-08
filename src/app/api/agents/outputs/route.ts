import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { outputStorageService } from '@/lib/agents';

// GET /api/agents/outputs?agentId=...&outputType=...&limit=10
export const GET = requireAuth(async (request: NextRequest, context, user: User) => {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId') ?? undefined;
    const outputType = searchParams.get('outputType') ?? undefined;
    const limit = parseInt(searchParams.get('limit') ?? '10', 10);

    const outputs = await outputStorageService.getOutputsByUser(user.id, { agentId, outputType, limit });

    return NextResponse.json({ outputs });
  } catch (error) {
    console.error('Error fetching agent outputs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent outputs' },
      { status: 500 }
    );
  }
});
