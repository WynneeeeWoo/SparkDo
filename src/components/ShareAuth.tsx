import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Lock, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useShare } from '../contexts/ShareContext';

interface ShareAuthProps {
  token: string;
}

export default function ShareAuth({ token }: ShareAuthProps) {
  const { t } = useLanguage();
  const { loadShared } = useShare();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{4,6}$/.test(pin)) {
      setError('PIN must be 4-6 digits.');
      return;
    }
    setLoading(true);
    try {
      await loadShared(token, pin);
    } catch (err: any) {
      setError(err?.message || 'Invalid PIN or expired share.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-outline-variant/10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-primary text-on-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <Sparkles size={32} />
          </div>
          <h1 className="text-2xl font-black text-on-surface">SparkDo</h1>
          <p className="text-sm text-on-surface-variant mt-2">Shared view</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant ml-1 flex items-center gap-2">
              <Lock size={14} />
              Enter PIN
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="4-6 digit PIN"
              className="w-full px-4 py-4 text-center text-2xl font-black tracking-[0.2em] bg-surface-container-low rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Loading...' : <>{t('common.open')} <ArrowRight size={18} /></>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
