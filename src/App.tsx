import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Users,
  AlertCircle,
  Calendar as CalendarIcon,
  User,
  Timer,
  Check,
  ChevronRight,
  LogOut,
  Sparkles,
  TrendingUp,
  Flame,
  School,
  Home,
  MessageSquare,
  X,
  Globe,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { useSync } from './contexts/SyncContext';
import { useAccountMode } from './contexts/AccountModeContext';
import { useLanguage } from './contexts/LanguageContext';
import FocusTimer from './components/FocusTimer';
import AuthForms from './components/AuthForms';
import { View, User as UserType } from './types';
import type { TranslationKey } from './translations';
import { CLASSES } from './constants';

// --- Shared Components ---

const Header = ({ currentView, user, onLogout }: { currentView: View, user: UserType, onLogout: () => void }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-on-surface tracking-tight font-headline">SparkDo</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex gap-6 items-center mr-6">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface/60">{t('nav.' + currentView)}</span>
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
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    {t('header.userMenu.signOut')}
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

const BottomNav = ({ activeView, setView }: { activeView: View, setView: (v: View) => void }) => {
  const { t } = useLanguage();
  return (
  <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-8 pt-3 bg-white/80 backdrop-blur-2xl rounded-t-3xl border-t border-outline-variant/20 shadow-lg">
    {[
      { id: 'tasks' as View, icon: Home, labelKey: 'nav.home' as const },
      { id: 'calendar' as View, icon: CalendarIcon, labelKey: 'nav.calendar' as const },
      { id: 'profile' as View, icon: User, labelKey: 'nav.profile' as const }
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
        <span className="text-[10px] font-bold uppercase tracking-widest mt-1">{t(item.labelKey)}</span>
      </button>
    ))}
  </nav>
  );
};

// --- Helpers ---

