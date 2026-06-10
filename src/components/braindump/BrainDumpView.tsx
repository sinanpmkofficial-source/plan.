'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { BrainDumpItem } from '@/types/planner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Trash2,
  Calendar,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { QuickAddInput } from '@/components/ui/QuickAddInput';

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
    selectedWeek,
    selectedMonth,
  } = usePlannerStore();

  const [inputValue, setInputValue] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    addBrainDumpItem(inputValue.trim());
    setInputValue('');
  };

  const inboxItems = brainDump.filter((item) => item.status === 'inbox');
  const convertedItems = brainDump.filter((item) => item.status === 'converted');

  const handleGoalConvertClick = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowGoalModal(true);
  };

  const confirmGoalConversion = (goalTitle: string) => {
    if (selectedItemId && goalTitle.trim()) {
      convertBrainDumpItem(selectedItemId, 'goal', goalTitle.trim());
    }
    setShowGoalModal(false);
    setSelectedItemId(null);
  };

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      <PageHeader title="Brain Dump Inbox" />

      <QuickAddInput
        id="quick-brain-dump-input"
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        placeholder="Capture a thought... (Press '/' to focus)"
        className="max-w-2xl mx-auto mb-10"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Inbox className="w-4 h-4 text-neutral-450" />
            <h4 className="font-extrabold text-sm text-neutral-400 uppercase tracking-wider">
              Inbox ({inboxItems.length})
            </h4>
          </div>

          <div className="space-y-3 min-h-[300px]">
            <AnimatePresence initial={false}>
              {inboxItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center p-8 border border-dashed border-divider rounded-2xl bg-card-bg/20 text-neutral-400 min-h-[250px]"
                >
                  <Inbox className="w-8 h-8 stroke-1 mb-2 text-neutral-400" />
                  <p className="text-sm font-bold">Your brain dump is clear.</p>
                  <span className="text-xs text-neutral-500 mt-1">Start typing above to log thoughts.</span>
                </motion.div>
              ) : (
                inboxItems.map((item) => (
                  <BrainDumpItemComponent
                    key={item.id}
                    item={item}
                    onUpdate={(text: string) => updateBrainDumpItem(item.id, text)}
                    onDelete={() => deleteBrainDumpItem(item.id)}
                    onConvertToTask={() => convertBrainDumpItem(item.id, 'task', selectedDate)}
                    onConvertToWeekly={() => convertBrainDumpItem(item.id, 'weekly', selectedWeek)}
                    onConvertToMonthly={() => convertBrainDumpItem(item.id, 'monthly', selectedMonth)}
                    onConvertToGoal={() => handleGoalConvertClick(item.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CheckCircle2 className="w-4 h-4 text-neutral-400" />
            <h4 className="font-extrabold text-sm text-neutral-450 uppercase tracking-wider">
              Processed ({convertedItems.length})
            </h4>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {convertedItems.length === 0 ? (
                <div className="p-6 border border-dashed border-divider rounded-2xl text-center text-neutral-405 text-sm font-semibold">
                  Processed logs will appear here.
                </div>
              ) : (
                convertedItems.map((item) => (
                  <ProcessedItemComponent
                    key={item.id}
                    item={item}
                    onDelete={() => deleteBrainDumpItem(item.id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-card-bg border border-card-border p-6 rounded-2xl max-w-sm w-full shadow-nav-shadow animate-in zoom-in-95 duration-100">
            <h3 className="font-extrabold text-sm mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Convert to Goal</span>
            </h3>
            <p className="text-xs md:text-sm text-neutral-500 mb-4 leading-relaxed font-semibold">
              Define the goal title for this brain dump item. You can customize details and milestones in the Goals dashboard.
            </p>
            <input
              type="text"
              id="goal-convert-title-input"
              defaultValue={brainDump.find((x) => x.id === selectedItemId)?.text || ''}
              placeholder="Goal Title"
              className="w-full input-premium text-sm font-semibold mb-5"
            />
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => {
                  setShowGoalModal(false);
                  setSelectedItemId(null);
                }}
                className="button-secondary text-xs px-4 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('goal-convert-title-input') as HTMLInputElement;
                  confirmGoalConversion(input?.value || '');
                }}
                className="button-premium text-xs px-4 py-1.5"
              >
                Create Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ItemProps {
  item: BrainDumpItem;
  onUpdate: (text: string) => void;
  onDelete: () => void;
  onConvertToTask: () => void;
  onConvertToWeekly: () => void;
  onConvertToMonthly: () => void;
  onConvertToGoal: () => void;
}

function BrainDumpItemComponent({ 
  item, 
  onUpdate, 
  onDelete, 
  onConvertToTask, 
  onConvertToWeekly, 
  onConvertToMonthly, 
  onConvertToGoal 
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
      transition={{ duration: 0.18 }}
      className="card-premium p-5 flex flex-col justify-between gap-4"
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="w-full textarea-premium text-base font-bold text-neutral-800 resize-none min-h-[80px]"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <button onClick={handleSave} className="p-1.5 hover:bg-neutral-100 text-emerald-600 rounded-full cursor-pointer">
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-base font-bold text-neutral-800 leading-relaxed break-words">
          {item.text}
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-divider pt-3.5 mt-1">
        <div className="flex items-center gap-1">
          <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 hover:bg-neutral-100 hover:text-red-500 rounded-full text-neutral-400 cursor-pointer" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
          {!editing && (
            <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-neutral-100 hover:text-neutral-900 rounded-full text-neutral-400 cursor-pointer" title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 font-bold">
          <button onClick={onConvertToTask} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-input-focus-border hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Today</span>
          </button>
          <button onClick={onConvertToWeekly} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-input-focus-border hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Sparkles className="w-3.5 h-3.5 text-neutral-400" />
            <span>Week</span>
          </button>
          <button onClick={onConvertToMonthly} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-input-focus-border hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
            <span>Month</span>
          </button>
          <button onClick={onConvertToGoal} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-input-focus-border hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Target className="w-3.5 h-3.5 text-neutral-400" />
            <span>Goal</span>
          </button>
        </div>
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

function ProcessedItemComponent({ item, onDelete }: { item: BrainDumpItem; onDelete: () => void }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-3.5 bg-card-bg border border-card-border rounded-2xl flex items-start justify-between gap-3 text-neutral-550"
    >
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-bold line-through text-neutral-400 break-words leading-relaxed">
          {item.text}
        </p>
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-extrabold block">
          Converted to {item.convertedTo}
        </span>
      </div>
      <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-red-550 cursor-pointer">
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Delete Processed Item"
        message="Are you sure you want to delete this processed item?"
        onConfirm={() => {
          onDelete();
          setShowDeleteConfirm(false);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </motion.div>
  );
}
