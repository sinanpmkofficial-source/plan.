'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  FileText,
} from 'lucide-react';

export default function MonthlyView() {
  const {
    selectedMonth,
    setMonth,
    getOrCreateMonthlyPlan,
    addMonthlyTask,
    toggleMonthlyTask,
    deleteMonthlyTask,
    updateMonthlyReflection,
  } = usePlannerStore();

  const [newTaskInput, setNewTaskInput] = useState('');

  const plan = getOrCreateMonthlyPlan(selectedMonth);

  const adjustMonth = (monthStr: string, delta: number) => {
    const [year, month] = monthStr.split('-').map(Number);
    const date = new Date(year, month - 1 + delta, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setMonth(adjustMonth(selectedMonth, -1));
  };

  const handleNextMonth = () => {
    setMonth(adjustMonth(selectedMonth, 1));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    addMonthlyTask(selectedMonth, newTaskInput.trim());
    setNewTaskInput('');
  };

  const formatMonthDisplay = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-[var(--foreground)]">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between border-b border-[var(--divider)] pb-5">
        <div className="space-y-1">
          <span className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-extrabold">Monthly Planning</span>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-neutral-800" />
            <span>{formatMonthDisplay(selectedMonth)}</span>
          </h3>
        </div>

        <div className="flex items-center gap-1 bg-[var(--kbd-bg)] rounded-full p-1.5 shadow-none">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-[var(--button-hover)] rounded-full text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs md:text-sm font-extrabold px-3 text-neutral-800 dark:text-neutral-200 text-center select-none">
            {selectedMonth}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-[var(--button-hover)] rounded-full text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Monthly Objectives */}
        <div className="card-premium p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight">Monthly Objectives</h4>
            <p className="text-xs md:text-sm text-neutral-500">Break down your long-term goals into monthly tasks.</p>
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder="Add monthly objective..."
              className="w-full input-premium text-sm py-2 font-semibold"
            />
            <button
              type="submit"
              className="button-premium w-10 h-10 rounded-full flex items-center justify-center p-0 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {plan.tasks.length === 0 ? (
              <div className="py-10 text-center text-neutral-455 dark:text-neutral-500 text-sm border border-dashed border-[var(--divider)] rounded-2xl">
                No monthly objectives defined.
              </div>
            ) : (
              plan.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 p-2 hover:bg-[var(--button-hover)] rounded-xl transition-colors group"
                >
                  <button
                    onClick={() => toggleMonthlyTask(selectedMonth, task.id)}
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
                  <button
                    onClick={() => deleteMonthlyTask(selectedMonth, task.id)}
                    className="p-1.5 hover:bg-[var(--kbd-bg)] text-neutral-455 hover:text-red-550 rounded-full transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Monthly Review & Reflections */}
        <div className="card-premium p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-neutral-550" />
              <span>Monthly Reflection</span>
            </h4>
            <p className="text-xs md:text-sm text-neutral-500">Record achievements, challenges, and core improvements.</p>
          </div>

          <textarea
            value={plan.reflection || ''}
            onChange={(e) => updateMonthlyReflection(selectedMonth, e.target.value)}
            placeholder="Write your reflection here... What worked? What needs adjustment?"
            rows={10}
            className="w-full input-premium text-sm font-semibold resize-none leading-relaxed p-3.5 rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
