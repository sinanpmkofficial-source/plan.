'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
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
import AssignDateButton from './AssignDateButton';

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

  const completedMonthly = (plan.tasks || []).filter((t) => t.completed).length;
  const monthlyTotal = (plan.tasks || []).length;
  const progress = monthlyTotal > 0 ? Math.round((completedMonthly / monthlyTotal) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      {/* Page Header (Unifies title, navigation, sync status, and score badge) */}
      <PageHeader title="Monthly Plan">
        <div className="flex items-center gap-1 bg-kbd-bg rounded-full p-1 shadow-none">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs font-extrabold px-2 py-0.5 bg-transparent border-0 outline-none text-center cursor-pointer w-[95px]"
            style={{ color: '#111111', colorScheme: 'light' }}
          />
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Monthly Objectives */}
        <div className="card-premium p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight">Monthly Objectives</h4>
            <span className="text-xs font-bold text-black select-none">
              {progress}% completed
            </span>
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
              style={{ padding: 0 }}
            >
              <Plus className="w-4 h-4" color="white" stroke="white" />
            </button>
          </form>

          <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
            {plan.tasks.length === 0 ? (
              <div className="py-10 text-center text-neutral-455 text-sm border border-dashed border-divider rounded-2xl">
                No monthly objectives defined.
              </div>
            ) : (
              plan.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between gap-3 p-2 hover:bg-neutral-50 rounded-xl transition-colors group"
                >
                  <button
                    onClick={() => toggleMonthlyTask(selectedMonth, task.id)}
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
                      onClick={() => deleteMonthlyTask(selectedMonth, task.id)}
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

        {/* Right Column: Monthly Review & Reflections */}
        <div className="card-premium p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-neutral-550" />
              <span>Monthly Reflection</span>
            </h4>
          </div>

          <textarea
            value={plan.reflection || ''}
            onChange={(e) => updateMonthlyReflection(selectedMonth, e.target.value)}
            placeholder="Write your reflection here... What worked? What needs adjustment?"
            rows={10}
            className="w-full textarea-premium text-sm font-semibold resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
