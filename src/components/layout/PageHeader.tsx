'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { Loader2, Check, RefreshCw, X, Cloud } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

// Thin arc SVG (half-circle) that fills based on score 0–100
function ScoreArc({ score }: { score: number }) {
  const r = 18;
  const cx = 22;
  const cy = 22;
  const circumference = Math.PI * r; // half circle
  const offset = circumference * (1 - score / 100);

  return (
    <svg width="44" height="28" viewBox="0 0 44 28" fill="none" className="overflow-visible">
      {/* Track */}
      <path
        d={`M 4 22 A ${r} ${r} 0 0 1 40 22`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-foreground/10"
      />
      {/* Progress */}
      <path
        d={`M 4 22 A ${r} ${r} 0 0 1 40 22`}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-foreground transition-all duration-700"
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
    </svg>
  );
}

export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  const {
    currentView,
    selectedDate,
    selectedWeek,
    selectedMonth,
    getOrCreateDailyPlan,
    getOrCreateWeeklyPlan,
    getOrCreateMonthlyPlan,
    syncStatus,
    syncErrorMsg,
    retrySync,
  } = usePlannerStore();

  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);

  let score = 0;
  let scoreLabel = 'Getting started';
  let popoverTitle = 'Daily Score';
  let breakdown: { label: string; value: number; max: number }[] = [];

  if (currentView === 'weekly') {
    const weeklyPlan = getOrCreateWeeklyPlan(selectedWeek);
    const bulletTasks = (weeklyPlan.bulletNotes || []).filter((n) => n.type === 'task');
    if (bulletTasks.length > 0) {
      const completedTasks = bulletTasks.filter((t) => t.completed).length;
      score = Math.round((completedTasks / bulletTasks.length) * 100);
      breakdown = [
        { label: 'Weekly Tasks', value: completedTasks, max: bulletTasks.length }
      ];
    } else {
      score = 100;
      breakdown = [
        { label: 'Weekly Tasks', value: 0, max: 0 }
      ];
    }
    popoverTitle = 'Weekly Score';
    scoreLabel = score >= 90 ? 'Excellent' : score >= 70 ? 'Great' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Getting started';
  } else if (currentView === 'monthly') {
    const monthlyPlan = getOrCreateMonthlyPlan(selectedMonth);
    const bulletTasks = (monthlyPlan.bulletNotes || []).filter((n) => n.type === 'task');
    if (bulletTasks.length > 0) {
      const completedTasks = bulletTasks.filter((t) => t.completed).length;
      score = Math.round((completedTasks / bulletTasks.length) * 100);
      breakdown = [
        { label: 'Monthly Tasks', value: completedTasks, max: bulletTasks.length }
      ];
    } else {
      score = 100;
      breakdown = [
        { label: 'Monthly Tasks', value: 0, max: 0 }
      ];
    }
    popoverTitle = 'Monthly Score';
    scoreLabel = score >= 90 ? 'Excellent' : score >= 70 ? 'Great' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Getting started';
  } else {
    // Daily view (or fallback for other pages)
    const dailyPlan = getOrCreateDailyPlan(selectedDate);
    score = dailyPlan.score || 0;

    let taskScore = 0;
    const bulletTasks = (dailyPlan.bulletNotes || []).filter((n) => n.type === 'task');
    if (bulletTasks.length > 0) {
      const completedTasks = bulletTasks.filter((t) => t.completed).length;
      taskScore = Math.round((completedTasks / bulletTasks.length) * 100);
    }
    breakdown = [
      { label: 'Daily Tasks', value: taskScore, max: 100 },
    ];
    popoverTitle = 'Daily Score';
    scoreLabel = score >= 90 ? 'Excellent' : score >= 70 ? 'Great' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Getting started';
  }

  return (
    <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-divider mb-8">
      <div className="pt-4 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Left — Title block + children (nav controls) */}
        <div className="flex sm:items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight truncate pb-1">{title}</h2>
            {subtitle && (
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-foreground/40 mt-1.5">
                {subtitle}
              </p>
            )}
          </div>

          {/* Inline nav controls (date pickers etc.) */}
          {children && (
            <div className="shrink-0">
              {children}
            </div>
          )}
        </div>

        {/* Right — Sync + Score */}
        <div className="flex items-center justify-end gap-3 shrink-0 select-none">

          {/* Sync indicator */}
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

      </div>
    </div>
  );
}
