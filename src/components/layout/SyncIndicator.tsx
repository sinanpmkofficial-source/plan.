'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import {
  Loader2,
  RefreshCw,
  Award,
  Check,
  Info,
  Cloud,
} from 'lucide-react';

export default function SyncIndicator() {
  const {
    currentView,
    selectedDate,
    getOrCreateDailyPlan,
    syncStatus,
    syncErrorMsg,
    retrySync,
  } = usePlannerStore();

  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const dailyPlan = getOrCreateDailyPlan(selectedDate);
  const score = dailyPlan.score || 0;

  const viewTitles: Record<string, string> = {
    daily: 'Today Page',
    braindump: 'Brain Dump Inbox',
    goals: 'Goals System',
    weekly: 'Weekly Planning',
    monthly: 'Monthly Planning',
    analytics: 'Performance Analytics',
  };

  const bulletTasks = (dailyPlan.bulletNotes || []).filter((n) => n.type === 'task');
  const completedCount = bulletTasks.filter((t) => t.completed).length;
  const totalCount = bulletTasks.length;

  return (
    <header className="h-16 border-b border-divider bg-card-bg px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-300">
      <div>
        <h2 className="font-semibold text-sm md:text-base text-foreground tracking-tight">
          {viewTitles[currentView] || 'Planner'}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Sync Status Badge (Icon-only) */}
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

        {/* Dynamic Performance Score Badge */}
        <div className="relative">
          <button
            onMouseEnter={() => setShowScoreInfo(true)}
            onMouseLeave={() => setShowScoreInfo(false)}
            onClick={() => setShowScoreInfo((prev) => !prev)}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full border border-input-border bg-kbd-bg hover:bg-button-hover transition-all select-none cursor-pointer group"
          >
            <Award className="w-3.5 h-3.5 text-foreground transition-transform group-hover:scale-105" />
            <span className="text-[10px] md:text-xs font-bold text-foreground">
              Score: {score}
            </span>
          </button>

          {/* Tooltip Breakdown */}
          {showScoreInfo && (
            <div className="absolute right-0 mt-2.5 w-56 bg-card-bg border border-card-border rounded-2xl p-4 shadow-nav-shadow z-50 text-[11px] animate-in fade-in duration-100 text-foreground">
              <h4 className="font-bold mb-2.5 flex items-center gap-1.5 border-b border-divider pb-1.5">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                <span>Score Breakdown</span>
              </h4>
              <div className="space-y-2 text-neutral-500">
                <div className="flex justify-between">
                  <span>Tasks Completed</span>
                  <span className="font-bold text-foreground">{completedCount} / {totalCount}</span>
                </div>
                <div className="border-t border-divider pt-2 flex justify-between font-bold text-foreground">
                  <span>Daily Total</span>
                  <span>{score} / 100</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
