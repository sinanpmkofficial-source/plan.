'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/planner-store';
import { Trash2, AlertTriangle, RotateCcw, ShieldAlert, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationsSettings from './NotificationsSettings';

type ResetStep = 'idle' | 'confirm1' | 'confirm2' | 'resetting' | 'done' | 'error';

export default function SettingsView() {
  const { showToast } = usePlannerStore();
  const [step, setStep] = useState<ResetStep>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async () => {
    setStep('resetting');
    try {
      // 1. Wipe MongoDB
      const res = await fetch('/api/reset', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Database reset failed');
      }

      // 2. Wipe localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('planner-data');
      }

      // 3. Reset in-memory store state — reload the page so the store
      //    reinitialises cleanly from the now-empty DB and localStorage.
      setStep('done');
      setTimeout(() => {
        window.location.href = '/';
      }, 1800);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStep('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-10 pb-20 px-4 space-y-10 animate-in fade-in duration-200 text-foreground">
      <div className="space-y-1">
        <h2 className="text-2xl font-black tracking-tight">Settings</h2>
        <p className="text-sm text-foreground/50 font-semibold">Manage your app data and preferences.</p>
      </div>

      {/* Reminders / Notifications */}
      <NotificationsSettings />

      {/* Data Management section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-divider pb-3">
          <ShieldAlert className="w-4 h-4 text-foreground/40" />
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-foreground/50">Data Management</h3>
        </div>

        {/* Reset card */}
        <div className="card-premium p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-500" />
              Reset All Data
            </h4>
            <p className="text-xs text-foreground/50 font-semibold leading-relaxed max-w-sm">
              Permanently deletes all goals, daily plans, weekly plans, monthly plans, and brain dump entries from the database and local storage.
            </p>
          </div>
          <button
            onClick={() => setStep('confirm1')}
            className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold border border-red-500/30 text-red-500 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/60 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Database
          </button>
        </div>
      </section>

      {/* Confirm Modal */}
      <AnimatePresence>
        {(step === 'confirm1' || step === 'confirm2' || step === 'resetting' || step === 'done' || step === 'error') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-foreground/10 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-card-bg border border-card-border rounded-2xl p-6 w-full max-w-sm shadow-none space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Step 1 — First warning */}
              {step === 'confirm1' && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                      </div>
                      <h3 className="font-extrabold text-sm">Reset All Data?</h3>
                    </div>
                    <button onClick={() => setStep('idle')} className="p-1.5 hover:bg-button-hover rounded-full text-foreground/40 hover:text-foreground cursor-pointer shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-foreground/60 font-semibold leading-relaxed">
                    This will <strong className="text-foreground">permanently erase</strong> all your goals, plans, brain dump entries, and reflections from the database and local storage.
                    <br /><br />
                    <span className="text-red-500 font-bold">This action cannot be undone.</span>
                  </p>
                  <div className="flex gap-2.5 justify-end">
                    <button onClick={() => setStep('idle')} className="button-secondary text-xs px-4 py-2">Cancel</button>
                    <button
                      onClick={() => setStep('confirm2')}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Yes, continue
                    </button>
                  </div>
                </>
              )}

              {/* Step 2 — Final confirmation */}
              {step === 'confirm2' && (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4.5 h-4.5 text-red-500" />
                      </div>
                      <h3 className="font-extrabold text-sm text-red-500">Final Warning</h3>
                    </div>
                    <button onClick={() => setStep('idle')} className="p-1.5 hover:bg-button-hover rounded-full text-foreground/40 hover:text-foreground cursor-pointer shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-foreground/60 font-semibold leading-relaxed">
                    Are you absolutely sure? Every piece of data will be deleted immediately — goals, milestones, action items, daily logs, reflections — <strong className="text-foreground">everything</strong>.
                  </p>
                  <div className="flex gap-2.5 justify-end">
                    <button onClick={() => setStep('idle')} className="button-secondary text-xs px-4 py-2">Cancel</button>
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Erase Everything
                    </button>
                  </div>
                </>
              )}

              {/* Resetting spinner */}
              {step === 'resetting' && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-10 h-10 rounded-full border-2 border-foreground/20 border-t-foreground animate-spin" />
                  <p className="text-sm font-bold text-foreground/60">Resetting all data…</p>
                </div>
              )}

              {/* Done */}
              {step === 'done' && (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-foreground/5 border border-card-border flex items-center justify-center">
                    <RotateCcw className="w-5 h-5 text-foreground/60" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold">All data erased</p>
                    <p className="text-xs text-foreground/50 font-semibold mt-1">Redirecting to home…</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {step === 'error' && (
                <>
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4.5 h-4.5 text-red-500" />
                    </div>
                    <h3 className="font-extrabold text-sm text-red-500">Reset Failed</h3>
                  </div>
                  <p className="text-xs text-foreground/60 font-semibold leading-relaxed bg-kbd-bg rounded-xl px-3 py-2 font-mono break-all">
                    {errorMsg}
                  </p>
                  <div className="flex justify-end">
                    <button onClick={() => setStep('idle')} className="button-secondary text-xs px-4 py-2">Close</button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
