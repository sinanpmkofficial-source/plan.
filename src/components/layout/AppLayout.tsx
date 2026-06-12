'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { usePlannerStore } from '@/store/planner-store';
import Navigation from '@/components/layout/Navigation';
import { Loader2, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { loadData, isLoading, toast, hideToast } = usePlannerStore();
  const pathname = usePathname();

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-background text-foreground font-sans transition-colors duration-300">
      {/* Navigation handles both desktop sidebar layout and mobile floating pill layout responsive states */}
      <Navigation />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic View Scroll Area with clean route transition */}
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
            className="flex-1 overflow-y-auto px-4 md:px-8 pt-0 pb-28 md:pb-6"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed z-50 bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-80 p-3.5 bg-neutral-950 text-white rounded-xl shadow-none flex items-center justify-between border border-neutral-800 gap-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {toast.type === 'delete' ? (
                <Trash2 className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              )}
              <span className="text-xs font-extrabold truncate leading-none">{toast.message}</span>
            </div>
            <button
              onClick={hideToast}
              className="p-1 hover:bg-neutral-800 rounded-full text-neutral-400 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
