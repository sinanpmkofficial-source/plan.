'use client';

import React from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { DailyPlan } from '@/types/planner';
import { Check, Flame } from 'lucide-react';

export default function PrayerTracker() {
  const { selectedDate, getOrCreateDailyPlan, togglePrayer } = usePlannerStore();

  const plan = getOrCreateDailyPlan(selectedDate);
  const prayers = plan.prayers || { fajr: false, dhuhr: false, isha: false, asr: false, maghrib: false };

  const prayerItems: { key: keyof DailyPlan['prayers']; label: string; time: string }[] = [
    { key: 'fajr', label: 'Fajr', time: 'Dawn' },
    { key: 'dhuhr', label: 'Dhuhr', time: 'Noon' },
    { key: 'asr', label: 'Asr', time: 'After' },
    { key: 'maghrib', label: 'Maghrib', time: 'Sunset' },
    { key: 'isha', label: 'Isha', time: 'Night' },
  ];

  const completedCount = Object.values(prayers).filter(Boolean).length;

  return (
    <div className="card-premium p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="font-extrabold text-base tracking-tight">5-Time Prayer Tracker</h4>
          <p className="text-xs md:text-sm text-neutral-500">Log prayers daily to maintain consistency.</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[var(--kbd-bg)] rounded-full py-1 px-3">
          <Flame className="w-3.5 h-3.5 text-[var(--foreground)]" />
          <span className="text-[10px] font-extrabold text-[var(--foreground)] uppercase tracking-wider">
            {completedCount} / 5 Done
          </span>
        </div>
      </div>

      {/* Grid of 5 Prayers */}
      <div className="grid grid-cols-5 gap-2.5">
        {prayerItems.map((item) => {
          const isDone = prayers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => togglePrayer(selectedDate, item.key)}
              className={`flex flex-col items-center justify-between p-3 rounded-2xl border-none text-center transition-all duration-300 cursor-pointer select-none group relative overflow-hidden ${
                isDone
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-xs scale-102 font-extrabold'
                  : 'bg-[var(--kbd-bg)] text-neutral-700 dark:text-neutral-400 hover:bg-[var(--scroll-thumb)]'
              }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${
                isDone ? 'text-neutral-400 dark:text-neutral-550' : 'text-neutral-500'
              }`}>
                {item.time}
              </span>
              <span className="text-xs md:text-sm font-bold mt-1 tracking-tight leading-none">
                {item.label}
              </span>

              {/* Pill Indicator */}
              <div className={`mt-2 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                isDone
                  ? 'bg-white text-neutral-955 dark:bg-neutral-900 dark:text-white'
                  : 'bg-neutral-250/20 dark:bg-neutral-800/40 text-transparent group-hover:scale-105'
              }`}>
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