function formatDueDate(iso: string, t: (key: any, vars?: any) => string): string {
  if (!iso) return t('common.noDueDate');
  const d = new Date(iso);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return t('dueDate.overdue', { days: Math.abs(diffDays) });
  if (diffDays === 0) return t('dueDate.today');
  if (diffDays === 1) return t('dueDate.tomorrow');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatSyncTime(iso: string | null, isSyncing: boolean, t: (key: any, vars?: any) => string): string {
  if (isSyncing) return t('tasks.syncing') + '...';
  if (!iso) return 'Off-sync';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('tasks.justNow');
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatPostTime(iso: string, t: (key: any, vars?: any) => string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t('tasks.justNow');
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

function AttachmentLinks({ attachments, userId, className }: { attachments?: string[], userId: string | null, className?: string }) {
  if (!userId || !attachments || attachments.length === 0 || !className) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((file) => (
        <a
          key={file}
          href={`/api/files/${encodeURIComponent(userId)}/${encodeURIComponent(className)}/${encodeURIComponent(file)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-surface-container-low text-[10px] font-bold text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          <FileText size={12} />
          <span className="truncate max-w-[120px]">{file}</span>
        </a>
      ))}
    </div>
  );
}

// --- Tasks View (Homepage) ---

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

const MOCK_TODOS: TodoItem[] = [
  { id: 't1', text: 'Review math chapter 5 notes', completed: false },
  { id: 't2', text: 'Email teacher about extension', completed: true },
  { id: 't3', text: 'Pack gym clothes for tomorrow', completed: false },
  { id: 't4', text: 'Finish history reading (pp. 45-62)', completed: false },
  { id: 't5', text: 'Buy graph paper for calculus', completed: true },
];

const TODO_STORAGE_KEY = 'sparkdo_todos';

function getStoredTodos(): TodoItem[] {
  try {
    const raw = localStorage.getItem(TODO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : MOCK_TODOS;
  } catch {
    return MOCK_TODOS;
  }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todos));
}

const TasksView = ({ assignments, posts, aiSummary, isSyncing, isAnalyzing, lastSyncedAt, onSync, onAnalyze, onOpenFocusTimer, onToggleAssignment, localUserId }: {
  assignments: any[],
  posts: any[],
  aiSummary: any,
  isSyncing: boolean,
  isAnalyzing: boolean,
  lastSyncedAt: string | null,
  onSync: () => void,
  onAnalyze: () => void,
  onOpenFocusTimer: () => void,
  onToggleAssignment: (id: string) => void,
  localUserId: string | null,
}) => {
  const { mode, label, canSync, isReadOnly } = useAccountMode();
  const { t } = useLanguage();
  const [todos, setTodos] = useState<TodoItem[]>(getStoredTodos);
  const [newTodo, setNewTodo] = useState('');
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('greeting.morning') : hour < 18 ? t('greeting.afternoon') : t('greeting.evening');

  const toggleTodo = (id: string) => {
    setTodos((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      saveTodos(next);
      return next;
    });
  };

  const addTodo = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => {
      const next = [...prev, { id: crypto.randomUUID(), text: trimmed, completed: false }];
      saveTodos(next);
      return next;
    });
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTodos(next);
      return next;
    });
  };

  const recent = [...assignments].sort((a, b) => {
    const da = a.assignedDateTime ? new Date(a.assignedDateTime).getTime() : 0;
    const db = b.assignedDateTime ? new Date(b.assignedDateTime).getTime() : 0;
    return db - da;
  }).slice(0, 5);

  const upcoming = [...assignments]
    .filter((a: any) => !a.completed && a.dueDateTime)
    .sort((a, b) => new Date(a.dueDateTime).getTime() - new Date(b.dueDateTime).getTime())
    .slice(0, 5);

  // Combined recent items + upcoming deadlines, deduplicated and sorted by due date
  const combinedItems = Array.from(
    new Map([...recent, ...upcoming].map((item) => [item.id, item])).values()
  ).sort((a, b) => {
    const da = a.dueDateTime ? new Date(a.dueDateTime).getTime() : 0;
    const db = b.dueDateTime ? new Date(b.dueDateTime).getTime() : 0;
    return db - da;
  });

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
              <span className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">{t('mode.' + mode)}</span>
              {isReadOnly && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider">{t('mode.readOnly')}</span>
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
                {isSyncing ? t('tasks.syncing') : formatSyncTime(lastSyncedAt, isSyncing, t)}
              </button>
            )}
            <button
              onClick={onOpenFocusTimer}
              className="bg-surface-container-low text-on-surface px-6 py-3 rounded-full font-bold flex items-center gap-2 border border-outline-variant/20 hover:bg-surface-container-high transition-all active:scale-95 text-sm"
            >
              <Timer size={16} />
              {t('tasks.focus')}
            </button>
            {canSync && (
              <button
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="bg-gradient-to-br from-secondary to-secondary-container text-on-secondary px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-lg hover:shadow-secondary/20 transition-all active:scale-95 disabled:opacity-70 text-sm"
              >
                <Sparkles size={16} className={isAnalyzing ? 'animate-pulse' : ''} />
                {isAnalyzing ? t('tasks.analyzing') : t('tasks.analyze')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* My To-Do List */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-on-surface">{t('tasks.todoList.title')}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addTodo(newTodo);
            setNewTodo('');
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder={t('tasks.todoList.addPlaceholder')}
            className="flex-1 px-4 py-3 rounded-2xl bg-white border border-outline-variant/10 shadow-sm text-sm font-bold text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          <button
            type="submit"
            disabled={!newTodo.trim()}
            className="px-4 py-3 rounded-2xl bg-primary text-on-primary font-bold shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
          </button>
        </form>
        <div className="space-y-2">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="group flex items-center gap-3 p-4 rounded-2xl bg-white border border-outline-variant/10 shadow-sm hover:shadow-md transition-all"
            >
              <button
                onClick={() => toggleTodo(todo.id)}
                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${todo.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant/30 hover:border-primary'}`}
              >
                {todo.completed && <Check size={14} strokeWidth={3} />}
              </button>
              <span className={`flex-1 text-left font-bold text-sm ${todo.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="p-2 rounded-xl text-on-surface-variant hover:bg-red-50 hover:text-red-500 transition-all"
                aria-label="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Progress Bar */}
      {total > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-on-surface text-sm">{t('tasks.assignmentProgress')}</span>
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
          <p className="text-xs text-on-surface-variant mt-2">{t('tasks.completedCount', { completed, total })}</p>
        </div>
      )}

      {/* Recent Items & Deadlines */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-on-surface">{t('tasks.recentItems.title')}</h3>
        <div className="space-y-3">
          {combinedItems.length === 0 ? (
            <p className="text-on-surface-variant text-sm">{t('tasks.recentItems.empty', { action: canSync ? t('tasks.recentItems.emptyAction.sync') : t('tasks.recentItems.emptyAction.manual') })}</p>
          ) : (
            combinedItems.map((task: any) => (
              <button
                key={task.id}
                onClick={() => onToggleAssignment(task.id)}
                className="w-full group bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${task.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant/30'}`}>
                      {task.completed && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div>
                      <h4 className={`font-bold text-sm ${task.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.title}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{task.className || t('common.general')} • {formatDueDate(task.dueDateTime, t)}</p>
                      <AttachmentLinks attachments={task.attachments} userId={localUserId} className={task.className} />
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
              </button>
            ))
          )}
        </div>
      </section>

      {/* Recent Channel Posts */}
      {posts.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            <h3 className="text-xl font-black text-on-surface">{t('tasks.channelPosts.title')}</h3>
          </div>
          <div className="space-y-3">
            {posts
              .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
              .slice(0, 5)
              .map((post: any) => (
                <div key={post.id} className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{post.subject}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{post.className} • {formatPostTime(post.postedAt, t)}</p>
                      <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* AI Summary — Today's Homework */}
      {aiSummary?.today?.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-secondary" />
            <h3 className="text-xl font-black text-on-surface">{t('tasks.ai.todayHomework')}</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {aiSummary.today.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{item.title}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.className} • {formatDueDate(item.dueDateTime, t)}</p>
                    <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{item.content}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest shrink-0">Today</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Summary — Cross-Subject Summary */}
      {aiSummary?.crossSubject && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-tertiary" />
            <h3 className="text-xl font-black text-on-surface">{t('tasks.ai.crossSubject')}</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{aiSummary.crossSubject.totalAssignments}</p>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t('tasks.ai.assignments')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-green-500">{aiSummary.crossSubject.completed}</p>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t('tasks.ai.done')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-red-500">{aiSummary.crossSubject.overdue}</p>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t('tasks.ai.overdue')}</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-tertiary">{Object.keys(aiSummary.crossSubject.bySubject || {}).length}</p>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">{t('tasks.ai.subjects')}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(aiSummary.crossSubject.bySubject || {}).map(([subject, count]: [string, any]) => (
                <span key={subject} className="px-3 py-1 rounded-full bg-surface-container-low text-xs font-bold text-on-surface-variant">
                  {subject}: {count}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Summary — Recent Activities */}
      {aiSummary?.recentActivities?.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-primary" />
            <h3 className="text-xl font-black text-on-surface">{t('tasks.ai.recentActivities')}</h3>
          </div>
          <div className="space-y-3">
            {aiSummary.recentActivities
              .sort((a: any, b: any) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime())
              .slice(0, 5)
              .map((activity: any) => (
                <div key={activity.id} className="bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/10 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-on-surface">{activity.subject}</h4>
                      <p className="text-xs text-on-surface-variant mt-0.5">{activity.className} • {formatPostTime(activity.postedAt, t)}</p>
                      <p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{activity.content}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}


    </motion.div>
  );
};

// --- Calendar View ---

const CalendarView = ({ events, assignments, classes, localUserId }: { events: any[], assignments: any[], classes: any[], localUserId: string | null }) => {
  const { language, t } = useLanguage();
  const weekStart = getWeekStart();
  const weekEnd = getWeekEnd();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

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

  const getAssignmentsForDay = (day: number) =>
    assignments.filter((a: any) => a.dueDateTime && new Date(a.dueDateTime).getDate() === day);

  const getEventsForDay = (day: number) =>
    events.filter((e: any) => e.startDateTime && new Date(e.startDateTime).getDate() === day);

  const selectedDayItems = selectedDay !== null
    ? [...getAssignmentsForDay(selectedDay), ...getEventsForDay(selectedDay)]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-7xl mx-auto space-y-10 pb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-on-surface mb-2">{t('calendar.title')}</h1>
          <p className="text-on-surface-variant font-medium">{t('calendar.subtitle')}</p>
        </div>
      </div>

      {/* Weekly Reminders */}
      <section className="bg-primary rounded-3xl p-6 md:p-8 text-on-primary relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-container/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Timer size={24} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold">{t('calendar.thisWeek')}</span>
          </div>
          <h3 className="text-2xl font-black mb-2">
            {thisWeekTasks.length > 0 ? `${thisWeekTasks.length} due this week` : 'No deadlines this week'}
          </h3>
          <div className="space-y-2 mt-4">
            {thisWeekTasks.slice(0, 5).map((task: any) => (
              <div key={task.id} className="flex items-center gap-3 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="font-medium">{task.title}</span>
                <span className="text-on-primary/70 text-xs">{formatDueDate(task.dueDateTime, t)}</span>
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
            const dayAssignments = getAssignmentsForDay(day);
            const hasDeadline = dayAssignments.length > 0;

            if (day < 1 || day > 30) return <div key={i} className="aspect-square" />;

            const isInteractive = !isToday && (hasEvent || hasDeadline);

            return (
              <button
                key={i}
                onClick={() => isInteractive && setSelectedDay(day)}
                disabled={!isInteractive && !isToday}
                className={`aspect-square rounded-2xl p-2 relative text-left transition-all ${
                  isToday
                    ? 'bg-primary text-on-primary scale-105 z-10 shadow-lg shadow-primary/20'
                    : isInteractive
                      ? 'bg-white border-2 border-primary hover:bg-surface-container-high'
                      : 'bg-white hover:bg-surface-container-high disabled:opacity-60 disabled:hover:bg-white'
                }`}
              >
                <span className={`font-bold text-sm ${isToday ? 'text-white' : 'text-on-surface'}`}>{day}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {selectedDay !== null && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              className="fixed inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 top-[10%] md:top-[15%] md:w-full md:max-w-lg max-h-[80vh] bg-white rounded-3xl shadow-2xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-outline-variant/10">
                <div>
                  <h3 className="text-xl font-black text-on-surface">{t('calendar.dayDetail.title', { day: selectedDay, month: new Date().toLocaleDateString(language === 'zh' ? 'zh-CN' : undefined, { month: 'long' }) })}</h3>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">
                    {t('calendar.dayDetail.count', { count: selectedDayItems.length, suffix: selectedDayItems.length !== 1 ? 's' : '' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="overflow-y-auto p-5 space-y-3">
                {selectedDayItems.length === 0 ? (
                  <p className="text-sm text-on-surface-variant">{t('calendar.dayDetail.empty')}</p>
                ) : (
                  selectedDayItems.map((item: any) => {
                    const isEvent = !!item.startDateTime;
                    return (
                      <div key={item.id} className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className={`font-bold text-sm ${item.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{item.title || item.subject}</h4>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {isEvent
                                ? `${item.className || t('common.general')} • ${new Date(item.startDateTime).toLocaleTimeString(language === 'zh' ? 'zh-CN' : undefined, { hour: '2-digit', minute: '2-digit' })}`
                                : `${item.className || t('common.general')} • ${formatDueDate(item.dueDateTime, t)}`}
                            </p>
                            {!isEvent && <AttachmentLinks attachments={item.attachments} userId={localUserId} className={item.className} />}
                          </div>
                          {!isEvent && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${
                              item.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                              item.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                              'bg-surface-container text-on-surface-variant'
                            }`}>
                              {item.priority}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-on-surface-variant mt-3 line-clamp-4">{item.description}</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* School Events / Activities */}
      {classes.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-xl font-black text-on-surface">{t('calendar.schoolEvents.title')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.slice(0, 4).map((cls: any) => (
              <div key={cls.id} className="bg-white rounded-2xl p-5 border border-outline-variant/10 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center ${cls.color} font-bold shadow-sm`}>
                  {cls.code}
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm text-on-surface">{cls.name}</h4>
                  <p className="text-xs text-on-surface-variant">{cls.channel} • {cls.syncsToday} {t('profile.monitoredClasses.updates')}</p>
                </div>
                <ChevronRight size={18} className="text-outline" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Long-term Deadlines */}
      <section className="space-y-4">
        <h3 className="text-xl font-black text-on-surface">{t('calendar.longTerm.title')}</h3>
        <div className="space-y-3">
          {longTerm.length === 0 ? (
            <p className="text-on-surface-variant text-sm">{t('calendar.longTerm.empty')}</p>
          ) : (
            longTerm.map((task: any) => (
              <div key={task.id} className="bg-white rounded-2xl p-4 border border-outline-variant/10 flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <CalendarIcon size={18} className="text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{task.title}</p>
                  <p className="text-xs text-on-surface-variant">{task.className || t('common.general')}</p>
                  <AttachmentLinks attachments={task.attachments} userId={localUserId} className={task.className} />
                </div>
                <span className="text-sm font-bold text-primary">{formatDueDate(task.dueDateTime, t)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </motion.div>
  );
};

// --- Profile View ---

const ProfileView = ({ user, onLogout, classes, onSync, isSyncing, lastSyncedAt, source }: {
  user: UserType;
  onLogout: () => void;
  classes: any[];
  onSync: () => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  source: 'teams' | 'local' | 'none';
}) => {
  const { mode, setMode, label, canSync } = useAccountMode();
  const { language, setLanguage, t } = useLanguage();
  const isLocalSource = source === 'local';

  const modes: { id: typeof mode; icon: typeof School; color: string; titleKey: TranslationKey; descKey: TranslationKey }[] = [
    { id: 'child', icon: School, color: 'bg-primary text-on-primary', titleKey: 'profile.mode.student.title', descKey: 'profile.mode.student.description' },
    { id: 'parent', icon: Users, color: 'bg-tertiary text-on-tertiary', titleKey: 'profile.mode.parent.title', descKey: 'profile.mode.parent.description' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-10 pb-12"
    >
      <div>
        <h2 className="text-4xl md:text-5xl font-black text-on-background tracking-tighter">{t('profile.title')}</h2>
        <p className="text-on-surface-variant mt-2 font-medium">{t('profile.subtitle')}</p>
      </div>

      {/* Account Switcher */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-on-surface uppercase tracking-widest">{t('profile.switchAccount.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <h4 className="font-bold text-on-surface text-lg">{t(m.titleKey)}</h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{t(m.descKey)}</p>
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
            <span className="inline-block mt-2 px-3 py-1 rounded-full bg-surface-container-low text-xs font-bold text-on-surface-variant">{t('mode.' + mode)}</span>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      {canSync && (
        <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-on-surface">{isLocalSource ? t('profile.syncStatus.localFolder') : t('profile.syncStatus.teams')}</h3>
              <p className="text-sm text-on-surface-variant">{formatSyncTime(lastSyncedAt, isSyncing, t)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-sm text-on-surface">{isLocalSource ? t('profile.syncStatus.active') : t('profile.syncStatus.connected')}</span>
            </div>
          </div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="w-full py-3 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-lg transition-all active:scale-95 disabled:opacity-60"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? t('profile.syncStatus.syncing') : t('profile.syncStatus.syncNow')}
          </button>
        </div>
      )}

      {/* Monitored Classes */}
      {canSync && classes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-black text-on-surface uppercase tracking-widest">{t('profile.monitoredClasses.title')}</h3>
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
                <span className="text-xs font-bold text-on-surface-variant">{cls.syncsToday} {t('profile.monitoredClasses.updates')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Language Selector */}
      <section className="space-y-4">
        <h3 className="text-lg font-black text-on-surface uppercase tracking-widest">{t('profile.language.title')}</h3>
        <div className="grid grid-cols-2 gap-4">
          {([
            { id: 'en' as const, label: t('profile.language.english') },
            { id: 'zh' as const, label: t('profile.language.chinese') },
          ]).map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`flex items-center gap-3 rounded-3xl p-5 text-left border-2 transition-all hover:scale-[1.02] active:scale-95 ${
                language === lang.id
                  ? 'border-primary bg-surface-container-low shadow-lg'
                  : 'border-transparent bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <Globe size={20} className={language === lang.id ? 'text-primary' : 'text-on-surface-variant'} />
              <span className="font-bold text-on-surface">{lang.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Sign Out */}
      <section className="space-y-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors active:scale-95"
        >
          <LogOut size={18} />
          {t('profile.signOut')}
        </button>
      </section>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const { t } = useLanguage();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { assignments, classes, events, posts, aiSummary, isSyncing, isAnalyzing, lastSyncedAt, sync, analyze, source, toggleAssignment, localUserId } = useSync();
  const [view, setView] = useState<View>('tasks');
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
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{t('common.loading')}</p>
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
        return <TasksView assignments={assignments} posts={posts} aiSummary={aiSummary} isSyncing={isSyncing} isAnalyzing={isAnalyzing} lastSyncedAt={lastSyncedAt} onSync={sync} onAnalyze={analyze} onOpenFocusTimer={() => setFocusTimerOpen(true)} onToggleAssignment={toggleAssignment} localUserId={localUserId} />;
      case 'calendar':
        return <CalendarView events={events} assignments={assignments} classes={classes} localUserId={localUserId} />;
      case 'profile':
        return <ProfileView user={user} onLogout={logout} classes={classes} onSync={sync} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} source={source} />;
      default:
        return <TasksView assignments={assignments} posts={posts} aiSummary={aiSummary} isSyncing={isSyncing} isAnalyzing={isAnalyzing} lastSyncedAt={lastSyncedAt} onSync={sync} onAnalyze={analyze} onOpenFocusTimer={() => setFocusTimerOpen(true)} onToggleAssignment={toggleAssignment} localUserId={localUserId} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      <Header
        currentView={view}
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
    </div>
  );
}
