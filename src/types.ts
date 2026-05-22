export type View = 'home' | 'tasks' | 'calendar' | 'profile' | 'assignment';

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
