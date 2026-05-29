import React, { useState } from 'react';
import {
  Menu,
  RefreshCw,
  Users,
  AlertCircle,
  FileText,
  BookOpen,
  ArrowRight,
  Timer,
  CheckSquare,
  Calendar as CalendarIcon,
  User,
  Plus,
  Share2,
  Cloud,
  HardDrive,
  Hourglass,
  Factory,
  ExternalLink,
  Check,
  ChevronRight,
  MoreVertical,
  Lightbulb,
  LogOut,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './contexts/AuthContext';
import { useSync } from './contexts/SyncContext';
import AuthForms from './components/AuthForms';
import { View, Task, Deadline, MonitoredClass, User as UserType } from './types';
import { TASKS, DEADLINES, CLASSES } from './constants';

// --- Shared Components ---

const Header = ({ currentView, onMenuClick, user, onLogout }: { currentView: string, onMenuClick: () => void, user: UserType, onLogout: () => void }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="w-full top-0 sticky z-50 bg-surface/80 backdrop-blur-md flex justify-between items-center px-6 py-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-primary p-2 rounded-full hover:bg-surface-container-high/20 transition-colors active:scale-95"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-black text-on-surface tracking-tight font-headline">The Scholastic Atelier</h1>
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
            {user.avatar ? (
              <img
                alt="User Profile"
                className="w-full h-full object-cover"
                src={user.avatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold text-sm">
                {user.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
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
      { id: 'home', icon: BookOpen, label: 'Home' },
      { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
      { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
      { id: 'profile', icon: User, label: 'Profile' }
    ].map((item) => (
      <button
        key={item.id}
        onClick={() => setView(item.id as View)}
        className={`flex flex-col items-center justify-center px-5 py-2 transition-all active:scale-90 duration-200 ease-out rounded-xl ${
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

const FAB = ({ onClick }: { onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="fixed bottom-28 right-6 w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40"
  >
    <Plus size={32} />
  </button>
);

// --- View Components ---

const DashboardView = ({ onAssignmentClick, user, onSync, isSyncing, lastSyncedAt }: { onAssignmentClick: () => void, user: UserType, onSync: () => void, isSyncing: boolean, lastSyncedAt: string | null }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12 pb-12"
    >
      {/* Hero */}
      <section className="editorial-asymmetry">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-secondary">Dashboard Overview</span>
            <h2 className="text-5xl md:text-6xl font-black text-on-background tracking-tighter leading-none">
              {greeting},<br /><span className="text-primary-fixed">{user.displayName || 'Archivist'}</span>
            </h2>
          </div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-bold flex items-center gap-3 shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-70"
          >
            <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : lastSyncedAt ? 'Quick-Sync Data' : 'Sync Teams Data'}
          </button>
        </div>
      </section>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Stats */}
        <div className="md:col-span-4">
          <div className="bg-surface-container-low rounded-3xl p-8 flex flex-col justify-between h-full relative overflow-hidden">
            <div className="relative z-10">
              <Users className="text-primary mb-4" size={40} />
              <h3 className="text-2xl font-bold text-on-surface mb-2">Teams Extractions</h3>
              <p className="text-on-surface-variant leading-relaxed">High-level extraction metrics across active scholastic squads.</p>
            </div>
            <div className="mt-8 space-y-4 relative z-10">
              <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
                <span className="font-medium">Active Streams</span>
                <span className="text-2xl font-black text-primary">12</span>
              </div>
              <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between">
                <span className="font-medium">Success Rate</span>
                <span className="text-2xl font-black text-tertiary">98.4%</span>
              </div>
            </div>
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-container opacity-20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Priorities */}
        <div className="md:col-span-8">
          <div className="bg-surface-container-lowest rounded-3xl p-8 ghost-border">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-on-surface">{user.displayName?.split(' ')[0] || 'Your'}&apos;s Daily Priorities</h3>
              <span className="text-sm font-medium px-4 py-2 bg-surface-container-high rounded-full text-on-primary-container">Oct 24, 2023</span>
            </div>
            <div className="space-y-4">
              {[
                { title: 'Curate Thesis Archives', desc: 'Finalize metadata for the 2024 collection', priority: 'High Priority', time: '09:00 AM', color: 'border-primary', icon: AlertCircle, iconColor: 'text-primary' },
                { title: 'Team extraction sync', desc: 'Review data points from Research Group A', priority: 'Standard', time: '11:30 AM', color: 'border-tertiary', icon: FileText, iconColor: 'text-tertiary' },
                { title: 'Atelier Editorial Review', desc: 'Quality check on curated digital journals', priority: 'Pending', time: '02:00 PM', color: 'border-secondary', icon: BookOpen, iconColor: 'text-secondary' }
              ].map((item, i) => (
                <div
                  key={i}
                  onClick={onAssignmentClick}
                  className={`group flex items-center gap-6 p-4 rounded-2xl hover:bg-surface-container-low transition-colors border-l-4 ${item.color} cursor-pointer`}
                >
                  <div className={`w-12 h-12 rounded-full bg-surface-container-low flex items-center justify-center ${item.iconColor}`}>
                    <item.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-lg text-on-surface">{item.title}</h4>
                    <p className="text-on-surface-variant text-sm">{item.desc}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${item.iconColor}`}>{item.priority}</span>
                    <span className="text-sm text-on-surface-variant">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 p-6 bg-tertiary-container/10 rounded-2xl flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1 w-full">
                <h5 className="text-tertiary font-bold mb-1">Archival Progress Ribbon</h5>
                <div className="h-3 w-full bg-tertiary-container rounded-full overflow-hidden">
                  <div className="h-full bg-tertiary w-[65%] rounded-full"></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-tertiary">65%</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase vertical-rl">Daily Goal</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-surface-container-low rounded-3xl p-10 flex flex-col justify-center">
          <h3 className="text-3xl font-bold text-on-surface mb-4 tracking-tight">Curation Spotlight</h3>
          <p className="text-on-surface-variant leading-relaxed text-lg mb-8">
            Your recent extraction of the &quot;Digital Renaissance&quot; journals has been flagged as high-quality. Explore how other Archivists are utilizing this dataset.
          </p>
          <div className="flex -space-x-4 mb-8">
            {[1, 2, 3].map(i => (
              <img
                key={i}
                alt="Team member"
                className="w-12 h-12 rounded-full border-4 border-surface"
                src={`https://picsum.photos/seed/user${i}/100/100`}
                referrerPolicy="no-referrer"
              />
            ))}
            <div className="w-12 h-12 rounded-full border-4 border-surface bg-primary text-on-primary flex items-center justify-center text-xs font-bold">+12</div>
          </div>
          <button className="text-primary font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:gap-4 transition-all w-fit">
            View Network Usage <ArrowRight size={16} />
          </button>
        </div>
        <div className="relative rounded-3xl overflow-hidden min-h-[320px] group">
          <img
            alt="Scholastic Environment"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            src="https://picsum.photos/seed/library/800/600"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 to-transparent flex flex-col justify-end p-8">
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold w-fit mb-3">NEW RESOURCE</span>
            <h4 className="text-white text-2xl font-bold leading-tight">The Archivist&apos;s Handbook: Edition 2024</h4>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

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
  if (isSyncing) return 'Syncing now...';
  if (!iso) return 'Off-sync';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Synced just now';
  if (mins < 60) return `Synced ${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  return `Synced ${Math.floor(hours / 24)}d ago`;
}

const TasksView = ({ assignments, isSyncing, lastSyncedAt }: { assignments: any[], isSyncing: boolean, lastSyncedAt: string | null }) => {
  const displayTasks = assignments.length > 0 ? assignments : TASKS;
  return (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 pb-12"
  >
    <section className="md:col-span-8 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-on-surface">Daily Focus</h2>
          <p className="text-on-surface-variant font-medium mt-1 uppercase tracking-widest text-[10px]">Today, October 24th</p>
        </div>
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-outline-variant/10">
          <RefreshCw className={`text-primary ${isSyncing ? 'animate-spin' : ''}`} size={16} />
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{formatSyncTime(lastSyncedAt, isSyncing)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {displayTasks.map((task: any) => (
          <div
            key={task.id}
            className={`group relative bg-white rounded-3xl p-6 shadow-sm border border-surface-container-low hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 ${task.completed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-5">
              <div className="pt-1">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${task.completed ? 'bg-primary border-primary text-white' : 'border-outline-variant/30 hover:border-primary'}`}>
                  {task.completed && <Check size={16} strokeWidth={3} />}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    task.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                    task.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                    'bg-surface-container-low text-on-surface-variant'
                  }`}>
                    {task.priority}
                  </span>
                  <span className={`text-on-surface-variant text-[11px] font-semibold ${task.completed ? 'line-through' : ''}`}>{'dueDateTime' in task ? formatDueDate(task.dueDateTime) : `Due ${task.dueTime}`}</span>
                </div>
                <h3 className={`text-lg font-bold leading-tight group-hover:text-primary transition-colors ${task.completed ? 'line-through' : ''}`}>{task.title}</h3>
                <p className="text-on-surface-variant/80 text-sm mt-1">{task.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {'className' in task && task.className && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#4c6ef5]">
                      <Users size={14} />
                      {task.className}
                    </div>
                  )}
                  {task.attachments && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
                      <Share2 size={14} />
                      {task.attachments} Files Attached
                    </div>
                  )}
                  {task.group && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#4c6ef5]">
                      <Users size={14} />
                      {task.group}
                    </div>
                  )}
                  {task.tags?.map((tag: string) => (
                    <div key={tag} className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
                      <FileText size={14} />
                      {tag}
                    </div>
                  ))}
                  {'maxPoints' in task && task.maxPoints && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-on-surface-variant">
                      <AlertCircle size={14} />
                      {task.maxPoints} pts
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>

    <aside className="md:col-span-4 space-y-6">
      <div className="bg-gradient-to-br from-primary to-primary-container p-1 rounded-3xl shadow-lg">
        <div className="bg-white rounded-[22px] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-black text-on-surface uppercase tracking-widest text-[10px]">Sync Ecosystem</h3>
            <Share2 className="text-primary" size={18} />
          </div>
          <div className="space-y-4">
            {[
              { name: 'MS Teams', status: '3 channels active', icon: Cloud, color: 'bg-[#4c6ef5]', active: true },
              { name: 'Outlook Cal', status: 'Synced: Just now', icon: CalendarIcon, color: 'bg-[#0078d4]', active: true },
              { name: 'Local Drive', status: 'Off-sync', icon: HardDrive, color: 'bg-gray-400', active: false }
            ].map((sync, i) => (
              <div key={i} className={`flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-surface-container ${!sync.active ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${sync.color} flex items-center justify-center text-white`}>
                    <sync.icon size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface">{sync.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{sync.status}</p>
                  </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${sync.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-gray-300'}`}></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-on-background text-white rounded-3xl p-6 relative overflow-hidden group">
        <div className="relative z-10">
          <h3 className="text-2xl font-black mb-2 leading-tight">Focus Studio</h3>
          <p className="text-primary-container text-sm font-medium mb-6">Deep work session starts in 5 minutes</p>
          <button className="w-full bg-primary py-3 rounded-2xl font-black uppercase tracking-widest text-[11px] text-on-background hover:bg-white transition-colors">Start Pomodoro</button>
        </div>
        <div className="absolute -right-4 -bottom-4 opacity-20 group-hover:rotate-12 transition-transform duration-700">
          <Hourglass size={120} />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-surface-container shadow-sm">
        <h3 className="font-black text-on-surface uppercase tracking-widest text-[10px] mb-4">Upcoming Deadlines</h3>
        <div className="space-y-4">
          {DEADLINES.slice(0, 2).map((deadline) => (
            <div key={deadline.id} className="flex gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-surface-container-low rounded-2xl border border-outline-variant/20">
                <span className="text-[10px] font-black text-on-surface-variant uppercase">{deadline.month}</span>
                <span className="text-lg font-black text-on-surface -mt-1">{deadline.date}</span>
              </div>
              <div className="flex-1 border-b border-surface-container pb-4 last:border-0">
                <p className="text-sm font-bold text-on-surface">{deadline.title}</p>
                <p className="text-xs text-on-surface-variant">{deadline.course}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  </motion.div>
  );
};

const CalendarView = ({ events }: { events: any[] }) => {
  const eventDays = new Set(events.map(e => new Date(e.startDateTime).getDate()));
  const eventDayColors: Record<number, string> = {};
  events.forEach(e => {
    const d = new Date(e.startDateTime).getDate();
    eventDayColors[d] = 'bg-primary-container';
  });

  return (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="max-w-7xl mx-auto space-y-12 pb-12"
  >
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight text-on-surface mb-2">November 2024</h1>
        <p className="text-on-surface-variant font-medium">12 Academic Deadlines • 4 Major Projects</p>
      </div>
      <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-full">
        <button className="px-6 py-2 rounded-full font-bold text-sm bg-white text-primary shadow-sm">Month</button>
        <button className="px-6 py-2 rounded-full font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors">Week</button>
        <button className="px-6 py-2 rounded-full font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors">Day</button>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <section className="lg:col-span-8 bg-surface-container-low rounded-3xl p-4 md:p-8">
        <div className="grid grid-cols-7 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-bold text-[10px] uppercase tracking-[0.2em] text-outline mb-4">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => {
            const day = i - 4; // Start from Nov 1st
            const isToday = day === new Date().getDate();
            const hasHardcodedEvent = [4, 7, 12, 20, 25].includes(day);
            const hasSyncedEvent = eventDays.has(day);
            const color = hasSyncedEvent ? (eventDayColors[day] || 'bg-primary-container') :
                          day === 4 || day === 20 ? 'bg-tertiary-container' :
                          day === 7 ? 'bg-primary-container' :
                          'bg-red-400';

            if (day < 1 || day > 30) return <div key={i} className="aspect-square" />;

            return (
              <div
                key={i}
                className={`aspect-square rounded-2xl p-3 relative group transition-all ${
                  isToday
                    ? 'bg-primary shadow-xl shadow-primary/20 scale-105 z-10 border-4 border-white'
                    : 'bg-white hover:bg-surface-container-high'
                }`}
              >
                <span className={`font-bold ${isToday ? 'text-white' : 'text-on-surface'}`}>{day}</span>
                {(hasHardcodedEvent || hasSyncedEvent) && !isToday && (
                  <div className={`absolute bottom-3 left-3 right-3 h-1.5 ${color} rounded-full`} />
                )}
                {isToday && (
                  <>
                    <span className="absolute top-3 right-3 w-2 h-2 bg-white rounded-full"></span>
                    <div className="absolute bottom-3 left-3 right-3 h-1.5 bg-white/30 rounded-full"></div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <aside className="lg:col-span-4 space-y-6">
        <div className="relative overflow-hidden bg-primary rounded-3xl p-8 text-on-primary">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-container/20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Timer size={32} />
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Live Focus Session</span>
            </div>
            <h3 className="text-3xl font-black mb-4 leading-tight">Advanced Curatorial Thesis</h3>
            <p className="text-on-primary/80 mb-8 font-medium">90 minutes deep work sprint scheduled for today at 2:00 PM.</p>
            <button className="w-full bg-white text-primary font-bold py-4 rounded-full hover:scale-[1.02] transition-transform active:scale-95 shadow-lg">
              Start Session
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-3xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-on-surface">Deadlines</h4>
            <ArrowRight className="text-primary cursor-pointer" size={20} />
          </div>
          <div className="space-y-4">
            {[
              { date: 'NOV 12', title: 'History of Art Gallery Review', color: 'bg-red-500' },
              { date: 'NOV 14', title: 'Modernist Portfolio Submission', color: 'bg-primary' },
              { date: 'NOV 20', title: 'Thesis Draft Review', color: 'bg-tertiary', opacity: true }
            ].map((item, i) => (
              <div key={i} className={`bg-white p-5 rounded-2xl flex items-center gap-4 ${item.opacity ? 'opacity-60' : ''}`}>
                <div className={`w-2 h-10 ${item.color} rounded-full`}></div>
                <div>
                  <p className="text-[10px] text-outline uppercase tracking-widest font-bold">{item.date}</p>
                  <p className="font-bold text-on-surface">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  </motion.div>
  );
};

const ProfileView = ({ user, onLogout, classes, onSync, isSyncing, lastSyncedAt }: { user: UserType; onLogout: () => void; classes: any[]; onSync: () => void; isSyncing: boolean; lastSyncedAt: string | null }) => {
  const displayClasses = classes.length > 0 ? classes : CLASSES;
  return (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="max-w-6xl mx-auto space-y-12 pb-12"
  >
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary mb-4">Integrations / Microsoft Teams</p>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <h2 className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface max-w-2xl">
          Automated <br /><span className="text-primary-fixed">Extractions.</span>
        </h2>
        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-outline">Status</span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-bold text-on-surface">Connected</span>
            </div>
          </div>
          <div className="h-8 w-px bg-outline-variant/20 mx-2"></div>
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-70"
          >
            <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
            {isSyncing ? 'Syncing...' : 'Re-sync Now'}
          </button>
        </div>
      </div>
    </div>

    {/* User Info Card */}
    <div className="bg-white rounded-3xl p-8 border border-outline-variant/10 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-primary-container flex items-center justify-center text-on-primary-container font-black text-2xl">
          {user.displayName?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-on-surface">{user.displayName}</h3>
          <p className="text-on-surface-variant">{user.email}</p>
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

    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4 bg-surface-container-low rounded-3xl p-8 flex flex-col justify-between overflow-hidden relative">
        <div className="relative z-10">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <Share2 className="text-primary" size={30} />
          </div>
          <h3 className="text-2xl font-bold mb-2">Sync Engine</h3>
          <p className="text-on-surface-variant leading-relaxed">{lastSyncedAt ? `Continuous monitoring active. Last successful fetch was ${formatSyncTime(lastSyncedAt, false)}.` : 'Connect your Microsoft account to start monitoring Teams assignments.'}</p>
        </div>
        <div className="mt-12 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-semibold text-primary uppercase">API Uptime</span>
            <span className="text-[10px] font-bold text-on-surface">99.9%</span>
          </div>
          <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-tertiary w-[99%]"></div>
          </div>
        </div>
      </div>

      <div className="md:col-span-8 bg-white rounded-3xl p-8 relative overflow-hidden group">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold">Monitored Classes</h3>
            <p className="text-sm text-outline">{displayClasses.length} Active Educational Channel{displayClasses.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="text-primary font-bold text-sm flex items-center gap-1 hover:underline">
            Manage Sources <ChevronRight size={16} />
          </button>
        </div>
        <div className="space-y-4">
          {displayClasses.map((cls: any) => (
            <div key={cls.id} className="group/item flex items-center justify-between p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container-high transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-white rounded-xl flex items-center justify-center ${cls.color} font-bold shadow-sm`}>
                  {cls.code}
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">{cls.name}</h4>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Channel: {cls.channel}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="block text-xs font-bold text-on-surface">{cls.syncsToday} Syncs</span>
                  <span className="block text-[10px] text-outline uppercase tracking-wider">Today</span>
                </div>
                <MoreVertical className="text-outline opacity-0 group-hover/item:opacity-100 transition-opacity cursor-pointer" size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="md:col-span-7 bg-tertiary-container rounded-3xl p-8 flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h4 className="text-on-tertiary-container font-black text-4xl mb-1">142</h4>
          <p className="text-on-tertiary-container/60 text-[10px] font-bold uppercase tracking-widest">Extractions This Month</p>
        </div>
        <div className="w-32 h-32 absolute -right-4 -bottom-4 bg-tertiary-fixed opacity-20 rounded-full blur-3xl"></div>
        <RefreshCw className="text-8xl text-on-tertiary-container/10 absolute right-8 top-1/2 -translate-y-1/2" />
      </div>

      <div className="md:col-span-5 bg-primary-container rounded-3xl p-8 text-on-primary-container">
        <h4 className="text-xl font-bold mb-3 flex items-center gap-2">
          <Lightbulb size={24} />
          Optimization Tip
        </h4>
        <p className="text-on-primary-container/80 text-sm leading-relaxed mb-6">
          Connect your faculty dashboard to increase extraction accuracy for handwritten mathematical formulas by 40%.
        </p>
        <button className="bg-on-primary-container text-white px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform active:scale-95">
          Upgrade Sync
        </button>
      </div>
    </div>
  </motion.div>
);
};

const AssignmentDetailView = ({ onBack }: { onBack: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 50 }}
    className="max-w-6xl mx-auto space-y-12 pb-12"
  >
    <button
      onClick={onBack}
      className="flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all"
    >
      <ArrowRight className="rotate-180" size={20} />
      Back to Dashboard
    </button>

    <section className="relative overflow-hidden rounded-3xl bg-surface-container-low p-8 md:p-16">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
        <img
          alt="Renaissance Artwork"
          className="object-cover w-full h-full"
          src="https://picsum.photos/seed/renaissance/800/800"
          referrerPolicy="no-referrer"
        />
      </div>
      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <span className="px-4 py-1.5 rounded-full bg-primary-container/20 text-on-primary-container text-[10px] font-bold uppercase tracking-widest border border-primary-container/30">Art History 402</span>
          <span className="text-on-surface-variant text-sm font-medium">Due October 24, 2023</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-on-surface tracking-tighter leading-tight mb-6">
          Comparative Analysis: Renaissance Aesthetics
        </h1>
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-primary" size={24} />
            <span className="font-bold text-xl">100 <span className="text-sm font-normal text-on-surface-variant">Points</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Timer className="text-primary" size={24} />
            <span className="font-bold text-xl">2 <span className="text-sm font-normal text-on-surface-variant">Weeks Left</span></span>
          </div>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
      <div className="md:col-span-8 space-y-8">
        <div className="bg-white rounded-3xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-on-surface">Assignment Description</h2>
          <p className="text-lg leading-relaxed text-on-surface-variant mb-6">
            This curated module invites students to explore the intersection of humanism and visual representation during the 15th and 16th centuries. You are required to select two works—one Northern Renaissance and one Italian Renaissance—to analyze their structural composition, lighting, and theological undertones.
          </p>
          <div className="p-6 rounded-xl bg-surface-container-low border-l-4 border-primary">
            <p className="text-on-primary-container font-medium italic">
              &quot;Art is the handmaid of philosophy, but the master of the eye.&quot;
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Task Module: Industrial Revolution Project</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Urban Transformation', desc: 'Analyze the shift from agrarian landscapes to industrial hubs through architectural sketches.', icon: Factory },
              { title: 'Social Hierarchy', desc: 'Documentary research on labor conditions and the emergence of the middle class.', icon: Users }
            ].map((task, i) => (
              <div key={i} className="bg-surface-container-low p-6 rounded-3xl hover:bg-surface-container-high transition-colors cursor-pointer group">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <task.icon className="text-tertiary" size={24} />
                </div>
                <h3 className="font-bold text-on-surface mb-2">{task.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{task.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-4 space-y-6">
        <div className="bg-surface-container-high p-8 rounded-3xl flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-md">
            <Share2 className="text-[#4c6ef5]" size={32} />
          </div>
          <h3 className="text-xl font-bold mb-2">Collaboration Hub</h3>
          <p className="text-sm text-on-surface-variant mb-8">Access shared documents and class discussions for this assignment.</p>
          <button className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-full shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
            Open in Microsoft Teams
            <ExternalLink size={16} />
          </button>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-outline-variant/10">
          <div className="flex justify-between items-end mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-tertiary">Progress Tracker</span>
            <span className="text-2xl font-bold text-on-surface">65%</span>
          </div>
          <div className="h-3 w-full bg-tertiary-container rounded-full overflow-hidden">
            <div className="h-full bg-tertiary w-[65%] rounded-full"></div>
          </div>
          <p className="mt-4 text-[10px] text-on-surface-variant leading-relaxed">3 of 5 research milestones completed. Keep going!</p>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest px-4 text-on-surface-variant">Helpful Resources</h4>
          <div className="bg-white p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-low transition-colors cursor-pointer border border-transparent hover:border-outline-variant/20">
            <div className="p-2 bg-secondary-container/30 rounded-lg text-secondary">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-sm font-bold">Grading Rubric.pdf</p>
              <p className="text-[10px] text-on-surface-variant">2.4 MB • Updated Yesterday</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
);

// --- Auth Loading Screen ---

function AuthLoading() {
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
          className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-xl shadow-primary/20"
        >
          <Sparkles size={24} />
        </motion.div>
        <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Loading</p>
      </motion.div>
    </div>
  );
}

// --- Main App ---

export default function App() {
  const { user, isAuthenticated, isLoading, logout, msalAccount } = useAuth();
  const { assignments, classes, events, isSyncing, lastSyncedAt, sync } = useSync();
  const [view, setView] = useState<View>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (isLoading) {
    return <AuthLoading />;
  }

  if (!isAuthenticated || !user) {
    return <AuthForms />;
  }

  const renderView = () => {
    switch (view) {
      case 'home': return <DashboardView onAssignmentClick={() => setView('assignment')} user={user} onSync={sync} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} />;
      case 'tasks': return <TasksView assignments={assignments} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} />;
      case 'calendar': return <CalendarView events={events} />;
      case 'profile': return <ProfileView user={user} onLogout={logout} classes={classes} onSync={sync} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} />;
      case 'assignment': return <AssignmentDetailView onBack={() => setView('home')} />;
      default: return <DashboardView onAssignmentClick={() => setView('assignment')} user={user} onSync={sync} isSyncing={isSyncing} lastSyncedAt={lastSyncedAt} />;
    }
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary/20">
      <Header
        currentView={view === 'assignment' ? 'Current Assignment' : view.toUpperCase()}
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

      {view !== 'assignment' && <FAB />}

      {/* Simple Sidebar Overlay */}
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
                <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <Sparkles size={24} />
                </div>
                <h2 className="text-2xl font-black">The Atelier</h2>
                <p className="text-xs text-on-surface-variant mt-1">{user.email}</p>
              </div>
              <div className="space-y-2 flex-1">
                {['Dashboard', 'Assignments', 'Resources', 'Settings'].map(item => (
                  <button
                    key={item}
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-left px-4 py-3 text-lg font-bold text-on-surface hover:text-primary hover:bg-surface-container-low rounded-2xl transition-colors"
                  >
                    {item}
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
