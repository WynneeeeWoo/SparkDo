import React, { useState, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  Users,
  AlertCircle,
  FileText,
  CheckSquare,
  Calendar as CalendarIcon,
  User,
  Plus,
  Share2,
  Cloud,
  HardDrive,
  Timer,
  Check,
  ChevronRight,
  LogOut,
  Sparkles,
  Moon,
  Sun,
  TrendingUp,
  X,
  Flame,
  School,
  Briefcase,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { useSync } from './contexts/SyncContext';
import { useTheme } from './contexts/ThemeContext';
import { useAccountMode } from './contexts/AccountModeContext';
import FocusTimer from './components/FocusTimer';
import AuthForms from './components/AuthForms';
import { View, User as UserType } from './types';
import { DEADLINES, CLASSES } from './constants';

// --- Shared Components ---

const Header = ({ currentView, onMenuClick, user, onLogout }: { currentView: string, onMenuClick: () => void, user: UserType, onLogout: () => void }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isDark, toggle } = useTheme();

  return (
    <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-primary p-2 rounded-full hover:bg-surface-container-high/20 transition-colors active:scale-95"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-black text-on-surface tracking-tight font-headline">SparkDo</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex gap-6 items-center mr-6">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface/60">{currentView}</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-10 h-10 rounded-full border-2 border-primary-container overflow-hidden shadow-sm hover:ring-2 hover:ring-primary/30 transition-all"
          >
            <div className="w-full h-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
              {user.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowUserMenu(false)}
                  className="fixed inset-0 z-40"
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-outline-variant/10 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-outline-variant/10">
                    <p className="font-bold text-on-surface text-sm">{user.displayName}</p>
                    <p className="text-xs text-on-surface-variant truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); toggle(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-low transition-colors"
                  >
                    {isDark ? <Sun size={16} /> : <Moon size={16} />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

const BottomNav = ({ activeView, setView }: { activeView: View, setView: (v: View) => void }) => (
  <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-3 bg-white/80 backdrop-blur-2xl rounded-t-3xl border-t border-outline-variant/20 shadow-lg">
    {[
      { id: 'tasks' as View, icon: Home, label: 'Home' },
      { id: 'calendar' as View, icon: CalendarIcon, label: 'Calendar' },
      { id: 'profile' as View, icon: User, label: 'Profile' }
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => setView(item.id)}
        className={`flex flex-col items-center justify-center px-6 py-2 transition-all active:scale-90 duration-200 ease-out rounded-xl ${
          activeView === item.id
            ? 'bg-surface-container-high text-on-primary-container'
            : 'text-on-surface/60 hover:bg-surface-container-low'
        }`}
      >
        <item.icon size={20} fill={activeView === item.id ? 'currentColor' : 'none'} />
        <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
      </button>
    ))}
  </nav>
);

// --- Helpers ---

function formatDueDate(iso: string): string {
  if (!iso) return 'No due date';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatSyncTime(iso: string | null, isSyncing: boolean): string {
  if (isSyncing) return 'Syncing...';
  if (!iso) return 'Off-sync';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getWeekStart(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekEnd(): Date {
  const start = getWeekStart();
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}

// --- Tasks View (Homepage) ---

const TasksView = ({ assignments, isSyncing, lastSyncedAt, onSync, onOpenFocusTimer }: {
  assignments: any[],
  isSyncing: boolean,
  lastSyncedAt: string | null,
  onSync: () => void,
  onOpenFocusTimer: () => void,
}) => {
  const { mode, label, canSync, isReadOnly } = useAccountMode();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  const urgent = assignments.filter((a: any) => !a.completed && (a.priority === 'urgent' || (a.dueDateTime && new Date(a.dueDateTime) < new Date())));
  const recent = [...assignments].sort((a, b) => {
    const da = a.assignedDateTime ? new Date(a.assignedDateTime).getTime() : 0;
    const db = b.assignedDateTime ? new Date(b.assignedDateTime).getTime() : 0;
    return db - da;
  }).slice(0, 5);

  const upcoming = [...assignments]
    .filter((a: any) => !a.completed && a.dueDateTime)
    .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime())
    .slice(0, 5);

  const total = assignments.length;
  const completed = assignments.filter((a: any) => a.completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10 pb-12"
    >
      {/* Greeting + Account Badge */}
      <section className="editorial-asymmetry">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">{label} Mode</span>
              {isReadOnly && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">Read Only</span>
              )}
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-on-background tracking-tighter leading-none">
              {greeting},
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {canSync && (
              <button
                onClick={onSync}
                disabled={isSyncing}
                className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-70 text-sm"
              >
                <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing' : formatSyncTime(lastSyncedAt, isSyncing)}
              </button>
            )}
            <button
              onClick={onOpenFocusTimer}
              className="bg-surface-container-low text-on-surface px-6 py-3 rounded-full font-bold flex items-center gap-2 border border-outline-variant/20 hover:bg-surface-container-high transition-all active:scale-95 text-sm"
            >
              <Timer size={16} />
              Focus
            </button>
          </div>
        </div>
      </section>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-on-surface text-sm">Assignment Progress</span>
            <span className="text-xl font-black text-primary">{percent}%</span>
          </div>
          <div className="h-2.5 w-full bg-surface-container-low rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <p className="text-xs text-on-surface-variant mt-2">{completed} of {total} completed</p>
        </div>
      )}

      {/* Urgent Items */}
      {urgent.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-red-500" />
            <h3 className="text-xl font-black text-on-surface">Urgent — Needs Attention</h3>
          </div>
          <div className="space-y-3">
            {urgent.map((task: any) => (
              <div key={task.id} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
                <div className="flex-1">
                  <h4 className="font-bold text-on-surface text-sm">{task.title}</h4>
                  <p className="text-xs text-red-600 mt-0.5">{formatDueDate(task.dueDateTime)} • {task.className || 'General'}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest shrink-0">{task.priority}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Items */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-on-surface">Recent Items</h3>
        <div className="space-y-3">
          {recent.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No assignments yet. {canSync ? 'Sync with Microsoft Teams to get started.' : 'Add tasks manually or switch to Student mode.'}</p>
          ) : (
            recent.map((task: any) => (
              <div key={task.id} className="group bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 shrink-0 ${task.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant/30'}`}>
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${task.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{task.className || 'General'} • {formatDueDate(task.dueDateTime)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                    'bg-surface-container-low text-on-surface-variant'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Recent Deadlines */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-on-surface">Upcoming Deadlines</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(upcoming.length > 0 ? upcoming : DEADLINES).slice(0, 6).map((item: any) => {
            const due = item.dueDateTime ? new Date(item.dueDateTime) : null;
            const month = due ? due.toLocaleDateString(undefined, { month: 'short' }) : item.month;
            const date = due ? due.getDate() : item.date;
            return (
              <div key={item.id} className="bg-surface-container-low rounded-2xl p-5 border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-black text-on-surface-variant uppercase">{month}</span>
                    <span className="text-lg font-black text-on-surface -mt-1">{date}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface truncate">{item.title || item.subject}</p>
                    <p className="text-xs text-on-surface-variant">{item.course || item.className || 'School'}</p>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.completed ? 'bg-green-500 w-full' : 'bg-tertiary w-[60%]'}`} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* School Activities */}
      {canSync && (
        <section className="space-y-4">
          <h3 className="text-xl font-black text-on-surface">School Activities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLASSES.slice(0, 4).map((cls) => (
              <div key={cls.id} className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center ${cls.color} font-bold shadow-sm`}>
                  {cls.code}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-on-surface">{cls.name}</h4>
                  <p className="text-xs text-on-surface-variant">{cls.channel} • {cls.syncsToday} updates today</p>
                </div>
                <ChevronRight size={18} className="text-outline" />
              </div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};

// --- Calendar View ---

const CalendarView = ({ events, assignments }: { events: any[], assignments: any[] }) => {
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();

  const thisWeekTasks = assignments.filter((a: any) => {
    if (!a.dueDateTime || a.completed) return false;
    const d = new Date(a.dueDateTime);
    return d >= weekStart && d <= weekEnd;
  });

  const longTerm = assignments
    .filter((a: any) => !a.completed && a.dueDateTime && new Date(a.dueDateTime) > weekEnd)
    .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime())
    .slice(0, 8);

  const eventDays = new Set(events.map((e: any) => new Date(e.startDateTime).getDate()));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface mb-2">Calendar</h1>
          <p className="text-on-surface-variant font-medium">Plan ahead. Never miss a deadline.</p>
        </div>
      </div>

      {/* Weekly Reminders */}
      <section className="bg-primary rounded-3xl p-6 md:p-8 text-on-primary relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Timer size={24} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">This Week</span>
          </div>
          <h3 className="text-2xl font-black mb-2">
            {thisWeekTasks.length > 0 ? `${thisWeekTasks.length} due this week` : 'No deadlines this week'}
          </h3>
          <div className="space-y-2 mt-4">
            {thisWeekTasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="font-medium">{task.title}</span>
                <span className="text-on-primary/70 text-xs">{formatDueDate(task.dueDateTime)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Calendar Grid */}
      <section className="bg-surface-container-low rounded-3xl p-4 md:p-8">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-[10px] uppercase tracking-[0.2em] text-outline mb-4">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i - 4;
            const isToday = day === new Date().getDate();
            const hasEvent = eventDays.has(day);
            const hasDeadline = assignments.some((a: any) => !a.completed && a.dueDateTime && new Date(a.dueDateTime).getDate() === day);

            if (day < 1 || day > 30) return <div key={i} className="aspect-square" />;

            return (
              <div
                key={i}
                className={`aspect-square rounded-2xl p-2 relative transition-all ${
                  isToday
                    ? 'bg-primary text-on-primary scale-105 z-10 shadow-lg shadow-primary/20'
                    : 'bg-white hover:bg-surface-container-high'
                }`}
              >
                <span className={`font-bold text-sm ${isToday ? 'text-white' : 'text-on-surface'}`}>{day}</span>
                {(hasEvent || hasDeadline) && !isToday && (
                  <div className={`absolute bottom-2 left-2 right-2 h-1 rounded-full ${hasDeadline ? 'bg-red-400' : 'bg-primary-container'}`} />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Long-term Deadlines */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-on-surface">Long-term Deadlines</h3>
        <div className="space-y-3">
          {longTerm.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No upcoming long-term deadlines. You're all caught up!</p>
          ) : (
            longTerm.map((task: any) => (
              <div key={task.id} className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <CalendarIcon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{task.title}</p>
                  <p className="text-xs text-on-surface-variant">{task.className || 'General'}</p>
                </div>
                <span className="text-sm font-bold text-primary">{formatDueDate(task.dueDateTime)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
};

// --- Profile View ---

const ProfileView = ({ user, onLogout, classes, onSync, isSyncing, lastSyncedAt }: {
  user: UserType;
  onLogout: () => void;
  classes: any[];
  onSync: () => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
}) => {
  const { mode, setMode, label, canSync } = useAccountMode();
  const { isDark, toggle } = useTheme();

  const modes: { id: typeof mode; icon: typeof School; color: string; title: string; desc: string }[] = [
    { id: 'child', icon: School, color: 'bg-primary text-on-primary', title: 'Student', desc: 'Full access to assignments, Teams sync, and school activities' },
    { id: 'parent', icon: Users, color: 'bg-tertiary text-on-tertiary', title: 'Parent', desc: 'Read-only overview of your child\'s tasks and deadlines' },
    { id: 'personal', icon: Briefcase, color: 'bg-secondary text-on-secondary', title: 'Personal', desc: 'Private tasks and calendar without school integration' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-10 pb-12"
    >
      <div>
        <h2 className="text-4xl md:text-5xl font-black text-on-background tracking-tighter">Profile</h2>
        <p className="text-on-surface-variant mt-2 font-medium">Manage your account and preferences</p>
      </div>

      {/* Account Switcher */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-on-surface uppercase tracking-widest">Switch Account</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`relative rounded-3xl p-6 text-left border-2 transition-all hover:scale-[1.02] active:scale-95 ${
                mode === m.id
                  ? 'border-primary bg-surface-container-low shadow-lg'
                  : 'border-transparent bg-white shadow-sm hover:shadow-md'
              }`}
            >
              {mode === m.id && (
                <div className="absolute top-4 right-4 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check size={14} className="text-on-primary" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center mb-4`}>
                <m.icon size={24} />
              </div>
              <h4 className="font-bold text-on-surface text-lg">{m.title}</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{m.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* User Info */}
      <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-primary-container flex items-center justify-center text-on-primary-container font-black text-2xl">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-on-surface">{user.displayName}</h3>
            <p className="text-on-surface-variant">{user.email}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-surface-container-low text-xs font-bold text-on-surface-variant">{label} Mode</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors active:scale-95"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Sync Status */}
      {canSync && (
        <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Microsoft Teams</h3>
              <p className="text-sm text-on-surface-variant">{formatSyncTime(lastSyncedAt, isSyncing)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-sm text-on-surface">Connected</span>
            </div>
          </div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {/* Settings */}
      <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm space-y-4">
        <h3 className="text-xl font-bold text-on-surface">Settings</h3>
        <button
          onClick={toggle}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-colors"
        >
          <div className="flex items-center gap-3">
            {isDark ? <Sun size={20} className="text-on-surface" /> : <Moon size={20} className="text-on-surface" />}
            <span className="font-bold text-sm text-on-surface">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isDark ? 'bg-primary' : 'bg-outline-variant/30'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>

      {/* Monitored Classes */}
      {canSync && classes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-on-surface uppercase tracking-widest">Monitored Classes</h3>
          <div className="space-y-3">
            {classes.map((cls: any) => (
              <div key={cls.id} className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-4">
                <div className={`w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center ${cls.color} font-bold text-sm`}>
                  {cls.code}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-on-surface">{cls.name}</h4>
                  <p className="text-xs text-on-surface-variant">{cls.channel}</p>
                </div>
                <span className="text-xs font-bold text-on-surface-variant">{cls.syncsToday} updates</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { assignments, classes, events, isSyncing, lastSyncedAt, sync } = useSync();
  const [view, setView] = useState<View>('tasks');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [focusTimerOpen, setFocusTimerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setFocusTimerOpen(true);
    window.addEventListener('open-focus-timer', handler);
    return () => window.removeEventListener('open-focus-timer', handler);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-xl"
          >
            <Sparkles size={24} />
          </motion.div>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Loading</p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthForms />;
  }

  const renderView = () => {
    switch (view) {
      case 'tasks':
        return <TasksView assignments={assignments} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} onSync={sync} onOpenFocusTimer={() => setFocusTimerOpen(true)} />;
      case 'calendar':
        return <CalendarView events={events} assignments={assignments} />;
      case 'profile':
        return <ProfileView user={user} onLogout={logout} classes={classes} onSync={sync} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} />;
      default:
        return <TasksView assignments={assignments} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} onSync={sync} onOpenFocusTimer={() => setFocusTimerOpen(true)} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      <Header
        currentView={view === 'tasks' ? 'Home' : view.charAt(0).toUpperCase() + view.slice(1)}
        onMenuClick={() => setIsMenuOpen(!isMenuOpen)}
        user={user}
        onLogout={logout}
      />

      <main className="px-6 py-8 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {renderView()}
        </AnimatePresence>
      </main>

      <BottomNav activeView={view} setView={setView} />

      <FocusTimer isOpen={focusTimerOpen} onClose={() => setFocusTimerOpen(false)} />

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed top-0 left-0 h-full w-72 bg-white z-[70] p-8 shadow-2xl flex flex-col"
            >
              <div className="mb-10">
                <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-4 shadow-lg">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-black">SparkDo</h2>
                <p className="text-xs text-on-surface-variant mt-1">{user.email}</p>
              </div>
              <div className="space-y-2 flex-1">
                {[
                  { label: 'Home', icon: Home, view: 'tasks' as View },
                  { label: 'Calendar', icon: CalendarIcon, view: 'calendar' as View },
                  { label: 'Profile', icon: User, view: 'profile' as View },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => { setIsMenuOpen(false); setView(item.view); }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3 text-lg font-bold text-on-surface hover:text-primary hover:bg-surface-container-low rounded-2xl transition-colors"
                  >
                    <item.icon size={20} />
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => { setIsMenuOpen(false); logout(); }}
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-colors"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
