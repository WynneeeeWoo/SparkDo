import { fetchLocalHomework, type LocalSyncPayload } from './localDataSource';
import type { ChannelPost } from '../types';

const LOCAL_SYNC_CACHE_KEY = 'sparkdo_local_sync_cache';
const CACHE_VERSION = 1;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface LocalSyncCache {
  version: number;
  timestamp: string;
  assignments: any[];
  classes: any[];
  teams: any[];
  calendarEvents: any[];
  posts: ChannelPost[];
}

function getCache(): LocalSyncCache | null {
  try {
    const raw = localStorage.getItem(LOCAL_SYNC_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalSyncCache;
    if (parsed.version !== CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(cache: LocalSyncCache) {
  localStorage.setItem(LOCAL_SYNC_CACHE_KEY, JSON.stringify(cache));
}

export function clearLocalCache() {
  localStorage.removeItem(LOCAL_SYNC_CACHE_KEY);
}

export function isLocalCacheFresh(): boolean {
  const cache = getCache();
  if (!cache) return false;
  const age = Date.now() - new Date(cache.timestamp).getTime();
  return age < CACHE_TTL_MS;
}

export function getCachedLocalAssignments(): any[] {
  return getCache()?.assignments ?? [];
}

export function getCachedLocalClasses(): any[] {
  return getCache()?.classes ?? [];
}

export function getCachedLocalTeams(): any[] {
  return getCache()?.teams ?? [];
}

export function getCachedLocalCalendarEvents(): any[] {
  return getCache()?.calendarEvents ?? [];
}

export function getCachedLocalPosts(): ChannelPost[] {
  return getCache()?.posts ?? [];
}

export function getLocalLastSyncedAt(): string | null {
  return getCache()?.timestamp ?? null;
}

export interface LocalSyncResult {
  success: boolean;
  assignments: any[];
  classes: any[];
  teams: any[];
  calendarEvents: any[];
  posts: ChannelPost[];
  error?: string;
}

export async function syncAllLocal(userId: string): Promise<LocalSyncResult> {
  const result: LocalSyncResult = {
    success: true,
    assignments: [],
    classes: [],
    teams: [],
    calendarEvents: [],
    posts: [],
  };

  try {
    const payload = await fetchLocalHomework(userId);

    result.assignments = payload.assignments ?? [];
    result.classes = payload.classes ?? [];
    result.teams = payload.teams ?? [];
    result.calendarEvents = payload.calendarEvents ?? [];
    result.posts = payload.posts ?? [];

    saveCache({
      version: CACHE_VERSION,
      timestamp: new Date().toISOString(),
      assignments: result.assignments,
      classes: result.classes,
      teams: result.teams,
      calendarEvents: result.calendarEvents,
      posts: result.posts,
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      assignments: [],
      classes: [],
      teams: [],
      calendarEvents: [],
      posts: [],
      error: err?.message || 'Local folder sync failed.',
    };
  }
}
