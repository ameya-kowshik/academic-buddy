import { NextRequest, NextResponse } from 'next/server';
import { scheduledTriggerService } from '@/lib/agents';
import { waitUntil } from '@vercel/functions';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Accept secret from x-cron-secret header OR ?secret= query param
  // (Vercel crons cannot send custom headers, so the query param fallback is required)
  const headerSecret = req.headers.get('x-cron-secret');
  const querySecret = req.nextUrl.searchParams.get('secret');
  const secret = headerSecret ?? querySecret;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type } = body;
  if (type !== 'weekly' && type !== 'monthly') {
    return NextResponse.json({ error: 'type must be "weekly" or "monthly"' }, { status: 400 });
  }

  const resultPromise =
    type === 'weekly'
      ? scheduledTriggerService.runWeekly()
      : scheduledTriggerService.runMonthly();

  // waitUntil keeps the Vercel function alive until all per-user events are published
  waitUntil(resultPromise);
  const result = await resultPromise;

  console.log(`[ScheduledTrigger] ${type} trigger completed — ${result.userCount} users at ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true, triggered: type, userCount: result.userCount });
}
