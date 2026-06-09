import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

// GET: Load all planner data
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();

    const brainDumpItems = await db.collection('brain_dump').find({}).toArray();
    const goalsItems = await db.collection('goals').find({}).toArray();
    const dailyPlansArray = await db.collection('daily_plans').find({}).toArray();
    const weeklyPlansArray = await db.collection('weekly_plans').find({}).toArray();
    const monthlyPlansArray = await db.collection('monthly_plans').find({}).toArray();

    // Map daily plans array to record indexed by date
    const dailyPlans: Record<string, any> = {};
    dailyPlansArray.forEach((plan) => {
      // Remove mongodb specific _id
      const { _id, ...rest } = plan;
      dailyPlans[plan.date] = rest;
    });

    // Map weekly plans array to record indexed by weekId
    const weeklyPlans: Record<string, any> = {};
    weeklyPlansArray.forEach((plan) => {
      const { _id, ...rest } = plan;
      weeklyPlans[plan.weekId] = rest;
    });

    // Map monthly plans array to record indexed by monthId
    const monthlyPlans: Record<string, any> = {};
    monthlyPlansArray.forEach((plan) => {
      const { _id, ...rest } = plan;
      monthlyPlans[plan.monthId] = rest;
    });

    // Remove mongodb specific _id from arrays
    const brainDump = brainDumpItems.map(({ _id, ...rest }) => rest);
    const goals = goalsItems.map(({ _id, ...rest }) => rest);

    return NextResponse.json({
      brainDump,
      goals,
      dailyPlans,
      weeklyPlans,
      monthlyPlans,
    });
  } catch (error: any) {
    console.error('API GET sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Upsert modified planner data and process deletions
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const client = await clientPromise;
    const db = client.db();

    const {
      brainDump = [],
      goals = [],
      dailyPlans = [],
      weeklyPlans = [],
      monthlyPlans = [],
      deletedBrainDump = [],
      deletedGoals = [],
    } = payload;

    // 1. Process Upserts
    if (brainDump.length > 0) {
      for (const item of brainDump) {
        await db.collection('brain_dump').updateOne(
          { id: item.id },
          { $set: item },
          { upsert: true }
        );
      }
    }

    if (goals.length > 0) {
      for (const goal of goals) {
        await db.collection('goals').updateOne(
          { id: goal.id },
          { $set: goal },
          { upsert: true }
        );
      }
    }

    if (dailyPlans.length > 0) {
      for (const plan of dailyPlans) {
        await db.collection('daily_plans').updateOne(
          { date: plan.date },
          { $set: plan },
          { upsert: true }
        );
      }
    }

    if (weeklyPlans.length > 0) {
      for (const plan of weeklyPlans) {
        await db.collection('weekly_plans').updateOne(
          { weekId: plan.weekId },
          { $set: plan },
          { upsert: true }
        );
      }
    }

    if (monthlyPlans.length > 0) {
      for (const plan of monthlyPlans) {
        await db.collection('monthly_plans').updateOne(
          { monthId: plan.monthId },
          { $set: plan },
          { upsert: true }
        );
      }
    }

    // 2. Process Deletions
    if (deletedBrainDump.length > 0) {
      await db.collection('brain_dump').deleteMany({ id: { $in: deletedBrainDump } });
    }

    if (deletedGoals.length > 0) {
      await db.collection('goals').deleteMany({ id: { $in: deletedGoals } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API POST sync error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
