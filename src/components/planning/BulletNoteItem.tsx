'use client';

import React, { useState } from 'react';
import { BulletNote } from '@/types/planner';
import { Pencil, Check, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';
import { usePlannerStore } from '@/store/planner-store';

const TAG_SPLIT = /(#[\p{L}\p{N}_-]+)/gu;
const TAG_ONE = /^#[\p{L}\p{N}_-]+$/u;

/** Render text with clickable #tags that open a filtered search. */
function renderWithTags(text: string, onTag: (tag: string) => void): React.ReactNode {
  return text.split(TAG_SPLIT).map((part, i) => {
    if (TAG_ONE.test(part)) {
      return (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            onTag(part);
          }}
          className="font-black text-foreground/55 hover:text-foreground hover:underline cursor-pointer"
        >
          {part}
        </button>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

interface BulletNoteItemProps {
  note: BulletNote;
  onToggle?: () => void;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  extraActions?: React.ReactNode;
}

export default function BulletNoteItem({
  note,
  onToggle,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  extraActions,
}: BulletNoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [editingText, setEditingText] = useState(note.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const openSearch = usePlannerStore((s) => s.openSearch);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (editing) return;
    if (e.key === 'ArrowUp') {
      if (onMoveUp) {
        e.preventDefault();
        onMoveUp();
      }
    } else if (e.key === 'ArrowDown') {
      if (onMoveDown) {
        e.preventDefault();
        onMoveDown();
      }
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex items-center justify-between gap-3 px-2 py-1.5 hover:bg-button-hover rounded-xl transition-colors group focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:bg-button-hover/50 outline-hidden"
    >
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
            {renderWithTags(note.text, (tag) => openSearch(tag))}
          </span>
        )}
      </div>

      {!editing && (
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100">
          {onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-button-hover text-neutral-450 hover:text-foreground rounded-full transition-colors cursor-pointer"
              title="Move Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="w-8 h-8 flex items-center justify-center hover:bg-button-hover text-neutral-450 hover:text-foreground rounded-full transition-colors cursor-pointer"
              title="Move Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleStartEdit}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover text-neutral-450 hover:text-foreground rounded-full transition-colors cursor-pointer"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          
          {extraActions}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover text-neutral-450 hover:text-foreground rounded-full transition-colors shrink-0 cursor-pointer"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
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
