'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { Loader2, Check, RefreshCw, X } from 'lucide-react';

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

    const prayersCount = Object.values(dailyPlan.prayers || {}).filter(Boolean).length;
    const prayerScore = prayersCount * 10;

    let taskScore = 50;
    const bulletTasks = (dailyPlan.bulletNotes || []).filter((n) => n.type === 'task');
    if (bulletTasks.length > 0) {
      const completedTasks = bulletTasks.filter((t) => t.completed).length;
      taskScore = Math.round((completedTasks / bulletTasks.length) * 50);
    }
    breakdown = [
      { label: 'Prayers', value: prayerScore, max: 50 },
      { label: 'Daily Tasks', value: taskScore, max: 50 },
    ];
    popoverTitle = 'Daily Score';
    scoreLabel = score >= 90 ? 'Excellent' : score >= 70 ? 'Great' : score >= 50 ? 'Good' : score >= 30 ? 'Fair' : 'Getting started';
  }

  return (
    <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-divider mb-8">
      <div className="pt-4 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        {/* Left — Title block + children (nav controls) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
          <div className="min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none truncate">{title}</h2>
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
        <div className="flex items-center gap-3 shrink-0 select-none">

          {/* Sync indicator */}
          <div className="text-[11px] font-bold text-foreground/40">
            {syncStatus === 'syncing' && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving…
              </span>
            )}
            {syncStatus === 'saved' && (
              <span className="flex items-center gap-1.5">
                <Check className="w-3 h-3" />
                Saved
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="flex items-center gap-1.5 text-red-500">
                Sync error
                <button
                  onClick={retrySync}
                  className="p-0.5 hover:bg-button-hover rounded-full transition-colors cursor-pointer"
                  title={syncErrorMsg || 'Retry sync'}
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {/* Score pill */}
          <div className="relative">
            <button
              onClick={() => setShowScoreBreakdown((v) => !v)}
              className="flex items-center gap-2.5 pl-2.5 pr-4 py-1.5 rounded-full border border-card-border bg-kbd-bg hover:bg-button-hover hover:border-foreground/30 transition-all cursor-pointer group"
              title="View score breakdown"
            >
              {/* Mini arc */}
              <div className="relative flex items-center justify-center">
                <ScoreArc score={score} />
                <span className="absolute bottom-0 text-[9px] font-black text-foreground leading-none">
                  {score}
                </span>
              </div>

              <div className="text-left">
                <div className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/40 leading-none">Score</div>
                <div className="text-xs font-extrabold text-foreground leading-tight mt-0.5">{scoreLabel}</div>
              </div>
            </button>

            {/* Breakdown popover */}
            {showScoreBreakdown && (
              <>
                {/* Backdrop to close on outside click */}
                <div className="fixed inset-0 z-40" onClick={() => setShowScoreBreakdown(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-56 bg-card-bg border border-card-border rounded-2xl p-4 shadow-none animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between mb-3 border-b border-divider pb-2.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/40">{popoverTitle}</span>
                    <button onClick={() => setShowScoreBreakdown(false)} className="p-0.5 hover:bg-button-hover rounded-full text-foreground/30 hover:text-foreground cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Big score display */}
                  <div className="text-center mb-4">
                    <span className="text-5xl font-black tracking-tight">{score}</span>
                    <span className="text-lg font-extrabold text-foreground/30">/100</span>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/40 mt-1">{scoreLabel}</p>
                  </div>

                  {/* Breakdown rows */}
                  <div className="space-y-2.5">
                    {breakdown.map(({ label, value, max }) => (
                      <div key={label}>
                        <div className="flex justify-between text-[10px] font-extrabold mb-1">
                          <span className="text-foreground/50 uppercase tracking-wider">{label}</span>
                          <span className="text-foreground">{value}<span className="text-foreground/30">/{max}</span></span>
                        </div>
                        <div className="h-1 w-full bg-divider rounded-full overflow-hidden">
                          <div
                            className="h-full bg-foreground rounded-full transition-all duration-500"
                            style={{ width: `${max > 0 ? (value / max) * 100 : 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
