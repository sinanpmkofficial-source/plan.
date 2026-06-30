'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { searchAll, popularTags, SearchResult } from '@/lib/search';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Search, X, CornerDownLeft, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function contextLabel(r: SearchResult): string {
  switch (r.kind) {
    case 'daily':
      return r.date ? `Daily · ${format(parseISO(r.date), 'MMM d, yyyy')}` : 'Daily';
    case 'reflection': {
      const where = r.date
        ? format(parseISO(r.date), 'MMM d, yyyy')
        : r.weekId || (r.monthId ? format(parseISO(r.monthId + '-01'), 'MMMM yyyy') : '');
      return `Reflection · ${where}`;
    }
    case 'weekly':
      return r.weekId ? `Weekly · ${r.weekId.replace('-W', ' · Week ')}` : 'Weekly';
    case 'monthly':
      return r.monthId ? `Monthly · ${format(parseISO(r.monthId + '-01'), 'MMMM yyyy')}` : 'Monthly';
    case 'goal':
      return 'Goal';
    case 'braindump':
      return 'Brain Dump';
  }
}

function SearchPanel({ prefill }: { prefill: string }) {
  const {
    closeSearch,
    brainDump,
    goals,
    dailyPlans,
    weeklyPlans,
    monthlyPlans,
    setDate,
    setWeek,
    setMonth,
  } = usePlannerStore();

  const router = useRouter();
  const [query, setQuery] = useState(prefill);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const data = useMemo(
    () => ({ brainDump, goals, dailyPlans, weeklyPlans, monthlyPlans }),
    [brainDump, goals, dailyPlans, weeklyPlans, monthlyPlans]
  );

  const results = useMemo(() => searchAll(data, query), [data, query]);
  const tags = useMemo(() => popularTags(data), [data]);

  const changeQuery = (v: string) => {
    setQuery(v);
    setSelected(0);
  };

  // Focus on mount (DOM side-effect, not state).
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  // Keep the selected row in view (DOM side-effect, not state).
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${selected}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const go = (r: SearchResult) => {
    if (r.date) setDate(r.date);
    if (r.weekId) setWeek(r.weekId);
    if (r.monthId) setMonth(r.monthId);
    closeSearch();
    router.push(r.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selected]) go(results[selected]);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeSearch}
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="fixed left-1/2 top-[8vh] -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-xl bg-card-bg border border-card-border rounded-2xl overflow-hidden shadow-nav-shadow"
      >
        {/* Input row */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-divider">
          <Search className="w-4.5 h-4.5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => changeQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks, notes, reflections, goals..."
            className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-neutral-400"
          />
          <button
            onClick={closeSearch}
            className="w-7 h-7 flex items-center justify-center hover:bg-button-hover rounded-full text-neutral-450 hover:text-foreground transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {query.trim() === '' ? (
            <div className="p-4 space-y-3">
              {tags.length > 0 ? (
                <>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(({ tag, count }) => (
                      <button
                        key={tag}
                        onClick={() => changeQuery(tag)}
                        className="flex items-center gap-1 py-1 px-2.5 bg-kbd-bg hover:bg-foreground hover:text-background rounded-full text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Hash className="w-3 h-3" />
                        {tag.replace(/^#/, '')}
                        <span className="opacity-50">{count}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm font-semibold text-neutral-400 text-center py-8">
                  Start typing to search everything you&apos;ve logged.
                </p>
              )}
            </div>
          ) : results.length === 0 ? (
            <p className="text-sm font-semibold text-neutral-400 text-center py-12">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="py-1.5">
              {results.map((r, idx) => (
                <button
                  key={r.key}
                  data-idx={idx}
                  onMouseEnter={() => setSelected(idx)}
                  onClick={() => go(r)}
                  className={`w-full text-left px-4 py-2.5 flex items-start gap-3 cursor-pointer transition-colors ${
                    idx === selected ? 'bg-button-hover' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-bold break-words leading-snug ${
                        r.completed ? 'line-through text-neutral-400' : 'text-foreground'
                      }`}
                    >
                      {r.text}
                    </p>
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">
                      {contextLabel(r)}
                    </span>
                  </div>
                  {idx === selected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-1" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="hidden md:flex items-center gap-3 px-4 py-2 border-t border-divider text-[10px] font-bold text-neutral-400">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </motion.div>
    </>
  );
}

export default function SearchModal() {
  const isSearchOpen = usePlannerStore((s) => s.isSearchOpen);
  const searchPrefill = usePlannerStore((s) => s.searchPrefill);

  return (
    <AnimatePresence>
      {isSearchOpen && <SearchPanel key={searchPrefill + '|open'} prefill={searchPrefill} />}
    </AnimatePresence>
  );
}
