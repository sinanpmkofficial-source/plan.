'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  FileText,
} from 'lucide-react';
import AssignDateButton from './AssignDateButton';

export default function WeeklyView() {
  const {
    selectedWeek,
    setWeek,
    getOrCreateWeeklyPlan,
    addWeeklyTask,
    toggleWeeklyTask,
    deleteWeeklyTask,
    updateWeeklyReflection,
  } = usePlannerStore();

  const [newTaskInput, setNewTaskInput] = useState('');

  const plan = getOrCreateWeeklyPlan(selectedWeek);

  const adjustWeek = (weekStr: string, delta: number) => {
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
  };

  const handlePrevWeek = () => {
    setWeek(adjustWeek(selectedWeek, -1));
  };

  const handleNextWeek = () => {
    setWeek(adjustWeek(selectedWeek, 1));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    addWeeklyTask(selectedWeek, newTaskInput.trim());
    setNewTaskInput('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-[var(--foreground)]">
      {/* Week Navigation Header */}
      <div className="flex items-center justify-between border-b border-[var(--divider)] pb-5">
        <div className="space-y-1">
          <span className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-extrabold">Weekly Planning</span>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-neutral-800" />
            <span>Week Planning</span>
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-[var(--kbd-bg)] rounded-full p-1.5 shadow-none">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs md:text-sm font-extrabold px-3 text-neutral-800 dark:text-neutral-200 text-center select-none">
            {selectedWeek}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Weekly Objectives */}
        <div className="card-premium p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight">Weekly Objectives</h4>
            <p className="text-xs md:text-sm text-neutral-500">List core priorities and actionable tasks for this week.</p>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Add weekly task..."
              className="w-full input-premium text-sm py-2 font-semibold"
            />
            <button
              type="submit"
              className="button-premium w-10 h-10 rounded-full flex items-center justify-center p-0 shrink-0 cursor-pointer"
              style={{ padding: 0 }}
            >
              <Plus className="w-4 h-4" color="white" stroke="white" />
            </button>
          </form>

          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {plan.tasks.length === 0 ? (
              <div className="py-10 text-center text-neutral-455 dark:text-neutral-500 text-sm border border-dashed border-[var(--divider)] rounded-2xl">
                No weekly tasks defined.
              </div>
            ) : (
              plan.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 p-2 hover:bg-neutral-50 rounded-xl transition-colors group"
                >
                  <button
                    onClick={() => toggleWeeklyTask(selectedWeek, task.id)}
                    className="flex items-start gap-2.5 text-left text-sm font-bold text-neutral-700 dark:text-neutral-300 w-full cursor-pointer select-none"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-neutral-900 dark:text-neutral-100 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-550 shrink-0 mt-0.5" />
                    )}
                    <span className={task.completed ? 'text-neutral-400 dark:text-neutral-505 line-through font-medium' : ''}>
                      {task.text}
                    </span>
                  </button>
                  
                  <div className="flex items-center gap-1 shrink-0">
                    <AssignDateButton taskText={task.text} />

                    <button
                      onClick={() => deleteWeeklyTask(selectedWeek, task.id)}
                      className="p-1.5 hover:bg-neutral-100 text-neutral-455 hover:text-red-550 rounded-full transition-colors shrink-0 cursor-pointer"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Weekly Reflections */}
        <div className="card-premium p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-neutral-550" />
              <span>Weekly Reflection</span>
            </h4>
            <p className="text-xs md:text-sm text-neutral-500">Log reflections, check goals alignment, and track improvements.</p>
          </div>

          <textarea
            value={plan.reflection || ''}
            onChange={(e) => updateWeeklyReflection(selectedWeek, e.target.value)}
            placeholder="Review this week. What was achieved? What challenges occurred?"
            rows={10}
            className="w-full textarea-premium text-sm font-semibold resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
