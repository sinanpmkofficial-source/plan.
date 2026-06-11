'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { usePlannerStore } from '@/store/planner-store';

interface AssignDateButtonProps {
  taskText: string;
  onAssign?: () => void;
  context: 'weekly' | 'monthly';
}

interface PanelPos { top: number; left: number; }

export default function AssignDateButton({ taskText, onAssign, context }: AssignDateButtonProps) {
  const { addBulletNote, showToast, selectedWeek, selectedMonth } = usePlannerStore();

  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [pos, setPos] = useState<PanelPos>({ top: 0, left: 0 });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Parse days of the selected week (YYYY-Www)
  const getWeekDays = useCallback(() => {
    try {
      const [yearStr, weekNoStr] = selectedWeek.split('-W');
      const year = Number(yearStr);
      const week = Number(weekNoStr);
      
      const jan4 = new Date(year, 0, 4);
      const dayOffset = (jan4.getDay() || 7) - 1; // days since Monday
      const startOfWeek1 = new Date(jan4.getTime() - dayOffset * 24 * 60 * 60 * 1000);
      
      const mondayTime = startOfWeek1.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000;
      
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(mondayTime + i * 24 * 60 * 60 * 1000);
        dates.push({
          dateStr: d.toISOString().split('T')[0],
          dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
          dayNum: d.getDate(),
        });
      }
      return dates;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [selectedWeek]);

  // Parse days of the selected month (YYYY-MM)
  const getMonthDays = useCallback(() => {
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const paddedDay = String(d).padStart(2, '0');
        const paddedMonth = String(month).padStart(2, '0');
        days.push({
          dayNum: d,
          dateStr: `${year}-${paddedMonth}-${paddedDay}`,
        });
      }
      return days;
    } catch (e) {
      console.error(e);
      return [];
    }
  }, [selectedMonth]);

  const calcPos = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const panelH = context === 'weekly' ? 260 : 220;
    const panelW = 280;
    const top = rect.top > panelH ? rect.top - panelH - 6 : rect.bottom + 6;
    let left = rect.right - panelW;
    if (left < 8) left = 8;
    if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8;
    setPos({ top, left });
  }, [context]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      setSelectedDate('');
      setShowCustomPicker(false);
    } else {
      calcPos();
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setOpen(true);
    }
  };

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

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) {
        setOpen(false);
        setSelectedDate('');
        setShowCustomPicker(false);
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
    setSelectedDate('');
  };

  const handleConfirmCustom = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedDate) return;
    handleQuickSelect(selectedDate);
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setSelectedDate('');
    setShowCustomPicker(false);
  };

  const weekDays = getWeekDays();
  const monthDays = getMonthDays();

  const panel = (
    <div
      ref={panelRef}
      onClick={(e) => e.stopPropagation()}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
      className="bg-white/80 backdrop-blur-md rounded-xl border border-neutral-200 p-4 w-[280px] space-y-3 shadow-none text-black select-none"
    >
      <div className="flex items-center justify-between border-b border-divider pb-2 mb-1">
        <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
          {context === 'weekly' ? 'Assign to Week Day' : 'Assign to Month Day'}
        </span>
        <button onClick={handleCancel} className="p-1 hover:bg-neutral-100 rounded text-neutral-400 hover:text-black">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {!showCustomPicker ? (
        <>
          {context === 'weekly' && (
            <div className="grid grid-cols-2 gap-1.5">
              {weekDays.map((wd) => (
                <button
                  key={wd.dateStr}
                  onClick={() => handleQuickSelect(wd.dateStr)}
                  className="px-2.5 py-1.5 text-left bg-neutral-50 hover:bg-black hover:text-white border border-neutral-200 hover:border-black rounded-md transition-colors cursor-pointer group flex flex-col"
                >
                  <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-extrabold group-hover:text-neutral-300">
                    {wd.dayName}
                  </span>
                  <span className="text-xs font-black leading-tight">
                    {wd.dayNum}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setShowCustomPicker(true)}
                className="col-span-2 py-2 text-center text-xs font-black border border-dashed border-neutral-300 hover:border-black rounded-md cursor-pointer hover:bg-neutral-50 transition-colors"
              >
                Choose Custom Date...
              </button>
            </div>
          )}

          {context === 'monthly' && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 max-h-[140px] overflow-y-auto pr-1">
                {monthDays.map((md) => (
                  <button
                    key={md.dateStr}
                    onClick={() => handleQuickSelect(md.dateStr)}
                    className="w-7 h-7 flex items-center justify-center text-xs font-black bg-neutral-50 hover:bg-black hover:text-white border border-neutral-200 hover:border-black rounded-md transition-colors cursor-pointer"
                  >
                    {md.dayNum}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowCustomPicker(true)}
                className="w-full py-2 text-center text-xs font-black border border-dashed border-neutral-300 hover:border-black rounded-md cursor-pointer hover:bg-neutral-50 transition-colors"
              >
                Choose Custom Date...
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3 animate-in fade-in duration-100">
          <div className="space-y-1.5">
            <label htmlFor="assign-date" className="block text-[9px] font-black text-neutral-400 uppercase tracking-wider">
              Select Custom Date
            </label>
            <input
              id="assign-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full input-premium text-sm font-bold py-1.5 text-black"
              style={{ colorScheme: 'light' }}
            />
          </div>
          
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCustomPicker(false)}
              className="flex-1 py-1.5 border border-neutral-200 hover:bg-neutral-50 rounded-md text-xs font-bold text-neutral-500 cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleConfirmCustom}
              disabled={!selectedDate}
              className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-colors ${
                selectedDate
                  ? 'bg-black text-white hover:bg-neutral-900 cursor-pointer'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              Assign
            </button>
          </div>
        </div>
      )}
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
