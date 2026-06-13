'use client';
import React, { useState, useRef, useEffect } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PrayerTracker from '../prayers/PrayerTracker';
import BulletNoteItem from './BulletNoteItem';
import { BULLET_TYPES } from '@/lib/constants';
import { format, addDays, isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Cloud,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { QuickAddInput } from '../ui/QuickAddInput';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 👋';
  if (hour < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
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
    dailyPlans,
    syncStatus,
    retrySync,
  } = usePlannerStore();

  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');
  const [bulletInput, setBulletInput] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  const plan = getOrCreateDailyPlan(selectedDate);

  const handleAddBullet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletInput.trim()) return;
    addBulletNote(selectedDate, bulletType, bulletInput.trim());
    setBulletInput('');
  };

  const bulletTasks = (plan.bulletNotes || []).filter((n) => n.type === 'task');
  const completedBullets = bulletTasks.filter((t) => t.completed).length;
  const progress = bulletTasks.length > 0 ? Math.round((completedBullets / bulletTasks.length) * 100) : 0;

  // Generate 15 days centered on selectedDate (7 before, current, 7 after)
  const parsedDate = parseISO(selectedDate);
  const sliderDays = Array.from({ length: 15 }, (_, i) => addDays(parsedDate, i - 7));

  // Auto-scroll selected date to center
  useEffect(() => {
    if (selectedRef.current && containerRef.current) {
      const container = containerRef.current;
      const selected = selectedRef.current;
      
      const scrollLeft = selected.offsetLeft - (container.offsetWidth / 2) + (selected.offsetWidth / 2);
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedDate]);

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-6 animate-in fade-in duration-200 text-foreground pb-10">
      
      {/* Brand Header */}
      <header className="flex items-center justify-between pb-2 select-none">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter leading-none">plan.</h1>
          
          {/* Cloud Sync badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight transition-all duration-300 border ${
            syncStatus === 'syncing'
              ? 'bg-neutral-800/40 border-neutral-700/50 text-neutral-400'
              : syncStatus === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400'
          }`}>
            {syncStatus === 'syncing' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                <span>Saving...</span>
              </>
            ) : syncStatus === 'error' ? (
              <button onClick={retrySync} className="flex items-center gap-1.5 text-red-400 cursor-pointer bg-transparent border-0 outline-none">
                <RefreshCw className="w-3 h-3 animate-pulse" />
                <span>Sync Error</span>
              </button>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-neutral-400" />
                <span>Cloud Sync</span>
              </>
            )}
          </div>
        </div>

        {/* Date Jump picker button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-450 mr-2">
            {format(parsedDate, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover border border-card-border rounded-full text-foreground/50 hover:text-foreground transition-all cursor-pointer"
            title="Pick a date"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <input
            type="date"
            ref={dateInputRef}
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) setDate(e.target.value);
            }}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            style={{ colorScheme: 'normal' }}
          />
        </div>
      </header>

      {/* Horizontal Date Slider (Borderless, full-width) */}
      <div className="w-full overflow-hidden select-none">
        <div
          ref={containerRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-2 px-1 scroll-smooth w-full relative"
        >
          {sliderDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayNum = format(day, 'd');
            const dayNameShort = format(day, 'eee').toUpperCase();
            const isSelected = isSameDay(day, parsedDate);
            const isTodayDate = isSameDay(day, new Date());
            
            // Check if this day has tasks/bullets
            const dayPlan = dailyPlans[dayStr];
            const hasNotes = dayPlan && dayPlan.bulletNotes && dayPlan.bulletNotes.length > 0;

            return (
              <button
                key={dayStr}
                ref={isSelected ? selectedRef : null}
                onClick={() => setDate(dayStr)}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer w-14 h-16 shrink-0 text-center ${
                  isSelected
                    ? 'bg-foreground text-background font-black scale-105 shadow-md z-10'
                    : 'bg-neutral-100 dark:bg-neutral-900/60 hover:bg-neutral-200 dark:hover:bg-[#1c1c1e] text-foreground border border-neutral-200/10'
                }`}
              >
                {/* Indicator Dot (Today / Has tasks) */}
                <div className="absolute top-1.5 flex gap-1 justify-center items-center w-full">
                  {isTodayDate && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                  {!isTodayDate && hasNotes && (
                    <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-background/50' : 'bg-foreground/30'}`} />
                  )}
                </div>

                <span className="text-sm font-extrabold tracking-tight mt-1">{dayNum}</span>
                <span className={`text-[9px] font-extrabold uppercase tracking-wider mt-0.5 ${
                  isSelected ? 'text-background/65' : 'text-foreground/45'
                }`}>
                  {dayNameShort}
                </span>
              </button>
            );
          })}
        </div>
      </div>

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
              <motion.button
                whileTap={{ scale: 0.98 }}
                key={type}
                type="button"
                onClick={() => setBulletType(type)}
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-foreground text-background shadow-none' : 'text-neutral-500 hover:text-foreground hover:bg-button-hover' }`}
              >
                {type === 'task' ? 'Task •' : type === 'note' ? 'Note —' : 'Event ○'}
              </motion.button>
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
