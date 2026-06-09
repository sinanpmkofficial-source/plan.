'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { usePlannerStore } from '@/store/planner-store';

interface AssignDateButtonProps {
  taskText: string;
  onAssign?: () => void;
}

export default function AssignDateButton({ taskText, onAssign }: AssignDateButtonProps) {
  const { addBulletNote, showToast } = usePlannerStore();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      addBulletNote(dateVal, 'task', taskText);
      const formattedDate = new Date(dateVal).toLocaleDateString(undefined, { dateStyle: 'medium' });
      showToast(`Scheduled for ${formattedDate}`);
      if (onAssign) onAssign();
      e.target.value = ''; // Reset the input date so it can be re-triggered
    }
  };

  return (
    <div
      className="relative w-7 h-7 flex items-center justify-center hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded-full transition-colors cursor-pointer"
      title="Assign to a Date"
    >
      <Calendar className="w-3.5 h-3.5" />
      <input
        type="date"
        onChange={handleDateChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:light] m-0 p-0 border-0"
      />
    </div>
  );
}
