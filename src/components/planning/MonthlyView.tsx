'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import BulletNoteItem from './BulletNoteItem';
import AssignDateButton from './AssignDateButton';
import { BULLET_TYPES } from '@/lib/constants';
import { format, parse } from 'date-fns';
import {
  FileText,
  Calendar as CalendarIcon,
  Cloud,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { QuickAddInput } from '../ui/QuickAddInput';
import DatePickerModal from '../ui/DatePickerModal';

export default function MonthlyView() {
  const {
    selectedMonth,
    setMonth,
    getOrCreateMonthlyPlan,
    addMonthlyTask,
    updateMonthlyTask,
    toggleMonthlyTask,
    deleteMonthlyTask,
    updateMonthlyReflection,
    syncStatus,
    retrySync,
  } = usePlannerStore();

  const [newTaskInput, setNewTaskInput] = useState('');
  const [bulletType, setBulletType] = useState<'task' | 'note' | 'event'>('task');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const plan = getOrCreateMonthlyPlan(selectedMonth);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    addMonthlyTask(selectedMonth, bulletType, newTaskInput.trim());
    setNewTaskInput('');
  };

  const bulletTasks = (plan.bulletNotes || []).filter((n) => n.type === 'task');
  const completedMonthly = bulletTasks.filter((t) => t.completed).length;
  const progress = bulletTasks.length > 0 ? Math.round((completedMonthly / bulletTasks.length) * 100) : 0;

  const parsedMonthDate = parse(selectedMonth, 'yyyy-MM', new Date());
  const formattedMonth = format(parsedMonthDate, 'MMMM yyyy');

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      
      {/* Brand Header */}
      <header className="flex items-center justify-between pb-2 select-none">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-black tracking-tighter leading-none">plan.</h1>
          
          {/* Cloud Sync Icon-only */}
          <div className="flex items-center justify-center">
            {syncStatus === 'syncing' ? (
              <span title="Saving...">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              </span>
            ) : syncStatus === 'error' ? (
              <button
                onClick={retrySync}
                className="p-1 hover:bg-button-hover rounded-full text-rose-500 hover:text-rose-650 transition-colors cursor-pointer bg-transparent border-0 outline-none flex items-center justify-center"
                title="Sync Error - Click to Retry"
              >
                <RefreshCw className="w-4 h-4 animate-pulse" />
              </button>
            ) : (
              <span title="All changes saved">
                <Cloud className="w-4 h-4 text-neutral-400" />
              </span>
            )}
          </div>
        </div>

        {/* Month Jump picker button */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral-450 mr-2">
            {formattedMonth}
          </span>
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover border border-card-border rounded-full text-foreground/50 hover:text-foreground transition-all cursor-pointer"
            title="Pick a month"
          >
            <CalendarIcon className="w-4 h-4" />
          </button>
          
          <DatePickerModal
            isOpen={isCalendarOpen}
            selectedDate={parsedMonthDate}
            onSelect={(date) => setMonth(format(date, 'yyyy-MM'))}
            onClose={() => setIsCalendarOpen(false)}
            title="Select Month"
            highlightType="month"
          />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        <div className="space-y-5 py-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-base tracking-tight text-foreground">Monthly Log</h4>
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
                className={`flex-1 py-1.5 px-3 rounded-full text-center transition-all cursor-pointer ${ bulletType === type ? 'bg-foreground text-background shadow-none' : 'text-neutral-550 hover:text-foreground hover:bg-button-hover' }`}
              >
                {type === 'task' ? 'Task •' : type === 'note' ? 'Note —' : 'Event ○'}
              </button>
            ))}
          </div>

          <QuickAddInput
            value={newTaskInput}
            onChange={setNewTaskInput}
            onSubmit={handleAddTask}
            placeholder={`Add monthly ${bulletType}...`}
          />

          <div className="space-y-1.5">
            {(plan.bulletNotes || []).length === 0 ? (
              <div className="py-12 text-center text-neutral-400 text-sm font-bold">
                Monthly Log is empty. Log a task, note, or event above!
              </div>
            ) : (
              (plan.bulletNotes || []).map((note) => (
                <BulletNoteItem
                  key={note.id}
                  note={note}
                  onToggle={() => toggleMonthlyTask(selectedMonth, note.id)}
                  onUpdate={(text) => updateMonthlyTask(selectedMonth, note.id, text)}
                  onDelete={() => deleteMonthlyTask(selectedMonth, note.id)}
                  extraActions={
                    <AssignDateButton
                      taskText={note.text}
                      onAssign={() => deleteMonthlyTask(selectedMonth, note.id, true)}
                      context="monthly"
                    />
                  }
                />
              ))
            )}
          </div>
        </div>

        <div className="space-y-5 py-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-base tracking-tight flex items-center gap-1.5 text-foreground">
              <FileText className="w-4 h-4 text-neutral-550" />
              <span>Monthly Reflection</span>
            </h4>
          </div>

          <textarea
            value={plan.reflection || ''}
            onChange={(e) => updateMonthlyReflection(selectedMonth, e.target.value)}
            placeholder="Write your reflection here... What worked? What needs adjustment?"
            rows={10}
            className="w-full textarea-premium text-sm font-semibold resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
