'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { BrainDumpItem } from '@/types/planner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Trash2,
  CheckCircle2,
  Pencil,
  Check,
  X,
  Plus,
} from 'lucide-react';
import PageHeader from '../layout/PageHeader';
import ConfirmationModal from '../ui/ConfirmationModal';

export default function BrainDumpView() {
  const {
    brainDump,
    addBrainDumpItem,
    updateBrainDumpItem,
    deleteBrainDumpItem,
    convertBrainDumpItem,
    selectedDate,
  } = usePlannerStore();

  const [inputValue, setInputValue] = useState('');

  const handleAddThoughts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Split by newlines and trim each line
    const lines = inputValue
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    lines.forEach((line) => {
      // Clean leading bullet marks if any
      const cleaned = line.replace(/^[-*•\s+]+|^\d+[\s.)-]+\s*/, '').trim();
      if (cleaned) {
        addBrainDumpItem(cleaned);
      }
    });

    setInputValue('');
  };

  const activeThoughts = brainDump.filter((item) => item.status === 'inbox');

  return (
    <div className="max-w-2xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-20">
      <PageHeader title="Brain Dump" subtitle="Dump your raw thoughts and convert them into actions." />

      {/* Input area */}
      <form onSubmit={handleAddThoughts} className="card-premium p-5 space-y-4">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={`Write or paste your thoughts... (Write each thought on a new line to add them separately)`}
          rows={4}
          className="w-full textarea-premium font-semibold text-sm placeholder:text-neutral-400 bg-neutral-50/20"
        />
        <div className="flex justify-end">
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!inputValue.trim()}
            className="button-premium text-xs px-5 py-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to Thoughts</span>
          </motion.button>
        </div>
      </form>

      {/* List of Thoughts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-sm text-neutral-400 uppercase tracking-wider">
            Thoughts ({activeThoughts.length})
          </h3>
        </div>

        <div className="space-y-4 min-h-[200px]">
          <AnimatePresence initial={false} mode="popLayout">
            {activeThoughts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="flex flex-col items-center justify-center p-8 border border-dashed border-divider rounded-[22px] bg-card-bg/20 text-neutral-400 min-h-[220px]"
              >
                <Inbox className="w-8 h-8 stroke-1 mb-2 text-neutral-450" />
                <p className="text-sm font-bold text-neutral-400">Your thoughts are clear.</p>
                <span className="text-xs text-neutral-500 mt-1">Type or paste thoughts above to dump them.</span>
              </motion.div>
            ) : (
              activeThoughts.map((item) => (
                <BrainDumpItemComponent
                  key={item.id}
                  item={item}
                  onUpdate={(text: string) => updateBrainDumpItem(item.id, text)}
                  onDelete={() => deleteBrainDumpItem(item.id)}
                  onConvertToTask={() => convertBrainDumpItem(item.id, 'task', selectedDate)}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface ItemProps {
  item: BrainDumpItem;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  onConvertToTask: () => void;
}

function BrainDumpItemComponent({
  item,
  onUpdate,
  onDelete,
  onConvertToTask,
}: ItemProps) {
  const [editing, setEditing] = useState(false);
  const [editingText, setEditingText] = useState(item.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    if (editingText.trim()) onUpdate(editingText.trim());
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="card-premium p-5 flex flex-col justify-between gap-4 text-foreground"
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="w-full textarea-premium text-base font-bold resize-none min-h-[80px]"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(false)}
              className="p-1.5 hover:bg-button-hover rounded-full text-neutral-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              className="p-1.5 hover:bg-button-hover text-foreground rounded-full cursor-pointer"
            >
              <Check className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      ) : (
        <p className="text-base font-bold text-foreground leading-relaxed break-words">
          {item.text}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-divider pt-3.5 mt-1">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDeleteConfirm(true)}
            className="w-8 h-8 flex items-center justify-center hover:bg-button-hover hover:text-red-500 rounded-full text-neutral-400 cursor-pointer transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
          {!editing && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(true)}
              className="w-8 h-8 flex items-center justify-center hover:bg-button-hover hover:text-foreground rounded-full text-neutral-400 cursor-pointer transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onConvertToTask}
          className="flex items-center gap-1.5 py-1.5 px-4 bg-foreground text-background hover:opacity-90 rounded-full cursor-pointer font-bold text-xs transition-opacity"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Convert to Action</span>
        </motion.button>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Thought"
        message="Are you sure you want to delete this thought from your brain dump?"
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </motion.div>
  );
}
