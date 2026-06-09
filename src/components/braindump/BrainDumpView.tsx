'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function BrainDumpView() {
  const {
    brainDump,
    addBrainDumpItem,
    deleteBrainDumpItem,
    convertBrainDumpItem,
    selectedDate,
    selectedWeek,
    selectedMonth,
  } = usePlannerStore();

  const [inputValue, setInputValue] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    addBrainDumpItem(inputValue.trim());
    setInputValue('');
  };

  const inboxItems = brainDump.filter((item) => item.status === 'inbox');
  const convertedItems = brainDump.filter((item) => item.status === 'converted');

  const handleGoalConvertClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowGoalModal(true);
  };

  const confirmGoalConversion = (goalTitle: string) => {
    if (selectedItemId && goalTitle.trim()) {
      convertBrainDumpItem(selectedItemId, 'goal', goalTitle.trim());
    }
    setShowGoalModal(false);
    setSelectedItemId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-[var(--foreground)]">
      {/* Introduction */}
      <div className="space-y-1">
        <h3 className="text-2xl font-black tracking-tight">Brain Dump Inbox</h3>
        <p className="text-sm md:text-base text-neutral-500">
          Clear your mind. Capture thoughts or reminders instantly, and convert them to plans later.
        </p>
      </div>

      {/* Input Capture Box */}
      <form onSubmit={handleSubmit} className="relative">
        <input
          id="quick-brain-dump-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Capture a thought... (Press '/' to focus)"
          className="w-full pl-5 pr-16 py-4 bg-[var(--card-bg)] border border-[var(--input-border)] rounded-full shadow-xs focus:outline-hidden focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] transition-all font-bold text-sm md:text-base text-[var(--foreground)] placeholder-neutral-450"
        />
        <button
          type="submit"
          className="absolute right-3 top-3 w-10 h-10 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center hover:bg-neutral-800 dark:hover:bg-white active:scale-95 transition-all cursor-pointer border-none"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Inbox Items Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Inbox className="w-4 h-4 text-neutral-450" />
            <h4 className="font-extrabold text-sm text-neutral-400 uppercase tracking-wider">
              Inbox ({inboxItems.length})
            </h4>
          </div>

          <div className="space-y-3 min-h-[300px]">
            <AnimatePresence initial={false}>
              {inboxItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-8 border border-dashed border-[var(--divider)] rounded-2xl bg-[var(--card-bg)]/20 text-neutral-400 min-h-[250px]"
                >
                  <Inbox className="w-8 h-8 stroke-1 mb-2 text-neutral-400" />
                  <p className="text-sm font-bold">Your brain dump is clear.</p>
                  <span className="text-xs text-neutral-500 mt-1">Start typing above to log thoughts.</span>
                </motion.div>
              ) : (
                inboxItems.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.18 }}
                    className="card-premium p-5 flex flex-col justify-between gap-4"
                  >
                    <p className="text-base font-bold text-neutral-800 leading-relaxed break-words">
                      {item.text}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[var(--divider)] pt-3.5 mt-1">
                      {/* Delete Action */}
                      <button
                        onClick={() => deleteBrainDumpItem(item.id)}
                        className="p-1.5 hover:bg-[var(--kbd-bg)] hover:text-red-500 rounded-full text-neutral-400 transition-colors cursor-pointer self-start sm:self-center"
                        title="Delete thought"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Convert Pill Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 font-bold">
                        <button
                          onClick={() => convertBrainDumpItem(item.id, 'task', selectedDate)}
                          className="flex items-center gap-1.5 py-1 px-3 border border-[var(--input-border)] hover:border-[var(--input-focus-border)] hover:bg-[var(--kbd-bg)] rounded-full transition-all cursor-pointer text-neutral-700 font-bold"
                        >
                          <Clock className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Today</span>
                        </button>
                        <button
                          onClick={() => convertBrainDumpItem(item.id, 'weekly', selectedWeek)}
                          className="flex items-center gap-1.5 py-1 px-3 border border-[var(--input-border)] hover:border-[var(--input-focus-border)] hover:bg-[var(--kbd-bg)] rounded-full transition-all cursor-pointer text-neutral-700 font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Week</span>
                        </button>
                        <button
                          onClick={() => convertBrainDumpItem(item.id, 'monthly', selectedMonth)}
                          className="flex items-center gap-1.5 py-1 px-3 border border-[var(--input-border)] hover:border-[var(--input-focus-border)] hover:bg-[var(--kbd-bg)] rounded-full transition-all cursor-pointer text-neutral-700 font-bold"
                        >
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Month</span>
                        </button>
                        <button
                          onClick={() => handleGoalConvertClick(item.id)}
                          className="flex items-center gap-1.5 py-1 px-3 border border-[var(--input-border)] hover:border-[var(--input-focus-border)] hover:bg-[var(--kbd-bg)] rounded-full transition-all cursor-pointer text-neutral-700 font-bold"
                        >
                          <Target className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Goal</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Converted Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 className="w-4 h-4 text-neutral-400" />
            <h4 className="font-extrabold text-sm text-neutral-450 uppercase tracking-wider">
              Processed ({convertedItems.length})
            </h4>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {convertedItems.length === 0 ? (
                <div className="p-6 border border-dashed border-[var(--divider)] rounded-2xl text-center text-neutral-405 text-sm font-semibold">
                  Processed logs will appear here.
                </div>
              ) : (
                convertedItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-3.5 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl flex items-start justify-between gap-3 text-neutral-550"
                  >
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-bold line-through text-neutral-400 dark:text-neutral-500 break-words leading-relaxed">
                        {item.text}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-extrabold block">
                        Converted to {item.convertedTo}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteBrainDumpItem(item.id)}
                      className="p-1.5 hover:bg-[var(--kbd-bg)] rounded-full text-neutral-400 hover:text-red-550 transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Goal Title Form Dialog */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-2xl max-w-sm w-full shadow-[var(--nav-shadow)] animate-in zoom-in-95 duration-100">
            <h3 className="font-extrabold text-sm mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Convert to Goal</span>
            </h3>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-450 mb-4 leading-relaxed font-semibold">
              Define the goal title for this brain dump item. You can customize details and milestones in the Goals dashboard.
            </p>
            <input
              type="text"
              id="goal-convert-title-input"
              defaultValue={brainDump.find((x) => x.id === selectedItemId)?.text || ''}
              placeholder="Goal Title"
              className="w-full input-premium text-sm font-semibold mb-5"
            />
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  setSelectedItemId(null);
                }}
                className="button-secondary text-xs px-4 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('goal-convert-title-input') as HTMLInputElement;
                  confirmGoalConversion(input?.value || '');
                }}
                className="button-premium text-xs px-4 py-1.5"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
