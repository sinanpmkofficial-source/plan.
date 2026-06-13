'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import DatePickerModal from './DatePickerModal';

interface DatePickerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePickerInput({
  value,
  onChange,
  placeholder = 'Select Date',
  className = '',
}: DatePickerInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const displayValue = value
    ? format(parseISO(value), 'MMM d, yyyy')
    : placeholder;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center justify-between input-premium text-sm font-semibold select-none cursor-pointer text-left ${className}`}
      >
        <span className={value ? 'text-foreground font-semibold' : 'text-neutral-400'}>
          {displayValue}
        </span>
        <CalendarIcon className="w-4 h-4 text-foreground/45 shrink-0 ml-2" />
      </button>

      <DatePickerModal
        isOpen={isOpen}
        selectedDate={value ? parseISO(value) : undefined}
        onSelect={(date) => {
          const formatted = format(date, 'yyyy-MM-dd');
          onChange(formatted);
        }}
        onClose={() => setIsOpen(false)}
        title={placeholder}
      />
    </>
  );
}
