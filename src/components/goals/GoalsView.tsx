'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, parseISO, isToday } from 'date-fns';
import {
  Target,
  Plus,
  Trash2,
  PlusCircle,
  X,
  Pencil,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  ArrowRight,
  Flag,
  Check,
  Send,
} from 'lucide-react';
import ConfirmationModal from '../ui/ConfirmationModal';
import { ActionItem, GoalItem, Milestone } from '@/types/planner';

// ─── Helpers ────────────────────────────────────────────────────────────────

function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = parseISO(dateStr);
  return isPast(d) && !isToday(d);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

function priorityConfig(p: ActionItem['priority']) {
  if (p === 'high') return { label: 'High', cls: 'text-red-500 bg-red-500/10 border-red-500/20' };
  if (p === 'medium') return { label: 'Med', cls: 'text-amber-500 bg-amber-500/10 border-amber-500/20' };
  return { label: 'Low', cls: 'text-foreground/40 bg-foreground/5 border-card-border' };
}

// ─── Date chip ───────────────────────────────────────────────────────────────

function DueDateChip({ date }: { date?: string }) {
  if (!date) return null;
  const overdue = isOverdue(date);
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${overdue ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-foreground/50 bg-foreground/5 border-card-border'}`}>
      <CalendarDays className="w-2.5 h-2.5" />
      {overdue ? '⚠ ' : ''}{formatDate(date)}
    </span>
  );
}

// ─── Action Item Row ─────────────────────────────────────────────────────────

