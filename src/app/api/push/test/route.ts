import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { getWebPush } from '@/lib/web-push-server';

// POST: send a test notification to every stored subscription.
export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const subs = await db.collection('push_subscriptions').find({}).toArray();

    const webpush = getWebPush();
    const payload = JSON.stringify({
      title: 'Plan',
      body: 'Test notification — your reminders are working ✅',
      url: '/',
      tag: 'plan-test',
    });

    let sent = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(s.subscription, payload);
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.collection('push_subscriptions').deleteOne({ endpoint: s.endpoint });
        }
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error: any) {
    console.error('API push/test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
