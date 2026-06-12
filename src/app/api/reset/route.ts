import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// DELETE: Wipe all planner data from MongoDB
export async function DELETE() {
  try {
    const client = await clientPromise;
    const db = client.db();

    await Promise.all([
      db.collection('brain_dump').deleteMany({}),
      db.collection('goals').deleteMany({}),
      db.collection('daily_plans').deleteMany({}),
      db.collection('weekly_plans').deleteMany({}),
      db.collection('monthly_plans').deleteMany({}),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE reset error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
