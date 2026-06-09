'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
import {
  MapPin,
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
  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');

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
    addMonthlyTask(selectedMonth, bulletType, newTaskInput.trim());
    setNewTaskInput('');
  };

  const bulletTasks = (plan.bulletNotes || []).filter((n) => n.type === 'task');
  const completedMonthly = bulletTasks.filter((t) => t.completed).length;
  const progress = bulletTasks.length > 0 ? Math.round((completedMonthly / bulletTasks.length) * 100) : 0;

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
        {/* Left Column: Monthly Log */}
        <div className="card-premium p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight">Monthly Log</h4>
            <span className="text-xs font-bold text-black select-none">
              {progress}% completed
            </span>
          </div>

          {/* Segmented Control Selector */}
          <div className="bg-kbd-bg p-1 rounded-full flex gap-1 text-xs font-bold select-none">
            {(['task', 'note', 'event'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBulletType(type)}
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-white text-neutral-955 shadow-xs' : 'text-neutral-500 hover:text-neutral-700' }`}
              >
                {type === 'task' ? 'Task •' : type === 'note' ? 'Note —' : 'Event ○'}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder={
                bulletType === 'task'
                  ? 'Add monthly task...'
                  : bulletType === 'note'
                  ? 'Add monthly note...'
                  : 'Add monthly event...'
              }
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

          <div className="space-y-1.5">
            {(plan.bulletNotes || []).length === 0 ? (
              <div className="py-12 text-center text-neutral-455 text-sm border border-dashed border-divider rounded-2xl font-bold">
                Monthly Log is empty. Add a task or note above!
              </div>
            ) : (
              (plan.bulletNotes || []).map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-3 px-2 py-1.5 hover:bg-neutral-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Checkbox or bullet icon type indicator */}
                    {note.type === 'task' && (
                      <button
                        onClick={() => toggleMonthlyTask(selectedMonth, note.id)}
                        className="shrink-0 focus:outline-hidden cursor-pointer"
                      >
                        {note.completed ? (
                          <span className="w-4 h-4 border border-neutral-900 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</span>
                        ) : (
                          <span className="w-4 h-4 border border-neutral-300 hover:border-neutral-500 rounded-full block" />
                        )}
                      </button>
                    )}
                    {note.type === 'note' && (
                      <span className="text-neutral-400 select-none font-bold shrink-0">—</span>
                    )}
                    {note.type === 'event' && (
                      <MapPin className="w-4 h-4 text-neutral-800 shrink-0" />
                    )}

                    <span
                      onClick={note.type === 'task' ? () => toggleMonthlyTask(selectedMonth, note.id) : undefined}
                      className={`text-sm break-words leading-relaxed font-bold ${ note.type === 'task' ? 'cursor-pointer hover:text-neutral-650 select-none' : '' } ${ note.type === 'task' && note.completed ? 'text-neutral-400 line-through font-medium' : 'text-neutral-850' }`}
                    >
                      {note.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <AssignDateButton
                      taskText={note.text}
                      onAssign={() => deleteMonthlyTask(selectedMonth, note.id)}
                    />
                    <button
                      onClick={() => deleteMonthlyTask(selectedMonth, note.id)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 text-neutral-455 hover:text-red-550 rounded-full transition-colors shrink-0 cursor-pointer"
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
