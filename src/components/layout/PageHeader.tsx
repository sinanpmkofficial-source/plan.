'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { Loader2, Check, RefreshCw, Award, Info } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, children }: PageHeaderProps) {
  const {
    selectedDate,
    getOrCreateDailyPlan,
    syncStatus,
    syncErrorMsg,
    retrySync,
  } = usePlannerStore();

  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const dailyPlan = getOrCreateDailyPlan(selectedDate);
  const score = dailyPlan.score || 0;

  const prayersCount = Object.values(dailyPlan.prayers || {}).filter(Boolean).length;
  const prayerScore = prayersCount * 10;

  let taskScore = 50;
  if (dailyPlan.tasks && dailyPlan.tasks.length > 0) {
    const completedTasks = dailyPlan.tasks.filter((t) => t.completed).length;
    taskScore = Math.round((completedTasks / dailyPlan.tasks.length) * 50);
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--divider)] pb-5 mb-8">
      <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
        <div className="space-y-0.5">
          <h3 className="text-2xl font-black tracking-tight">{title}</h3>
        </div>
        {children}
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto select-none">
        {/* Sync Status Badge */}
        {syncStatus === 'syncing' && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-450 font-bold">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {syncStatus === 'saved' && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-450 font-bold">
            <Check className="w-3.5 h-3.5 text-neutral-450" />
            <span>Saved</span>
          </div>
        )}
        {syncStatus === 'error' && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-red-500 font-bold" title={syncErrorMsg || 'Sync Failed'}>
              Sync Error
            </span>
            <button
              onClick={retrySync}
              className="p-1 hover:bg-neutral-100 rounded-full text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Performance Score Badge */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowScoreInfo(true)}
            onMouseLeave={() => setShowScoreInfo(false)}
            onClick={() => setShowScoreInfo((prev) => !prev)}
            className="flex items-center gap-1.5 py-1 px-3 rounded-full border border-[var(--input-border)] bg-[var(--kbd-bg)] hover:bg-neutral-100 transition-all cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-neutral-900" />
            <span className="text-xs font-extrabold text-neutral-900">
              Score: {score}
            </span>
          </button>

          {/* Breakdown popup */}
          {showScoreInfo && (
            <div className="absolute right-0 mt-2.5 w-52 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 shadow-[var(--nav-shadow)] z-50 text-xs text-[var(--foreground)]">
              <h4 className="font-bold mb-2 flex items-center gap-1 border-b border-[var(--divider)] pb-1.5">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                <span>Score Breakdown</span>
              </h4>
              <div className="space-y-1.5 text-neutral-500 font-bold">
                <div className="flex justify-between">
                  <span>Prayers</span>
                  <span>{prayerScore}/50</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Tasks</span>
                  <span>{taskScore}/50</span>
                </div>
                <div className="border-t border-[var(--divider)] pt-1.5 flex justify-between font-extrabold text-[var(--foreground)]">
                  <span>Total Score</span>
                  <span>{score} / 100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
