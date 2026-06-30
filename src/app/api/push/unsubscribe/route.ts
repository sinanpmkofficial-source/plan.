import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// POST: remove a push subscription by endpoint.
export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    await db.collection('push_subscriptions').deleteOne({ endpoint });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API push/unsubscribe error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
