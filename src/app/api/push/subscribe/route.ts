import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST: store/refresh a push subscription and its reminder preferences.
export async function POST(request: Request) {
  try {
    const { subscription, dailyReviewTime, tzOffset } = await request.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Missing subscription endpoint' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    await db.collection('push_subscriptions').updateOne(
      { endpoint: subscription.endpoint },
      {
        $set: {
          endpoint: subscription.endpoint,
          subscription,
          dailyReviewTime: dailyReviewTime || null,
          tzOffset: typeof tzOffset === 'number' ? tzOffset : 0,
          enabled: true,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API push/subscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
