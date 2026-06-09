'use client';
import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
import PrayerTracker from '../prayers/PrayerTracker';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from 'lucide-react';

export default function DailyView() {
  const {
    selectedDate,
    setDate,
    getOrCreateDailyPlan,
    addBulletNote,
    toggleBulletNote,
    deleteBulletNote,
  } = usePlannerStore();

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
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-[var(--foreground)] pb-10">
      {/* Page Header (Unifies title, navigation, sync status, and score badge) */}
      <PageHeader title={formatDayDisplay(selectedDate)}>
        <div className="flex items-center gap-1 bg-[var(--kbd-bg)] rounded-full p-1 shadow-none">
          <button
            onClick={handlePrevDay}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 dark:text-neutral-450 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs font-extrabold px-2 py-0.5 bg-transparent border-0 outline-none text-center cursor-pointer w-[125px]"
            style={{ color: '#111111', colorScheme: 'light' }}
          />
          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 dark:text-neutral-450 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Bullet Journal Daily Log */}
        <div className="card-premium p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight">Daily Log</h4>
            <p className="text-xs md:text-sm text-neutral-500">
              Log entries: task <span className="font-bold">•</span>, note <span className="font-bold">—</span>, or event <span className="font-bold">○</span>.
            </p>
          </div>

          {/* Segmented Control Selector */}
          <div className="bg-[var(--kbd-bg)] p-1 rounded-full flex gap-1 text-xs font-bold select-none">
            {(['task', 'note', 'event'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBulletType(type)}
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${
                  bulletType === type
                    ? 'bg-white text-neutral-950 dark:bg-neutral-800 dark:text-white shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-700'
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
              <Plus className="w-4 h-4" color="white" stroke="white" />
            </button>
          </form>

          <div className="space-y-1.5 max-h-[350px] overflow-y-auto pr-1">
            {plan.bulletNotes.length === 0 ? (
              <div className="py-12 text-center text-neutral-450 text-sm border border-dashed border-[var(--divider)] rounded-2xl font-bold">
                Daily Log is empty. Add a task or note above!
              </div>
            ) : (
              plan.bulletNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-3 px-2 py-1.5 hover:bg-neutral-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Checkbox or bullet icon type indicator */}
                    {note.type === 'task' && (
                      <button
                        onClick={() => toggleBulletNote(selectedDate, note.id)}
                        className="shrink-0 mt-0.5 focus:outline-hidden cursor-pointer"
                      >
                        {note.completed ? (
                          <span className="w-4 h-4 border border-neutral-900 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</span>
                        ) : (
                          <span className="w-4 h-4 border border-neutral-300 hover:border-neutral-500 rounded-full block" />
                        )}
                      </button>
                    )}
                    {note.type === 'note' && (
                      <span className="text-neutral-400 select-none font-bold mt-0.5 shrink-0">—</span>
                    )}
                    {note.type === 'event' && (
                      <span className="text-neutral-850 select-none font-bold mt-0.5 shrink-0">○</span>
                    )}

                    <span
                      className={`text-sm break-words leading-relaxed font-bold ${
                        note.type === 'task' && note.completed
                          ? 'text-neutral-400 line-through font-medium'
                          : 'text-neutral-850'
                      }`}
                    >
                      {note.text}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteBulletNote(selectedDate, note.id)}
                    className="p-1 hover:bg-neutral-100 text-neutral-450 hover:text-red-500 rounded-full transition-colors opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Spiritual Prayer Tracker */}
        <div className="space-y-8">
          <PrayerTracker />
        </div>
      </div>
    </div>
  );
}
