import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
  syncAll,
  clearCache,
  isCacheFresh,
  isOffline,
  getCachedAssignments,
  getCachedClasses,
  getCachedTeams,
  getCachedCalendarEvents,
  getLastSyncedAt,
} from '../services/teamsSync';
import type {
  SyncedAssignment,
  SyncedClass,
  SyncedEvent,
  SyncState,
} from '../types';

interface SyncContextValue extends SyncState {
  sync: () => Promise<void>;
  clear: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

function mapAssignments(raw: any[]): SyncedAssignment[] {
  return raw.map((a) => {
    const due = a.dueDateTime ? new Date(a.dueDateTime) : null;
    const now = new Date();
    const hoursUntilDue = due ? (due.getTime() - now.getTime()) / (1000 * 60 * 60) : Infinity;

    let priority: SyncedAssignment['priority'] = 'standard';
    if (hoursUntilDue <= 48) priority = 'urgent';
    else if (hoursUntilDue <= 168) priority = 'high'; // 1 week
    else if (!due) priority = 'pending';

    return {
      id: a.id,
      title: a.displayName || 'Untitled Assignment',
      description: a.instructions?.content
        ? stripHtml(a.instructions.content)
        : 'No description provided.',
      dueDateTime: a.dueDateTime || '',
      assignedDateTime: a.assignedDateTime,
      priority,
      completed: a.status === 'completed' || a.status === 'turnedIn',
      className: a.className || a.classId,
      classId: a.classId,
      status: a.status,
      maxPoints: a.maxPoints,
    };
  });
}

function mapClasses(raw: any[]): SyncedClass[] {
  const colors = ['text-primary', 'text-tertiary', 'text-secondary'];
  return raw.map((c, i) => ({
    id: c.id,
    code: c.mailNickname?.slice(0, 2).toUpperCase() || c.displayName?.slice(0, 2).toUpperCase() || 'CL',
    name: c.displayName || 'Unnamed Class',
    channel: c.mailNickname || 'general',
    syncsToday: Math.floor(Math.random() * 15),
    color: colors[i % colors.length],
  }));
}

function mapEvents(raw: any[]): SyncedEvent[] {
  return raw.map((e) => ({
    id: e.id,
    subject: e.subject || 'Untitled Event',
    startDateTime: e.start?.dateTime || '',
    endDateTime: e.end?.dateTime || '',
    bodyPreview: e.bodyPreview,
  }));
}

function stripHtml(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { msalAccount, isAuthenticated } = useAuth();

  const [assignments, setAssignments] = useState<SyncedAssignment[]>([]);
  const [classes, setClasses] = useState<SyncedClass[]>([]);
  const [events, setEvents] = useState<SyncedEvent[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOfflineState, setIsOfflineState] = useState(isOffline());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(getLastSyncedAt());
  const [error, setError] = useState<string | null>(null);

  // Hydrate from cache on mount
  useEffect(() => {
    const cachedAssignments = getCachedAssignments();
    const cachedClasses = getCachedClasses();
    const cachedEvents = getCachedCalendarEvents();

    if (cachedAssignments.length) setAssignments(mapAssignments(cachedAssignments));
    if (cachedClasses.length) setClasses(mapClasses(cachedClasses));
    if (cachedEvents.length) setEvents(mapEvents(cachedEvents));
  }, []);

  // Listen for online/offline
  useEffect(() => {
    const handleOnline = () => setIsOfflineState(false);
    const handleOffline = () => setIsOfflineState(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when MSAL account becomes available
  useEffect(() => {
    if (msalAccount && isAuthenticated && !isCacheFresh() && !isOfflineState) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msalAccount, isAuthenticated]);

  const sync = useCallback(async () => {
    if (!msalAccount) {
      setError('Microsoft account not connected. Please sign in with Microsoft.');
      return;
    }
    if (isOfflineState) {
      setError('You are offline. Using cached data.');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const result = await syncAll(msalAccount);

      if (result.success || result.assignments.length > 0) {
        setAssignments(mapAssignments(result.assignments));
        setClasses(mapClasses(result.classes));
        setEvents(mapEvents(result.calendarEvents));
        setLastSyncedAt(new Date().toISOString());
      }

      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Sync failed.');
    } finally {
      setIsSyncing(false);
    }
  }, [msalAccount, isOfflineState]);

  const clear = useCallback(() => {
    clearCache();
    setAssignments([]);
    setClasses([]);
    setEvents([]);
    setLastSyncedAt(null);
    setError(null);
  }, []);

  return (
    <SyncContext.Provider
      value={{
        assignments,
        classes,
        events,
        isSyncing,
        isOffline: isOfflineState,
        lastSyncedAt,
        error,
        sync,
        clear,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return ctx;
}
