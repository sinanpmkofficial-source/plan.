/**
 * Utility functions for date manipulations in the planner.
 */

export function getWeekIdFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getMonthIdFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function adjustDate(dateStr: string, delta: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

export function adjustMonth(monthStr: string, delta: number): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function adjustWeek(weekStr: string, delta: number): string {
  try {
    const [yearStr, weekNoStr] = weekStr.split('-W');
    const year = Number(yearStr);
    const week = Number(weekNoStr);
    
    const jan4 = new Date(year, 0, 4);
    const dayOffset = (jan4.getDay() || 7) - 1; // days since Monday
    const startOfWeek1 = new Date(jan4.getTime() - dayOffset * 24 * 60 * 60 * 1000);
    
    const currentWeekTime = startOfWeek1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000;
    const adjustedTime = currentWeekTime + delta * 7 * 24 * 60 * 60 * 1000;
    const d = new Date(adjustedTime);
    
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  } catch (e) {
    console.error(e);
    return weekStr;
  }
}
