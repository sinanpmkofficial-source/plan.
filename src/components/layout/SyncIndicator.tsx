'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import {
  Loader2,
  RefreshCw,
  Award,
  Check,
  Info,
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

  const prayersCount = Object.values(dailyPlan.prayers || {}).filter(Boolean).length;
  const prayerScore = prayersCount * 10;

  let taskScore = 30;
  if (dailyPlan.tasks && dailyPlan.tasks.length > 0) {
    const completedTasks = dailyPlan.tasks.filter((t) => t.completed).length;
    taskScore = Math.round((completedTasks / dailyPlan.tasks.length) * 30);
  }

  let bulletScore = 10;
  const bulletTasks = (dailyPlan.bulletNotes || []).filter((n) => n.type === 'task');
  if (bulletTasks.length > 0) {
    const completedBullets = bulletTasks.filter((t) => t.completed).length;
    bulletScore = Math.round((completedBullets / bulletTasks.length) * 10);
  }

  const reflectionScore = dailyPlan.reflection && dailyPlan.reflection.trim().length > 0 ? 10 : 0;

  return (
    <header className="h-16 border-b border-divider bg-card-bg px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30 transition-colors duration-300">
      <div>
        <h2 className="font-semibold text-sm md:text-base text-foreground tracking-tight">
          {viewTitles[currentView] || 'Planner'}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Sync Status Badge */}
        <div className="flex items-center gap-2">
          {syncStatus === 'syncing' && (
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-neutral-400 font-medium select-none">
              <Loader2 className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {syncStatus === 'saved' && (
            <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-neutral-400 font-medium select-none">
              <Check className="w-3 h-3 md:w-3.5 md:h-3.5 text-neutral-450" />
              <span>Saved</span>
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] md:text-xs text-red-500 font-medium select-none flex items-center gap-1" title={syncErrorMsg || 'Network Error'}>
                Sync Failed
              </span>
              <button
                onClick={retrySync}
                className="p-1 hover:bg-button-hover rounded text-neutral-500 hover:text-foreground transition-colors cursor-pointer"
                title="Retry Sync"
              >
                <RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5" />
              </button>
            </div>
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
            <div className="absolute right-0 mt-2.5 w-56 bg-card-bg border border-card-border rounded-xl p-4 shadow-nav-shadow z-50 text-[11px] animate-in fade-in duration-100 text-foreground">
              <h4 className="font-bold mb-2.5 flex items-center gap-1.5 border-b border-divider pb-1.5">
                <Info className="w-3.5 h-3.5 text-neutral-400" />
                <span>Score Breakdown</span>
              </h4>
              <div className="space-y-2 text-neutral-500">
                <div className="flex justify-between">
                  <span>Prayers ({prayersCount}/5)</span>
                  <span className="font-bold text-foreground">{prayerScore}/50</span>
                </div>
                <div className="flex justify-between">
                  <span>Focus Tasks</span>
                  <span className="font-bold text-foreground">{taskScore}/30</span>
                </div>
                <div className="flex justify-between">
                  <span>Journal Action</span>
                  <span className="font-bold text-foreground">{bulletScore}/10</span>
                </div>
                <div className="flex justify-between">
                  <span>Reflection Daily</span>
                  <span className="font-bold text-foreground">{reflectionScore}/10</span>
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
