'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface QuickAddInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
  id?: string;
  className?: string;
}

export function QuickAddInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Add new item...',
  id,
  className = '',
}: QuickAddInputProps) {
  return (
    <form onSubmit={onSubmit} className={`flex gap-2 select-none ${className}`}>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full input-premium text-sm font-semibold"
      />
      <button
        type="submit"
        className="button-premium flex items-center justify-center shrink-0 cursor-pointer px-4 gap-1.5"
        aria-label="Add"
      >
        <Plus 
          size={16} 
          strokeWidth={3.5} 
        />
        <span className="hidden sm:inline text-[10px] uppercase tracking-widest font-black">Add</span>
      </button>
    </form>
  );
}
