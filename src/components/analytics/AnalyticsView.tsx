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
        // Count prayers
        const prayersCount = Object.values(realPlan.prayers || {}).filter(Boolean).length;
        // Count tasks in bulletNotes
        const bulletTasks = (realPlan.bulletNotes || []).filter((n) => n.type === 'task');
        const tasksCount = bulletTasks.length;
        const completedTasks = bulletTasks.filter((t) => t.completed).length;
        
        data.push({
          date: label,
          score: realPlan.score || 0,
          prayers: prayersCount,
          tasksCompleted: completedTasks,
          tasksTotal: tasksCount,
          isReal: true,
        });
      } else {
        data.push({
          date: label,
          score: 0,
          prayers: 0,
          tasksCompleted: 0,
          tasksTotal: 0,
          isReal: false,
        });
      }
    }
    return data;
  };

  // Compile prayer consistency rates (Fajr, Dhuhr, Asr, Maghrib, Isha) over the last 14 days
  const getPrayerConsistencyData = () => {
    const counts = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    const totalDays = 14;
    const today = new Date();
    let realDaysCount = 0;

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const plan = dailyPlans[dateStr];
      if (plan) {
        realDaysCount++;
        if (plan.prayers?.fajr) counts.fajr++;
        if (plan.prayers?.dhuhr) counts.dhuhr++;
        if (plan.prayers?.asr) counts.asr++;
        if (plan.prayers?.maghrib) counts.maghrib++;
        if (plan.prayers?.isha) counts.isha++;
      }
    }

    // Fallback to zero if no real logs exist
    const useReal = realDaysCount > 0;
    const denom = useReal ? realDaysCount : 1;

    return [
      { name: 'Fajr', rate: useReal ? Math.round((counts.fajr / denom) * 100) : 0 },
      { name: 'Dhuhr', rate: useReal ? Math.round((counts.dhuhr / denom) * 100) : 0 },
      { name: 'Asr', rate: useReal ? Math.round((counts.asr / denom) * 100) : 0 },
      { name: 'Maghrib', rate: useReal ? Math.round((counts.maghrib / denom) * 100) : 0 },
      { name: 'Isha', rate: useReal ? Math.round((counts.isha / denom) * 100) : 0 },
    ];
  };

  const trendData = getLast7DaysData();
  const prayerData = getPrayerConsistencyData();

  // Compute averages
  const averageScore = Math.round(trendData.reduce((acc, curr) => acc + curr.score, 0) / trendData.length);
  const averagePrayers = (trendData.reduce((acc, curr) => acc + curr.prayers, 0) / trendData.length).toFixed(1);

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200">
      <PageHeader title="Analytics" />

      {/* Overview Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="card-premium p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 col-span-1">
          <div className="p-2.5 md:p-3 bg-neutral-100 rounded-md self-start md:self-auto shrink-0 text-black">
            <Award className="w-5.5 h-5.5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] md:text-[10px] text-neutral-500 font-bold uppercase tracking-wider block leading-tight">Avg Performance</span>
            <h4 className="text-lg md:text-xl font-bold text-black mt-0.5 truncate">{averageScore} / 100</h4>
          </div>
        </div>

        <div className="card-premium p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 col-span-1">
          <div className="p-2.5 md:p-3 bg-neutral-100 rounded-md self-start md:self-auto shrink-0 text-black">
            <Flame className="w-5.5 h-5.5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] md:text-[10px] text-neutral-500 font-bold uppercase tracking-wider block leading-tight">Avg Prayers Logged</span>
            <h4 className="text-lg md:text-xl font-bold text-black mt-0.5 truncate">{averagePrayers} / 5.0</h4>
          </div>
        </div>

        <div className="card-premium p-4 md:p-5 flex items-center gap-4 col-span-2 md:col-span-1">
          <div className="p-2.5 md:p-3 bg-neutral-100 rounded-md shrink-0 text-black">
            <BarChart3 className="w-5.5 h-5.5 md:w-6 md:h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[9px] md:text-[10px] text-neutral-500 font-bold uppercase tracking-wider block leading-tight">Active Goals</span>
            <h4 className="text-lg md:text-xl font-bold text-black mt-0.5 truncate">{goals.filter(g => g.status === 'active').length} Objectives</h4>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Performance Score Trend Chart */}
        <div className="card-premium p-6 space-y-4">
          <div>
            <h4 className="font-bold text-sm text-neutral-900 tracking-tight">Performance Trend</h4>
          </div>
          <div className="h-64 w-full text-black">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#666', fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#666', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #000000', fontSize: 11, boxShadow: 'none' }}
                  labelStyle={{ fontWeight: 'bold', color: '#000000' }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#000000"
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 1 }}
                  activeDot={{ r: 5 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prayer Consistency Bar Chart */}
        <div className="card-premium p-6 space-y-4">
          <div>
            <h4 className="font-bold text-sm text-neutral-900 tracking-tight">Prayer Consistency</h4>
          </div>
          <div className="h-64 w-full text-black">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prayerData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#666', fontWeight: 600 }} />
                <YAxis domain={[0, 100]} tickLine={false} axisLine={false} style={{ fontSize: 10, fill: '#666', fontWeight: 600 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: 8, border: '1px solid #000000', fontSize: 11, boxShadow: 'none' }}
                  labelStyle={{ fontWeight: 'bold', color: '#000000' }}
                />
                <Bar dataKey="rate" fill="#000000" radius={[3, 3, 0, 0]} name="Consistency %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Score Calculation Guide */}
      <div className="card-premium p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Award className="w-4.5 h-4.5 text-neutral-800" />
          <h4 className="font-extrabold text-sm text-neutral-900 tracking-tight">Performance Score Calculation</h4>
        </div>
        <p className="text-xs md:text-sm text-neutral-500 font-semibold leading-relaxed">
          Your daily performance score is dynamically computed out of 100 points based on two core categories:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-neutral-50 rounded-lg border border-divider space-y-1">
            <span className="text-xs uppercase tracking-wider font-extrabold text-neutral-400 block">Spiritual Tracker (50%)</span>
            <p className="text-sm font-bold text-neutral-800">5-Time Prayers Consistency</p>
            <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
              Earn 10 points for each prayer logged (Fajr, Dhuhr, Asr, Maghrib, Isha) up to a maximum of 50 points.
            </p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg border border-divider space-y-1">
            <span className="text-xs uppercase tracking-wider font-extrabold text-neutral-400 block">Today's Tasks (50%)</span>
            <p className="text-sm font-bold text-neutral-800">Bullet Journal Task Completion</p>
            <p className="text-xs text-neutral-500 leading-relaxed font-semibold">
              Earn points based on the completion percentage of your logged tasks, up to a maximum of 50 points.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
