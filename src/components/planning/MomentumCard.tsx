'use client';

import React from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { computeMomentum } from '@/lib/gamification';
import { Flame, Trophy, CalendarCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 👋';
  if (hour < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 bg-kbd-bg rounded-2xl py-3 px-2 text-center">
      <span className="text-foreground/70">{icon}</span>
      <span className="text-lg font-black leading-none">{value}</span>
      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function MomentumCard() {
  const { dailyPlans, goals, selectedDate } = usePlannerStore();
  const stats = computeMomentum(dailyPlans, goals, selectedDate);

  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-neutral-500">{getGreeting()}</p>
          <h3 className="text-xl font-black tracking-tight flex items-center gap-2 mt-0.5">
            <Zap className="w-4.5 h-4.5 shrink-0" />
            <span className="truncate">
              Level {stats.level} · {stats.levelTitle}
            </span>
          </h3>
        </div>
        <div className="flex items-center gap-1.5 bg-foreground text-background rounded-full py-1.5 px-3 shrink-0">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-black leading-none">{stats.currentStreak}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
            day{stats.currentStreak === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* XP progress to next level */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span className="text-neutral-500">{stats.xp} XP</span>
          <span className="text-neutral-400">
            {stats.xpIntoLevel}/{stats.xpForNextLevel} to Lv {stats.level + 1}
          </span>
        </div>
        <div className="h-2.5 w-full bg-kbd-bg rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stats.progressToNext}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-foreground rounded-full"
          />
        </div>
      </div>

      {/* Progress stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <Stat icon={<CalendarCheck className="w-4 h-4" />} label="Today" value={`${stats.todayProgress}%`} />
        <Stat icon={<Trophy className="w-4 h-4" />} label="Best streak" value={`${stats.bestStreak}`} />
        <Stat icon={<Flame className="w-4 h-4" />} label="Days logged" value={`${stats.daysLogged}`} />
      </div>
    </div>
  );
}
