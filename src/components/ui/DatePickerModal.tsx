'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayPicker } from 'react-day-picker';
import { isSameWeek, isSameMonth } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface DatePickerModalProps {
  isOpen: boolean;
  selectedDate: Date | undefined;
  onSelect: (date: Date) => void;
  onClose: () => void;
  title?: string;
  highlightType?: 'day' | 'week' | 'month';
}

export default function DatePickerModal({
  isOpen,
  selectedDate,
  onSelect,
  onClose,
  title = 'Select Date',
  highlightType = 'day',
}: DatePickerModalProps) {
  if (typeof document === 'undefined') return null;

  const modifiers: Record<string, (date: Date) => boolean> = {};
  const modifiersClassNames: Record<string, string> = {};

  if (selectedDate) {
    if (highlightType === 'week') {
      modifiers.activeWeek = (date: Date) => isSameWeek(date, selectedDate, { weekStartsOn: 1 });
      modifiersClassNames.activeWeek = 'rdp-day_active-week';
    } else if (highlightType === 'month') {
      modifiers.activeMonth = (date: Date) => isSameMonth(date, selectedDate);
      modifiersClassNames.activeMonth = 'rdp-day_active-month';
    }
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-card-bg rounded-[22px] border border-card-border p-5 max-w-[340px] w-full flex flex-col items-center justify-center overflow-hidden text-foreground select-none"
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between border-b border-divider pb-3 mb-2">
              <h3 className="text-sm font-extrabold tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-button-hover rounded-full text-foreground/45 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DayPicker Calendar */}
            <div className="flex justify-center items-center w-full">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    onSelect(date);
                    onClose();
                  }
                }}
                required
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
