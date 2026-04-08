import { NextRequest, NextResponse } from 'next/server';
import { scheduledTriggerService } from '@/lib/agents';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-cron-secret');
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

  // Await the call so the trigger service completes before the response is sent.
  // This is safe on both Vercel (serverless) and Render (persistent) because
  // the service only publishes events — agents run fire-and-forget internally.
  const result =
    type === 'weekly'
      ? await scheduledTriggerService.runWeekly()
      : await scheduledTriggerService.runMonthly();

  console.log(`[ScheduledTrigger] ${type} trigger completed — ${result.userCount} users at ${new Date().toISOString()}`);

  return NextResponse.json({ ok: true, triggered: type, userCount: result.userCount });
}
