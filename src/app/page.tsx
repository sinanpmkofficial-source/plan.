'use client';

import React, { useEffect } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import Navigation from '@/components/layout/Navigation';
import SyncIndicator from '@/components/layout/SyncIndicator';
import DailyView from '@/components/planning/DailyView';
import BrainDumpView from '@/components/braindump/BrainDumpView';
import GoalsView from '@/components/goals/GoalsView';
import WeeklyView from '@/components/planning/WeeklyView';
import MonthlyView from '@/components/planning/MonthlyView';
import AnalyticsView from '@/components/analytics/AnalyticsView';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { currentView, loadData, isLoading } = usePlannerStore();

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dynamic View Renderer
  const renderView = () => {
    switch (currentView) {
      case 'daily':
        return <DailyView />;
      case 'braindump':
        return <BrainDumpView />;
      case 'goals':
        return <GoalsView />;
      case 'weekly':
        return <WeeklyView />;
      case 'monthly':
        return <MonthlyView />;
      case 'analytics':
        return <AnalyticsView />;
      default:
        return <DailyView />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] font-sans transition-colors duration-300">
      {/* Navigation handles both desktop sidebar layout and mobile floating pill layout responsive states */}
      <Navigation />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic View Scroll Area */}
        {/* pb-28 on mobile leaves space for the floating bottom pill bar; md:pb-6 resets this for desktop sidebar */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-28 md:pb-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="w-8 h-8 text-[var(--foreground)] animate-spin stroke-1.5" />
              <span className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-widest animate-pulse">
                Syncing workspace...
              </span>
            </div>
          ) : (
            renderView()
          )}
        </main>
      </div>
    </div>
  );
}
