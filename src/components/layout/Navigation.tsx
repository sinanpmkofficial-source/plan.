'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Layers,
  BarChart3,
  Settings,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(false);

  const mainItems = [
    { id: 'daily', label: 'Daily', icon: Calendar, path: '/' },
    { id: 'weekly', label: 'Weekly', icon: Layers, path: '/weekly' },
    { id: 'monthly', label: 'Monthly', icon: BarChart3, path: '/monthly' },
  ];

  const moreItems = [
    { id: 'analytics', label: 'Insights', icon: BarChart3, path: '/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isMoreActive = moreItems.some((item) => pathname === item.path);

  // If currently on a sub-item on desktop, auto-expand the desktop sub-menu
  React.useEffect(() => {
    if (isMoreActive) {
      setIsDesktopMoreOpen(true);
    }
  }, [isMoreActive]);

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
              <h1 className="font-semibold text-sm leading-tight text-foreground">plan.</h1>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {mainItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
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

            {/* Desktop More Dropdown Trigger */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDesktopMoreOpen(!isDesktopMoreOpen)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-sm font-bold transition-all group cursor-pointer ${
                isMoreActive
                  ? 'bg-foreground text-background shadow-none'
                  : 'text-neutral-500 hover:text-foreground hover:bg-button-hover'
              }`}
            >
              <div className="flex items-center gap-3">
                <MoreHorizontal className="w-4 h-4 shrink-0" />
                <span>More</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                isDesktopMoreOpen ? 'rotate-180' : ''
              }`} />
            </motion.div>

            {/* Desktop Sub-Items */}
            <AnimatePresence initial={false}>
              {isDesktopMoreOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="pl-4 space-y-1 overflow-hidden"
                >
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.id}
                        href={item.path}
                        className="w-full block"
                      >
                        <div
                          className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                            isActive
                              ? 'text-foreground font-black bg-foreground/5'
                              : 'text-neutral-500 hover:text-foreground hover:bg-button-hover'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </nav>
        </div>
      </aside>

      {/* MOBILE BOTTOM TAB BAR */}
      <nav className="flex md:hidden fixed bottom-0 left-0 right-0 z-40 bg-nav-bg border-t border-nav-border items-center justify-around py-2 shadow-none select-none transition-all duration-300">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
          return (
            <Link
              key={item.id}
              href={item.path}
              className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer"
            >
              <motion.div
                whileTap={{ scale: 0.90 }}
                className={`flex flex-col items-center justify-center transition-all ${
                  isActive ? 'text-foreground' : 'text-neutral-500 hover:text-foreground'
                }`}
              >
                <Icon className="w-5.5 h-5.5 shrink-0" />
                <span className="text-[10px] font-bold mt-1 tracking-tight">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}

        {/* Mobile More Button */}
        <div
          onClick={() => setIsMobileMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center py-1 cursor-pointer"
        >
          <motion.div
            whileTap={{ scale: 0.90 }}
            className={`flex flex-col items-center justify-center transition-all ${
              isMoreActive ? 'text-foreground' : 'text-neutral-500 hover:text-foreground'
            }`}
          >
            <MoreHorizontal className="w-5.5 h-5.5 shrink-0" />
            <span className="text-[10px] font-bold mt-1 tracking-tight">More</span>
          </motion.div>
        </div>
      </nav>

      {/* iOS STYLE BOTTOM SHEET DRAWER */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-colors"
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
              <div className="flex flex-col bg-neutral-100 rounded-2xl overflow-hidden border border-card-border">
                {moreItems.map((item, index) => {
                  const Icon = item.icon;
                  const isItemActive = pathname === item.path;
                  return (
                    <React.Fragment key={item.id}>
                      {index > 0 && <div className="h-px bg-divider w-full" />}
                      <button
                        onClick={() => {
                          router.push(item.path);
                          setIsMobileMoreOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-neutral-200 transition-colors text-left cursor-pointer border-0 bg-transparent text-foreground"
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
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-full mt-4 py-3.5 bg-neutral-100 hover:bg-neutral-200 border border-card-border rounded-2xl text-center text-sm font-black transition-colors cursor-pointer text-foreground"
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
