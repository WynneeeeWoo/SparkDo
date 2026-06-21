import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Link2, Copy, Check, Trash2, RefreshCw } from 'lucide-react';
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

function generateSharePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function ShareModal({ userId, assignments, posts, classes, events, onClose }: ShareModalProps) {
  const { t } = useLanguage();
  const { create, activeShare, revoke } = useShare();
  const [pin, setPin] = useState(() => generateSharePin());
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!activeShare) setPin(generateSharePin());
  }, [activeShare]);

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

  const regeneratePin = useCallback(() => setPin(generateSharePin()), []);

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
        key="share-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        key="share-modal"
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
                A new share code is generated for you each month. It is unique to your account and expires with the share link.
              </p>
              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">This month&apos;s share code</p>
                  <button
                    onClick={regeneratePin}
                    className="p-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant transition-colors"
                    title="Generate new code"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="text-3xl font-black tracking-[0.25em] text-on-surface text-center">{pin}</p>
                <p className="text-xs text-on-surface-variant text-center">6-digit PIN for the parent view</p>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating}
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
