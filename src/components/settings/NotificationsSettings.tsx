'use client';

import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2, Send, BellRing } from 'lucide-react';
import {
  isPushSupported,
  getPermission,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
} from '@/lib/push-client';

const ENABLED_KEY = 'reminder-enabled';
const TIME_KEY = 'reminder-time';

export default function NotificationsSettings() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState('20:00');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    setSupported(isPushSupported());
    setEnabled(localStorage.getItem(ENABLED_KEY) === 'true' && getPermission() === 'granted');
    const savedTime = localStorage.getItem(TIME_KEY);
    if (savedTime) setTime(savedTime);
  }, []);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const handleToggle = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (!enabled) {
        await subscribeToPush(time);
        localStorage.setItem(ENABLED_KEY, 'true');
        localStorage.setItem(TIME_KEY, time);
        setEnabled(true);
        flash('ok', 'Reminders enabled.');
      } else {
        await unsubscribeFromPush();
        localStorage.setItem(ENABLED_KEY, 'false');
        setEnabled(false);
        flash('ok', 'Reminders turned off.');
      }
    } catch (err: any) {
      flash('err', err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const handleTimeChange = async (value: string) => {
    setTime(value);
    localStorage.setItem(TIME_KEY, value);
    if (enabled) {
      // Re-register so the server has the new reminder time.
      try {
        await subscribeToPush(value);
        flash('ok', `Daily reminder set to ${value}.`);
      } catch (err: any) {
        flash('err', err.message || 'Failed to update time.');
      }
    }
  };

  const handleTest = async () => {
    setBusy(true);
    try {
      const sent = await sendTestPush();
      flash(sent > 0 ? 'ok' : 'err', sent > 0 ? 'Test notification sent.' : 'No active subscriptions to notify.');
    } catch (err: any) {
      flash('err', err.message || 'Failed to send test.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 border-b border-divider pb-3">
        <BellRing className="w-4 h-4 text-foreground/40" />
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-foreground/50">Reminders</h3>
      </div>

      <div className="card-premium p-6 space-y-5">
        {!supported && (
          <p className="text-xs font-semibold text-amber-600 bg-amber-500/10 rounded-xl px-3 py-2">
            This browser doesn&apos;t support push notifications. On iPhone, install the app to your
            Home Screen first (Share → Add to Home Screen), then enable reminders from there.
          </p>
        )}

        {/* Enable row */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm flex items-center gap-2">
              {enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4 text-foreground/40" />}
              Daily review reminder
            </h4>
            <p className="text-xs text-foreground/50 font-semibold leading-relaxed max-w-sm">
              A nudge to tick off what you finished and plan tomorrow. Requires notification permission.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={busy || !supported}
            className={`shrink-0 relative w-12 h-7 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
              enabled ? 'bg-foreground' : 'bg-kbd-bg'
            }`}
            aria-pressed={enabled}
          >
            <span
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-background transition-transform ${
                enabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {/* Time + test */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-divider pt-4">
          <label className="flex items-center gap-2 text-xs font-bold text-foreground/60">
            Remind me at
            <input
              type="time"
              value={time}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={busy}
              className="input-premium text-sm font-bold py-1.5 px-3 w-[120px]"
            />
          </label>

          <button
            onClick={handleTest}
            disabled={busy || !enabled}
            className="button-secondary text-xs px-4 py-2 flex items-center gap-2 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Send test
          </button>
        </div>

        {msg && (
          <p
            className={`text-xs font-bold ${
              msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'
            }`}
          >
            {msg.text}
          </p>
        )}
      </div>
    </section>
  );
}
