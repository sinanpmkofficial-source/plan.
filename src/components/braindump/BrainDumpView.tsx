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

interface ParsedItem {
  id: string;
  text: string;
  type: 'task' | 'weekly' | 'monthly' | 'goal' | 'new_goal' | 'inbox';
  scheduledValue: string;
}

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
    goals,
    addGoal,
    updateGoal,
    addBulletNote,
    addWeeklyTask,
    addMonthlyTask,
    showToast,
  } = usePlannerStore();

  const [inputValue, setInputValue] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Smart Parser states
  const [showParser, setShowParser] = useState(false);
  const [parserInput, setParserInput] = useState('');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);

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

  // Rule-based client-side NLP thought parser
  const parseBrainDumpText = (rawText: string) => {
    const lines = rawText.split('\n');
    const items: ParsedItem[] = [];
    const today = new Date();

    const getNextWeekday = (dayOfWeek: number) => {
      const resultDate = new Date(today);
      const currentDay = today.getDay();
      let steps = dayOfWeek - currentDay;
      if (steps <= 0) steps += 7;
      resultDate.setDate(today.getDate() + steps);
      return resultDate;
    };

    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    lines.forEach((line, idx) => {
      let cleanLine = line.trim();
      if (!cleanLine) return;

      // Strip bullet symbols
      cleanLine = cleanLine.replace(/^[-*•\s+]+|^\d+[\s.)-]+\s*/, '').trim();
      if (!cleanLine) return;

      let text = cleanLine;
      let type: ParsedItem['type'] = 'inbox';
      let scheduledValue = '';

      const lowerLine = cleanLine.toLowerCase();

      // Detect Goal Matching from active goals list
      let matchedGoal = '';
      for (const g of goals) {
        const goalLower = g.title.toLowerCase();
        if (lowerLine.includes(goalLower) && goalLower.length > 2) {
          matchedGoal = g.title;
          break;
        }
      }

      // Detect Date Tags
      if (lowerLine.includes('today')) {
        type = 'task';
        scheduledValue = todayStr;
        text = text.replace(/\b(today)\b/gi, '').trim();
      } else if (lowerLine.includes('tomorrow')) {
        type = 'task';
        scheduledValue = tomorrowStr;
        text = text.replace(/\b(tomorrow)\b/gi, '').trim();
      } else if (/\b(monday|mon)\b/i.test(lowerLine)) {
        type = 'task';
        scheduledValue = getNextWeekday(1).toISOString().split('T')[0];
        text = text.replace(/\b(on\s+)?(monday|mon)\b/gi, '').trim();
      } else if (/\b(tuesday|tue)\b/i.test(lowerLine)) {
        type = 'task';
        scheduledValue = getNextWeekday(2).toISOString().split('T')[0];
        text = text.replace(/\b(on\s+)?(tuesday|tue)\b/gi, '').trim();
      } else if (/\b(wednesday|wed)\b/i.test(lowerLine)) {
        type = 'task';
        scheduledValue = getNextWeekday(3).toISOString().split('T')[0];
        text = text.replace(/\b(on\s+)?(wednesday|wed)\b/gi, '').trim();
      } else if (/\b(thursday|thu)\b/i.test(lowerLine)) {
        type = 'task';
        scheduledValue = getNextWeekday(4).toISOString().split('T')[0];
        text = text.replace(/\b(on\s+)?(thursday|thu)\b/gi, '').trim();
      } else if (/\b(friday|fri)\b/i.test(lowerLine)) {
        type = 'task';
        scheduledValue = getNextWeekday(5).toISOString().split('T')[0];
        text = text.replace(/\b(on\s+)?(friday|fri)\b/gi, '').trim();
      } else if (/\b(saturday|sat)\b/i.test(lowerLine)) {
        type = 'task';
        scheduledValue = getNextWeekday(6).toISOString().split('T')[0];
        text = text.replace(/\b(on\s+)?(saturday|sat)\b/gi, '').trim();
      } else if (/\b(sunday|sun)\b/i.test(lowerLine)) {
        type = 'task';
        scheduledValue = getNextWeekday(0).toISOString().split('T')[0];
        text = text.replace(/\b(on\s+)?(sunday|sun)\b/gi, '').trim();
      } else if (lowerLine.includes('this week') || lowerLine.includes('weekly')) {
        type = 'weekly';
        scheduledValue = selectedWeek;
        text = text.replace(/\b(this week|weekly)\b/gi, '').trim();
      } else if (lowerLine.includes('this month') || lowerLine.includes('monthly')) {
        type = 'monthly';
        scheduledValue = selectedMonth;
        text = text.replace(/\b(this month|monthly)\b/gi, '').trim();
      }

      // Clean dangling prepositions/spaces
      text = text.replace(/\s+/g, ' ').replace(/(?:on|by|at|\s)+$/, '').trim();

      // Fallback goal mapping
      if (matchedGoal && type === 'inbox') {
        type = 'goal';
        scheduledValue = matchedGoal;
      }

      items.push({
        id: `parsed-${idx}-${Date.now()}`,
        text: text || cleanLine,
        type,
        scheduledValue,
      });
    });

    setParsedItems(items);
  };

  const handleImportAll = () => {
    if (parsedItems.length === 0) return;

    parsedItems.forEach((item) => {
      const text = item.text.trim();
      if (!text) return;

      if (item.type === 'inbox') {
        addBrainDumpItem(text);
      } else if (item.type === 'task') {
        const dateVal = item.scheduledValue || selectedDate;
        addBulletNote(dateVal, 'task', text);
      } else if (item.type === 'weekly') {
        const weekVal = item.scheduledValue || selectedWeek;
        addWeeklyTask(weekVal, 'task', text);
      } else if (item.type === 'monthly') {
        const monthVal = item.scheduledValue || selectedMonth;
        addMonthlyTask(monthVal, 'task', text);
      } else if (item.type === 'new_goal') {
        addGoal(text, '', []);
      } else if (item.type === 'goal') {
        const goalTitle = item.scheduledValue;
        const goal = goals.find((g) => g.title === goalTitle);
        if (goal) {
          const updatedMilestones = [
            ...(goal.milestones || []),
            {
              id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              title: text,
              completed: false,
            },
          ];
          updateGoal(goal.id, goal.title, goal.description, updatedMilestones);
        } else {
          addGoal(text, '', []);
        }
      }
    });

    showToast(`Successfully processed and imported ${parsedItems.length} items.`);
    setParsedItems([]);
    setParserInput('');
    setShowParser(false);
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
        className="max-w-2xl mx-auto"
      />

      <div className="flex justify-center mb-6">
        <button
          onClick={() => {
            setParserInput('');
            setParsedItems([]);
            setShowParser(!showParser);
          }}
          className="flex items-center gap-2 px-4 py-2 border border-dashed border-neutral-300 hover:border-black rounded-full text-xs font-black cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{showParser ? 'Close Smart Parser' : 'Open Smart Parser'}</span>
        </button>
      </div>

      {showParser && (
        <div className="card-premium p-6 max-w-2xl mx-auto mb-10 space-y-4 animate-in slide-in-from-top-4 duration-200 text-black">
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Smart Thought Parser</span>
            </h3>
            <p className="text-xs text-neutral-400 font-semibold leading-relaxed">
              Paste or type a block of unstructured thoughts. Bullet points, dates (e.g. "on Friday", "tomorrow"), and goals mentioned in your text will be extracted automatically.
            </p>
          </div>

          <textarea
            value={parserInput}
            onChange={(e) => setParserInput(e.target.value)}
            placeholder={`Example thought dump:\n- Schedule launch meeting on Friday\n- Read a book tomorrow\n- Review goals for Launch App goal\n- Groceries on Monday`}
            className="w-full textarea-premium font-semibold text-sm placeholder:text-neutral-405 bg-neutral-50/50 min-h-[140px]"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setParserInput('');
                setParsedItems([]);
              }}
              className="button-secondary text-xs px-4 py-1.5"
            >
              Clear
            </button>
            <button
              onClick={() => parseBrainDumpText(parserInput)}
              disabled={!parserInput.trim()}
              className="button-premium text-xs px-4 py-1.5 disabled:opacity-50"
            >
              Extract Tasks
            </button>
          </div>

          {parsedItems.length > 0 && (
            <div className="border-t border-divider pt-6 space-y-4 animate-in fade-in duration-200">
              <h4 className="font-extrabold text-xs text-neutral-400 uppercase tracking-wider">
                Extracted Items ({parsedItems.length})
              </h4>
              <div className="space-y-3">
                {parsedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50/30 hover:border-neutral-350 transition-colors"
                  >
                    {/* Cleaned text input */}
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const updated = [...parsedItems];
                        updated[idx].text = e.target.value;
                        setParsedItems(updated);
                      }}
                      className="flex-1 input-premium py-1 px-3 text-xs bg-white text-black font-semibold border-neutral-200 focus:border-black"
                    />

                    {/* Target type dropdown */}
                    <select
                      value={item.type}
                      onChange={(e) => {
                        const updated = [...parsedItems];
                        const val = e.target.value as ParsedItem['type'];
                        updated[idx].type = val;
                        if (val === 'task') updated[idx].scheduledValue = new Date().toISOString().split('T')[0];
                        else if (val === 'weekly') updated[idx].scheduledValue = selectedWeek;
                        else if (val === 'monthly') updated[idx].scheduledValue = selectedMonth;
                        else if (val === 'goal') updated[idx].scheduledValue = goals[0]?.title || '';
                        else updated[idx].scheduledValue = '';
                        setParsedItems(updated);
                      }}
                      className="input-premium py-1 px-2 text-xs bg-white border-neutral-200 text-black font-semibold w-full sm:w-36 focus:border-black"
                    >
                      <option value="inbox">Brain Dump</option>
                      <option value="task">Daily Task</option>
                      <option value="weekly">Weekly Plan</option>
                      <option value="monthly">Monthly Plan</option>
                      <option value="goal">Goal Milestone</option>
                      <option value="new_goal">New Goal</option>
                    </select>

                    {/* Target Value selector */}
                    {item.type === 'task' && (
                      <input
                        type="date"
                        value={item.scheduledValue}
                        onChange={(e) => {
                          const updated = [...parsedItems];
                          updated[idx].scheduledValue = e.target.value;
                          setParsedItems(updated);
                        }}
                        className="input-premium py-1 px-2 text-xs bg-white border border-neutral-200 text-black font-semibold focus:border-black"
                      />
                    )}

                    {item.type === 'weekly' && (
                      <input
                        type="text"
                        placeholder="YYYY-Www"
                        value={item.scheduledValue}
                        onChange={(e) => {
                          const updated = [...parsedItems];
                          updated[idx].scheduledValue = e.target.value;
                          setParsedItems(updated);
                        }}
                        className="input-premium py-1 px-2 text-xs bg-white border border-neutral-200 text-black font-semibold w-24 focus:border-black"
                      />
                    )}

                    {item.type === 'monthly' && (
                      <input
                        type="text"
                        placeholder="YYYY-MM"
                        value={item.scheduledValue}
                        onChange={(e) => {
                          const updated = [...parsedItems];
                          updated[idx].scheduledValue = e.target.value;
                          setParsedItems(updated);
                        }}
                        className="input-premium py-1 px-2 text-xs bg-white border border-neutral-200 text-black font-semibold w-20 focus:border-black"
                      />
                    )}

                    {item.type === 'goal' && (
                      <select
                        value={item.scheduledValue}
                        onChange={(e) => {
                          const updated = [...parsedItems];
                          updated[idx].scheduledValue = e.target.value;
                          setParsedItems(updated);
                        }}
                        className="input-premium py-1 px-2 text-xs bg-white border border-neutral-200 text-black font-semibold w-full sm:w-40 focus:border-black"
                      >
                        {goals.length === 0 ? (
                          <option value="">No Active Goals</option>
                        ) : (
                          goals.map((g) => (
                            <option key={g.id} value={g.title}>
                              {g.title}
                            </option>
                          ))
                        )}
                      </select>
                    )}

                    {/* Discard button */}
                    <button
                      onClick={() => {
                        setParsedItems(parsedItems.filter((_, i) => i !== idx));
                      }}
                      className="p-1.5 hover:bg-neutral-200 rounded-full text-neutral-400 hover:text-black cursor-pointer"
                      title="Discard item"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setParsedItems([])}
                  className="button-secondary text-xs px-4 py-1.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportAll}
                  className="button-premium text-xs px-4 py-1.5"
                >
                  Import All to Planner
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                  className="flex flex-col items-center justify-center p-8 border border-dashed border-divider rounded-lg bg-card-bg/20 text-neutral-400 min-h-[250px]"
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
            <h4 className="font-extrabold text-sm text-neutral-400 uppercase tracking-wider">
              Processed ({convertedItems.length})
            </h4>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {convertedItems.length === 0 ? (
                <div className="p-6 border border-dashed border-divider rounded-lg text-center text-neutral-400 text-sm font-semibold">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
          <div className="bg-card-bg border border-neutral-200 p-6 rounded-2xl max-w-sm w-full shadow-none animate-in zoom-in-95 duration-100">
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
  onConvertToGoal,
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
      className="card-premium p-5 flex flex-col justify-between gap-4 text-black"
    >
      {editing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            className="w-full textarea-premium text-base font-bold text-neutral-850 resize-none min-h-[80px]"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="p-1.5 hover:bg-neutral-200 rounded-full text-neutral-400 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <button onClick={handleSave} className="p-1.5 hover:bg-neutral-200 text-black rounded-full cursor-pointer">
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
          <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 hover:bg-neutral-200 hover:text-black rounded-full text-neutral-400 cursor-pointer" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
          {!editing && (
            <button onClick={() => setEditing(true)} className="p-1.5 hover:bg-neutral-200 hover:text-black rounded-full text-neutral-400 cursor-pointer" title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-500 font-bold">
          <button onClick={onConvertToTask} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-black hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Clock className="w-3.5 h-3.5 text-neutral-450" />
            <span>Today</span>
          </button>
          <button onClick={onConvertToWeekly} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-black hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Sparkles className="w-3.5 h-3.5 text-neutral-455" />
            <span>Week</span>
          </button>
          <button onClick={onConvertToMonthly} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-black hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Calendar className="w-3.5 h-3.5 text-neutral-450" />
            <span>Month</span>
          </button>
          <button onClick={onConvertToGoal} className="flex items-center gap-1.5 py-1 px-3 border border-input-border hover:border-black hover:bg-neutral-100 rounded-full cursor-pointer text-neutral-700">
            <Target className="w-3.5 h-3.5 text-neutral-455" />
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
      className="p-3.5 bg-card-bg border border-neutral-200 rounded-xl flex items-start justify-between gap-3 text-neutral-500 font-bold"
    >
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-bold line-through text-neutral-400 break-words leading-relaxed">
          {item.text}
        </p>
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-extrabold block">
          Converted to {item.convertedTo}
        </span>
      </div>
      <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 hover:bg-neutral-200 rounded-full text-neutral-400 hover:text-black cursor-pointer">
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
