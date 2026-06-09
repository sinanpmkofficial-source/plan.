export interface BrainDumpItem {
  id: string;
  text: string;
  status: 'inbox' | 'converted';
  convertedTo: 'task' | 'goal' | 'weekly' | 'monthly' | null;
  convertedAt: string | null; // ISO string
  createdAt: string; // ISO string
}

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface GoalItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  milestones: Milestone[];
  createdAt: string; // ISO string
}

export interface BulletNote {
  id: string;
  type: 'task' | 'note' | 'event';
  text: string;
  completed?: boolean;
}

export interface DailyPlan {
  date: string; // YYYY-MM-DD
  tasks: { id: string; text: string; completed: boolean }[];
  bulletNotes: BulletNote[];
  prayers: {
    fajr: boolean;
    dhuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
  reflection: string;
  score: number;
  updatedAt: string; // ISO string
}

export interface WeeklyPlan {
  weekId: string; // YYYY-Www (e.g., 2026-W24)
  tasks: { id: string; text: string; completed: boolean }[];
  bulletNotes: BulletNote[];
  reflection: string;
  updatedAt: string; // ISO string
}

export interface MonthlyPlan {
  monthId: string; // YYYY-MM
  tasks: { id: string; text: string; completed: boolean }[];
  bulletNotes: BulletNote[];
  reflection: string;
  updatedAt: string; // ISO string
}

export interface SyncPayload {
  brainDump: BrainDumpItem[];
  goals: GoalItem[];
  dailyPlans: Record<string, DailyPlan>;
  weeklyPlans: Record<string, WeeklyPlan>;
  monthlyPlans: Record<string, MonthlyPlan>;
}
