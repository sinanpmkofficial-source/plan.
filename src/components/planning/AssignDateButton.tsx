'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { usePlannerStore } from '@/store/planner-store';
import DatePicker from 'react-datepicker';

interface AssignDateButtonProps {
  taskText: string;
  onAssign?: () => void;
  context: 'weekly' | 'monthly';
}

export default function AssignDateButton({ taskText, onAssign, context }: AssignDateButtonProps) {
  const { addBulletNote, showToast, dailyPlans } = usePlannerStore();

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setSelectedDate(null);
    } else {
      setSelectedDate(new Date());
      setOpen(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(target) && !(e.target as HTMLElement).closest('.calendar-toggle-btn')) {
        setOpen(false);
        setSelectedDate(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const handleQuickSelect = (dateStr: string) => {
    addBulletNote(dateStr, 'task', taskText);
    const displayDate = format(new Date(dateStr), 'MMM d, yyyy');
    showToast(`Scheduled for ${displayDate}`);
    if (onAssign) onAssign();
    setOpen(false);
    setSelectedDate(null);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setSelectedDate(null);
  };

  const getDayClassName = (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const plan = dailyPlans[dateStr];
      const taskCount = plan?.bulletNotes?.filter((n: any) => n.type === 'task').length || 0;
      return taskCount > 0 ? 'react-datepicker__day--highlighted-custom' : '';
    } catch (e) {
      return '';
    }
  };

  const panel = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Blurred overlay background */}
      <div 
        onClick={handleCancel}
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
      />
      {/* Centered Modal content */}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-2xl border border-neutral-200 p-5 shadow-none text-black select-none z-10 animate-in zoom-in-95 duration-100 flex flex-col items-center"
      >
        <div className="flex items-center justify-between border-b border-divider pb-2.5 mb-3 w-full">
          <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
            Schedule Task
          </span>
          <button onClick={handleCancel} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-black cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => {
            if (date) {
              const formatted = format(date, 'yyyy-MM-dd');
              handleQuickSelect(formatted);
            }
          }}
          dayClassName={getDayClassName}
          inline
        />
      </div>
    </div>
  );

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleToggle}
        className="calendar-toggle-btn w-7 h-7 flex items-center justify-center hover:bg-neutral-200 text-neutral-400 hover:text-black rounded-md transition-colors cursor-pointer"
        title="Assign to a Date"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(panel, document.body)}
    </div>
  );
}
