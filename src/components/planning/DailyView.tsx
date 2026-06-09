'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PrayerTracker from '../prayers/PrayerTracker';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  FileText,
  CalendarDays,
} from 'lucide-react';

export default function DailyView() {
  const {
    selectedDate,
    setDate,
    getOrCreateDailyPlan,
    addDailyTask,
    toggleDailyTask,
    deleteDailyTask,
    addBulletNote,
    toggleBulletNote,
    deleteBulletNote,
    updateDailyReflection,
  } = usePlannerStore();

  const [newTaskInput, setNewTaskInput] = useState('');
  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');
  const [bulletInput, setBulletInput] = useState('');

  const plan = getOrCreateDailyPlan(selectedDate);

  const adjustDate = (dateStr: string, delta: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + delta);
    return d.toISOString().split('T')[0];
  };

  const handlePrevDay = () => {
    setDate(adjustDate(selectedDate, -1));
  };

  const handleNextDay = () => {
    setDate(adjustDate(selectedDate, 1));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    addDailyTask(selectedDate, newTaskInput.trim());
    setNewTaskInput('');
  };

  const handleAddBullet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletInput.trim()) return;
    addBulletNote(selectedDate, bulletType, bulletInput.trim());
    setBulletInput('');
  };

  const formatDayDisplay = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];
    if (dateStr === today) return 'Today';
    
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-[var(--foreground)]">
      {/* Date Navigation Header */}
      <div className="flex items-center justify-between border-b border-[var(--divider)] pb-5">
        <div className="space-y-1">
          <span className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-extrabold">Daily Planning</span>
          <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-neutral-855" />
            <span>{formatDayDisplay(selectedDate)}</span>
          </h3>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-1.5 bg-[var(--kbd-bg)] rounded-full p-1.5 shadow-none">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-[var(--button-hover)] rounded-full text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs md:text-sm font-extrabold px-2 py-0.5 text-neutral-800 dark:text-neutral-200 bg-transparent border-0 outline-hidden text-center cursor-pointer select-none"
          />
          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-[var(--button-hover)] rounded-full text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Focus Tasks & Prayers */}
        <div className="space-y-8">
          {/* Daily Tasks Card */}
          <div className="card-premium p-6 space-y-5">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base tracking-tight">Focus Tasks</h4>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-450">Main objectives you must execute today.</p>
            </div>

            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="Add focus task..."
                className="w-full input-premium text-sm py-2 font-semibold"
              />
              <button
                type="submit"
                className="button-premium w-10 h-10 rounded-full flex items-center justify-center p-0 shrink-0 cursor-pointer"
                title="Add task"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
              {plan.tasks.length === 0 ? (
                <div className="py-10 text-center text-neutral-400 dark:text-neutral-550 text-sm border border-dashed border-[var(--divider)] rounded-2xl">
                  No focus tasks defined.
                </div>
              ) : (
                plan.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between gap-3 p-2 hover:bg-[var(--button-hover)] rounded-xl transition-colors group"
                  >
                    <button
                      onClick={() => toggleDailyTask(selectedDate, task.id)}
                      className="flex items-start gap-2.5 text-left text-sm font-bold text-neutral-700 dark:text-neutral-350 w-full cursor-pointer select-none"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-neutral-900 dark:text-neutral-100 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-4.5 h-4.5 text-neutral-350 dark:text-neutral-600 group-hover:text-neutral-500 shrink-0 mt-0.5" />
                      )}
                      <span className={task.completed ? 'text-neutral-400 dark:text-neutral-500 line-through font-medium' : ''}>
                        {task.text}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteDailyTask(selectedDate, task.id)}
                      className="p-1.5 hover:bg-[var(--kbd-bg)] text-neutral-450 hover:text-red-550 rounded-full transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Prayer Tracker */}
          <PrayerTracker />
        </div>

        {/* Right Column: Bullet Journal & Reflections */}
        <div className="space-y-8">
          {/* Bullet Journal Block */}
          <div className="card-premium p-6 space-y-5">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base tracking-tight">Bullet Journal</h4>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-450">
                Log quick thoughts as: task <span className="font-bold">•</span>, note <span className="font-bold">—</span>, or event <span className="font-bold">○</span>.
              </p>
            </div>

            {/* iOS style Segmented Control Selector */}
            <div className="bg-[var(--kbd-bg)] p-1 rounded-full flex gap-1 text-xs font-bold select-none">
              {(['task', 'note', 'event'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setBulletType(type)}
                  className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${
                    bulletType === type
                      ? 'bg-white text-neutral-950 dark:bg-neutral-800 dark:text-white shadow-xs'
                      : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
                  }`}
                >
                  {type === 'task' ? 'Task •' : type === 'note' ? 'Note —' : 'Event ○'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddBullet} className="flex gap-2">
              <input
                type="text"
                value={bulletInput}
                onChange={(e) => setBulletInput(e.target.value)}
                placeholder={
                  bulletType === 'task'
                    ? 'Log action item...'
                    : bulletType === 'note'
                    ? 'Log general observation...'
                    : 'Log event or meeting...'
                }
                className="w-full input-premium text-sm py-2 font-semibold"
              />
              <button
                type="submit"
                className="button-premium w-10 h-10 rounded-full flex items-center justify-center p-0 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
              {plan.bulletNotes.length === 0 ? (
                <div className="py-10 text-center text-neutral-400 dark:text-neutral-550 text-sm border border-dashed border-[var(--divider)] rounded-2xl">
                  Bullet journal is empty.
                </div>
              ) : (
                plan.bulletNotes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between gap-3 px-2 py-1.5 hover:bg-[var(--button-hover)] rounded-xl transition-colors group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      {/* Bullet Icon Symbol */}
                      {note.type === 'task' && (
                        <button
                          onClick={() => toggleBulletNote(selectedDate, note.id)}
                          className="shrink-0 mt-0.5 focus:outline-hidden cursor-pointer"
                        >
                          {note.completed ? (
                            <span className="w-4 h-4 border border-neutral-900 dark:border-neutral-100 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-950 rounded-full flex items-center justify-center text-[10px] font-bold">✓</span>
                          ) : (
                            <span className="w-4 h-4 border border-neutral-300 dark:border-neutral-600 hover:border-neutral-500 dark:hover:border-neutral-400 rounded-full block" />
                          )}
                        </button>
                      )}
                      {note.type === 'note' && (
                        <span className="text-neutral-400 select-none font-bold mt-0.5 shrink-0">—</span>
                      )}
                      {note.type === 'event' && (
                        <span className="text-neutral-800 dark:text-neutral-250 select-none font-bold mt-0.5 shrink-0">○</span>
                      )}

                      <span
                        className={`text-sm break-words leading-relaxed font-bold ${
                          note.type === 'task' && note.completed
                            ? 'text-neutral-400 dark:text-neutral-500 line-through font-medium'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {note.text}
                      </span>
                    </div>

                    <button
                      onClick={() => deleteBulletNote(selectedDate, note.id)}
                      className="p-1 hover:bg-[var(--kbd-bg)] text-neutral-400 dark:text-neutral-550 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Daily Reflection Journal Block */}
          <div className="card-premium p-6 space-y-4">
            <div className="space-y-1">
              <h4 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-neutral-550" />
                <span>Daily Reflection (+10 Points)</span>
              </h4>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-450">Record reflections or core insights of the day.</p>
            </div>

            <textarea
              value={plan.reflection || ''}
              onChange={(e) => updateDailyReflection(selectedDate, e.target.value)}
              placeholder="What did you learn today? What are you grateful for?"
              rows={4}
              className="w-full input-premium text-sm font-semibold resize-none leading-relaxed p-3.5 rounded-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
