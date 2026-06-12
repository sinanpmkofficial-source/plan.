'use client';
import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
import PrayerTracker from '../prayers/PrayerTracker';
import BulletNoteItem from './BulletNoteItem';
import { adjustDate } from '@/lib/date-utils';
import { BULLET_TYPES } from '@/lib/constants';
import { format } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { QuickAddInput } from '../ui/QuickAddInput';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 👋';
  if (hour < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

function getLocalDateSubtitle(): string {
  const now = new Date();
  return format(now, 'EEEE, d MMMM');
}

export default function DailyView() {
  const {
    selectedDate,
    setDate,
    getOrCreateDailyPlan,
    addBulletNote,
    updateBulletNote,
    toggleBulletNote,
    deleteBulletNote,
  } = usePlannerStore();

  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');
  const [bulletInput, setBulletInput] = useState('');

  const plan = getOrCreateDailyPlan(selectedDate);

  const handlePrevDay = () => setDate(adjustDate(selectedDate, -1));
  const handleNextDay = () => setDate(adjustDate(selectedDate, 1));

  const handleAddBullet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletInput.trim()) return;
    addBulletNote(selectedDate, bulletType, bulletInput.trim());
    setBulletInput('');
  };

  const bulletTasks = (plan.bulletNotes || []).filter((n) => n.type === 'task');
  const completedBullets = bulletTasks.filter((t) => t.completed).length;
  const progress = bulletTasks.length > 0 ? Math.round((completedBullets / bulletTasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      <PageHeader title={getGreeting()} subtitle={getLocalDateSubtitle()}>
        <div className="flex items-center gap-1 bg-kbd-bg rounded-full p-1 shadow-none">
          <button
            onClick={handlePrevDay}
            className="p-1.5 hover:bg-button-hover rounded-full text-foreground transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs font-extrabold px-2 py-0.5 bg-transparent border-0 outline-none text-center cursor-pointer w-[125px] text-foreground"
            style={{ colorScheme: 'normal' }}
          />
          <button
            onClick={handleNextDay}
            className="p-1.5 hover:bg-button-hover rounded-full text-foreground transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="card-premium p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight">Daily Log</h4>
            <span className="text-xs font-bold text-neutral-500 select-none">
              {progress}% completed
            </span>
          </div>

          <div className="bg-kbd-bg p-1 rounded-full flex gap-1 text-xs font-bold select-none">
            {BULLET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBulletType(type)}
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-foreground text-background shadow-none' : 'text-neutral-500 hover:text-foreground hover:bg-button-hover' }`}
              >
                {type === 'task' ? 'Task •' : type === 'note' ? 'Note —' : 'Event ○'}
              </button>
            ))}
          </div>

          <QuickAddInput
            value={bulletInput}
            onChange={setBulletInput}
            onSubmit={handleAddBullet}
            placeholder={`Log ${bulletType}...`}
          />

          <div className="space-y-1.5">
            {plan.bulletNotes.length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-divider rounded-lg font-bold">
                Daily Log is empty. Add a task or note above!
              </div>
            ) : (
              plan.bulletNotes.map((note) => (
                <BulletNoteItem
                  key={note.id}
                  note={note}
                  onToggle={() => toggleBulletNote(selectedDate, note.id)}
                  onUpdate={(text) => updateBulletNote(selectedDate, note.id, text)}
                  onDelete={() => deleteBulletNote(selectedDate, note.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-8">
          <PrayerTracker />
        </div>
      </div>
    </div>
  );
}
