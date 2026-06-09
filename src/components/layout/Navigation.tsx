'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Inbox,
  Target,
  Calendar,
  BarChart3,
  Clock,
  CalendarDays,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Silent Keyboard Navigation Listeners (No UI modal)
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

      if (e.key === '/') {
        e.preventDefault();
        router.push('/braindump');
        setTimeout(() => {
          const input = document.getElementById('quick-brain-dump-input');
          if (input) input.focus();
        }, 50);
        return;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keysPressed['g']) {
        if (key === 'd') {
          e.preventDefault();
          router.push('/');
        } else if (key === 'b') {
          e.preventDefault();
          router.push('/braindump');
        } else if (key === 'g') {
          e.preventDefault();
          router.push('/goals');
        } else if (key === 'w') {
          e.preventDefault();
          router.push('/weekly');
        } else if (key === 'm') {
          e.preventDefault();
          router.push('/monthly');
        } else if (key === 'a') {
          e.preventDefault();
          router.push('/analytics');
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
  }, [router]);

  const navItems = [
    { id: 'daily', label: 'Today', mobileLabel: 'Today', icon: Clock, shortcut: 'g d', path: '/' },
    { id: 'braindump', label: 'Brain Dump', mobileLabel: 'Dump', icon: Inbox, shortcut: 'g b', path: '/braindump' },
    { id: 'goals', label: 'Goals System', mobileLabel: 'Goals', icon: Target, shortcut: 'g g', path: '/goals' },
    { id: 'weekly', label: 'Weekly Plan', mobileLabel: 'Weekly', icon: CalendarDays, shortcut: 'g w', path: '/weekly' },
    { id: 'monthly', label: 'Monthly Plan', mobileLabel: 'Monthly', icon: Calendar, shortcut: 'g m', path: '/monthly' },
    { id: 'analytics', label: 'Analytics', mobileLabel: 'Stats', icon: BarChart3, shortcut: 'g a', path: '/analytics' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR: Visible on md screens and up */}
      <aside className="hidden md:flex w-64 border-r border-divider bg-card-bg flex-col justify-between shrink-0 h-screen sticky top-0 select-none transition-colors duration-300">
        <div className="flex flex-col pt-6 px-4">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-mono font-bold text-lg">
              P
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-foreground">Plan</h1>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-bold transition-all group cursor-pointer ${ isActive ? 'bg-neutral-900 text-white shadow-xs' : 'text-neutral-500 hover:text-foreground hover:bg-neutral-100' }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <kbd className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${ isActive ? 'bg-neutral-800 text-neutral-300 ' : 'bg-kbd-bg text-neutral-500' }`}>
                    {item.shortcut}
                  </kbd>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MOBILE PILL MENU: Redesigned iOS bottom tab bar style (Icon only) */}
      <nav className="flex md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-nav-bg backdrop-blur-md border border-nav-border rounded-full px-3 py-2 items-center justify-around gap-1.5 shadow-nav-shadow w-[calc(100%-2rem)] max-w-[420px] select-none transition-all duration-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center justify-center p-3 rounded-full transition-all relative cursor-pointer w-12 h-12 shrink-0 ${ isActive ? 'bg-neutral-900 text-white shadow-sm scale-105' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100/50' }`}
            >
              <Icon className="w-5.5 h-5.5 shrink-0" />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
