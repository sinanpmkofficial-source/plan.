'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Inbox,
  Target,
  Calendar,
  BarChart3,
  Clock,
  CalendarDays,
  FileText,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { id: 'daily', label: 'Today', mobileLabel: 'Today', icon: Clock, path: '/' },
    { id: 'braindump', label: 'Brain Dump', mobileLabel: 'Dump', icon: Inbox, path: '/braindump' },
    { id: 'goals', label: 'Goals System', mobileLabel: 'Goals', icon: Target, path: '/goals' },
    { id: 'notes', label: 'Notes', mobileLabel: 'Notes', icon: FileText, path: '/notes' },
    { id: 'weekly', label: 'Weekly Plan', mobileLabel: 'Weekly', icon: CalendarDays, path: '/weekly' },
    { id: 'monthly', label: 'Monthly Plan', mobileLabel: 'Monthly', icon: Calendar, path: '/monthly' },
    { id: 'analytics', label: 'Analytics', mobileLabel: 'Stats', icon: BarChart3, path: '/analytics' },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR: Visible on md screens and up */}
      <aside className="hidden md:flex w-64 border-r border-divider bg-card-bg flex-col justify-between shrink-0 h-screen sticky top-0 select-none transition-colors duration-300">
        <div className="flex flex-col pt-6 px-4">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-3 mb-8">
            <div className="w-8 h-8 rounded-md bg-black flex items-center justify-center text-white font-mono font-bold text-lg">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-sm font-bold transition-all group cursor-pointer ${ isActive ? 'bg-black text-white shadow-none' : 'text-neutral-500 hover:text-foreground hover:bg-neutral-100' }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MOBILE MENU: Redesigned bottom tab bar style (Icon only) */}
      <nav className="flex md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white border border-nav-border rounded-lg px-3 py-2 items-center justify-around gap-1.5 shadow-none w-[calc(100%-2rem)] max-w-[420px] select-none transition-all duration-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex items-center justify-center p-3 rounded-md transition-all relative cursor-pointer w-12 h-12 shrink-0 ${ isActive ? 'bg-black text-white shadow-none' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-150/50' }`}
            >
              <Icon className="w-5.5 h-5.5 shrink-0" />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
