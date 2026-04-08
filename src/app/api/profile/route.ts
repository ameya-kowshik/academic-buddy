import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';

// GET /api/profile — returns emailNotificationsEnabled preference
export const GET = withRateLimit(requireAuth(async (_request: NextRequest, _context, user: User) => {
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailNotificationsEnabled: true },
  });

  return NextResponse.json({
    emailNotificationsEnabled: dbUser?.emailNotificationsEnabled ?? false,
  });
}), 'read');

// PATCH /api/profile — update emailNotificationsEnabled
export const PATCH = withRateLimit(requireAuth(async (request: NextRequest, _context, user: User) => {
  const body = await request.json().catch(() => ({}));

  if (typeof body.emailNotificationsEnabled !== 'boolean') {
    return NextResponse.json(
      { error: 'emailNotificationsEnabled must be a boolean' },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailNotificationsEnabled: body.emailNotificationsEnabled },
  });

  return NextResponse.json({ ok: true, emailNotificationsEnabled: body.emailNotificationsEnabled });
}), 'write');
