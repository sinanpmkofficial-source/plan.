'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { usePlannerStore } from '@/store/planner-store';

interface AssignDateButtonProps {
  taskText: string;
  onAssign?: () => void;
  context: 'weekly' | 'monthly';
}

export default function AssignDateButton({ taskText, onAssign, context }: AssignDateButtonProps) {
  const { addBulletNote, showToast } = usePlannerStore();

  const [open, setOpen] = useState(false);
  // Step 1: pick a date. Step 2: confirm before scheduling.
  const [step, setStep] = useState<'pick' | 'confirm'>('pick');
  const [pickedDate, setPickedDate] = useState('');

  // Today in local time (YYYY-MM-DD)
  const todayLocal = new Date().toLocaleDateString('en-CA');

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPickedDate(todayLocal);
    setStep('pick');
    setOpen(true);
  };

  const handleClose = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpen(false);
    setPickedDate('');
    setStep('pick');
  };

  const handleNext = () => {
    if (!pickedDate) return;
    setStep('confirm');
  };

  const handleConfirm = () => {
    addBulletNote(pickedDate, 'task', taskText);
    const displayDate = format(parseISO(pickedDate), 'MMM d, yyyy');
    showToast(`Scheduled for ${displayDate}`);
    if (onAssign) onAssign();
    handleClose();
  };

  const panel = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div onClick={handleClose} className="absolute inset-0 bg-foreground/10 backdrop-blur-md" />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-card-bg rounded-2xl border border-card-border p-5 shadow-none text-foreground z-10 animate-in zoom-in-95 duration-100 w-full max-w-xs"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-divider pb-2.5 mb-4">
          <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
            {step === 'pick' ? 'Schedule Task' : 'Confirm Reschedule'}
          </span>
          <button onClick={handleClose} className="p-1 hover:bg-button-hover rounded-full text-foreground/40 hover:text-foreground cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'pick' ? (
          <>
            {/* Task preview */}
            <p className="text-xs font-bold text-foreground/50 mb-3 leading-relaxed line-clamp-2">
              "{taskText}"
            </p>

            {/* Native date input */}
            <div className="space-y-1 mb-4">
              <label className="text-[10px] font-extrabold text-foreground/40 uppercase tracking-wider">
                Choose Date
              </label>
              <input
                type="date"
                value={pickedDate}
                min={todayLocal}
                onChange={(e) => setPickedDate(e.target.value)}
                className="w-full input-premium text-sm font-semibold"
                style={{ colorScheme: 'normal' }}
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={handleClose} className="button-secondary text-xs px-4 py-1.5">Cancel</button>
              <button onClick={handleNext} disabled={!pickedDate} className="button-premium text-xs px-4 py-1.5 disabled:opacity-50">
                Next →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation step */}
            <div className="space-y-3 mb-5">
              <p className="text-sm font-bold text-foreground leading-relaxed">
                Move this task to <span className="underline underline-offset-2">{format(parseISO(pickedDate), 'EEEE, MMM d')}</span>?
              </p>
              <div className="bg-kbd-bg rounded-xl px-4 py-3 border border-card-border">
                <p className="text-xs font-semibold text-foreground/60 line-clamp-3 leading-relaxed">"{taskText}"</p>
              </div>
              <p className="text-[10px] text-foreground/40 font-semibold">
                This will add the task to your Daily Log on the selected date.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setStep('pick')} className="button-secondary text-xs px-4 py-1.5">← Back</button>
              <button onClick={handleConfirm} className="button-premium text-xs px-4 py-1.5">
                Confirm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-7 h-7 flex items-center justify-center hover:bg-button-hover text-foreground/40 hover:text-foreground rounded-full transition-colors cursor-pointer"
        title="Schedule to a date"
      >
        <CalendarIcon className="w-3.5 h-3.5" />
      </button>

      {open && typeof document !== 'undefined' && createPortal(panel, document.body)}
    </div>
  );
}
