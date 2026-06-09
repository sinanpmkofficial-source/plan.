import { create } from 'zustand';
import {
  BrainDumpItem,
  GoalItem,
  DailyPlan,
  WeeklyPlan,
  MonthlyPlan,
  BulletNote,
} from '@/types/planner';

export type PlannerView = 'daily' | 'braindump' | 'goals' | 'weekly' | 'monthly' | 'analytics';

interface PlannerState {
  // Data State
  brainDump: BrainDumpItem[];
  goals: GoalItem[];
  dailyPlans: Record<string, DailyPlan>; // Key: YYYY-MM-DD
  weeklyPlans: Record<string, WeeklyPlan>; // Key: YYYY-Www
  monthlyPlans: Record<string, MonthlyPlan>; // Key: YYYY-MM

  // UI State
  currentView: PlannerView;
  selectedDate: string; // YYYY-MM-DD
  selectedWeek: string; // YYYY-Www
  selectedMonth: string; // YYYY-MM
  syncStatus: 'saved' | 'syncing' | 'error';
  syncErrorMsg: string | null;
  isLoading: boolean;

  // Sync Queue (Keys of dirty/changed entities)
  dirtyBrainDump: Set<string>;
  dirtyGoals: Set<string>;
  dirtyDailyPlans: Set<string>;
  dirtyWeeklyPlans: Set<string>;
  dirtyMonthlyPlans: Set<string>;

  // Actions - Core
  loadData: () => Promise<void>;
  triggerSync: () => void;
  retrySync: () => void;

  // Navigation
  setView: (view: PlannerView) => void;
  setDate: (date: string) => void;
  setWeek: (week: string) => void;
  setMonth: (month: string) => void;

  // Actions - Brain Dump
  addBrainDumpItem: (text: string) => void;
  deleteBrainDumpItem: (id: string) => void;
  convertBrainDumpItem: (
    id: string,
    type: 'task' | 'goal' | 'weekly' | 'monthly',
    targetValue: string // date, goal details, etc.
  ) => void;

  // Actions - Goals
  addGoal: (title: string, description: string, milestones: string[]) => void;
  updateGoal: (id: string, title: string, description: string) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;

  // Actions - Daily Plan
  getOrCreateDailyPlan: (date: string) => DailyPlan;
  addDailyTask: (date: string, text: string) => void;
  toggleDailyTask: (date: string, taskId: string) => void;
  deleteDailyTask: (date: string, taskId: string) => void;
  addBulletNote: (date: string, type: 'task' | 'note' | 'event', text: string) => void;
  toggleBulletNote: (date: string, noteId: string) => void;
  deleteBulletNote: (date: string, noteId: string) => void;
  updateDailyReflection: (date: string, reflection: string) => void;
  togglePrayer: (date: string, prayer: keyof DailyPlan['prayers']) => void;

  // Actions - Weekly Plan
  getOrCreateWeeklyPlan: (weekId: string) => WeeklyPlan;
  addWeeklyTask: (weekId: string, text: string) => void;
  toggleWeeklyTask: (weekId: string, taskId: string) => void;
  deleteWeeklyTask: (weekId: string, taskId: string) => void;
  updateWeeklyReflection: (weekId: string, reflection: string) => void;

  // Actions - Monthly Plan
  getOrCreateMonthlyPlan: (monthId: string) => MonthlyPlan;
  addMonthlyTask: (monthId: string, text: string) => void;
  toggleMonthlyTask: (monthId: string, taskId: string) => void;
  deleteMonthlyTask: (monthId: string, taskId: string) => void;
  updateMonthlyReflection: (monthId: string, reflection: string) => void;
}

// Helper: Calculate Daily Performance Score (0 - 100)
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

// Debounce timer for background syncing
let syncTimeout: NodeJS.Timeout | null = null;

