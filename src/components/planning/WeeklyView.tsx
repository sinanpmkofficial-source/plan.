'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  FileText,
  MapPin,
} from 'lucide-react';
import AssignDateButton from './AssignDateButton';

export default function WeeklyView() {
  const {
    selectedWeek,
    setWeek,
    getOrCreateWeeklyPlan,
    addWeeklyTask,
    toggleWeeklyTask,
    deleteWeeklyTask,
    updateWeeklyReflection,
  } = usePlannerStore();

  const [newTaskInput, setNewTaskInput] = useState('');
  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');

  const plan = getOrCreateWeeklyPlan(selectedWeek);

  const adjustWeek = (weekStr: string, delta: number) => {
    try {
      const [yearStr, weekNoStr] = weekStr.split('-W');
      const year = Number(yearStr);
      const week = Number(weekNoStr);
      
      const jan4 = new Date(year, 0, 4);
      const dayOffset = (jan4.getDay() || 7) - 1; // days since Monday
      const startOfWeek1 = new Date(jan4.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      const currentWeekTime = startOfWeek1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000;
      const adjustedTime = currentWeekTime + delta * 7 * 24 * 60 * 60 * 1000;
      const d = new Date(adjustedTime);
      
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    } catch (e) {
      console.error(e);
      return weekStr;
    }
  };

  const handlePrevWeek = () => {
    setWeek(adjustWeek(selectedWeek, -1));
  };

  const handleNextWeek = () => {
    setWeek(adjustWeek(selectedWeek, 1));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    addWeeklyTask(selectedWeek, bulletType, newTaskInput.trim());
    setNewTaskInput('');
  };

  const bulletTasks = (plan.bulletNotes || []).filter((n) => n.type === 'task');
  const completedWeekly = bulletTasks.filter((t) => t.completed).length;
  const progress = bulletTasks.length > 0 ? Math.round((completedWeekly / bulletTasks.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      {/* Page Header (Unifies title, navigation, sync status, and score badge) */}
      <PageHeader title="Weekly Plan">
        <div className="flex items-center gap-1 bg-kbd-bg rounded-full p-1 shadow-none">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 transition-colors cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="week"
            value={selectedWeek}
            onChange={(e) => {
              if (e.target.value) setWeek(e.target.value);
            }}
            className="text-xs font-extrabold px-2 py-0.5 bg-transparent border-0 outline-none text-center cursor-pointer w-[125px]"
            style={{ color: '#111111', colorScheme: 'light' }}
          />
          <button
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-600 transition-colors cursor-pointer"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left Column: Weekly Log */}
        <div className="card-premium p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight">Weekly Log</h4>
            <span className="text-xs font-bold text-black select-none">
              {progress}% completed
            </span>
          </div>

          {/* Segmented Control Selector */}
          <div className="bg-kbd-bg p-1 rounded-full flex gap-1 text-xs font-bold select-none">
            {(['task', 'note', 'event'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBulletType(type)}
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-white text-neutral-955 shadow-xs' : 'text-neutral-500 hover:text-neutral-700' }`}
              >
                {type === 'task' ? 'Task •' : type === 'note' ? 'Note —' : 'Event ○'}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskInput}
              onChange={(e) => setNewTaskInput(e.target.value)}
              placeholder={
                bulletType === 'task'
                  ? 'Add weekly task...'
                  : bulletType === 'note'
                  ? 'Add weekly note...'
                  : 'Add weekly event...'
              }
              className="w-full input-premium text-sm py-2 font-semibold"
            />
            <button
              type="submit"
              className="button-premium w-10 h-10 rounded-full flex items-center justify-center p-0 shrink-0 cursor-pointer"
              style={{ padding: 0 }}
            >
              <Plus className="w-4 h-4" color="white" stroke="white" />
            </button>
          </form>

          <div className="space-y-1.5">
            {(plan.bulletNotes || []).length === 0 ? (
              <div className="py-12 text-center text-neutral-450 text-sm border border-dashed border-divider rounded-2xl font-bold">
                Weekly Log is empty. Add a task or note above!
              </div>
            ) : (
              (plan.bulletNotes || []).map((note) => (
                <div
                  key={note.id}
                  className="flex items-center justify-between gap-3 px-2 py-1.5 hover:bg-neutral-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Checkbox or bullet icon type indicator */}
                    {note.type === 'task' && (
                      <button
                        onClick={() => toggleWeeklyTask(selectedWeek, note.id)}
                        className="shrink-0 focus:outline-hidden cursor-pointer"
                      >
                        {note.completed ? (
                          <span className="w-4 h-4 border border-neutral-900 bg-neutral-900 text-white rounded-full flex items-center justify-center text-[10px] font-bold">✓</span>
                        ) : (
                          <span className="w-4 h-4 border border-neutral-300 hover:border-neutral-500 rounded-full block" />
                        )}
                      </button>
                    )}
                    {note.type === 'note' && (
                      <span className="text-neutral-400 select-none font-bold shrink-0">—</span>
                    )}
                    {note.type === 'event' && (
                      <MapPin className="w-4 h-4 text-neutral-800 shrink-0" />
                    )}

                    <span
                      onClick={note.type === 'task' ? () => toggleWeeklyTask(selectedWeek, note.id) : undefined}
                      className={`text-sm break-words leading-relaxed font-bold ${ note.type === 'task' ? 'cursor-pointer hover:text-neutral-650 select-none' : '' } ${ note.type === 'task' && note.completed ? 'text-neutral-400 line-through font-medium' : 'text-neutral-850' }`}
                    >
                      {note.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100">
                    <AssignDateButton
                      taskText={note.text}
                      onAssign={() => deleteWeeklyTask(selectedWeek, note.id)}
                    />
                    <button
                      onClick={() => deleteWeeklyTask(selectedWeek, note.id)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 text-neutral-455 hover:text-red-550 rounded-full transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Weekly Reflections */}
        <div className="card-premium p-6 space-y-5">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-neutral-550" />
              <span>Weekly Reflection</span>
            </h4>
          </div>

          <textarea
            value={plan.reflection || ''}
            onChange={(e) => updateWeeklyReflection(selectedWeek, e.target.value)}
            placeholder="Review this week. What was achieved? What challenges occurred?"
            rows={10}
            className="w-full textarea-premium text-sm font-semibold resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
