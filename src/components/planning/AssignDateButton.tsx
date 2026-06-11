'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { usePlannerStore } from '@/store/planner-store';

interface AssignDateButtonProps {
  taskText: string;
  onAssign?: () => void;
}

interface PanelPos { top: number; left: number; }

export default function AssignDateButton({ taskText, onAssign }: AssignDateButtonProps) {
  const { addBulletNote, showToast } = usePlannerStore();

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [pos, setPos] = useState<PanelPos>({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const calcPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelH = 160;
    const panelW = 260;
    const top = rect.top > panelH ? rect.top - panelH - 6 : rect.bottom + 6;
    let left = rect.right - panelW;
    if (left < 8) left = 8;
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
    setPos({ top, left });
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setSelectedDate('');
    } else {
      calcPos();
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setOpen(true);
    }
  };

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const update = () => calcPos();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, calcPos]);

  // Close on outside click/tap
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
        setSelectedDate('');
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedDate) return;
    
    addBulletNote(selectedDate, 'task', taskText);
    const displayDate = format(new Date(selectedDate), 'MMM d, yyyy');
    showToast(`Scheduled for ${displayDate}`);
    if (onAssign) onAssign();
    setOpen(false);
    setSelectedDate('');
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setSelectedDate('');
  };

  const panel = (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white rounded-lg border border-neutral-200 p-4 w-[260px] space-y-4 shadow-none"
    >
      <div className="space-y-2">
        <label htmlFor="assign-date" className="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
          Select Date
        </label>
        <input
          id="assign-date"
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full input-premium text-sm font-bold py-2 text-black"
          style={{ colorScheme: 'light' }}
        />
      </div>
      
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-bold text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedDate}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-md text-xs font-bold transition-colors ${
            selectedDate
              ? 'bg-black text-white hover:bg-neutral-900 cursor-pointer'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          }`}
        >
          <Check className="w-3 h-3" /> Assign
        </button>
      </div>
    </div>
  );

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-7 h-7 flex items-center justify-center hover:bg-neutral-200 text-neutral-400 hover:text-black rounded-md transition-colors cursor-pointer"
        title="Assign to a Date"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(panel, document.body)}
    </div>
  );
}
