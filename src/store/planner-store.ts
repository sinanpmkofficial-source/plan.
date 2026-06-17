import { create } from 'zustand';
import {
  BrainDumpItem,
  GoalItem,
  DailyPlan,
  WeeklyPlan,
  MonthlyPlan,
  BulletNote,
  ActionItem,
} from '@/types/planner';
import { 
  getWeekIdFromDate, 
  getMonthIdFromDate 
} from '@/lib/date-utils';
import { 
  calculateDailyScore, 
  getOrCreateDailyPlanFn, 
  getOrCreateWeeklyPlanFn, 
  getOrCreateMonthlyPlanFn 
} from '@/lib/planner-utils';

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
  updateBrainDumpItem: (id: string, text: string) => void;
  deleteBrainDumpItem: (id: string) => void;
  convertBrainDumpItem: (
    id: string,
    type: 'task' | 'goal' | 'weekly' | 'monthly',
    targetValue: string, // date, goal details, etc.
    bulletType?: 'task' | 'note' | 'event'
  ) => void;

  // Actions - Goals
  addGoal: (title: string, description: string, dueDate: string | undefined, milestones: { title: string; dueDate?: string }[]) => void;
  updateGoal: (
    id: string,
    title: string,
    description: string,
    dueDate: string | undefined,
    milestones: { id?: string; title: string; dueDate?: string; completed?: boolean; actionItems?: ActionItem[] }[]
  ) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addActionItem: (goalId: string, milestoneId: string, title: string, priority: ActionItem['priority'], dueDate?: string) => void;
  updateActionItem: (goalId: string, milestoneId: string, actionId: string, fields: Partial<Pick<ActionItem, 'title' | 'priority' | 'dueDate' | 'completed'>>) => void;
  toggleActionItem: (goalId: string, milestoneId: string, actionId: string) => void;
  deleteActionItem: (goalId: string, milestoneId: string, actionId: string) => void;
  sendActionToDaily: (goalId: string, milestoneId: string, actionId: string) => void;

  // Actions - Daily Plan
  getOrCreateDailyPlan: (date: string) => DailyPlan;
  addDailyTask: (date: string, text: string) => void;
  toggleDailyTask: (date: string, taskId: string) => void;
  deleteDailyTask: (date: string, taskId: string) => void;
  addBulletNote: (date: string, type: 'task' | 'note' | 'event', text: string) => void;
  updateBulletNote: (date: string, noteId: string, text: string) => void;
  toggleBulletNote: (date: string, noteId: string) => void;
  deleteBulletNote: (date: string, noteId: string) => void;
  moveBulletNote: (dateOrId: string, noteId: string, direction: 'up' | 'down', context: 'daily' | 'weekly' | 'monthly') => void;
  updateDailyReflection: (date: string, reflection: string) => void;

  // Actions - Weekly Plan
  getOrCreateWeeklyPlan: (weekId: string) => WeeklyPlan;
  addWeeklyTask: (weekId: string, type: 'task' | 'note' | 'event', text: string) => void;
  updateWeeklyTask: (weekId: string, taskId: string, text: string) => void;
  toggleWeeklyTask: (weekId: string, taskId: string) => void;
  deleteWeeklyTask: (weekId: string, taskId: string, silent?: boolean) => void;
  updateWeeklyReflection: (weekId: string, reflection: string) => void;

  // Actions - Monthly Plan
  getOrCreateMonthlyPlan: (monthId: string) => MonthlyPlan;
  addMonthlyTask: (monthId: string, type: 'task' | 'note' | 'event', text: string) => void;
  updateMonthlyTask: (monthId: string, taskId: string, text: string) => void;
  toggleMonthlyTask: (monthId: string, taskId: string) => void;
  deleteMonthlyTask: (monthId: string, taskId: string, silent?: boolean) => void;
  updateMonthlyReflection: (monthId: string, reflection: string) => void;

  // Toast Notifications
  toast: { message: string; type: 'success' | 'delete' } | null;
  showToast: (message: string, type?: 'success' | 'delete') => void;
  hideToast: () => void;
}

// Debounce timer for background syncing
let syncTimeout: NodeJS.Timeout | null = null;

const isBrowser = typeof window !== 'undefined';

const getLocalStorageData = () => {
  if (!isBrowser) return { brainDump: [], goals: [], dailyPlans: {}, weeklyPlans: {}, monthlyPlans: {} };
  try {
    const data = localStorage.getItem('planner-data');
    if (data) {
      const parsed = JSON.parse(data);
      return {
        brainDump: parsed.brainDump || [],
        goals: parsed.goals || [],
        dailyPlans: parsed.dailyPlans || {},
        weeklyPlans: parsed.weeklyPlans || {},
        monthlyPlans: parsed.monthlyPlans || {},
      };
    }
  } catch (e) {
    console.error('Failed to parse local storage data', e);
  }
  return { brainDump: [], goals: [], dailyPlans: {}, weeklyPlans: {}, monthlyPlans: {} };
};

