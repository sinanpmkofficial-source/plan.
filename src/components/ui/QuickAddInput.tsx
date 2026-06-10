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
        className="w-full input-premium text-sm py-2 font-semibold"
      />
      <button
        type="submit"
        style={{ padding: 0 }}
        className="button-premium w-10 h-10 rounded-full flex items-center justify-center shrink-0 cursor-pointer bg-black hover:bg-neutral-900 active:scale-95 transition-all"
        aria-label="Add"
      >
        <Plus 
          size={18} 
          color="white"
          strokeWidth={3} 
        />
      </button>
    </form>
  );
}
