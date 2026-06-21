import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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
import {
  syncAllLocal,
  clearLocalCache,
  isLocalCacheFresh,
  getCachedLocalAssignments,
  getCachedLocalClasses,
  getCachedLocalTeams,
  getCachedLocalCalendarEvents,
  getCachedLocalPosts,
  getLocalLastSyncedAt,
} from '../services/localSync';
import { analyzeFiles } from '../services/aiAnalyzer';
import { getAICache, saveAICache, clearAICache } from '../services/aiAnalysisCache';
import {
  getAssignmentOverrides,
  saveAssignmentOverrides,
  clearAssignmentOverrides,
  applyAssignmentOverrides,
} from '../services/assignmentOverrides';
import type {
  SyncedAssignment,
  SyncedClass,
  SyncedEvent,
  SyncState,
  ChannelPost,
  AISummaryCache,
} from '../types';

interface SyncContextValue extends SyncState {
  sync: () => Promise<void>;
  clear: () => void;
  analyze: () => Promise<void>;
  toggleAssignment: (id: string) => void;
  source: 'teams' | 'local' | 'none';
  localUserId: string | null;
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

function mapPosts(raw: any[]): ChannelPost[] {
  return raw.map((p) => ({
    id: p.id,
    subject: p.subject || 'Untitled Post',
    content: p.content || '',
    className: p.className || 'General',
    postedAt: p.postedAt || new Date().toISOString(),
    author: p.author,
    attachments: p.attachments || [],
  }));
}

function stripHtml(html: string): string {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function getLocalUserId(): string | null {
  try {
    return (import.meta.env.VITE_LOCAL_USER_ID as string) || null;
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of base) map.set(item.id, item);
  for (const item of extra) map.set(item.id, item);
  return Array.from(map.values());
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { msalAccount, isAuthenticated } = useAuth();
  const localUserId = useMemo(() => getLocalUserId(), []);
  const isLocalMode = Boolean(localUserId);

  const [folderAssignments, setFolderAssignments] = useState<SyncedAssignment[]>([]);
  const [folderClasses, setFolderClasses] = useState<SyncedClass[]>([]);
  const [folderEvents, setFolderEvents] = useState<SyncedEvent[]>([]);
  const [folderPosts, setFolderPosts] = useState<ChannelPost[]>([]);

  const [aiAssignmentsRaw, setAiAssignmentsRaw] = useState<SyncedAssignment[]>([]);
  const [aiClassesRaw, setAiClassesRaw] = useState<SyncedClass[]>([]);
  const [aiEventsRaw, setAiEventsRaw] = useState<SyncedEvent[]>([]);
  const [aiPostsRaw, setAiPostsRaw] = useState<ChannelPost[]>([]);
  const [aiSummary, setAiSummary] = useState<AISummaryCache | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOfflineState, setIsOfflineState] = useState(isOffline());
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() =>
    isLocalMode ? getLocalLastSyncedAt() : getLastSyncedAt()
  );
  const [error, setError] = useState<string | null>(null);
  const [assignmentOverrides, setAssignmentOverrides] = useState<Record<string, boolean>>(() =>
    getAssignmentOverrides()
  );

  // Hydrate folder cache on mount
  useEffect(() => {
    if (isLocalMode) {
      const cachedAssignments = getCachedLocalAssignments();
      const cachedClasses = getCachedLocalClasses();
      const cachedEvents = getCachedLocalCalendarEvents();
      const cachedPosts = getCachedLocalPosts();

      if (cachedAssignments.length) setFolderAssignments(mapAssignments(cachedAssignments));
      if (cachedClasses.length) setFolderClasses(mapClasses(cachedClasses));
      if (cachedEvents.length) setFolderEvents(mapEvents(cachedEvents));
      if (cachedPosts.length) setFolderPosts(mapPosts(cachedPosts));
    } else {
      const cachedAssignments = getCachedAssignments();
      const cachedClasses = getCachedClasses();
      const cachedEvents = getCachedCalendarEvents();

      if (cachedAssignments.length) setFolderAssignments(mapAssignments(cachedAssignments));
      if (cachedClasses.length) setFolderClasses(mapClasses(cachedClasses));
      if (cachedEvents.length) setFolderEvents(mapEvents(cachedEvents));
    }
  }, [isLocalMode]);

