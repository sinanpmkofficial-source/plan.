'use client';

import React from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { getUnfinishedBefore } from '@/lib/gamification';
import { format, parseISO } from 'date-fns';
import { ArrowDownToLine, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CarryOverSection() {
  const { dailyPlans, selectedDate, moveTaskToDate, deleteBulletNote } = usePlannerStore();
  const overdue = getUnfinishedBefore(dailyPlans, selectedDate);

  if (overdue.length === 0) return null;

  const moveAll = () => {
    overdue.forEach((t) => moveTaskToDate(t.date, t.id, selectedDate));
  };

  return (
    <div className="card-premium p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Unfinished ({overdue.length})
          </h4>
          <p className="text-[11px] font-semibold text-neutral-500 mt-0.5">
            Left over from earlier days — pull them in or let them go.
          </p>
        </div>
        <button onClick={moveAll} className="button-premium text-xs py-1.5 px-3 shrink-0">
          Pull all in
        </button>
      </div>

      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {overdue.map((t) => (
            <motion.div
              key={`${t.date}-${t.id}`}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-button-hover group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-4 h-4 border border-neutral-300 rounded shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate text-foreground">{t.text}</p>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide">
                    {format(parseISO(t.date), 'MMM d')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => moveTaskToDate(t.date, t.id, selectedDate)}
                  title="Move to this day"
                  className="w-8 h-8 flex items-center justify-center hover:bg-foreground hover:text-background border border-card-border rounded-full transition-colors cursor-pointer"
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteBulletNote(t.date, t.id)}
                  title="Drop"
                  className="w-8 h-8 flex items-center justify-center hover:bg-button-hover text-neutral-450 hover:text-foreground rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
