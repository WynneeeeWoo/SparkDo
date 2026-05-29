import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, Timer, Coffee } from 'lucide-react';

interface FocusTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

export default function FocusTimer({ isOpen, onClose }: FocusTimerProps) {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_MINUTES * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        // Timer complete
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (mode === 'work') {
          setCompletedSessions((c) => c + 1);
          setMode('break');
          return BREAK_MINUTES * 60;
        } else {
          setMode('work');
          return WORK_MINUTES * 60;
        }
      }
      return prev - 1;
    });
  }, [mode]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, tick]);

  const handleStartPause = () => setIsRunning((r) => !r);

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60);
  };

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-on-background/40 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-3xl p-8 md:p-12 w-full max-w-md mx-4 shadow-2xl border border-outline-variant/20"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${mode === 'work' ? 'bg-primary text-on-primary' : 'bg-tertiary-container text-on-tertiary-container'}`}>
                  {mode === 'work' ? <Timer size={20} /> : <Coffee size={20} />}
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-surface">Focus Studio</h3>
                  <p className="text-xs text-on-surface-variant font-medium">{mode === 'work' ? 'Deep work session' : 'Take a breather'}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-high transition-colors">
                <X size={20} className="text-on-surface-variant" />
              </button>
            </div>

            {/* Circular Timer */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
                <circle
                  cx="130" cy="130" r="120"
                  fill="none"
                  stroke="currentColor"
                  className="text-surface-container-high"
                  strokeWidth="12"
                />
                <circle
                  cx="130" cy="130" r="120"
                  fill="none"
                  stroke="currentColor"
                  className={mode === 'work' ? 'text-primary' : 'text-tertiary'}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-on-surface tracking-tighter">{formatTime(timeLeft)}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mt-2">{mode === 'work' ? 'Focus' : 'Break'}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={handleReset}
                className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-95"
              >
                <RotateCcw size={22} />
              </button>
              <button
                onClick={handleStartPause}
                className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl transition-all active:scale-95 ${
                  mode === 'work'
                    ? 'bg-primary text-on-primary shadow-primary/20'
                    : 'bg-tertiary text-on-tertiary shadow-tertiary/20'
                }`}
              >
                {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setMode(mode === 'work' ? 'break' : 'work');
                  setTimeLeft(mode === 'work' ? BREAK_MINUTES * 60 : WORK_MINUTES * 60);
                }}
                className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-all active:scale-95"
              >
                <span className="text-xs font-black">{mode === 'work' ? 'BRK' : 'WRK'}</span>
              </button>
            </div>

            {/* Session counter */}
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {completedSessions} session{completedSessions !== 1 ? 's' : ''} completed
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
