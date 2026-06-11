'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import PageHeader from '../layout/PageHeader';
import BulletNoteItem from './BulletNoteItem';
import AssignDateButton from './AssignDateButton';
import { adjustWeek } from '@/lib/date-utils';
import { BULLET_TYPES } from '@/lib/constants';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
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
  } = usePlannerStore();

  const [newTaskInput, setNewTaskInput] = useState('');
  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');

  const plan = getOrCreateWeeklyPlan(selectedWeek);

  const handlePrevWeek = () => setWeek(adjustWeek(selectedWeek, -1));
  const handleNextWeek = () => setWeek(adjustWeek(selectedWeek, 1));

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
      <PageHeader title="Weekly Plan">
        <div className="flex items-center gap-1 bg-kbd-bg rounded-md p-1 shadow-none">
          <button
            onClick={handlePrevWeek}
            className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-800 transition-colors cursor-pointer"
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
            className="text-xs font-extrabold px-2 py-0.5 bg-transparent border-0 outline-none text-center cursor-pointer w-[125px] text-black"
            style={{ colorScheme: 'light' }}
          />
          <button
            onClick={handleNextWeek}
            className="p-1.5 hover:bg-neutral-200 rounded-md text-neutral-800 transition-colors cursor-pointer"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="card-premium p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight">Weekly Log</h4>
            <span className="text-xs font-bold text-neutral-500 select-none">
              {progress}% completed
            </span>
          </div>

          <div className="bg-kbd-bg p-1 rounded-md flex gap-1 text-xs font-bold select-none">
            {BULLET_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setBulletType(type)}
                className={`flex-1 py-1.5 px-3 rounded-md text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-black text-white shadow-none' : 'text-neutral-550 hover:text-black hover:bg-neutral-200/50' }`}
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
                      onAssign={() => deleteWeeklyTask(selectedWeek, note.id)}
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
