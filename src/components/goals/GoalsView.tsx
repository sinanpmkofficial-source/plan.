'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { GoalItem } from '@/types/planner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  PlusCircle,
  X,
} from 'lucide-react';

export default function GoalsView() {
  const { goals, addGoal, deleteGoal, toggleMilestone } = usePlannerStore();
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Goal Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMilestones, setNewMilestones] = useState<string[]>(['']);

  const handleAddMilestoneField = () => {
    setNewMilestones([...newMilestones, '']);
  };

  const handleRemoveMilestoneField = (index: number) => {
    setNewMilestones(newMilestones.filter((_, idx) => idx !== index));
  };

  const handleMilestoneChange = (index: number, val: string) => {
    const updated = [...newMilestones];
    updated[index] = val;
    setNewMilestones(updated);
  };

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const milestones = newMilestones.filter((m) => m.trim().length > 0);
    addGoal(newTitle.trim(), newDesc.trim(), milestones);

    setNewTitle('');
    setNewDesc('');
    setNewMilestones(['']);
    setShowAddModal(false);
  };

  const filteredGoals = goals.filter((g) => g.status === activeTab);
  const totalActive = goals.filter((g) => g.status === 'active').length;
  const totalCompleted = goals.filter((g) => g.status === 'completed').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-200 text-[var(--foreground)]">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-2xl font-black tracking-tight">Goals System</h3>
          <p className="text-sm md:text-base text-neutral-500">
            Define objectives, establish milestones, and review your progress daily.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="button-premium text-xs md:text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* iOS Segmented Control Tab Filters */}
      <div className="bg-[var(--kbd-bg)] p-1.5 rounded-full flex gap-1 inline-flex text-xs md:text-sm font-bold shadow-none select-none">
        <button
          onClick={() => setActiveTab('active')}
          className={`py-1.5 px-4 rounded-full text-center transition-all cursor-pointer ${
            activeTab === 'active'
              ? 'bg-white text-neutral-955 dark:bg-neutral-800 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
          }`}
        >
          Active ({totalActive})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`py-1.5 px-4 rounded-full text-center transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-white text-neutral-955 dark:bg-neutral-800 dark:text-white shadow-xs'
              : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400'
          }`}
        >
          Completed ({totalCompleted})
        </button>
      </div>

      {/* Goals grid list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[300px]">
        <AnimatePresence mode="popLayout" initial={false}>
          {filteredGoals.length === 0 ? (
            <motion.div
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed border-[var(--divider)] rounded-2xl bg-[var(--card-bg)]/20 text-neutral-400 text-center min-h-[250px]"
            >
              <Target className="w-8 h-8 stroke-1 mb-2.5 text-neutral-450" />
              <p className="text-sm font-bold text-neutral-600">No {activeTab} goals found.</p>
              <span className="text-xs text-neutral-500 mt-1 max-w-[240px]">
                Create a new target goal with milestones to structure your long term progress.
              </span>
            </motion.div>
          ) : (
            filteredGoals.map((goal) => {
              const completedCount = goal.milestones.filter((m) => m.completed).length;
              const totalMilestones = goal.milestones.length;
              const progressPct =
                totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="card-premium p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Goal Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-extrabold text-base tracking-tight leading-snug break-words">
                          {goal.title}
                        </h4>
                        {goal.description && (
                          <p className="text-xs md:text-sm text-neutral-550 mt-1.5 break-words leading-relaxed font-semibold">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="p-1.5 hover:bg-[var(--kbd-bg)] hover:text-red-500 text-neutral-400 rounded-full transition-colors shrink-0 cursor-pointer"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Slider */}
                    {totalMilestones > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-neutral-450">
                          <span className="uppercase tracking-wider">Milestones progress</span>
                          <span className="text-[var(--foreground)]">{progressPct}%</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--kbd-bg)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Milestones list */}
                    {totalMilestones > 0 ? (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-extrabold block">
                          Milestones ({completedCount}/{totalMilestones})
                        </span>
                        <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                          {goal.milestones.map((m) => (
                            <button
                              key={m.id}
                              onClick={() => toggleMilestone(goal.id, m.id)}
                              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-[var(--button-hover)] text-left transition-colors cursor-pointer group"
                            >
                              {m.completed ? (
                                <CheckCircle2 className="w-4.5 h-4.5 text-neutral-900 dark:text-neutral-100 shrink-0 mt-0.5" />
                              ) : (
                                <Circle className="w-4.5 h-4.5 text-neutral-305 dark:text-neutral-600 group-hover:text-neutral-550 shrink-0 mt-0.5" />
                              )}
                              <span
                                className={`text-sm leading-normal font-bold ${
                                  m.completed ? 'text-neutral-400 dark:text-neutral-500 line-through font-medium' : ''
                                }`}
                              >
                                {m.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 text-xs text-neutral-400 font-bold italic">
                        No milestones defined.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--divider)] pt-3.5 mt-4 flex items-center justify-between text-[10px] md:text-xs font-bold text-neutral-400 select-none">
                    <span className="uppercase tracking-wider">Created</span>
                    <span className="text-neutral-600 dark:text-neutral-400">{new Date(goal.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Add Goal Dialog Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] p-6 rounded-2xl max-w-md w-full shadow-[var(--nav-shadow)] animate-in zoom-in-95 duration-120 max-h-[90vh] overflow-y-auto text-[var(--foreground)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Create Long-term Goal</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-[var(--button-hover)] rounded-full text-neutral-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitGoal} className="space-y-4">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs text-neutral-450 uppercase tracking-wider font-extrabold">Goal Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Next.js Framework"
                  className="w-full input-premium text-sm font-semibold"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs text-neutral-450 uppercase tracking-wider font-extrabold">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Details, resources or key outcomes..."
                  rows={2}
                  className="w-full input-premium text-sm font-semibold resize-none rounded-xl"
                />
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-neutral-455 uppercase tracking-wider font-extrabold">Milestones</label>
                  <button
                    type="button"
                    onClick={handleAddMilestoneField}
                    className="text-sm font-bold text-neutral-800 dark:text-neutral-200 hover:text-black flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newMilestones.map((m, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={m}
                        onChange={(e) => handleMilestoneChange(idx, e.target.value)}
                        placeholder={`Milestone #${idx + 1}`}
                        className="w-full input-premium text-sm font-semibold py-1.5"
                      />
                      {newMilestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestoneField(idx)}
                          className="p-2 border border-[var(--input-border)] text-neutral-400 hover:text-red-550 hover:border-red-200 rounded-full cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="button-secondary text-xs md:text-sm px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="button-premium text-xs md:text-sm px-4"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
