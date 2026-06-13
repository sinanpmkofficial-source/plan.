'use client';

import React, { useState, useRef } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import BulletNoteItem from './BulletNoteItem';
import AssignDateButton from './AssignDateButton';
import { BULLET_TYPES } from '@/lib/constants';
import {
  FileText,
  Calendar as CalendarIcon,
  Cloud,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { QuickAddInput } from '../ui/QuickAddInput';

export default function WeeklyView() {
  const {
    selectedWeek,
    setWeek,
    getOrCreateWeeklyPlan,
    addWeeklyTask,
    updateWeeklyTask,
    toggleWeeklyTask,
    deleteWeeklyTask,
    updateWeeklyReflection,
    syncStatus,
    retrySync,
  } = usePlannerStore();

  const [newTaskInput, setNewTaskInput] = useState('');
  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');
  const weekInputRef = useRef<HTMLInputElement>(null);

  const plan = getOrCreateWeeklyPlan(selectedWeek);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    addWeeklyTask(selectedWeek, bulletType, newTaskInput.trim());
    setNewTaskInput('');
  };

  const bulletTasks = (plan.bulletNotes || []).filter((n) => n.type === 'task');
  const completedWeekly = bulletTasks.filter((t) => t.completed).length;
  const progress = bulletTasks.length > 0 ? Math.round((completedWeekly / bulletTasks.length) * 100) : 0;

  const [yearStr, weekNoStr] = selectedWeek.split('-W');
  const formattedWeek = `Week ${weekNoStr}, ${yearStr}`;

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      
      {/* Brand Header */}
      <header className="flex items-center justify-between pb-2 select-none">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter leading-none">plan.</h1>
          
          {/* Cloud Sync badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-tight transition-all duration-300 border ${
            syncStatus === 'syncing'
              ? 'bg-neutral-800/40 border-neutral-700/50 text-neutral-400'
              : syncStatus === 'error'
              ? 'bg-red-500/10 border-red-500/20 text-red-400'
              : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-400'
          }`}>
            {syncStatus === 'syncing' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                <span>Saving...</span>
              </>
            ) : syncStatus === 'error' ? (
              <button onClick={retrySync} className="flex items-center gap-1.5 text-red-400 cursor-pointer bg-transparent border-0 outline-none">
                <RefreshCw className="w-3 h-3 animate-pulse" />
                <span>Sync Error</span>
              </button>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-neutral-400" />
                <span>Cloud Sync</span>
              </>
            )}
          </div>
        </div>

        {/* Week Jump picker button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-450 mr-2">
            {formattedWeek}
          </span>
          <button
            onClick={() => weekInputRef.current?.showPicker()}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover border border-card-border rounded-full text-foreground/50 hover:text-foreground transition-all cursor-pointer"
            title="Pick a week"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          <input
            type="week"
            ref={weekInputRef}
            value={selectedWeek}
            onChange={(e) => {
              if (e.target.value) setWeek(e.target.value);
            }}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
            style={{ colorScheme: 'normal' }}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="card-premium p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight">Weekly Log</h4>
            <span className="text-xs font-bold text-neutral-500 select-none">
              {progress}% completed
            </span>
          </div>

          <div className="bg-kbd-bg p-1 rounded-full flex gap-1 text-xs font-bold select-none">
            {BULLET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBulletType(type)}
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-foreground text-background shadow-none' : 'text-neutral-500 hover:text-foreground hover:bg-button-hover' }`}
              >
                {type === 'task' ? 'Task •' : type === 'note' ? 'Note —' : 'Event ○'}
              </button>
            ))}
          </div>

          <QuickAddInput
            value={newTaskInput}
            onChange={setNewTaskInput}
            onSubmit={handleAddTask}
            placeholder={`Add weekly ${bulletType}...`}
          />

          <div className="space-y-1.5">
            {(plan.bulletNotes || []).length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm border border-dashed border-divider rounded-lg font-bold">
                Weekly Log is empty. Add a task or note above!
              </div>
            ) : (
              (plan.bulletNotes || []).map((note) => (
                <BulletNoteItem
                  key={note.id}
                  note={note}
                  onToggle={() => toggleWeeklyTask(selectedWeek, note.id)}
                  onUpdate={(text) => updateWeeklyTask(selectedWeek, note.id, text)}
                  onDelete={() => deleteWeeklyTask(selectedWeek, note.id)}
                  extraActions={
                    <AssignDateButton
                      taskText={note.text}
                      onAssign={() => deleteWeeklyTask(selectedWeek, note.id, true)}
                      context="weekly"
                    />
                  }
                />
              ))
            )}
          </div>
        </div>

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
