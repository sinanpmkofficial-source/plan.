'use client';

import React from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { Check, Flame } from 'lucide-react';
import { PRAYERS_CONFIG } from '@/lib/constants';

export default function PrayerTracker() {
  const { selectedDate, getOrCreateDailyPlan, togglePrayer } = usePlannerStore();

  const plan = getOrCreateDailyPlan(selectedDate);
  const prayers = plan.prayers || { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };

  const completedCount = Object.values(prayers).filter(Boolean).length;

  return (
    <div className="card-premium p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h4 className="font-extrabold text-base tracking-tight">5-Time Prayer Tracker</h4>
        </div>
        <div className="flex items-center gap-1.5 bg-kbd-bg rounded-md py-1 px-3">
          <Flame className="w-3.5 h-3.5 text-foreground" />
          <span className="text-[10px] font-extrabold text-foreground uppercase tracking-wider">
            {completedCount} / 5
          </span>
        </div>
      </div>

      {/* Grid of 5 Prayers */}
      <div className="grid grid-cols-5 gap-2.5">
        {PRAYERS_CONFIG.map((item) => {
          const isDone = prayers[item.key];
          return (
            <button
              key={item.key}
              onClick={() => togglePrayer(selectedDate, item.key)}
              className={`flex flex-col items-center justify-between p-3 rounded-md border text-center transition-all duration-200 cursor-pointer select-none group relative overflow-hidden ${ isDone ? 'bg-black text-white border-black font-extrabold' : 'bg-white text-neutral-800 border-neutral-200 hover:border-black' }`}
            >
              <span className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${ isDone ? 'text-neutral-400 ' : 'text-neutral-500' }`}>
                {item.time}
              </span>
              <span className="text-xs md:text-sm font-bold mt-1 tracking-tight leading-none">
                {item.label}
              </span>

              {/* Square Checkbox Indicator */}
              <div className={`mt-2 w-4 h-4 rounded flex items-center justify-center transition-all border ${ isDone ? 'bg-white text-black border-white' : 'border-neutral-300 bg-transparent text-transparent group-hover:border-neutral-400' }`}>
                <Check className="w-2.5 h-2.5 stroke-[3.5]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
