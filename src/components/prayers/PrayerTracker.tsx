'use client';

import React from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { Check, Flame } from 'lucide-react';
import { PRAYERS_CONFIG } from '@/lib/constants';
import { motion } from 'framer-motion';

export default function PrayerTracker() {
  const { selectedDate, getOrCreateDailyPlan, togglePrayer } = usePlannerStore();

  const plan = getOrCreateDailyPlan(selectedDate);
  const prayers = plan.prayers || { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };

  const completedCount = Object.values(prayers).filter(Boolean).length;

  return (
    <div className="card-premium p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-base tracking-tight">5-Time Prayer Tracker</h4>
        <div className="flex items-center gap-1.5 bg-kbd-bg rounded-full py-1 px-3">
          <Flame className="w-3.5 h-3.5 text-foreground" />
          <span className="text-[10px] font-extrabold text-foreground uppercase tracking-wider">
            {completedCount} / 5
          </span>
        </div>
      </div>

      {/* Grid of 5 Prayers */}
      <div className="grid grid-cols-5 gap-2 select-none">
        {PRAYERS_CONFIG.map((item) => {
          const isDone = prayers[item.key];
          return (
            <motion.button
              key={item.key}
              onClick={() => togglePrayer(selectedDate, item.key)}
              whileTap={{ scale: 0.94 }}
              className={`flex flex-col items-center justify-between py-4 px-1 rounded-full transition-all duration-200 cursor-pointer text-center group relative overflow-hidden border-0 ${
                isDone
                  ? 'bg-foreground text-background font-black shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-foreground hover:bg-neutral-200 dark:hover:bg-[#1c1c1e]'
              }`}
            >
              <span className={`text-[8px] font-black uppercase tracking-wider transition-colors ${
                isDone ? 'text-background/60' : 'text-neutral-500'
              }`}>
                {item.time}
              </span>
              
              <span className="text-[11px] font-black mt-1 tracking-tight leading-none">
                {item.label}
              </span>

              {/* Circular Checkbox Indicator */}
              <div className={`mt-3.5 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                isDone
                  ? 'bg-background text-foreground'
                  : 'bg-foreground/5 text-transparent border border-neutral-300 dark:border-neutral-800 group-hover:border-foreground/30'
              }`}>
                <Check className="w-3 h-3 stroke-[3.5]" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
