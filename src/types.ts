export type View = 'tasks' | 'calendar' | 'profile';

export interface Task {
  id: string;
  title: string;
  description: string;
  dueTime: string;
  priority: 'urgent' | 'high' | 'standard' | 'pending';
  completed: boolean;
  tags?: string[];
  attachments?: number;
  group?: string;
}

export interface Deadline {
  id: string;
  date: string;
  month: string;
  day: string;
  title: string;
  course: string;
  type: 'critical' | 'normal' | 'low';
}

export interface MonitoredClass {
  id: string;
  code: string;
  name: string;
  channel: string;
  syncsToday: number;
  color: string;
}

// --- Auth Types ---

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export type AuthView = 'login' | 'register' | 'forgot';

// --- Sync Types ---

export interface SyncedAssignment {
  id: string;
  title: string;
  description: string;
  dueDateTime: string;
  assignedDateTime?: string;
  priority: 'urgent' | 'high' | 'standard' | 'pending';
  completed: boolean;
  className?: string;
  classId?: string;
  status?: string;
  maxPoints?: number;
  attachments?: string[];
}

export interface SyncedClass {
  id: string;
  code: string;
  name: string;
  channel: string;
  syncsToday: number;
  color: string;
}

export interface SyncedEvent {
  id: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  bodyPreview?: string;
}

export interface ChannelPost {
  id: string;
  subject: string;
  content: string;
  className: string;
  postedAt: string;
  author?: string;
  attachments: string[];
}

export interface AISummaryCache {
  today: any[];
  upcoming: any[];
  crossSubject: any;
  recentActivities: any[];
}

export interface SyncState {
  assignments: SyncedAssignment[];
  classes: SyncedClass[];
  events: SyncedEvent[];
  posts: ChannelPost[];
  aiAssignments: SyncedAssignment[];
  aiEvents: SyncedEvent[];
  aiPosts: ChannelPost[];
  aiSummary: AISummaryCache | null;
  isSyncing: boolean;
  isAnalyzing: boolean;
  isOffline: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}
