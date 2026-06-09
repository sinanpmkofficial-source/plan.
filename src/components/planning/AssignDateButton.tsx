'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
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
  const [selected, setSelected] = useState<Date | undefined>(undefined);
  const [pos, setPos] = useState<PanelPos>({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const calcPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelH = 320;
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
      setSelected(undefined);
    } else {
      calcPos();
      setSelected(undefined);
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
        setSelected(undefined);
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
    if (!selected) return;
    const dateStr = format(selected, 'yyyy-MM-dd');
    addBulletNote(dateStr, 'task', taskText);
    showToast(`Scheduled for ${format(selected, 'MMM d, yyyy')}`);
    if (onAssign) onAssign();
    setOpen(false);
    setSelected(undefined);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setSelected(undefined);
  };

  const panel = (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden"
    >
      <Calendar
        mode="single"
        selected={selected}
        onSelect={setSelected}
        today={new Date()}
      />
      <div className="flex gap-2 px-3 pb-3 pt-1 border-t border-neutral-100">
        <button
          type="button"
          onClick={handleCancel}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-bold text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" /> Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-full text-xs font-bold transition-colors ${
            selected
              ? 'bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer'
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
        className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded-full transition-colors cursor-pointer"
        title="Assign to a Date"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(panel, document.body)}
    </div>
  );
}
