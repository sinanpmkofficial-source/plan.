'use client';

import React, { useState } from 'react';
import { BulletNote } from '@/types/planner';
import { MapPin, Pencil, Check, X, Trash2 } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';

interface BulletNoteItemProps {
  note: BulletNote;
  onToggle?: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  extraActions?: React.ReactNode;
}

export default function BulletNoteItem({
  note,
  onToggle,
  onUpdate,
  onDelete,
  extraActions,
}: BulletNoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [editingText, setEditingText] = useState(note.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStartEdit = () => {
    setEditingText(note.text);
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (editingText.trim()) {
      onUpdate(editingText.trim());
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 px-2 py-1.5 hover:bg-button-hover rounded-md transition-colors group">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Type Indicator / Toggle */}
        {note.type === 'task' && (
          <button
            onClick={onToggle}
            className="shrink-0 focus:outline-hidden cursor-pointer"
          >
            {note.completed ? (
              <span className="w-4 h-4 border border-foreground bg-foreground text-background rounded flex items-center justify-center text-[10px] font-black">✓</span>
            ) : (
              <span className="w-4 h-4 border border-neutral-300 hover:border-foreground rounded block" />
            )}
          </button>
        )}
        {note.type === 'note' && (
          <span className="text-neutral-400 select-none font-bold shrink-0">—</span>
        )}
        {note.type === 'event' && (
          <span className="text-neutral-400 select-none font-bold shrink-0">○</span>
        )}

        {/* Text / Input */}
        {editing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input
              type="text"
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              className="flex-1 bg-transparent border-b border-foreground outline-none text-sm font-bold py-0 text-foreground"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <button
              onClick={handleSaveEdit}
              className="p-1 hover:bg-button-hover text-foreground rounded transition-colors cursor-pointer"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={handleCancelEdit}
              className="p-1 hover:bg-button-hover text-neutral-450 rounded transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span
            onClick={note.type === 'task' ? onToggle : undefined}
            className={`text-sm break-words leading-relaxed font-bold flex-1 ${ note.type === 'task' ? 'cursor-pointer hover:text-foreground/85 select-none' : '' } ${ note.type === 'task' && note.completed ? 'text-neutral-400 line-through font-medium' : 'text-foreground' }`}
          >
            {note.text}
          </span>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <button
            onClick={handleStartEdit}
            className="p-1 hover:bg-button-hover text-neutral-400 hover:text-foreground rounded-full transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          
          {extraActions}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1 hover:bg-button-hover text-neutral-400 hover:text-foreground rounded-full transition-colors shrink-0 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Item"
        message={`Are you sure you want to delete this ${note.type}? This action cannot be undone.`}
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
