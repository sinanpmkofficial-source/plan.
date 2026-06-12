'use client';
import React, { useState, useRef } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
import PrayerTracker from '../prayers/PrayerTracker';
import BulletNoteItem from './BulletNoteItem';
import { BULLET_TYPES } from '@/lib/constants';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
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
  } = usePlannerStore();

  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');
  const [bulletInput, setBulletInput] = useState('');
  const dateInputRef = useRef<HTMLInputElement>(null);

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

  // Date slider helpers
  const parsedDate = parseISO(selectedDate);
  const startOfCurrentWeek = startOfWeek(parsedDate, { weekStartsOn: 1 }); // Starts on Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  const handlePrevWeek = () => {
    const prevWeekDate = format(addDays(parsedDate, -7), 'yyyy-MM-dd');
    setDate(prevWeekDate);
  };

  const handleNextWeek = () => {
    const nextWeekDate = format(addDays(parsedDate, 7), 'yyyy-MM-dd');
    setDate(nextWeekDate);
  };

  const formattedSubtitle = format(parsedDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-6 animate-in fade-in duration-200 text-foreground pb-10">
      <PageHeader title={getGreeting()} subtitle={formattedSubtitle} />

      {/* Horizontal Date Slider (Week View) */}
      <div className="card-premium p-4 select-none">
        <div className="flex items-center justify-between gap-2.5">
          {/* Prev week button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handlePrevWeek}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover rounded-full text-foreground/50 hover:text-foreground transition-all cursor-pointer shrink-0"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>

          {/* 7 Days container */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-between">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const dayNum = format(day, 'd');
              const dayNameShort = format(day, 'eee').toUpperCase();
              const isSelected = isSameDay(day, parsedDate);
              const isTodayDate = isSameDay(day, new Date());
              
              // Check if this day has tasks/bullets
              const dayPlan = dailyPlans[dayStr];
              const hasNotes = dayPlan && dayPlan.bulletNotes && dayPlan.bulletNotes.length > 0;

              return (
                <motion.button
                  key={dayStr}
                  onClick={() => setDate(dayStr)}
                  whileTap={{ scale: 0.95 }}
                  className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer flex-1 min-w-0 max-w-[56px] text-center ${
                    isSelected
                      ? 'bg-foreground text-background font-black scale-105 shadow-md z-10'
                      : 'bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-[#1c1c1e] text-foreground'
                  }`}
                >
                  {/* Indicator Dot (Today / Has tasks) */}
                  <div className="absolute top-1.5 flex gap-1 justify-center items-center w-full">
                    {isTodayDate && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    {!isTodayDate && hasNotes && (
                      <span className="w-1 h-1 rounded-full bg-foreground/30" />
                    )}
                  </div>

                  <span className="text-sm font-extrabold tracking-tight mt-1">{dayNum}</span>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-foreground/45 mt-0.5">{dayNameShort}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Next week chevron + native picker */}
          <div className="flex items-center gap-1 shrink-0">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleNextWeek}
              className="w-8 h-8 flex items-center justify-center hover:bg-button-hover rounded-full text-foreground/50 hover:text-foreground transition-all cursor-pointer"
              title="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>

            <div className="h-4 w-px bg-divider mx-0.5" />

            <div className="relative flex items-center">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => dateInputRef.current?.showPicker()}
                className="w-8 h-8 flex items-center justify-center hover:bg-button-hover rounded-full text-foreground/50 hover:text-foreground transition-all cursor-pointer"
                title="Pick specific date"
              >
                <CalendarIcon className="w-4 h-4" />
              </motion.button>
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
          </div>
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
