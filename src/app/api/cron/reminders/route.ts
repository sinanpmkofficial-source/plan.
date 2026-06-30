import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getWebPush } from '@/lib/web-push-server';

/**
 * GET: reminder dispatcher, meant to be hit by an external scheduler (Vercel
 * Cron, cron-job.org, etc.) roughly every minute. Protected by CRON_SECRET,
 * passed as `?secret=...` or `Authorization: Bearer ...`.
 *
 * For each subscription it computes the device-local time and, if the daily
 * review time has just passed and a reminder hasn't been sent today, pushes
 * a nudge. `lastSentDate` makes it idempotent regardless of cron cadence.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const secret =
      url.searchParams.get('secret') ||
      request.headers.get('authorization')?.replace('Bearer ', '');

    if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();
    const subs = await db
      .collection('push_subscriptions')
      .find({ enabled: true, dailyReviewTime: { $ne: null } })
      .toArray();

    const webpush = getWebPush();
    const now = Date.now();
    const pad = (n: number) => String(n).padStart(2, '0');

    let sent = 0;
    for (const s of subs) {
      const local = new Date(now - (s.tzOffset || 0) * 60000);
      const nowMin = local.getUTCHours() * 60 + local.getUTCMinutes();
      const [rh, rm] = String(s.dailyReviewTime).split(':').map(Number);
      const remMin = rh * 60 + rm;
      const localDate = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}`;

      if (s.lastSentDate === localDate) continue;
      // Fire only within a 3h window after the target time (avoids a late catch-up).
      if (nowMin < remMin || nowMin - remMin > 180) continue;

      const payload = JSON.stringify({
        title: 'Plan — daily review',
        body: 'Tick off what you finished and set up tomorrow.',
        url: '/',
        tag: 'plan-daily-review',
      });

      try {
        await webpush.sendNotification(s.subscription, payload);
        await db
          .collection('push_subscriptions')
          .updateOne({ endpoint: s.endpoint }, { $set: { lastSentDate: localDate } });
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.collection('push_subscriptions').deleteOne({ endpoint: s.endpoint });
        }
      }
    }

    return NextResponse.json({ success: true, checked: subs.length, sent });
  } catch (error: any) {
    console.error('API cron/reminders error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
