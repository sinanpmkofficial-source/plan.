'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Inbox,
  Target,
  Calendar,
  BarChart3,
  Clock,
  CalendarDays,
  Settings,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const desktopNavItems = [
    { id: 'daily', label: 'Today', icon: Clock, path: '/' },
    { id: 'braindump', label: 'Brain Dump', icon: Inbox, path: '/braindump' },
    { id: 'goals', label: 'Goals System', icon: Target, path: '/goals' },
    { id: 'weekly', label: 'Weekly Plan', icon: CalendarDays, path: '/weekly' },
    { id: 'monthly', label: 'Monthly Plan', icon: Calendar, path: '/monthly' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const mobileNavItems = [
    { id: 'daily', label: 'Today', icon: Clock, path: '/' },
    { id: 'braindump', label: 'Brain Dump', icon: Inbox, path: '/braindump' },
    { id: 'goals', label: 'Goals System', icon: Target, path: '/goals' },
    { id: 'weekly', label: 'Weekly Plan', icon: CalendarDays, path: '/weekly' },
    { id: 'monthly', label: 'Monthly Plan', icon: Calendar, path: '/monthly' },
  ];

  const moreItems = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isMoreActive = moreItems.some((item) => pathname === item.path);

  return (
    <>
      {/* DESKTOP SIDEBAR: Visible on md screens and up */}
      <aside className="hidden md:flex w-64 border-r border-divider bg-card-bg flex-col justify-between shrink-0 h-screen sticky top-0 select-none transition-colors duration-300">
        <div className="flex flex-col pt-6 px-4">
          {/* Brand Header */}
          <div className="flex items-center gap-2.5 px-3 mb-8">
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background font-mono font-bold text-lg">
              P
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight text-foreground">Plan</h1>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className="w-full block"
                >
                  <motion.div
                    whileTap={{ scale: 0.96 }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-sm font-bold transition-all group cursor-pointer ${
                      isActive
                        ? 'bg-foreground text-background shadow-none'
                        : 'text-neutral-500 hover:text-foreground hover:bg-button-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MOBILE MENU: Redesigned bottom tab bar style (Icon only) */}
      <nav className="flex md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-nav-bg border border-nav-border rounded-full px-3 py-2 items-center justify-around gap-1.5 shadow-none w-[calc(100%-2rem)] max-w-[420px] select-none transition-all duration-300">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
            >
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={`flex items-center justify-center p-3 rounded-full transition-all relative cursor-pointer w-12 h-12 shrink-0 ${
                  isActive
                    ? 'bg-foreground text-background shadow-none'
                    : 'text-neutral-455 hover:text-foreground hover:bg-button-hover'
                }`}
              >
                <Icon className="w-5.5 h-5.5 shrink-0" />
              </motion.div>
            </Link>
          );
        })}

        {/* More button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsMoreOpen(true)}
          className={`flex items-center justify-center p-3 rounded-full transition-all relative cursor-pointer w-12 h-12 shrink-0 ${
            isMoreActive
              ? 'bg-foreground text-background shadow-none'
              : 'text-neutral-455 hover:text-foreground hover:bg-button-hover'
          }`}
        >
          <MoreHorizontal className="w-5.5 h-5.5 shrink-0" />
        </motion.button>
      </nav>

      {/* iOS STYLE BOTTOM SHEET ACTION SHEET */}
      <AnimatePresence>
        {isMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 bg-foreground/15 backdrop-blur-md z-[9998] transition-colors"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[9999] bg-card-bg border-t border-divider rounded-t-[28px] px-5 pt-3 pb-8 w-full shadow-none select-none text-foreground"
            >
              {/* iOS Drag Handle */}
              <div className="w-10 h-1 bg-foreground/10 rounded-full mx-auto mb-5" />

              {/* Title Header */}
              <div className="mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/40 block px-1">
                  More Options
                </span>
              </div>

              {/* Action Rows Container */}
              <div className="flex flex-col bg-kbd-bg rounded-2xl overflow-hidden border border-card-border">
                {moreItems.map((item, index) => {
                  const Icon = item.icon;
                  const isItemActive = pathname === item.path;
                  return (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="h-px bg-divider w-full" />}
                      <button
                        onClick={() => {
                          router.push(item.path);
                          setIsMoreOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3.5 hover:bg-button-hover transition-colors text-left cursor-pointer ${
                          isItemActive ? 'bg-foreground/5' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-foreground/5 flex items-center justify-center text-foreground">
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <span className={`text-sm font-extrabold ${isItemActive ? 'text-foreground font-black' : 'text-foreground/80'}`}>
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isItemActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-foreground" />
                          )}
                          <ChevronRight className="w-4 h-4 text-foreground/30" />
                        </div>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* iOS style cancel button */}
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-full mt-4 py-3.5 bg-kbd-bg hover:bg-button-hover border border-card-border rounded-2xl text-center text-sm font-black transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