export const usePlannerStore = create<PlannerState>((set, get) => {
  // Helper: Mark entity as dirty and schedule sync
  const markDirty = (
    type: 'brainDump' | 'goals' | 'dailyPlans' | 'weeklyPlans' | 'monthlyPlans',
    id: string
  ) => {
    set((state) => {
      const updated = { ...state };
      if (type === 'brainDump') updated.dirtyBrainDump = new Set(state.dirtyBrainDump).add(id);
      if (type === 'goals') updated.dirtyGoals = new Set(state.dirtyGoals).add(id);
      if (type === 'dailyPlans') updated.dirtyDailyPlans = new Set(state.dirtyDailyPlans).add(id);
      if (type === 'weeklyPlans') updated.dirtyWeeklyPlans = new Set(state.dirtyWeeklyPlans).add(id);
      if (type === 'monthlyPlans') updated.dirtyMonthlyPlans = new Set(state.dirtyMonthlyPlans).add(id);
      return updated;
    });
    get().triggerSync();
  };

  const getOrCreateDailyPlanFn = (state: any, date: string): DailyPlan => {
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

  const getOrCreateWeeklyPlanFn = (state: any, weekId: string): WeeklyPlan => {
    if (state.weeklyPlans[weekId]) return state.weeklyPlans[weekId];
    return {
      weekId,
      tasks: [],
      reflection: '',
      updatedAt: new Date().toISOString(),
    };
  };

  const getOrCreateMonthlyPlanFn = (state: any, monthId: string): MonthlyPlan => {
    if (state.monthlyPlans[monthId]) return state.monthlyPlans[monthId];
    return {
      monthId,
      tasks: [],
      reflection: '',
      updatedAt: new Date().toISOString(),
    };
  };

  return {
    // Initial UI and data state
    brainDump: [],
    goals: [],
    dailyPlans: {},
    weeklyPlans: {},
    monthlyPlans: {},

    currentView: 'daily',
    selectedDate: new Date().toISOString().split('T')[0],
    selectedWeek: (() => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    })(),
    selectedMonth: new Date().toISOString().slice(0, 7),
    syncStatus: 'saved',
    syncErrorMsg: null,
    isLoading: true,

    dirtyBrainDump: new Set(),
    dirtyGoals: new Set(),
    dirtyDailyPlans: new Set(),
    dirtyWeeklyPlans: new Set(),
    dirtyMonthlyPlans: new Set(),

    // Core Sync Actions
    loadData: async () => {
      set({ isLoading: true });
      try {
        const res = await fetch('/api/sync');
        if (!res.ok) throw new Error('Failed to load initial data');
        const data = await res.json();
        set({
          brainDump: data.brainDump || [],
          goals: data.goals || [],
          dailyPlans: data.dailyPlans || {},
          weeklyPlans: data.weeklyPlans || {},
          monthlyPlans: data.monthlyPlans || {},
          isLoading: false,
          syncStatus: 'saved',
        });
      } catch (err: any) {
        console.error(err);
        set({ isLoading: false, syncStatus: 'error', syncErrorMsg: err.message });
      }
    },

    triggerSync: () => {
      set({ syncStatus: 'syncing', syncErrorMsg: null });
      if (syncTimeout) clearTimeout(syncTimeout);

      syncTimeout = setTimeout(async () => {
        const {
          brainDump,
          goals,
          dailyPlans,
          weeklyPlans,
          monthlyPlans,
          dirtyBrainDump,
          dirtyGoals,
          dirtyDailyPlans,
          dirtyWeeklyPlans,
          dirtyMonthlyPlans,
        } = get();

        // If nothing is dirty, mark saved
        if (
          dirtyBrainDump.size === 0 &&
          dirtyGoals.size === 0 &&
          dirtyDailyPlans.size === 0 &&
          dirtyWeeklyPlans.size === 0 &&
          dirtyMonthlyPlans.size === 0
        ) {
          set({ syncStatus: 'saved' });
          return;
        }

        // Package only the modified entities
        const payload = {
          brainDump: brainDump.filter((item) => dirtyBrainDump.has(item.id)),
          goals: goals.filter((goal) => dirtyGoals.has(goal.id)),
          dailyPlans: Object.values(dailyPlans).filter((p) => dirtyDailyPlans.has(p.date)),
          weeklyPlans: Object.values(weeklyPlans).filter((p) => dirtyWeeklyPlans.has(p.weekId)),
          monthlyPlans: Object.values(monthlyPlans).filter((p) => dirtyMonthlyPlans.has(p.monthId)),
          // Track deletions separately if needed, but since statuses are modified, updates are sufficient
          deletedBrainDump: Array.from(dirtyBrainDump).filter((id) => !brainDump.some((x) => x.id === id)),
          deletedGoals: Array.from(dirtyGoals).filter((id) => !goals.some((x) => x.id === id)),
        };

        try {
          const res = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Database sync failed');

          // Reset dirty sets on success
          set({
            dirtyBrainDump: new Set(),
            dirtyGoals: new Set(),
            dirtyDailyPlans: new Set(),
            dirtyWeeklyPlans: new Set(),
            dirtyMonthlyPlans: new Set(),
            syncStatus: 'saved',
          });
        } catch (err: any) {
          set({ syncStatus: 'error', syncErrorMsg: err.message });
        }
      }, 2000); // Debounce sync by 2 seconds
    },

    retrySync: () => {
      const {
        brainDump,
        goals,
        dailyPlans,
        weeklyPlans,
        monthlyPlans,
      } = get();

      // If error happened, let's mark everything as dirty to enforce a full sync
      set({
        dirtyBrainDump: new Set(brainDump.map((x) => x.id)),
        dirtyGoals: new Set(goals.map((x) => x.id)),
        dirtyDailyPlans: new Set(Object.keys(dailyPlans)),
        dirtyWeeklyPlans: new Set(Object.keys(weeklyPlans)),
        dirtyMonthlyPlans: new Set(Object.keys(monthlyPlans)),
      });
      get().triggerSync();
    },

    // Navigation Actions
    setView: (view) => set({ currentView: view }),
    setDate: (date) => set({ selectedDate: date }),
    setWeek: (week) => set({ selectedWeek: week }),
    setMonth: (month) => set({ selectedMonth: month }),

    // Brain Dump Actions
    addBrainDumpItem: (text) => {
      const newItem: BrainDumpItem = {
        id: crypto.randomUUID(),
        text,
        status: 'inbox',
        convertedTo: null,
        convertedAt: null,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ brainDump: [newItem, ...state.brainDump] }));
      markDirty('brainDump', newItem.id);
    },

    deleteBrainDumpItem: (id) => {
      set((state) => ({
        brainDump: state.brainDump.filter((item) => item.id !== id),
      }));
      markDirty('brainDump', id);
    },

    convertBrainDumpItem: (id, type, targetValue) => {
      set((state) => {
        const updatedDump = state.brainDump.map((item) => {
          if (item.id === id) {
            return {
              ...item,
              status: 'converted' as const,
              convertedTo: type,
              convertedAt: new Date().toISOString(),
            };
          }
          return item;
        });

        // Optimistically create the target planning item
        const updatedState: any = { brainDump: updatedDump };

        if (type === 'task') {
          // targetValue is YYYY-MM-DD
          const dailyPlan = getOrCreateDailyPlanFn(state, targetValue);
          const itemText = state.brainDump.find((x) => x.id === id)?.text || '';
          dailyPlan.bulletNotes = [...dailyPlan.bulletNotes, { id: crypto.randomUUID(), type: 'task', text: itemText, completed: false }];
          dailyPlan.score = calculateDailyScore(dailyPlan);
          dailyPlan.updatedAt = new Date().toISOString();
          updatedState.dailyPlans = { ...state.dailyPlans, [targetValue]: dailyPlan };
          setTimeout(() => markDirty('dailyPlans', targetValue), 0);
        } else if (type === 'goal') {
          // targetValue is Goal Title
          const newGoal: GoalItem = {
            id: crypto.randomUUID(),
            title: targetValue,
            description: '',
            status: 'active',
            milestones: [],
            createdAt: new Date().toISOString(),
          };
          updatedState.goals = [...state.goals, newGoal];
          setTimeout(() => markDirty('goals', newGoal.id), 0);
        } else if (type === 'weekly') {
          // targetValue is YYYY-Www
          const weeklyPlan = getOrCreateWeeklyPlanFn(state, targetValue);
          const itemText = state.brainDump.find((x) => x.id === id)?.text || '';
          weeklyPlan.tasks = [...weeklyPlan.tasks, { id: crypto.randomUUID(), text: itemText, completed: false }];
          weeklyPlan.updatedAt = new Date().toISOString();
          updatedState.weeklyPlans = { ...state.weeklyPlans, [targetValue]: weeklyPlan };
          setTimeout(() => markDirty('weeklyPlans', targetValue), 0);
        } else if (type === 'monthly') {
          // targetValue is YYYY-MM
          const monthlyPlan = getOrCreateMonthlyPlanFn(state, targetValue);
          const itemText = state.brainDump.find((x) => x.id === id)?.text || '';
          monthlyPlan.tasks = [...monthlyPlan.tasks, { id: crypto.randomUUID(), text: itemText, completed: false }];
          monthlyPlan.updatedAt = new Date().toISOString();
          updatedState.monthlyPlans = { ...state.monthlyPlans, [targetValue]: monthlyPlan };
          setTimeout(() => markDirty('monthlyPlans', targetValue), 0);
        }

        return updatedState;
      });
      markDirty('brainDump', id);
    },

    // Goals Actions
    addGoal: (title, description, milestones) => {
      const newGoal: GoalItem = {
        id: crypto.randomUUID(),
        title,
        description,
        status: 'active',
        milestones: milestones.map((m) => ({
          id: crypto.randomUUID(),
          title: m,
          completed: false,
        })),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ goals: [...state.goals, newGoal] }));
      markDirty('goals', newGoal.id);
    },

    updateGoal: (id, title, description) => {
      set((state) => ({
        goals: state.goals.map((g) => (g.id === id ? { ...g, title, description } : g)),
      }));
      markDirty('goals', id);
    },

    deleteGoal: (id) => {
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
      markDirty('goals', id);
    },

    toggleMilestone: (goalId, milestoneId) => {
      set((state) => {
        const updatedGoals = state.goals.map((g) => {
          if (g.id === goalId) {
            const updatedMilestones = g.milestones.map((m) =>
              m.id === milestoneId ? { ...m, completed: !m.completed } : m
            );
            const allCompleted = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
            return {
              ...g,
              milestones: updatedMilestones,
              status: (allCompleted ? 'completed' : 'active') as GoalItem['status'],
            };
          }
          return g;
        });
        return { goals: updatedGoals };
      });
      markDirty('goals', goalId);
    },

    // Daily Plan Actions
    getOrCreateDailyPlan: (date) => {
      return getOrCreateDailyPlanFn(get(), date);
    },

    addDailyTask: (date, text) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.tasks = [...plan.tasks, { id: crypto.randomUUID(), text, completed: false }];
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    toggleDailyTask: (date, taskId) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.tasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    deleteDailyTask: (date, taskId) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    addBulletNote: (date, type, text) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        const newNote: BulletNote = {
          id: crypto.randomUUID(),
          type,
          text,
          completed: type === 'task' ? false : undefined,
        };
        plan.bulletNotes = [...plan.bulletNotes, newNote];
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    toggleBulletNote: (date, noteId) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.bulletNotes = plan.bulletNotes.map((n) =>
          n.id === noteId && n.type === 'task' ? { ...n, completed: !n.completed } : n
        );
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    deleteBulletNote: (date, noteId) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.bulletNotes = plan.bulletNotes.filter((n) => n.id !== noteId);
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    updateDailyReflection: (date, reflection) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.reflection = reflection;
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    togglePrayer: (date, prayer) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.prayers = {
          ...plan.prayers,
          [prayer]: !plan.prayers[prayer],
        };
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
    },

    // Weekly Plan Actions
    getOrCreateWeeklyPlan: (weekId) => {
      return getOrCreateWeeklyPlanFn(get(), weekId);
    },

    addWeeklyTask: (weekId, text) => {
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        plan.tasks = [...plan.tasks, { id: crypto.randomUUID(), text, completed: false }];
        plan.updatedAt = new Date().toISOString();
        return { weeklyPlans: { ...state.weeklyPlans, [weekId]: plan } };
      });
      markDirty('weeklyPlans', weekId);
    },

    toggleWeeklyTask: (weekId, taskId) => {
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        plan.tasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        plan.updatedAt = new Date().toISOString();
        return { weeklyPlans: { ...state.weeklyPlans, [weekId]: plan } };
      });
      markDirty('weeklyPlans', weekId);
    },

    deleteWeeklyTask: (weekId, taskId) => {
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
        plan.updatedAt = new Date().toISOString();
        return { weeklyPlans: { ...state.weeklyPlans, [weekId]: plan } };
      });
      markDirty('weeklyPlans', weekId);
    },

    updateWeeklyReflection: (weekId, reflection) => {
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        plan.reflection = reflection;
        plan.updatedAt = new Date().toISOString();
        return { weeklyPlans: { ...state.weeklyPlans, [weekId]: plan } };
      });
      markDirty('weeklyPlans', weekId);
    },

    // Monthly Plan Actions
    getOrCreateMonthlyPlan: (monthId) => {
      return getOrCreateMonthlyPlanFn(get(), monthId);
    },

    addMonthlyTask: (monthId, text) => {
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        plan.tasks = [...plan.tasks, { id: crypto.randomUUID(), text, completed: false }];
        plan.updatedAt = new Date().toISOString();
        return { monthlyPlans: { ...state.monthlyPlans, [monthId]: plan } };
      });
      markDirty('monthlyPlans', monthId);
    },

    toggleMonthlyTask: (monthId, taskId) => {
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        plan.tasks = plan.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        plan.updatedAt = new Date().toISOString();
        return { monthlyPlans: { ...state.monthlyPlans, [monthId]: plan } };
      });
      markDirty('monthlyPlans', monthId);
    },

    deleteMonthlyTask: (monthId, taskId) => {
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
        plan.updatedAt = new Date().toISOString();
        return { monthlyPlans: { ...state.monthlyPlans, [monthId]: plan } };
      });
      markDirty('monthlyPlans', monthId);
    },

    updateMonthlyReflection: (monthId, reflection) => {
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        plan.reflection = reflection;
        plan.updatedAt = new Date().toISOString();
        return { monthlyPlans: { ...state.monthlyPlans, [monthId]: plan } };
      });
      markDirty('monthlyPlans', monthId);
    },
  };
});
