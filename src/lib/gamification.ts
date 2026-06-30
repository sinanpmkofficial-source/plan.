import { DailyPlan, GoalItem } from '@/types/planner';

/**
 * Lightweight gamification + progress engine.
 * All functions are pure and derive everything from existing planner data,
 * so there is no extra state to persist.
 */

const XP_PER_TASK = 10;
const XP_PER_GOAL_ACTION = 25;

const LEVEL_TITLES = [
  'Seedling',
  'Spark',
  'Builder',
  'Achiever',
  'Trailblazer',
  'Pathfinder',
  'Champion',
  'Master',
  'Legend',
];

/** Cumulative XP required to reach a given level (level 1 = 0 XP). */
export function levelFloor(level: number): number {
  return 50 * Math.pow(level - 1, 2);
}

/** Resolve a total XP amount to a level. */
export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(xp, 0) / 50)) + 1;
}

/** Shift a YYYY-MM-DD string by a number of days (UTC-based to match stored keys). */
export function shiftDay(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().split('T')[0];
}

function dayHasCompletedTask(plan?: DailyPlan): boolean {
  return !!plan && (plan.bulletNotes || []).some((n) => n.type === 'task' && n.completed);
}

export interface MomentumStats {
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progressToNext: number; // 0-100
  totalCompletedTasks: number;
  goalActionsCompleted: number;
  daysLogged: number;
  currentStreak: number;
  bestStreak: number;
  todayProgress: number; // 0-100 for the selected day
  todayCompleted: number;
  todayTotal: number;
}

export function computeMomentum(
  dailyPlans: Record<string, DailyPlan>,
  goals: GoalItem[],
  selectedDate: string
): MomentumStats {
  const plans = Object.values(dailyPlans);

  let totalCompletedTasks = 0;
  plans.forEach((p) => {
    (p.bulletNotes || []).forEach((n) => {
      if (n.type === 'task' && n.completed) totalCompletedTasks++;
    });
  });

  let goalActionsCompleted = 0;
  goals.forEach((g) => {
    g.milestones.forEach((m) => {
      (m.actionItems || []).forEach((a) => {
        if (a.completed) goalActionsCompleted++;
      });
    });
  });

  const xp = totalCompletedTasks * XP_PER_TASK + goalActionsCompleted * XP_PER_GOAL_ACTION;
  const level = xpToLevel(xp);
  const currentFloor = levelFloor(level);
  const nextFloor = levelFloor(level + 1);
  const xpIntoLevel = xp - currentFloor;
  const xpForNextLevel = nextFloor - currentFloor;
  const progressToNext = xpForNextLevel > 0 ? Math.round((xpIntoLevel / xpForNextLevel) * 100) : 0;
  const levelTitle = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];

  const daysLogged = plans.filter(
    (p) => (p.bulletNotes || []).length > 0 || (p.reflection || '').trim().length > 0
  ).length;

  // Current streak: consecutive days (ending today, or yesterday as grace) with a completed task.
  const today = new Date().toISOString().split('T')[0];
  let cursor = today;
  if (!dayHasCompletedTask(dailyPlans[today]) && dayHasCompletedTask(dailyPlans[shiftDay(today, -1)])) {
    cursor = shiftDay(today, -1);
  }
  let currentStreak = 0;
  while (dayHasCompletedTask(dailyPlans[cursor])) {
    currentStreak++;
    cursor = shiftDay(cursor, -1);
  }

  // Best streak across all active days.
  const activeDays = plans
    .filter((p) => dayHasCompletedTask(p))
    .map((p) => p.date)
    .sort();
  let bestStreak = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of activeDays) {
    run = prev && shiftDay(prev, 1) === day ? run + 1 : 1;
    if (run > bestStreak) bestStreak = run;
    prev = day;
  }
  bestStreak = Math.max(bestStreak, currentStreak);

  // Selected-day progress.
  const selPlan = dailyPlans[selectedDate];
  const selTasks = (selPlan?.bulletNotes || []).filter((n) => n.type === 'task');
  const todayCompleted = selTasks.filter((t) => t.completed).length;
  const todayTotal = selTasks.length;
  const todayProgress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return {
    xp,
    level,
    levelTitle,
    xpIntoLevel,
    xpForNextLevel,
    progressToNext,
    totalCompletedTasks,
    goalActionsCompleted,
    daysLogged,
    currentStreak,
    bestStreak,
    todayProgress,
    todayCompleted,
    todayTotal,
  };
}

export interface OverdueTask {
  date: string;
  id: string;
  text: string;
}

/** Incomplete task bullets from days strictly before `beforeDate`, oldest first. */
export function getUnfinishedBefore(
  dailyPlans: Record<string, DailyPlan>,
  beforeDate: string
): OverdueTask[] {
  const result: OverdueTask[] = [];
  Object.values(dailyPlans).forEach((p) => {
    if (p.date >= beforeDate) return;
    (p.bulletNotes || []).forEach((n) => {
      if (n.type === 'task' && !n.completed) {
        result.push({ date: p.date, id: n.id, text: n.text });
      }
    });
  });
  result.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return result;
}
