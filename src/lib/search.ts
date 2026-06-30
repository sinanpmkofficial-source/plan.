import {
  BrainDumpItem,
  GoalItem,
  DailyPlan,
  WeeklyPlan,
  MonthlyPlan,
} from '@/types/planner';

export type SearchResultKind =
  | 'daily'
  | 'reflection'
  | 'weekly'
  | 'monthly'
  | 'goal'
  | 'braindump';

export interface SearchResult {
  key: string;
  kind: SearchResultKind;
  text: string;
  tags: string[];
  route: string;
  date?: string;
  weekId?: string;
  monthId?: string;
  completed?: boolean;
  sortKey: string;
}

export interface SearchData {
  brainDump: BrainDumpItem[];
  goals: GoalItem[];
  dailyPlans: Record<string, DailyPlan>;
  weeklyPlans: Record<string, WeeklyPlan>;
  monthlyPlans: Record<string, MonthlyPlan>;
}

const TAG_RE = /#[\p{L}\p{N}_-]+/gu;

/** Extract unique, lowercased #hashtags from a string. */
export function extractTags(text: string): string[] {
  const matches = text.match(TAG_RE) || [];
  return Array.from(new Set(matches.map((t) => t.toLowerCase())));
}

/** Case-insensitive substring search across every text field in the planner. */
export function searchAll(data: SearchData, rawQuery: string): SearchResult[] {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return [];

  const matches = (text?: string) => !!text && text.toLowerCase().includes(q);
  const results: SearchResult[] = [];

  Object.values(data.dailyPlans).forEach((p) => {
    (p.bulletNotes || []).forEach((n) => {
      if (matches(n.text)) {
        results.push({
          key: `d:${p.date}:${n.id}`,
          kind: 'daily',
          text: n.text,
          tags: extractTags(n.text),
          route: '/',
          date: p.date,
          completed: n.type === 'task' ? n.completed : undefined,
          sortKey: p.date,
        });
      }
    });
    if (matches(p.reflection)) {
      results.push({
        key: `dr:${p.date}`,
        kind: 'reflection',
        text: p.reflection,
        tags: extractTags(p.reflection),
        route: '/',
        date: p.date,
        sortKey: p.date,
      });
    }
  });

  Object.values(data.weeklyPlans).forEach((p) => {
    (p.bulletNotes || []).forEach((n) => {
      if (matches(n.text)) {
        results.push({
          key: `w:${p.weekId}:${n.id}`,
          kind: 'weekly',
          text: n.text,
          tags: extractTags(n.text),
          route: '/weekly',
          weekId: p.weekId,
          completed: n.type === 'task' ? n.completed : undefined,
          sortKey: p.weekId,
        });
      }
    });
    if (matches(p.reflection)) {
      results.push({
        key: `wr:${p.weekId}`,
        kind: 'reflection',
        text: p.reflection,
        tags: extractTags(p.reflection),
        route: '/weekly',
        weekId: p.weekId,
        sortKey: p.weekId,
      });
    }
  });

  Object.values(data.monthlyPlans).forEach((p) => {
    (p.bulletNotes || []).forEach((n) => {
      if (matches(n.text)) {
        results.push({
          key: `m:${p.monthId}:${n.id}`,
          kind: 'monthly',
          text: n.text,
          tags: extractTags(n.text),
          route: '/monthly',
          monthId: p.monthId,
          completed: n.type === 'task' ? n.completed : undefined,
          sortKey: p.monthId,
        });
      }
    });
    if (matches(p.reflection)) {
      results.push({
        key: `mr:${p.monthId}`,
        kind: 'reflection',
        text: p.reflection,
        tags: extractTags(p.reflection),
        route: '/monthly',
        monthId: p.monthId,
        sortKey: p.monthId,
      });
    }
  });

  data.goals.forEach((g) => {
    const haystack = [
      g.title,
      g.description,
      ...g.milestones.map((m) => m.title),
      ...g.milestones.flatMap((m) => (m.actionItems || []).map((a) => a.title)),
    ].join(' ');
    if (matches(haystack)) {
      results.push({
        key: `g:${g.id}`,
        kind: 'goal',
        text: g.title,
        tags: extractTags(haystack),
        route: '/goals',
        sortKey: g.createdAt,
      });
    }
  });

  data.brainDump.forEach((b) => {
    if (matches(b.text)) {
      results.push({
        key: `b:${b.id}`,
        kind: 'braindump',
        text: b.text,
        tags: extractTags(b.text),
        route: '/braindump',
        sortKey: b.createdAt,
      });
    }
  });

  results.sort((a, b) => (a.sortKey < b.sortKey ? 1 : a.sortKey > b.sortKey ? -1 : 0));
  return results.slice(0, 60);
}

/** Most-used tags across the whole planner, for quick-filter chips. */
export function popularTags(data: SearchData, limit = 14): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  const add = (text?: string) => {
    if (!text) return;
    extractTags(text).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
  };

  Object.values(data.dailyPlans).forEach((p) => {
    (p.bulletNotes || []).forEach((n) => add(n.text));
    add(p.reflection);
  });
  Object.values(data.weeklyPlans).forEach((p) => {
    (p.bulletNotes || []).forEach((n) => add(n.text));
    add(p.reflection);
  });
  Object.values(data.monthlyPlans).forEach((p) => {
    (p.bulletNotes || []).forEach((n) => add(n.text));
    add(p.reflection);
  });
  data.brainDump.forEach((b) => add(b.text));
  data.goals.forEach((g) => {
    add(g.title);
    add(g.description);
  });

  return Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
