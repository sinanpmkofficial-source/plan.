'use client';
import React, { useState, useRef, useEffect } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import BulletNoteItem from './BulletNoteItem';
import { BULLET_TYPES } from '@/lib/constants';
import { format, addDays, isSameDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Cloud,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { QuickAddInput } from '../ui/QuickAddInput';
import DatePickerModal from '../ui/DatePickerModal';
import MomentumCard from './MomentumCard';
import CarryOverSection from './CarryOverSection';
import { NotebookPen } from 'lucide-react';

export default function DailyView() {
  const {
    selectedDate,
    setDate,
    getOrCreateDailyPlan,
    addBulletNote,
    updateBulletNote,
    toggleBulletNote,
    deleteBulletNote,
    moveBulletNote,
    updateDailyReflection,
    dailyPlans,
    syncStatus,
    retrySync,
  } = usePlannerStore();

  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');
  const [bulletInput, setBulletInput] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
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

  const weekStart = startOfWeek(parsedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(parsedDate, { weekStartsOn: 1 });
  const formattedWeekRange = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;

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
          
          {/* Cloud Sync Icon-only */}
          <div className="flex items-center justify-center">
            {syncStatus === 'syncing' ? (
              <span title="Saving...">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </span>
            ) : syncStatus === 'error' ? (
              <button
                onClick={retrySync}
                className="p-1 hover:bg-button-hover rounded-full text-rose-500 hover:text-rose-650 transition-colors cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                title="Sync Error - Click to Retry"
              >
                <RefreshCw className="w-4 h-4 animate-pulse" />
              </button>
            ) : (
              <span title="All changes saved">
                <Cloud className="w-4 h-4 text-neutral-400" />
              </span>
            )}
          </div>
        </div>

        {/* Date Jump picker button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-450 mr-2">
            {formattedWeekRange}
          </span>
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover border border-card-border rounded-full text-foreground/50 hover:text-foreground transition-all cursor-pointer"
            title="Pick a date"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          
          <DatePickerModal
            isOpen={isCalendarOpen}
            selectedDate={parsedDate}
            onSelect={(date) => setDate(format(date, 'yyyy-MM-dd'))}
            onClose={() => setIsCalendarOpen(false)}
            highlightType="week"
          />
        </div>
      </header>

      {/* Horizontal Date Slider (Borderless, full-width) */}
      <div className="w-full overflow-hidden select-none">
        <div
          ref={containerRef}
          className="flex gap-2.5 overflow-x-auto scrollbar-none py-2 px-1 w-full relative"
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
                    : 'bg-neutral-100 hover:bg-neutral-200 text-foreground border border-neutral-200/10'
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

      <div className="max-w-2xl mx-auto w-full space-y-5">
        <MomentumCard />

        <CarryOverSection />

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight text-foreground">Daily Log</h4>
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
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-foreground text-background shadow-none' : 'text-neutral-550 hover:text-foreground hover:bg-button-hover' }`}
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
              <div className="py-12 text-center text-neutral-400 text-sm font-bold">
                Daily Log is empty. Log a task, note, or event above!
              </div>
            ) : (
              plan.bulletNotes.map((note, index) => (
                <BulletNoteItem
                  key={note.id}
                  note={note}
                  onToggle={() => toggleBulletNote(selectedDate, note.id)}
                  onUpdate={(text) => updateBulletNote(selectedDate, note.id, text)}
                  onDelete={() => deleteBulletNote(selectedDate, note.id)}
                  onMoveUp={index > 0 ? () => moveBulletNote(selectedDate, note.id, 'up', 'daily') : undefined}
                  onMoveDown={index < plan.bulletNotes.length - 1 ? () => moveBulletNote(selectedDate, note.id, 'down', 'daily') : undefined}
                />
              ))
            )}
          </div>
        </div>

        {/* Daily Reflection */}
        <div className="space-y-2.5 pb-2">
          <h4 className="font-extrabold text-base tracking-tight text-foreground flex items-center gap-1.5">
            <NotebookPen className="w-4 h-4 text-neutral-500" />
            Reflection
          </h4>
          <textarea
            value={plan.reflection || ''}
            onChange={(e) => updateDailyReflection(selectedDate, e.target.value)}
            placeholder="How did today go? Wins, blockers, gratitude..."
            rows={4}
            className="w-full textarea-premium text-sm font-semibold resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
