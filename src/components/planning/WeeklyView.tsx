'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
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

  const completedWeekly = (plan.tasks || []).filter((t) => t.completed).length;
  const weeklyTotal = (plan.tasks || []).length;
  const progress = weeklyTotal > 0 ? Math.round((completedWeekly / weeklyTotal) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      {/* Page Header (Unifies title, navigation, sync status, and score badge) */}
      <PageHeader title={`Week ${selectedWeek.split('-W')[1]}, ${selectedWeek.split('-W')[0]}`}>
        <div className="flex items-center gap-1 bg-kbd-bg rounded-full p-1 shadow-none">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 transition-colors cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="week"
            value={selectedWeek}
            onChange={(e) => {
              if (e.target.value) setWeek(e.target.value);
            }}
            className="text-xs font-extrabold px-2 py-0.5 bg-transparent border-0 outline-none text-center cursor-pointer w-[125px]"
            style={{ color: '#111111', colorScheme: 'light' }}
          />
          <button
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 transition-colors cursor-pointer"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Weekly Objectives */}
        <div className="card-premium p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight">Weekly Objectives</h4>
            <span className="text-xs font-bold text-black select-none">
              {progress}% completed
            </span>
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
              <div className="py-10 text-center text-neutral-455 text-sm border border-dashed border-divider rounded-2xl">
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
                    className="flex items-start gap-2.5 text-left text-sm font-bold text-neutral-700 w-full cursor-pointer select-none"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-neutral-900 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-neutral-300 group-hover:text-neutral-550 shrink-0 mt-0.5" />
                    )}
                    <span className={task.completed ? 'text-neutral-400  line-through font-medium' : ''}>
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