  // Hydrate AI cache on mount
  useEffect(() => {
    const cache = getAICache();
    if (!cache) return;

    if (cache.assignments?.length) setAiAssignmentsRaw(mapAssignments(cache.assignments));
    if (cache.classes?.length) setAiClassesRaw(mapClasses(cache.classes));
    if (cache.calendarEvents?.length) setAiEventsRaw(mapEvents(cache.calendarEvents));
    if (cache.posts?.length) setAiPostsRaw(mapPosts(cache.posts));
    if (cache.summary) setAiSummary(cache.summary);
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

  // Auto-sync when MSAL account becomes available (Teams mode)
  useEffect(() => {
    if (!isLocalMode && msalAccount && isAuthenticated && !isCacheFresh() && !isOfflineState) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msalAccount, isAuthenticated, isLocalMode]);

  // Auto-sync on mount when using local folders and cache is stale
  useEffect(() => {
    if (isLocalMode && !isLocalCacheFresh() && !isOfflineState) {
      sync();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocalMode]);

  const sync = useCallback(async () => {
    if (isLocalMode) {
      if (!localUserId) {
        setError('Local user is not configured. Set VITE_LOCAL_USER_ID in your environment.');
        return;
      }

      setIsSyncing(true);
      setError(null);

      try {
        const result = await syncAllLocal(localUserId);

        if (result.success || result.assignments.length > 0) {
          setFolderAssignments(mapAssignments(result.assignments));
          setFolderClasses(mapClasses(result.classes));
          setFolderEvents(mapEvents(result.calendarEvents));
          setFolderPosts(mapPosts(result.posts));
          setLastSyncedAt(new Date().toISOString());
        }

        if (!result.success && result.error) {
          setError(result.error);
        }
      } catch (err: any) {
        setError(err?.message || 'Local sync failed.');
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    // Microsoft Teams Graph sync
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
        setFolderAssignments(mapAssignments(result.assignments));
        setFolderClasses(mapClasses(result.classes));
        setFolderEvents(mapEvents(result.calendarEvents));
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
  }, [isLocalMode, localUserId, msalAccount, isOfflineState]);

  const analyze = useCallback(async () => {
    if (!localUserId) {
      setError('Local user is not configured. Set VITE_LOCAL_USER_ID in your environment.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await analyzeFiles(localUserId);

      if (response.syncPayload) {
        const mappedAssignments = mapAssignments(response.syncPayload.assignments ?? []);
        const mappedClasses = mapClasses(response.syncPayload.classes ?? []);
        const mappedEvents = mapEvents(response.syncPayload.calendarEvents ?? []);
        const mappedPosts = mapPosts(response.syncPayload.posts ?? []);

        setAiAssignmentsRaw(mappedAssignments);
        setAiClassesRaw(mappedClasses);
        setAiEventsRaw(mappedEvents);
        setAiPostsRaw(mappedPosts);

        saveAICache({
          generatedAt: response.generatedAt,
          userId: localUserId,
          assignments: response.syncPayload.assignments ?? [],
          classes: response.syncPayload.classes ?? [],
          calendarEvents: response.syncPayload.calendarEvents ?? [],
          posts: response.syncPayload.posts ?? [],
          summary: response.summary,
        });
      }

      setAiSummary(response.summary ?? null);
    } catch (err: any) {
      setError(err?.message || 'File analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [localUserId]);

  const clear = useCallback(() => {
    if (isLocalMode) {
      clearLocalCache();
    } else {
      clearCache();
    }
    clearAICache();
    clearAssignmentOverrides();
    setFolderAssignments([]);
    setFolderClasses([]);
    setFolderEvents([]);
    setFolderPosts([]);
    setAiAssignmentsRaw([]);
    setAiClassesRaw([]);
    setAiEventsRaw([]);
    setAiPostsRaw([]);
    setAiSummary(null);
    setAssignmentOverrides({});
    setLastSyncedAt(null);
    setError(null);
  }, [isLocalMode]);

  const toggleAssignment = useCallback((id: string) => {
    setAssignmentOverrides((prev) => {
      const current = prev[id] ?? false;
      const next = { ...prev, [id]: !current };
      saveAssignmentOverrides(next);
      return next;
    });
  }, []);

  const assignments = useMemo(
    () => applyAssignmentOverrides(mergeById<SyncedAssignment>(folderAssignments, aiAssignmentsRaw), assignmentOverrides),
    [folderAssignments, aiAssignmentsRaw, assignmentOverrides]
  );
  const classes = useMemo(() => mergeById(folderClasses, aiClassesRaw), [folderClasses, aiClassesRaw]);
  const events = useMemo(() => mergeById(folderEvents, aiEventsRaw), [folderEvents, aiEventsRaw]);
  const posts = useMemo(() => mergeById(folderPosts, aiPostsRaw), [folderPosts, aiPostsRaw]);

  const source: SyncContextValue['source'] = isLocalMode ? 'local' : msalAccount ? 'teams' : 'none';

  return (
    <SyncContext.Provider
      value={{
        assignments,
        classes,
        events,
        posts,
        aiAssignments: aiAssignmentsRaw,
        aiEvents: aiEventsRaw,
        aiPosts: aiPostsRaw,
        aiSummary,
        isSyncing,
        isAnalyzing,
        isOffline: isOfflineState,
        lastSyncedAt,
        error,
        sync,
        clear,
        analyze,
        toggleAssignment,
        source,
        localUserId,
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
