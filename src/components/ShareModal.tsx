import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link2, Copy, Check, Trash2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useShare } from '../contexts/ShareContext';

interface ShareModalProps {
  userId: string;
  assignments: any[];
  posts: any[];
  classes: any[];
  events: any[];
  onClose: () => void;
}

export default function ShareModal({ userId, assignments, posts, classes, events, onClose }: ShareModalProps) {
  const { t } = useLanguage();
  const { create, activeShare, revoke } = useShare();
  const [pin, setPin] = useState('');
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const storedTodos = (() => {
    try {
      return JSON.parse(localStorage.getItem('sparkdo_todos') || '[]');
    } catch {
      return [];
    }
  })();

  const overrides = (() => {
    try {
      return JSON.parse(localStorage.getItem('sparkdo_assignment_overrides') || '{}');
    } catch {
      return {};
    }
  })();

  const handleCreate = async () => {
    setError('');
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits.');
      return;
    }
    setCreating(true);
    try {
      await create(userId, pin, {
        assignments: assignments.map((a) => ({ ...a, completed: overrides[a.id] ?? a.completed })),
        todos: storedTodos,
        assignmentOverrides: overrides,
        posts,
        classes,
        events,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to create share.');
    } finally {
      setCreating(false);
    }
  };

  const shareUrl = activeShare ? `${window.location.origin}?share=${activeShare.token}` : '';

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-[10%] md:top-[15%] md:w-full md:max-w-lg max-h-[80vh] bg-white rounded-3xl shadow-2xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
          <div className="flex items-center gap-3">
            <Link2 size={20} className="text-primary" />
            <h3 className="text-xl font-black text-on-surface">Share Homework</h3>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {activeShare ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Share Link</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 px-3 py-2 rounded-xl bg-white text-sm text-on-surface outline-none border border-outline-variant/20"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 rounded-xl bg-primary text-on-primary hover:shadow-md transition-all"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">PIN</p>
                <p className="text-2xl font-black tracking-[0.2em] text-on-surface">{activeShare.pin}</p>
                <p className="text-xs text-on-surface-variant">Expires {new Date(activeShare.expiresAt).toLocaleDateString()}</p>
              </div>

              <button
                onClick={revoke}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors active:scale-95"
              >
                <Trash2 size={18} />
                Revoke Share
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant">
                Create a shareable link so a parent can view your homework and to-do list. The link expires in 30 days.
              </p>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1">Set a 4-6 digit PIN</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="4-6 digit PIN"
                  className="w-full px-4 py-4 text-center text-2xl font-black tracking-[0.2em] bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || pin.length < 4}
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
              >
                {creating ? 'Creating...' : <><Link2 size={18} /> Create Share Link</>}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
