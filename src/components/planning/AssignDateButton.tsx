'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import { format } from 'date-fns';
import { usePlannerStore } from '@/store/planner-store';

interface AssignDateButtonProps {
  taskText: string;
  onAssign?: () => void;
}

export default function AssignDateButton({ taskText, onAssign }: AssignDateButtonProps) {
  const { addBulletNote, showToast } = usePlannerStore();

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close panel on outside click/tap
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

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setSelected(undefined);
    } else {
      setSelected(undefined);
      setOpen(true);
    }
  };

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

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      {/* Trigger */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-7 h-7 flex items-center justify-center hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded-full transition-colors cursor-pointer"
        title="Assign to a Date"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>

      {/* Picker panel */}
      {open && (
        <div
          ref={panelRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute z-50 right-0 bottom-9 bg-white rounded-2xl shadow-xl border border-neutral-100 p-3"
          style={{ minWidth: 260 }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            today={new Date()}
            style={{ margin: 0 }}
          />

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-neutral-100 mt-1">
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
      )}
    </div>
  );
}
