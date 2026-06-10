import { DailyPlan, WeeklyPlan, MonthlyPlan } from '@/types/planner';

/**
 * Calculate Daily Performance Score (0 - 100)
 */
export function calculateDailyScore(plan: DailyPlan): number {
  // 1. Prayer Tracker (50%): 10 points per prayer checked
  const prayers = plan.prayers || { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
  const prayersCount = Object.values(prayers).filter(Boolean).length;
  const prayerScore = prayersCount * 10;

  // 2. Bullet Journal Tasks (50%): Completion rate of bullet-journal action items
  let bulletScore = 50;
  const bulletTasks = (plan.bulletNotes || []).filter((n) => n.type === 'task');
  if (bulletTasks.length > 0) {
    const completedBullets = bulletTasks.filter((t) => t.completed).length;
    bulletScore = Math.round((completedBullets / bulletTasks.length) * 50);
  }

  return prayerScore + bulletScore;
}

/**
 * Plan Factory/Getter Helpers
 */

export const getOrCreateDailyPlanFn = (state: { dailyPlans: Record<string, DailyPlan> }, date: string): DailyPlan => {
  if (state.dailyPlans[date]) return state.dailyPlans[date];
  return {
    date,
    tasks: [],
    bulletNotes: [],
    prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    reflection: '',
    score: 0,
    updatedAt: new Date().toISOString(),
  };
};

export const getOrCreateWeeklyPlanFn = (state: { weeklyPlans: Record<string, WeeklyPlan> }, weekId: string): WeeklyPlan => {
  if (state.weeklyPlans[weekId]) {
    const plan = state.weeklyPlans[weekId];
    // Migration helper for older data formats
    if (!plan.bulletNotes) {
      plan.bulletNotes = (plan.tasks || []).map((t: any) => ({
        id: t.id,
        type: 'task',
        text: t.text,
        completed: t.completed,
      }));
    }
    return plan;
  }
  return {
    weekId,
    tasks: [],
    bulletNotes: [],
    reflection: '',
    updatedAt: new Date().toISOString(),
  };
};

export const getOrCreateMonthlyPlanFn = (state: { monthlyPlans: Record<string, MonthlyPlan> }, monthId: string): MonthlyPlan => {
  if (state.monthlyPlans[monthId]) {
    const plan = state.monthlyPlans[monthId];
    // Migration helper for older data formats
    if (!plan.bulletNotes) {
      plan.bulletNotes = (plan.tasks || []).map((t: any) => ({
        id: t.id,
        type: 'task',
        text: t.text,
        completed: t.completed,
      }));
    }
    return plan;
  }
  return {
    monthId,
    tasks: [],
    bulletNotes: [],
    reflection: '',
    updatedAt: new Date().toISOString(),
  };
};