const saveLocalStorageData = (state: {
  brainDump: any[];
  goals: any[];
  dailyPlans: any;
  weeklyPlans: any;
  monthlyPlans: any;
}) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem('planner-data', JSON.stringify({
      brainDump: state.brainDump,
      goals: state.goals,
      dailyPlans: state.dailyPlans,
      weeklyPlans: state.weeklyPlans,
      monthlyPlans: state.monthlyPlans,
    }));
  } catch (e) {
    console.error('Failed to save to local storage', e);
  }
};

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

  return {
    // Initial UI and data state from local cache
    ...getLocalStorageData(),

    currentView: 'daily',
    selectedDate: new Date().toISOString().split('T')[0],
    selectedWeek: getWeekIdFromDate(new Date().toISOString().split('T')[0]),
    selectedMonth: getMonthIdFromDate(new Date().toISOString().split('T')[0]),
    syncStatus: 'saved',
    syncErrorMsg: null,
    isLoading: false, // Default false to avoid skeleton blocker screen
    toast: null,

    dirtyBrainDump: new Set(),
    dirtyGoals: new Set(),
    dirtyDailyPlans: new Set(),
    dirtyWeeklyPlans: new Set(),
    dirtyMonthlyPlans: new Set(),

    // Core Sync Actions
    loadData: async () => {
      const cached = getLocalStorageData();
      const hasCachedData = cached.brainDump.length > 0 || cached.goals.length > 0 || Object.keys(cached.dailyPlans).length > 0;
      
      if (!hasCachedData) {
        set({ isLoading: true });
      }

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
        saveLocalStorageData(data);
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

    // Toast Actions
    showToast: (message, type = 'success') => {
      set({ toast: { message, type } });
      setTimeout(() => {
        const currentToast = get().toast;
        if (currentToast && currentToast.message === message) {
          get().hideToast();
        }
      }, 3000);
    },
    hideToast: () => set({ toast: null }),

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

    updateBrainDumpItem: (id, text) => {
      set((state) => ({
        brainDump: state.brainDump.map((item) => (item.id === id ? { ...item, text } : item)),
      }));
      markDirty('brainDump', id);
    },

    deleteBrainDumpItem: (id) => {
      const text = get().brainDump.find((item) => item.id === id)?.text || 'Thought';
      set((state) => ({
        brainDump: state.brainDump.filter((item) => item.id !== id),
      }));
      markDirty('brainDump', id);
      get().showToast(`"${text.slice(0, 20)}${text.length > 20 ? '...' : ''}" deleted`, 'delete');
    },

    convertBrainDumpItem: (id, type, targetValue, bulletType = 'task') => {
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
        const updatedState: any = { 
          brainDump: updatedDump,
          dirtyBrainDump: new Set(state.dirtyBrainDump).add(id)
        };

        if (type === 'task') {
          // targetValue is YYYY-MM-DD
          const dailyPlan = getOrCreateDailyPlanFn(state, targetValue);
          const itemText = state.brainDump.find((x) => x.id === id)?.text || '';
          dailyPlan.bulletNotes = [...dailyPlan.bulletNotes, { id: crypto.randomUUID(), type: bulletType, text: itemText, completed: false }];
          dailyPlan.score = calculateDailyScore(dailyPlan);
          dailyPlan.updatedAt = new Date().toISOString();
          updatedState.dailyPlans = { ...state.dailyPlans, [targetValue]: dailyPlan };
          updatedState.dirtyDailyPlans = new Set(state.dirtyDailyPlans).add(targetValue);
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
          updatedState.dirtyGoals = new Set(state.dirtyGoals).add(newGoal.id);
        } else if (type === 'weekly') {
          // targetValue is YYYY-Www
          const weeklyPlan = getOrCreateWeeklyPlanFn(state, targetValue);
          const itemText = state.brainDump.find((x) => x.id === id)?.text || '';
          const newNote: BulletNote = { id: crypto.randomUUID(), type: 'task', text: itemText, completed: false };
          weeklyPlan.bulletNotes = [...(weeklyPlan.bulletNotes || []), newNote];
          weeklyPlan.updatedAt = new Date().toISOString();
          updatedState.weeklyPlans = { ...state.weeklyPlans, [targetValue]: weeklyPlan };
          updatedState.dirtyWeeklyPlans = new Set(state.dirtyWeeklyPlans).add(targetValue);
        } else if (type === 'monthly') {
          // targetValue is YYYY-MM
          const monthlyPlan = getOrCreateMonthlyPlanFn(state, targetValue);
          const itemText = state.brainDump.find((x) => x.id === id)?.text || '';
          const newNote: BulletNote = { id: crypto.randomUUID(), type: 'task', text: itemText, completed: false };
          monthlyPlan.bulletNotes = [...(monthlyPlan.bulletNotes || []), newNote];
          monthlyPlan.updatedAt = new Date().toISOString();
          updatedState.monthlyPlans = { ...state.monthlyPlans, [targetValue]: monthlyPlan };
          updatedState.dirtyMonthlyPlans = new Set(state.dirtyMonthlyPlans).add(targetValue);
        }

        return updatedState;
      });
      get().triggerSync();
    },

    // Goals Actions
    addGoal: (title, description, dueDate, milestones) => {
      const newGoal: GoalItem = {
        id: crypto.randomUUID(),
        title,
        description,
        status: 'active',
        dueDate: dueDate || undefined,
        milestones: milestones.map((m) => ({
          id: crypto.randomUUID(),
          title: m.title,
          completed: false,
          dueDate: m.dueDate || undefined,
          actionItems: [],
        })),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ goals: [...state.goals, newGoal] }));
      markDirty('goals', newGoal.id);
    },

    updateGoal: (id, title, description, dueDate, milestones) => {
      set((state) => ({
        goals: state.goals.map((g) => {
          if (g.id === id) {
            const updatedMilestones = milestones.map((m) => {
              const existing = g.milestones.find((em) => em.id === m.id);
              const actionItems = existing?.actionItems || m.actionItems || [];
              const derivedCompleted = actionItems.length > 0
                ? actionItems.every((a) => a.completed)
                : (existing ? existing.completed : (m.completed || false));
              return {
                id: m.id || crypto.randomUUID(),
                title: m.title,
                completed: derivedCompleted,
                dueDate: m.dueDate || undefined,
                actionItems,
              };
            });
            const allCompleted = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
            return {
              ...g,
              title,
              description,
              dueDate: dueDate || undefined,
              milestones: updatedMilestones,
              status: (allCompleted ? 'completed' : 'active') as GoalItem['status'],
            };
          }
          return g;
        }),
      }));
      markDirty('goals', id);
    },

    deleteGoal: (id) => {
      const title = get().goals.find((g) => g.id === id)?.title || 'Goal';
      set((state) => ({
        goals: state.goals.filter((g) => g.id !== id),
      }));
      markDirty('goals', id);
      get().showToast(`"${title.slice(0, 20)}${title.length > 20 ? '...' : ''}" deleted`, 'delete');
    },

    toggleMilestone: (goalId, milestoneId) => {
      set((state) => {
        const updatedGoals = state.goals.map((g) => {
          if (g.id === goalId) {
            const updatedMilestones = g.milestones.map((m) => {
              if (m.id !== milestoneId) return m;
              // If milestone has action items, don't allow manual toggle — driven by actions
              if ((m.actionItems || []).length > 0) return m;
              return { ...m, completed: !m.completed };
            });
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

    addActionItem: (goalId, milestoneId, title, priority, dueDate) => {
      const newAction: ActionItem = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        priority,
        dueDate: dueDate || undefined,
      };
      set((state) => ({
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id !== milestoneId) return m;
              const actionItems = [...(m.actionItems || []), newAction];
              return { ...m, actionItems, completed: actionItems.every((a) => a.completed) };
            }),
          };
        }),
      }));
      markDirty('goals', goalId);
    },

    updateActionItem: (goalId, milestoneId, actionId, fields) => {
      set((state) => ({
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id !== milestoneId) return m;
              const actionItems = (m.actionItems || []).map((a) =>
                a.id === actionId ? { ...a, ...fields } : a
              );
              return { ...m, actionItems, completed: actionItems.length > 0 && actionItems.every((a) => a.completed) };
            }),
          };
        }),
      }));
      markDirty('goals', goalId);
    },

    toggleActionItem: (goalId, milestoneId, actionId) => {
      set((state) => {
        const updatedGoals = state.goals.map((g) => {
          if (g.id !== goalId) return g;
          const updatedMilestones = g.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            const actionItems = (m.actionItems || []).map((a) =>
              a.id === actionId ? { ...a, completed: !a.completed } : a
            );
            const milestoneCompleted = actionItems.length > 0 && actionItems.every((a) => a.completed);
            return { ...m, actionItems, completed: milestoneCompleted };
          });
          const allMilestoneDone = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed);
          return {
            ...g,
            milestones: updatedMilestones,
            status: (allMilestoneDone ? 'completed' : 'active') as GoalItem['status'],
          };
        });
        return { goals: updatedGoals };
      });
      markDirty('goals', goalId);
    },

    deleteActionItem: (goalId, milestoneId, actionId) => {
      set((state) => ({
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id !== milestoneId) return m;
              const actionItems = (m.actionItems || []).filter((a) => a.id !== actionId);
              const milestoneCompleted = actionItems.length > 0 && actionItems.every((a) => a.completed);
              return { ...m, actionItems, completed: milestoneCompleted };
            }),
          };
        }),
      }));
      markDirty('goals', goalId);
    },

    sendActionToDaily: (goalId, milestoneId, actionId) => {
      const todayDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD using local time
      const goal = get().goals.find((g) => g.id === goalId);
      const milestone = goal?.milestones.find((m) => m.id === milestoneId);
      const action = milestone?.actionItems?.find((a) => a.id === actionId);
      if (!action) return;

      // Add to today's daily log
      get().addBulletNote(todayDate, 'task', action.title);

      // Mark as sent
      set((state) => ({
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          return {
            ...g,
            milestones: g.milestones.map((m) => {
              if (m.id !== milestoneId) return m;
              return {
                ...m,
                actionItems: (m.actionItems || []).map((a) =>
                  a.id === actionId ? { ...a, sentToDaily: todayDate } : a
                ),
              };
            }),
          };
        }),
      }));
      markDirty('goals', goalId);
      get().showToast('Action sent to Today\'s Daily Log');
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
      const plan = get().dailyPlans[date];
      const task = plan?.tasks?.find((t) => t.id === taskId);
      const text = task?.text || 'Daily task';
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.tasks = plan.tasks.filter((t) => t.id !== taskId);
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();
        return { dailyPlans: { ...state.dailyPlans, [date]: plan } };
      });
      markDirty('dailyPlans', date);
      get().showToast(`"${text.slice(0, 20)}${text.length > 20 ? '...' : ''}" deleted`, 'delete');
    },

    addBulletNote: (date, type, text) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        const noteId = crypto.randomUUID();
        const newNote: BulletNote = {
          id: noteId,
          type,
          text,
          completed: type === 'task' ? false : undefined,
        };
        plan.bulletNotes = [...plan.bulletNotes, newNote];
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          dailyPlans: { ...state.dailyPlans, [date]: plan },
          dirtyDailyPlans: new Set(state.dirtyDailyPlans).add(date)
        };

        // Propagate to Weekly Plan
        const weekId = getWeekIdFromDate(date);
        const weeklyPlan = getOrCreateWeeklyPlanFn(state, weekId);
        const newWeeklyNote: BulletNote = { id: noteId, type, text, completed: type === 'task' ? false : undefined };
        weeklyPlan.bulletNotes = [...(weeklyPlan.bulletNotes || []), newWeeklyNote];
        weeklyPlan.updatedAt = new Date().toISOString();
        updatedState.weeklyPlans = { ...state.weeklyPlans, [weekId]: weeklyPlan };
        updatedState.dirtyWeeklyPlans = new Set(state.dirtyWeeklyPlans).add(weekId);

        // Propagate to Monthly Plan
        const monthId = getMonthIdFromDate(date);
        const monthlyPlan = getOrCreateMonthlyPlanFn(state, monthId);
        const newMonthlyNote: BulletNote = { id: noteId, type, text, completed: type === 'task' ? false : undefined };
        monthlyPlan.bulletNotes = [...(monthlyPlan.bulletNotes || []), newMonthlyNote];
        monthlyPlan.updatedAt = new Date().toISOString();
        updatedState.monthlyPlans = { ...state.monthlyPlans, [monthId]: monthlyPlan };
        updatedState.dirtyMonthlyPlans = new Set(state.dirtyMonthlyPlans).add(monthId);

        return updatedState;
      });
      get().triggerSync();
    },

    updateBulletNote: (date, noteId, text) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.bulletNotes = plan.bulletNotes.map((n) => (n.id === noteId ? { ...n, text } : n));
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          dailyPlans: { ...state.dailyPlans, [date]: plan },
          dirtyDailyPlans: new Set(state.dirtyDailyPlans).add(date)
        };

        // Sync to Weekly Plans
        Object.entries(state.weeklyPlans).forEach(([wId, wPlan]) => {
          if (wPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedWPlan = {
              ...wPlan,
              bulletNotes: wPlan.bulletNotes.map((n) => (n.id === noteId ? { ...n, text } : n)),
              updatedAt: new Date().toISOString(),
            };
            updatedState.weeklyPlans = { ...(updatedState.weeklyPlans || state.weeklyPlans), [wId]: updatedWPlan };
            updatedState.dirtyWeeklyPlans = new Set(updatedState.dirtyWeeklyPlans || state.dirtyWeeklyPlans).add(wId);
          }
        });

        // Sync to Monthly Plans
        Object.entries(state.monthlyPlans).forEach(([mId, mPlan]) => {
          if (mPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedMPlan = {
              ...mPlan,
              bulletNotes: mPlan.bulletNotes.map((n) => (n.id === noteId ? { ...n, text } : n)),
              updatedAt: new Date().toISOString(),
            };
            updatedState.monthlyPlans = { ...(updatedState.monthlyPlans || state.monthlyPlans), [mId]: updatedMPlan };
            updatedState.dirtyMonthlyPlans = new Set(updatedState.dirtyMonthlyPlans || state.dirtyMonthlyPlans).add(mId);
          }
        });

        return updatedState;
      });
      get().triggerSync();
    },

    toggleBulletNote: (date, noteId) => {
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        let wasToggled = false;
        let nextCompletedState: boolean | undefined;

        plan.bulletNotes = plan.bulletNotes.map((n) => {
          if (n.id === noteId && n.type === 'task') {
            wasToggled = true;
            nextCompletedState = !n.completed;
            return { ...n, completed: nextCompletedState };
          }
          return n;
        });

        if (!wasToggled) return {};

        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          dailyPlans: { ...state.dailyPlans, [date]: plan },
          dirtyDailyPlans: new Set(state.dirtyDailyPlans).add(date)
        };

        // Sync to Weekly Plans
        Object.entries(state.weeklyPlans).forEach(([wId, wPlan]) => {
          if (wPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedWPlan = {
              ...wPlan,
              bulletNotes: wPlan.bulletNotes.map((n) =>
                n.id === noteId && n.type === 'task' ? { ...n, completed: nextCompletedState } : n
              ),
              updatedAt: new Date().toISOString(),
            };
            updatedState.weeklyPlans = { ...(updatedState.weeklyPlans || state.weeklyPlans), [wId]: updatedWPlan };
            updatedState.dirtyWeeklyPlans = new Set(updatedState.dirtyWeeklyPlans || state.dirtyWeeklyPlans).add(wId);
          }
        });

        // Sync to Monthly Plans
        Object.entries(state.monthlyPlans).forEach(([mId, mPlan]) => {
          if (mPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedMPlan = {
              ...mPlan,
              bulletNotes: mPlan.bulletNotes.map((n) =>
                n.id === noteId && n.type === 'task' ? { ...n, completed: nextCompletedState } : n
              ),
              updatedAt: new Date().toISOString(),
            };
            updatedState.monthlyPlans = { ...(updatedState.monthlyPlans || state.monthlyPlans), [mId]: updatedMPlan };
            updatedState.dirtyMonthlyPlans = new Set(updatedState.dirtyMonthlyPlans || state.dirtyMonthlyPlans).add(mId);
          }
        });

        return updatedState;
      });
      get().triggerSync();
    },

    deleteBulletNote: (date, noteId) => {
      const plan = get().dailyPlans[date];
      const note = plan?.bulletNotes?.find((n) => n.id === noteId);
      const text = note?.text || 'Daily note';
      set((state) => {
        const plan = getOrCreateDailyPlanFn(state, date);
        plan.bulletNotes = plan.bulletNotes.filter((n) => n.id !== noteId);
        plan.score = calculateDailyScore(plan);
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          dailyPlans: { ...state.dailyPlans, [date]: plan },
          dirtyDailyPlans: new Set(state.dirtyDailyPlans).add(date)
        };

        // Sync to Weekly Plans
        Object.entries(state.weeklyPlans).forEach(([wId, wPlan]) => {
          if (wPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedWPlan = {
              ...wPlan,
              bulletNotes: wPlan.bulletNotes.filter((n) => n.id !== noteId),
              updatedAt: new Date().toISOString(),
            };
            updatedState.weeklyPlans = { ...(updatedState.weeklyPlans || state.weeklyPlans), [wId]: updatedWPlan };
            updatedState.dirtyWeeklyPlans = new Set(updatedState.dirtyWeeklyPlans || state.dirtyWeeklyPlans).add(wId);
          }
        });

        // Sync to Monthly Plans
        Object.entries(state.monthlyPlans).forEach(([mId, mPlan]) => {
          if (mPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedMPlan = {
              ...mPlan,
              bulletNotes: mPlan.bulletNotes.filter((n) => n.id !== noteId),
              updatedAt: new Date().toISOString(),
            };
            updatedState.monthlyPlans = { ...(updatedState.monthlyPlans || state.monthlyPlans), [mId]: updatedMPlan };
            updatedState.dirtyMonthlyPlans = new Set(updatedState.dirtyMonthlyPlans || state.dirtyMonthlyPlans).add(mId);
          }
        });

        return updatedState;
      });
      get().showToast(`"${text.slice(0, 20)}${text.length > 20 ? '...' : ''}" deleted`, 'delete');
      get().triggerSync();
    },

    moveBulletNote: (dateOrId, noteId, direction, context) => {
      set((state) => {
        let plan: DailyPlan | WeeklyPlan | MonthlyPlan | undefined;
        const key = dateOrId;
        let storeKey: 'dailyPlans' | 'weeklyPlans' | 'monthlyPlans';
        let dirtyKey: 'dirtyDailyPlans' | 'dirtyWeeklyPlans' | 'dirtyMonthlyPlans';

        if (context === 'daily') {
          plan = getOrCreateDailyPlanFn(state, dateOrId);
          storeKey = 'dailyPlans';
          dirtyKey = 'dirtyDailyPlans';
        } else if (context === 'weekly') {
          plan = getOrCreateWeeklyPlanFn(state, dateOrId);
          storeKey = 'weeklyPlans';
          dirtyKey = 'dirtyWeeklyPlans';
        } else {
          plan = getOrCreateMonthlyPlanFn(state, dateOrId);
          storeKey = 'monthlyPlans';
          dirtyKey = 'dirtyMonthlyPlans';
        }

        if (!plan || !plan.bulletNotes) return {};

        const notes = [...plan.bulletNotes];
        const index = notes.findIndex((n) => n.id === noteId);
        if (index === -1) return {};

        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= notes.length) return {};

        // Swap items
        const [movedNote] = notes.splice(index, 1);
        notes.splice(targetIndex, 0, movedNote);

        plan.bulletNotes = notes;
        if (context === 'daily') {
          (plan as DailyPlan).score = calculateDailyScore(plan as DailyPlan);
        }
        plan.updatedAt = new Date().toISOString();

        const updatedState = {
          [storeKey]: { ...state[storeKey], [key]: plan },
          [dirtyKey]: new Set(state[dirtyKey] as Set<string>).add(key),
        };

        return updatedState as any;
      });
      get().triggerSync();
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

    // Weekly Plan Actions
    getOrCreateWeeklyPlan: (weekId) => {
      return getOrCreateWeeklyPlanFn(get(), weekId);
    },

    addWeeklyTask: (weekId, type, text) => {
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        const newNote: BulletNote = {
          id: crypto.randomUUID(),
          type,
          text,
          completed: type === 'task' ? false : undefined,
        };
        plan.bulletNotes = [...(plan.bulletNotes || []), newNote];
        plan.updatedAt = new Date().toISOString();
        return { weeklyPlans: { ...state.weeklyPlans, [weekId]: plan } };
      });
      markDirty('weeklyPlans', weekId);
    },

    updateWeeklyTask: (weekId, taskId, text) => {
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        plan.bulletNotes = (plan.bulletNotes || []).map((n) => (n.id === taskId ? { ...n, text } : n));
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          weeklyPlans: { ...state.weeklyPlans, [weekId]: plan },
          dirtyWeeklyPlans: new Set(state.dirtyWeeklyPlans).add(weekId)
        };

        // Sync to Daily Plans
        Object.entries(state.dailyPlans).forEach(([dStr, dPlan]) => {
          if (dPlan.bulletNotes?.some((n) => n.id === taskId)) {
            const updatedDPlan = {
              ...dPlan,
              bulletNotes: dPlan.bulletNotes.map((n) => (n.id === taskId ? { ...n, text } : n)),
              updatedAt: new Date().toISOString(),
            };
            updatedState.dailyPlans = { ...(updatedState.dailyPlans || state.dailyPlans), [dStr]: updatedDPlan };
            updatedState.dirtyDailyPlans = new Set(updatedState.dirtyDailyPlans || state.dirtyDailyPlans).add(dStr);
          }
        });

        // Sync to Monthly Plans
        Object.entries(state.monthlyPlans).forEach(([mId, mPlan]) => {
          if (mPlan.bulletNotes?.some((n) => n.id === taskId)) {
            const updatedMPlan = {
              ...mPlan,
              bulletNotes: mPlan.bulletNotes.map((n) => (n.id === taskId ? { ...n, text } : n)),
              updatedAt: new Date().toISOString(),
            };
            updatedState.monthlyPlans = { ...(updatedState.monthlyPlans || state.monthlyPlans), [mId]: updatedMPlan };
            updatedState.dirtyMonthlyPlans = new Set(updatedState.dirtyMonthlyPlans || state.dirtyMonthlyPlans).add(mId);
          }
        });

        return updatedState;
      });
      get().triggerSync();
    },

    toggleWeeklyTask: (weekId, noteId) => {
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        let wasToggled = false;
        let nextCompletedState: boolean | undefined;

        plan.bulletNotes = (plan.bulletNotes || []).map((n) => {
          if (n.id === noteId && n.type === 'task') {
            wasToggled = true;
            nextCompletedState = !n.completed;
            return { ...n, completed: nextCompletedState };
          }
          return n;
        });

        if (!wasToggled) return {};

        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          weeklyPlans: { ...state.weeklyPlans, [weekId]: plan },
          dirtyWeeklyPlans: new Set(state.dirtyWeeklyPlans).add(weekId)
        };

        // Sync to Daily Plans (and recalculate score)
        Object.entries(state.dailyPlans).forEach(([dStr, dPlan]) => {
          if (dPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedDPlan = {
              ...dPlan,
              bulletNotes: dPlan.bulletNotes.map((n) =>
                n.id === noteId && n.type === 'task' ? { ...n, completed: nextCompletedState } : n
              ),
              updatedAt: new Date().toISOString(),
            };
            updatedDPlan.score = calculateDailyScore(updatedDPlan);
            updatedState.dailyPlans = { ...(updatedState.dailyPlans || state.dailyPlans), [dStr]: updatedDPlan };
            updatedState.dirtyDailyPlans = new Set(updatedState.dirtyDailyPlans || state.dirtyDailyPlans).add(dStr);
          }
        });

        // Sync to Monthly Plans
        Object.entries(state.monthlyPlans).forEach(([mId, mPlan]) => {
          if (mPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedMPlan = {
              ...mPlan,
              bulletNotes: mPlan.bulletNotes.map((n) =>
                n.id === noteId && n.type === 'task' ? { ...n, completed: nextCompletedState } : n
              ),
              updatedAt: new Date().toISOString(),
            };
            updatedState.monthlyPlans = { ...(updatedState.monthlyPlans || state.monthlyPlans), [mId]: updatedMPlan };
            updatedState.dirtyMonthlyPlans = new Set(updatedState.dirtyMonthlyPlans || state.dirtyMonthlyPlans).add(mId);
          }
        });

        return updatedState;
      });
      get().triggerSync();
    },

    deleteWeeklyTask: (weekId, noteId, silent) => {
      const plan = get().weeklyPlans[weekId];
      const note = plan?.bulletNotes?.find((n) => n.id === noteId);
      const text = note?.text || 'Weekly note';
      set((state) => {
        const plan = getOrCreateWeeklyPlanFn(state, weekId);
        plan.bulletNotes = (plan.bulletNotes || []).filter((n) => n.id !== noteId);
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          weeklyPlans: { ...state.weeklyPlans, [weekId]: plan },
          dirtyWeeklyPlans: new Set(state.dirtyWeeklyPlans).add(weekId)
        };

        // Sync to Daily Plans (and recalculate score)
        Object.entries(state.dailyPlans).forEach(([dStr, dPlan]) => {
          if (dPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedDPlan = {
              ...dPlan,
              bulletNotes: dPlan.bulletNotes.filter((n) => n.id !== noteId),
              updatedAt: new Date().toISOString(),
            };
            updatedDPlan.score = calculateDailyScore(updatedDPlan);
            updatedState.dailyPlans = { ...(updatedState.dailyPlans || state.dailyPlans), [dStr]: updatedDPlan };
            updatedState.dirtyDailyPlans = new Set(updatedState.dirtyDailyPlans || state.dirtyDailyPlans).add(dStr);
          }
        });

        // Sync to Monthly Plans
        Object.entries(state.monthlyPlans).forEach(([mId, mPlan]) => {
          if (mPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedMPlan = {
              ...mPlan,
              bulletNotes: mPlan.bulletNotes.filter((n) => n.id !== noteId),
              updatedAt: new Date().toISOString(),
            };
            updatedState.monthlyPlans = { ...(updatedState.monthlyPlans || state.monthlyPlans), [mId]: updatedMPlan };
            updatedState.dirtyMonthlyPlans = new Set(updatedState.dirtyMonthlyPlans || state.dirtyMonthlyPlans).add(mId);
          }
        });

        return updatedState;
      });
      if (!silent) {
        get().showToast(`"${text.slice(0, 20)}${text.length > 20 ? '...' : ''}" deleted`, 'delete');
      }
      get().triggerSync();
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

    addMonthlyTask: (monthId, type, text) => {
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        const newNote: BulletNote = {
          id: crypto.randomUUID(),
          type,
          text,
          completed: type === 'task' ? false : undefined,
        };
        plan.bulletNotes = [...(plan.bulletNotes || []), newNote];
        plan.updatedAt = new Date().toISOString();
        return { monthlyPlans: { ...state.monthlyPlans, [monthId]: plan } };
      });
      markDirty('monthlyPlans', monthId);
    },

    updateMonthlyTask: (monthId, taskId, text) => {
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        plan.bulletNotes = (plan.bulletNotes || []).map((n) => (n.id === taskId ? { ...n, text } : n));
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          monthlyPlans: { ...state.monthlyPlans, [monthId]: plan },
          dirtyMonthlyPlans: new Set(state.dirtyMonthlyPlans).add(monthId)
        };

        // Sync to Daily Plans
        Object.entries(state.dailyPlans).forEach(([dStr, dPlan]) => {
          if (dPlan.bulletNotes?.some((n) => n.id === taskId)) {
            const updatedDPlan = {
              ...dPlan,
              bulletNotes: dPlan.bulletNotes.map((n) => (n.id === taskId ? { ...n, text } : n)),
              updatedAt: new Date().toISOString(),
            };
            updatedState.dailyPlans = { ...(updatedState.dailyPlans || state.dailyPlans), [dStr]: updatedDPlan };
            updatedState.dirtyDailyPlans = new Set(updatedState.dirtyDailyPlans || state.dirtyDailyPlans).add(dStr);
          }
        });

        // Sync to Weekly Plans
        Object.entries(state.weeklyPlans).forEach(([wId, wPlan]) => {
          if (wPlan.bulletNotes?.some((n) => n.id === taskId)) {
            const updatedWPlan = {
              ...wPlan,
              bulletNotes: wPlan.bulletNotes.map((n) => (n.id === taskId ? { ...n, text } : n)),
              updatedAt: new Date().toISOString(),
            };
            updatedState.weeklyPlans = { ...(updatedState.weeklyPlans || state.weeklyPlans), [wId]: updatedWPlan };
            updatedState.dirtyWeeklyPlans = new Set(updatedState.dirtyWeeklyPlans || state.dirtyWeeklyPlans).add(wId);
          }
        });

        return updatedState;
      });
      get().triggerSync();
    },

    toggleMonthlyTask: (monthId, noteId) => {
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        let wasToggled = false;
        let nextCompletedState: boolean | undefined;

        plan.bulletNotes = (plan.bulletNotes || []).map((n) => {
          if (n.id === noteId && n.type === 'task') {
            wasToggled = true;
            nextCompletedState = !n.completed;
            return { ...n, completed: nextCompletedState };
          }
          return n;
        });

        if (!wasToggled) return {};

        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          monthlyPlans: { ...state.monthlyPlans, [monthId]: plan },
          dirtyMonthlyPlans: new Set(state.dirtyMonthlyPlans).add(monthId)
        };

        // Sync to Daily Plans (and recalculate score)
        Object.entries(state.dailyPlans).forEach(([dStr, dPlan]) => {
          if (dPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedDPlan = {
              ...dPlan,
              bulletNotes: dPlan.bulletNotes.map((n) =>
                n.id === noteId && n.type === 'task' ? { ...n, completed: nextCompletedState } : n
              ),
              updatedAt: new Date().toISOString(),
            };
            updatedDPlan.score = calculateDailyScore(updatedDPlan);
            updatedState.dailyPlans = { ...(updatedState.dailyPlans || state.dailyPlans), [dStr]: updatedDPlan };
            updatedState.dirtyDailyPlans = new Set(updatedState.dirtyDailyPlans || state.dirtyDailyPlans).add(dStr);
          }
        });

        // Sync to Weekly Plans
        Object.entries(state.weeklyPlans).forEach(([wId, wPlan]) => {
          if (wPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedWPlan = {
              ...wPlan,
              bulletNotes: wPlan.bulletNotes.map((n) =>
                n.id === noteId && n.type === 'task' ? { ...n, completed: nextCompletedState } : n
              ),
              updatedAt: new Date().toISOString(),
            };
            updatedState.weeklyPlans = { ...(updatedState.weeklyPlans || state.weeklyPlans), [wId]: updatedWPlan };
            updatedState.dirtyWeeklyPlans = new Set(updatedState.dirtyWeeklyPlans || state.dirtyWeeklyPlans).add(wId);
          }
        });

        return updatedState;
      });
      get().triggerSync();
    },

    deleteMonthlyTask: (monthId, noteId, silent) => {
      const plan = get().monthlyPlans[monthId];
      const note = plan?.bulletNotes?.find((n) => n.id === noteId);
      const text = note?.text || 'Monthly note';
      set((state) => {
        const plan = getOrCreateMonthlyPlanFn(state, monthId);
        plan.bulletNotes = (plan.bulletNotes || []).filter((n) => n.id !== noteId);
        plan.updatedAt = new Date().toISOString();

        const updatedState: any = {
          monthlyPlans: { ...state.monthlyPlans, [monthId]: plan },
          dirtyMonthlyPlans: new Set(state.dirtyMonthlyPlans).add(monthId)
        };

        // Sync to Daily Plans (and recalculate score)
        Object.entries(state.dailyPlans).forEach(([dStr, dPlan]) => {
          if (dPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedDPlan = {
              ...dPlan,
              bulletNotes: dPlan.bulletNotes.filter((n) => n.id !== noteId),
              updatedAt: new Date().toISOString(),
            };
            updatedDPlan.score = calculateDailyScore(updatedDPlan);
            updatedState.dailyPlans = { ...(updatedState.dailyPlans || state.dailyPlans), [dStr]: updatedDPlan };
            updatedState.dirtyDailyPlans = new Set(updatedState.dirtyDailyPlans || state.dirtyDailyPlans).add(dStr);
          }
        });

        // Sync to Weekly Plans
        Object.entries(state.weeklyPlans).forEach(([wId, wPlan]) => {
          if (wPlan.bulletNotes?.some((n) => n.id === noteId)) {
            const updatedWPlan = {
              ...wPlan,
              bulletNotes: wPlan.bulletNotes.filter((n) => n.id !== noteId),
              updatedAt: new Date().toISOString(),
            };
            updatedState.weeklyPlans = { ...(updatedState.weeklyPlans || state.weeklyPlans), [wId]: updatedWPlan };
            updatedState.dirtyWeeklyPlans = new Set(updatedState.dirtyWeeklyPlans || state.dirtyWeeklyPlans).add(wId);
          }
        });

        return updatedState;
      });
      if (!silent) {
        get().showToast(`"${text.slice(0, 20)}${text.length > 20 ? '...' : ''}" deleted`, 'delete');
      }
      get().triggerSync();
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

if (isBrowser) {
  usePlannerStore.subscribe((state) => {
    saveLocalStorageData(state);
  });
}

