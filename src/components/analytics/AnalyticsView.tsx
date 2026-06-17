'use client';

import React, { useEffect, useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Award,
  Flame,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import PageHeader from '../layout/PageHeader';

export default function AnalyticsView() {
  const { dailyPlans, goals } = usePlannerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-xs text-neutral-400 font-semibold uppercase tracking-wider">
          Loading charts...
        </div>
      </div>
    );
  }

  // Compile last 7 days of daily plans, fallback to mock data if empty
  const getLast7DaysData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const realPlan = dailyPlans[dateStr];
      
      if (realPlan) {
        // Count tasks in bulletNotes
        const bulletTasks = (realPlan.bulletNotes || []).filter((n) => n.type === 'task');
        const tasksCount = bulletTasks.length;
        const completedTasks = bulletTasks.filter((t) => t.completed).length;
        
        data.push({
          date: label,
          score: realPlan.score || 0,
          tasksCompleted: completedTasks,
          tasksTotal: tasksCount,
          isReal: true,
        });
      } else {
        data.push({
          date: label,
          score: 0,
          tasksCompleted: 0,
          tasksTotal: 0,
          isReal: false,
        });
      }
    }
    return data;
  };

  const trendData = getLast7DaysData();

  // Compute averages
  const averageScore = Math.round(trendData.reduce((acc, curr) => acc + curr.score, 0) / trendData.length);

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200">
      <PageHeader title="Analytics" />

      {/* Overview Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="card-premium p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 col-span-1 text-foreground">
          <div className="p-2.5 md:p-3 bg-button-hover rounded-full self-start md:self-auto shrink-0 text-foreground">
            <Award className="w-5.5 h-5.5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] md:text-[10px] text-neutral-500 font-bold uppercase tracking-wider block leading-tight">Avg Performance</span>
            <h4 className="text-lg md:text-xl font-bold text-foreground mt-0.5 truncate">{averageScore} / 100</h4>
          </div>
        </div>

        <div className="card-premium p-4 md:p-5 flex items-center gap-4 col-span-1 text-foreground">
          <div className="p-2.5 md:p-3 bg-button-hover rounded-full shrink-0 text-foreground">
            <BarChart3 className="w-5.5 h-5.5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] md:text-[10px] text-neutral-500 font-bold uppercase tracking-wider block leading-tight">Active Goals</span>
            <h4 className="text-lg md:text-xl font-bold text-foreground mt-0.5 truncate">{goals.filter(g => g.status === 'active').length} Objectives</h4>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-8">
        {/* Performance Score Trend Chart */}
        <div className="card-premium p-6 space-y-4 text-foreground">
          <div>
            <h4 className="font-bold text-sm text-foreground tracking-tight">Performance Trend</h4>
          </div>
          <div className="h-72 w-full text-foreground">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: 'var(--foreground)', opacity: 0.6, fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: 'var(--foreground)', opacity: 0.6, fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card-bg)', borderRadius: 8, border: '1px solid var(--card-border)', fontSize: 11, boxShadow: 'none' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Score Calculation Guide */}
      <div className="card-premium p-6 space-y-4 text-foreground">
        <div className="flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-foreground" />
          <h4 className="font-extrabold text-sm text-foreground tracking-tight">Performance Score Calculation</h4>
        </div>
        <p className="text-xs md:text-sm text-neutral-500 font-semibold leading-relaxed">
          Your daily performance score is dynamically computed out of 100 points based on your logged tasks:
        </p>
        <div className="pt-2">
          <div className="p-4 bg-button-hover/50 rounded-2xl border border-divider space-y-1">
            <span className="text-xs uppercase tracking-wider font-extrabold text-neutral-400 block">Today's Tasks (100%)</span>
            <p className="text-sm font-bold text-foreground">Bullet Journal Task Completion</p>
            <p className="text-xs text-neutral-550 leading-relaxed font-semibold">
              Earn points based on the completion percentage of your logged tasks, up to a maximum of 100 points.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
