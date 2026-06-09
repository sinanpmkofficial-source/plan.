'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { usePlannerStore } from '@/store/planner-store';

interface AssignDateButtonProps {
  taskText: string;
}

export default function AssignDateButton({ taskText }: AssignDateButtonProps) {
  const { addBulletNote } = usePlannerStore();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateVal = e.target.value;
    if (dateVal) {
      addBulletNote(dateVal, 'task', taskText);
      alert(`Assigned to ${new Date(dateVal).toLocaleDateString(undefined, { dateStyle: 'medium' })}`);
      e.target.value = ''; // Reset the input date so it can be re-triggered
    }
  };

  return (
    <div
      className="relative p-1.5 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 rounded-full transition-colors cursor-pointer"
      title="Assign to a Date"
    >
      <Calendar className="w-3.5 h-3.5" />
      <input
        type="date"
        onChange={handleDateChange}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full [color-scheme:light]"
      />
    </div>
  );
}
