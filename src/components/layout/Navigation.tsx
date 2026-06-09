'use client';

import React, { useEffect, useState } from 'react';
import { usePlannerStore, PlannerView } from '@/store/planner-store';
import {
  Inbox,
  Target,
  Calendar,
  BarChart3,
  HelpCircle,
  Clock,
  Sparkles,
  Command,
  X,
} from 'lucide-react';

export default function Navigation() {
  const { currentView, setView } = usePlannerStore();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard Navigation Listeners (Registered only once)
  useEffect(() => {
    let keysPressed: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      keysPressed[e.key.toLowerCase()] = true;

      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }

      if (e.key === '/') {
        e.preventDefault();
        setView('braindump');
        setTimeout(() => {
          const input = document.getElementById('quick-brain-dump-input');
          if (input) input.focus();
        }, 50);
        return;
      }

      if (keysPressed['h'] || e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keysPressed['g']) {
        if (key === 'd') {
          e.preventDefault();
          setView('daily');
        } else if (key === 'b') {
          e.preventDefault();
          setView('braindump');
        } else if (key === 'g') {
          e.preventDefault();
          setView('goals');
        } else if (key === 'w') {
          e.preventDefault();
          setView('weekly');
        } else if (key === 'm') {
          e.preventDefault();
          setView('monthly');
        } else if (key === 'a') {
          e.preventDefault();
          setView('analytics');
        }
      }

      delete keysPressed[key];
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setView]);

  const navItems = [
    { id: 'daily', label: 'Today', icon: Clock, shortcut: 'g d' },
    { id: 'braindump', label: 'Brain Dump', icon: Inbox, shortcut: 'g b' },
    { id: 'goals', label: 'Goals System', icon: Target, shortcut: 'g g' },
    { id: 'weekly', label: 'Weekly Plan', icon: Sparkles, shortcut: 'g w' },
    { id: 'monthly', label: 'Monthly Plan', icon: Calendar, shortcut: 'g m' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, shortcut: 'g a' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR: Visible on md screens and up */}
      <aside className="hidden md:flex w-64 border-r border-[var(--divider)] bg-[var(--card-bg)] flex-col justify-between shrink-0 h-screen sticky top-0 select-none transition-colors duration-300">
        <div className="flex flex-col pt-6 px-4">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-950 font-mono font-bold text-lg">
              P
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-[var(--foreground)]">Plan</h1>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id as PlannerView)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all group cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-xs'
                      : 'text-neutral-500 hover:text-[var(--foreground)] dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-[var(--button-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <kbd className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                    isActive ? 'bg-neutral-800 text-neutral-350 dark:bg-neutral-200 dark:text-neutral-600' : 'bg-[var(--kbd-bg)] text-neutral-450'
                  }`}>
                    {item.shortcut}
                  </kbd>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Keyboard Shortcut Help Trigger */}
        <div className="p-4 border-t border-[var(--divider)]">
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-full flex items-center justify-between py-2 px-3 border border-[var(--input-border)] rounded-lg text-xs font-extrabold text-neutral-500 hover:text-[var(--foreground)] dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-[var(--button-hover)] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5" />
              <span>Shortcuts Help</span>
            </div>
            <kbd className="bg-[var(--kbd-bg)] text-[var(--kbd-text)] text-[9px] px-1.5 py-0.2 rounded font-semibold border border-[var(--kbd-border)] font-mono">?</kbd>
          </button>
        </div>
      </aside>

      {/* MOBILE PILL MENU: Visible on screens below md */}
      <nav className="flex md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--nav-bg)] backdrop-blur-md border border-[var(--nav-border)] rounded-full px-2 py-1.5 items-center gap-1 shadow-[var(--nav-shadow)] max-w-[95vw] overflow-x-auto scrollbar-none select-none transition-all duration-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id as PlannerView)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-extrabold transition-all relative cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-[var(--button-hover)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}

        <div className="h-4 w-[1px] bg-[var(--divider)] mx-1" />
        <button
          onClick={() => setShowShortcuts(true)}
          className="p-2 rounded-full text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300 hover:bg-[var(--button-hover)] cursor-pointer shrink-0"
          title="Keyboard Shortcuts"
        >
          <Command className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-border)] max-w-sm w-full p-6 shadow-[var(--nav-shadow)] animate-in fade-in duration-150 text-[var(--foreground)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Command className="w-4 h-4" />
                <span>Keyboard Workflows</span>
              </h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-1 hover:bg-[var(--button-hover)] rounded-lg transition-colors text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-1.5">
                <span className="font-medium text-[var(--foreground)]">Quick Brain Dump Capture</span>
                <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px] shadow-xs">/</kbd>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-1.5">
                <span>Go to Today View</span>
                <div className="flex gap-0.5">
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">g</kbd>
                  <span className="text-neutral-300 dark:text-neutral-700 font-mono">+</span>
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">d</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-1.5">
                <span>Go to Brain Dump Inbox</span>
                <div className="flex gap-0.5">
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">g</kbd>
                  <span className="text-neutral-300 dark:text-neutral-700 font-mono">+</span>
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">b</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-1.5">
                <span>Go to Goals System</span>
                <div className="flex gap-0.5">
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">g</kbd>
                  <span className="text-neutral-300 dark:text-neutral-700 font-mono">+</span>
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">g</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-1.5">
                <span>Go to Weekly Planning</span>
                <div className="flex gap-0.5">
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">g</kbd>
                  <span className="text-neutral-300 dark:text-neutral-700 font-mono">+</span>
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">w</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-1.5">
                <span>Go to Monthly Planning</span>
                <div className="flex gap-0.5">
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">g</kbd>
                  <span className="text-neutral-300 dark:text-neutral-700 font-mono">+</span>
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">m</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-[var(--divider)] pb-1.5">
                <span>Go to Analytics View</span>
                <div className="flex gap-0.5">
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">g</kbd>
                  <span className="text-neutral-300 dark:text-neutral-700 font-mono">+</span>
                  <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">a</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span>Exit Forms / Close Modal</span>
                <kbd className="bg-[var(--kbd-bg)] border border-[var(--kbd-border)] text-[var(--kbd-text)] px-1.5 py-0.5 rounded font-mono text-[10px]">Esc</kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcuts(false)}
              className="w-full mt-5 py-2 text-center text-xs font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 rounded-lg transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