function ActionItemRow({
  action,
  goalId,
  milestoneId,
}: {
  action: ActionItem;
  goalId: string;
  milestoneId: string;
}) {
  const { toggleActionItem, deleteActionItem, sendActionToDaily, updateActionItem } = usePlannerStore();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(action.title);
  const pc = priorityConfig(action.priority);

  const handleSave = () => {
    if (editText.trim()) updateActionItem(goalId, milestoneId, action.id, { title: editText.trim() });
    setEditing(false);
  };

  return (
    <div className={`flex items-center gap-2.5 group px-2 py-1.5 rounded-lg transition-colors hover:bg-button-hover ${action.completed ? 'opacity-60' : ''}`}>
      {/* Checkbox */}
      <button
        onClick={() => toggleActionItem(goalId, milestoneId, action.id)}
        className="shrink-0 w-4 h-4 rounded border border-input-border hover:border-foreground flex items-center justify-center transition-colors cursor-pointer"
        style={{ background: action.completed ? 'var(--foreground)' : undefined }}
      >
        {action.completed && <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />}
      </button>

      {/* Title */}
      {editing ? (
        <input
          autoFocus
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          className="flex-1 text-xs font-semibold bg-transparent border-b border-input-border outline-none text-foreground py-0.5"
        />
      ) : (
        <span
          onClick={() => setEditing(true)}
          className={`flex-1 text-xs font-semibold cursor-text ${action.completed ? 'line-through text-foreground/40' : 'text-foreground'}`}
        >
          {action.title}
        </span>
      )}

      {/* Priority badge */}
      <span className={`hidden sm:inline-flex text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border uppercase tracking-wide ${pc.cls}`}>
        {pc.label}
      </span>

      {/* Due date */}
      <DueDateChip date={action.dueDate} />

      {/* Sent to daily indicator */}
      {action.sentToDaily && (
        <span className="hidden sm:inline-flex text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-card-border text-foreground/40 uppercase tracking-wide">
          In Daily
        </span>
      )}

      {/* Actions (show on hover) */}
      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!action.sentToDaily && (
          <button
            onClick={() => sendActionToDaily(goalId, milestoneId, action.id)}
            title="Send to Today's Daily Log"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-button-hover text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => deleteActionItem(goalId, milestoneId, action.id)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-button-hover text-foreground/40 hover:text-foreground transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Milestone Row ────────────────────────────────────────────────────────────

function MilestoneRow({
  milestone,
  goalId,
}: {
  milestone: Milestone;
  goalId: string;
}) {
  const { addActionItem, toggleMilestone } = usePlannerStore();
  const [expanded, setExpanded] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionPriority, setActionPriority] = useState<ActionItem['priority']>('medium');
  const [actionDue, setActionDue] = useState('');

  const actions = milestone.actionItems || [];
  const completedActions = actions.filter((a) => a.completed).length;
  const totalActions = actions.length;
  const progress = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : milestone.completed ? 100 : 0;

  const handleAddAction = () => {
    if (!actionTitle.trim()) return;
    addActionItem(goalId, milestone.id, actionTitle.trim(), actionPriority, actionDue || undefined);
    setActionTitle('');
    setActionPriority('medium');
    setActionDue('');
    setShowAddAction(false);
  };

  return (
    <div className="border border-card-border rounded-xl overflow-hidden">
      {/* Milestone header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-button-hover/50 transition-colors select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Completion checkbox (only if no action items) */}
        {totalActions === 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); toggleMilestone(goalId, milestone.id); }}
            className="shrink-0 w-4 h-4 rounded border border-input-border hover:border-foreground flex items-center justify-center transition-colors cursor-pointer"
            style={{ background: milestone.completed ? 'var(--foreground)' : undefined }}
          >
            {milestone.completed && <Check className="w-2.5 h-2.5 text-background" strokeWidth={3} />}
          </button>
        ) : (
          <div className="shrink-0 w-4 h-4 rounded-full border border-input-border flex items-center justify-center">
            <div
              className="rounded-full bg-foreground transition-all"
              style={{ width: `${progress}%`, height: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold ${milestone.completed ? 'line-through text-foreground/40' : 'text-foreground'}`}>
              {milestone.title}
            </span>
            {totalActions > 0 && (
              <span className="text-[10px] font-extrabold text-foreground/40 uppercase tracking-wider">
                {completedActions}/{totalActions}
              </span>
            )}
            <DueDateChip date={milestone.dueDate} />
          </div>
          {totalActions > 0 && (
            <div className="h-0.5 w-full bg-divider rounded-full mt-1.5 overflow-hidden">
              <div className="h-full bg-foreground transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-foreground/40 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-foreground/40 shrink-0" />}
      </div>

      {/* Action items list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="border-t border-divider px-3 pb-3 pt-2 space-y-1 bg-kbd-bg/30">
              {actions.length === 0 && !showAddAction && (
                <p className="text-[10px] text-foreground/30 font-bold text-center py-3">No actions yet.</p>
              )}
              {actions.map((action) => (
                <ActionItemRow key={action.id} action={action} goalId={goalId} milestoneId={milestone.id} />
              ))}

              {/* Add action form */}
              {showAddAction ? (
                <div className="pt-2 space-y-2 border-t border-divider mt-2">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Action title..."
                    value={actionTitle}
                    onChange={(e) => setActionTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddAction(); if (e.key === 'Escape') setShowAddAction(false); }}
                    className="w-full text-xs font-semibold bg-transparent border-b border-input-border outline-none text-foreground py-0.5"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={actionPriority}
                      onChange={(e) => setActionPriority(e.target.value as ActionItem['priority'])}
                      className="text-[10px] font-bold bg-kbd-bg border border-card-border rounded-full px-2 py-1 text-foreground outline-none cursor-pointer"
                    >
                      <option value="high">🔴 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">⚪ Low</option>
                    </select>
                    <input
                      type="date"
                      value={actionDue}
                      onChange={(e) => setActionDue(e.target.value)}
                      className="text-[10px] font-bold bg-kbd-bg border border-card-border rounded-full px-2 py-1 text-foreground outline-none cursor-pointer"
                      style={{ colorScheme: 'normal' }}
                    />
                    <div className="flex gap-1.5 ml-auto">
                      <button onClick={() => setShowAddAction(false)} className="text-[10px] font-bold text-foreground/40 hover:text-foreground cursor-pointer">Cancel</button>
                      <button onClick={handleAddAction} className="text-[10px] font-bold text-foreground bg-button-hover border border-card-border px-2 py-0.5 rounded-full cursor-pointer hover:border-foreground">Add</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddAction(true)}
                  className="w-full flex items-center gap-1.5 text-[10px] font-bold text-foreground/40 hover:text-foreground transition-colors py-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  Add action
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Goal Card ───────────────────────────────────────────────────────────────

function GoalCard({ goal, onEdit, onDelete }: { goal: GoalItem; onEdit: () => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const totalMilestones = goal.milestones.length;
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const progressPct = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const overdue = isOverdue(goal.dueDate);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      className="card-premium flex flex-col"
    >
      {/* Card header */}
      <div
        className="p-5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm tracking-tight leading-snug">{goal.title}</h4>
              {goal.status === 'completed' && (
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-foreground/20 text-foreground/50 uppercase tracking-wider">Done</span>
              )}
            </div>
            {goal.description && (
              <p className="text-xs text-foreground/50 font-semibold leading-relaxed">{goal.description}</p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {goal.dueDate && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${overdue ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-foreground/50 bg-foreground/5 border-card-border'}`}>
                  <Flag className="w-2.5 h-2.5" />
                  {overdue ? '⚠ Overdue · ' : 'Due · '}{formatDate(goal.dueDate)}
                </span>
              )}
              {totalMilestones > 0 && (
                <span className="text-[10px] font-extrabold text-foreground/40 uppercase tracking-wider">
                  {completedMilestones}/{totalMilestones} milestones
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="w-8 h-8 flex items-center justify-center hover:bg-button-hover text-foreground/40 hover:text-foreground rounded-full transition-colors cursor-pointer" title="Edit Goal">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-8 h-8 flex items-center justify-center hover:bg-button-hover text-foreground/40 hover:text-foreground rounded-full transition-colors cursor-pointer" title="Delete Goal">
              <Trash2 className="w-4 h-4" />
            </button>
            {expanded ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
          </div>
        </div>

        {/* Progress bar */}
        {totalMilestones > 0 && (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full bg-divider rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground transition-all duration-500 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-foreground/40">
              <span className="uppercase tracking-wider">Progress</span>
              <span>{progressPct}%</span>
            </div>
          </div>
        )}
        {totalMilestones === 0 && (
          <p className="mt-3 text-[10px] font-bold text-foreground/30 italic">No milestones — click to add some.</p>
        )}
      </div>

      {/* Expanded milestone panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-divider px-5 py-4 space-y-3 bg-kbd-bg/20">
              <span className="text-[10px] font-extrabold text-foreground/40 uppercase tracking-widest">Milestones</span>
              {goal.milestones.length === 0 && (
                <p className="text-xs text-foreground/30 font-bold text-center py-4">No milestones yet.</p>
              )}
              {goal.milestones.map((m) => (
                <MilestoneRow key={m.id} milestone={m} goalId={goal.id} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-divider flex items-center justify-between text-[10px] font-bold text-foreground/40 select-none">
        <span className="uppercase tracking-wider">Created {formatDate(goal.createdAt.split('T')[0])}</span>
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
          {expanded ? 'Collapse' : 'View milestones'}
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Milestone Form Item ──────────────────────────────────────────────────────

function MilestoneFormItem({
  value,
  dueDate,
  onChange,
  onDueDateChange,
  onRemove,
  placeholder,
  canRemove,
}: {
  value: string;
  dueDate: string;
  onChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onRemove: () => void;
  placeholder: string;
  canRemove: boolean;
}) {
  return (
    <div className="flex gap-2 items-center">
      <div className="flex-1 flex gap-2 flex-col sm:flex-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 input-premium text-sm font-semibold py-1.5"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => onDueDateChange(e.target.value)}
          className="text-xs font-bold bg-kbd-bg border border-input-border rounded-full px-3 py-1.5 text-foreground outline-none cursor-pointer"
          style={{ colorScheme: 'normal' }}
          title="Milestone due date (optional)"
        />
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="w-8 h-8 flex items-center justify-center border border-input-border text-foreground/40 hover:text-foreground hover:border-foreground rounded-full cursor-pointer shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Goal Form (shared for create & edit) ────────────────────────────────────

type MilestoneFormData = { title: string; dueDate: string; id?: string; completed?: boolean; actionItems?: ActionItem[] };

function GoalForm({
  title,
  onTitleChange,
  desc,
  onDescChange,
  dueDate,
  onDueDateChange,
  milestones,
  onMilestonesChange,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  title: string;
  onTitleChange: (v: string) => void;
  desc: string;
  onDescChange: (v: string) => void;
  dueDate: string;
  onDueDateChange: (v: string) => void;
  milestones: MilestoneFormData[];
  onMilestonesChange: (m: MilestoneFormData[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const addMilestone = () => onMilestonesChange([...milestones, { title: '', dueDate: '' }]);
  const removeMilestone = (idx: number) => onMilestonesChange(milestones.filter((_, i) => i !== idx));
  const updateMilestone = (idx: number, field: 'title' | 'dueDate', val: string) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: val };
    onMilestonesChange(updated);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs text-foreground/50 uppercase tracking-wider font-extrabold">Goal Title *</label>
        <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="e.g. Master Next.js" className="w-full input-premium text-sm font-semibold" required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-foreground/50 uppercase tracking-wider font-extrabold">Description</label>
        <textarea value={desc} onChange={(e) => onDescChange(e.target.value)} placeholder="Key outcomes, motivation..." rows={2} className="w-full textarea-premium text-sm font-semibold resize-none" />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-foreground/50 uppercase tracking-wider font-extrabold">Goal Due Date</label>
        <input type="date" value={dueDate} onChange={(e) => onDueDateChange(e.target.value)} className="w-full input-premium text-sm font-semibold" style={{ colorScheme: 'normal' }} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs text-foreground/50 uppercase tracking-wider font-extrabold">Milestones</label>
          <button type="button" onClick={addMilestone} className="text-xs font-bold text-foreground/60 hover:text-foreground flex items-center gap-1 cursor-pointer">
            <PlusCircle className="w-3.5 h-3.5" /><span>Add</span>
          </button>
        </div>
        <div className="space-y-2">
          {milestones.map((m, idx) => (
            <MilestoneFormItem
              key={idx}
              value={m.title}
              dueDate={m.dueDate}
              onChange={(v) => updateMilestone(idx, 'title', v)}
              onDueDateChange={(v) => updateMilestone(idx, 'dueDate', v)}
              onRemove={() => removeMilestone(idx)}
              placeholder={`Milestone #${idx + 1}`}
              canRemove={milestones.length > 1}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2.5 justify-end pt-2">
        <button type="button" onClick={onCancel} className="button-secondary text-xs md:text-sm px-4">Cancel</button>
        <button type="submit" className="button-premium text-xs md:text-sm px-4">{submitLabel}</button>
      </div>
    </form>
  );
}

// ─── Main View ───────────────────────────────────────────────────────────────

export default function GoalsView() {
  const { goals, addGoal, updateGoal, deleteGoal, showToast } = usePlannerStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<string | null>(null);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newMilestones, setNewMilestones] = useState<MilestoneFormData[]>([{ title: '', dueDate: '' }]);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editMilestones, setEditMilestones] = useState<MilestoneFormData[]>([]);

  const handleStartEdit = (goal: GoalItem) => {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditDesc(goal.description || '');
    setEditDueDate(goal.dueDate || '');
    setEditMilestones(goal.milestones.map((m) => ({
      id: m.id,
      title: m.title,
      dueDate: m.dueDate || '',
      completed: m.completed,
      actionItems: m.actionItems || [],
    })));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const mStones = newMilestones.filter((m) => m.title.trim().length > 0).map((m) => ({
      title: m.title.trim(),
      dueDate: m.dueDate || undefined,
    }));
    addGoal(newTitle.trim(), newDesc.trim(), newDueDate || undefined, mStones);
    setNewTitle(''); setNewDesc(''); setNewDueDate('');
    setNewMilestones([{ title: '', dueDate: '' }]);
    setShowAddModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoalId || !editTitle.trim()) return;
    const mStones = editMilestones.filter((m) => m.title.trim().length > 0);
    updateGoal(editingGoalId, editTitle.trim(), editDesc.trim(), editDueDate || undefined, mStones);
    setEditingGoalId(null);
  };

  const filteredGoals = goals.filter((g) => g.status === activeTab);
  const totalActive = goals.filter((g) => g.status === 'active').length;
  const totalCompleted = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto pt-6 space-y-8 animate-in fade-in duration-200 text-foreground pb-10">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black tracking-tight">Goals System</h3>
        <button onClick={() => setShowAddModal(true)} className="button-premium text-xs md:text-sm whitespace-nowrap shrink-0">
          <Plus size={18} strokeWidth={3} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-kbd-bg p-1 rounded-full flex gap-1 inline-flex text-xs md:text-sm font-bold shadow-none select-none">
        <button onClick={() => setActiveTab('active')} className={`py-1.5 px-4 rounded-full text-center transition-all cursor-pointer ${activeTab === 'active' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground hover:bg-button-hover'}`}>
          Active ({totalActive})
        </button>
        <button onClick={() => setActiveTab('completed')} className={`py-1.5 px-4 rounded-full text-center transition-all cursor-pointer ${activeTab === 'completed' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground hover:bg-button-hover'}`}>
          Completed ({totalCompleted})
        </button>
      </div>

      {/* Goal cards */}
      <div className="grid grid-cols-1 gap-5 min-h-[300px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredGoals.length === 0 ? (
            <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center p-12 border border-dashed border-divider rounded-2xl text-center min-h-[250px] space-y-3">
              <div className="w-12 h-12 rounded-full bg-button-hover flex items-center justify-center">
                <Target className="w-5 h-5 text-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground/50">No {activeTab} goals</p>
                <p className="text-xs text-foreground/30 font-semibold mt-1">Create a goal and break it into milestones and action items.</p>
              </div>
              {activeTab === 'active' && (
                <button onClick={() => setShowAddModal(true)} className="button-premium text-xs px-4 py-2">
                  <Plus className="w-3.5 h-3.5" /><span>New Goal</span>
                </button>
              )}
            </motion.div>
          ) : (
            filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onEdit={() => handleStartEdit(goal)}
                onDelete={() => setGoalToDelete(goal.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Delete confirmation */}
      <ConfirmationModal
        isOpen={!!goalToDelete}
        title="Delete Goal"
        message="Delete this goal and all its milestones and action items? This cannot be undone."
        onConfirm={() => { if (goalToDelete) deleteGoal(goalToDelete); setGoalToDelete(null); }}
        onCancel={() => setGoalToDelete(null)}
      />

      {/* Create modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-md">
          <div className="bg-card-bg border border-card-border p-6 rounded-2xl max-w-lg w-full shadow-none animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-foreground mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm flex items-center gap-2"><Target className="w-4 h-4" /><span>Create Goal</span></h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-button-hover rounded-full text-foreground/40 hover:text-foreground cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <GoalForm
              title={newTitle} onTitleChange={setNewTitle}
              desc={newDesc} onDescChange={setNewDesc}
              dueDate={newDueDate} onDueDateChange={setNewDueDate}
              milestones={newMilestones} onMilestonesChange={setNewMilestones}
              onSubmit={handleCreateSubmit}
              onCancel={() => setShowAddModal(false)}
              submitLabel="Create Goal"
            />
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/10 backdrop-blur-md">
          <div className="bg-card-bg border border-card-border p-6 rounded-2xl max-w-lg w-full shadow-none animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto text-foreground mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-sm flex items-center gap-2"><Target className="w-4 h-4" /><span>Edit Goal</span></h3>
              <button onClick={() => setEditingGoalId(null)} className="p-1.5 hover:bg-button-hover rounded-full text-foreground/40 hover:text-foreground cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <GoalForm
              title={editTitle} onTitleChange={setEditTitle}
              desc={editDesc} onDescChange={setEditDesc}
              dueDate={editDueDate} onDueDateChange={setEditDueDate}
              milestones={editMilestones} onMilestonesChange={setEditMilestones}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingGoalId(null)}
              submitLabel="Save Changes"
            />
          </div>
        </div>
      )}
    </div>
  );
}
