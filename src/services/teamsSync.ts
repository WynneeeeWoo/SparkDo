import type { AccountInfo } from '@azure/msal-browser';
import {
  getEducationAssignments,
  getEducationClasses,
  getJoinedTeams,
  getCalendarEvents,
  type GraphAssignment,
  type GraphTeam,
  type GraphEvent,
} from './graphApi';

const SYNC_CACHE_KEY = 'sparkdo_sync_cache';
const CACHE_VERSION = 2;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface SyncCache {
  version: number;
  timestamp: string;
  assignments: GraphAssignment[];
  classes: GraphClass[];
  teams: GraphTeam[];
  calendarEvents: GraphEvent[];
}

interface GraphClass {
  id: string;
  displayName?: string;
  description?: string;
  mailNickname?: string;
}

function getCache(): SyncCache | null {
  try {
    const raw = localStorage.getItem(SYNC_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncCache;
    if (parsed.version !== CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCache(cache: SyncCache) {
  localStorage.setItem(SYNC_CACHE_KEY, JSON.stringify(cache));
}

export function clearCache() {
  localStorage.removeItem(SYNC_CACHE_KEY);
}

export function isCacheFresh(): boolean {
  const cache = getCache();
  if (!cache) return false;
  const age = Date.now() - new Date(cache.timestamp).getTime();
  return age < CACHE_TTL_MS;
}

export function getCachedAssignments(): GraphAssignment[] {
  return getCache()?.assignments ?? [];
}

export function getCachedClasses(): GraphClass[] {
  return getCache()?.classes ?? [];
}

export function getCachedTeams(): GraphTeam[] {
  return getCache()?.teams ?? [];
}

export function getCachedCalendarEvents(): GraphEvent[] {
  return getCache()?.calendarEvents ?? [];
}

export function getLastSyncedAt(): string | null {
  return getCache()?.timestamp ?? null;
}

export interface SyncResult {
  success: boolean;
  assignments: GraphAssignment[];
  classes: GraphClass[];
  teams: GraphTeam[];
  calendarEvents: GraphEvent[];
  error?: string;
}

export async function syncAll(account: AccountInfo): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    assignments: [],
    classes: [],
    teams: [],
    calendarEvents: [],
  };

  try {
    const [assignmentsRes, classesRes, teamsRes, calendarRes] = await Promise.allSettled([
      getEducationAssignments(account),
      getEducationClasses(account),
      getJoinedTeams(account),
      getCalendarEvents(account),
    ]);

    if (assignmentsRes.status === 'fulfilled') {
      result.assignments = assignmentsRes.value?.value ?? [];
    }
    if (classesRes.status === 'fulfilled') {
      result.classes = classesRes.value?.value ?? [];
    }
    if (teamsRes.status === 'fulfilled') {
      result.teams = teamsRes.value?.value ?? [];
    }
    if (calendarRes.status === 'fulfilled') {
      result.calendarEvents = calendarRes.value?.value ?? [];
    }

    // Collect errors
    const errors: string[] = [];
    if (assignmentsRes.status === 'rejected') errors.push('Assignments: ' + assignmentsRes.reason?.message);
    if (classesRes.status === 'rejected') errors.push('Classes: ' + classesRes.reason?.message);
    if (teamsRes.status === 'rejected') errors.push('Teams: ' + teamsRes.reason?.message);
    if (calendarRes.status === 'rejected') errors.push('Calendar: ' + calendarRes.reason?.message);

    if (errors.length > 0 && result.assignments.length === 0 && result.classes.length === 0) {
      result.success = false;
      result.error = errors.join('; ');
    }

    // Save to cache even if partially successful
    saveCache({
      version: CACHE_VERSION,
      timestamp: new Date().toISOString(),
      assignments: result.assignments,
      classes: result.classes,
      teams: result.teams,
      calendarEvents: result.calendarEvents,
    });

    return result;
  } catch (err: any) {
    return {
      success: false,
      assignments: [],
      classes: [],
      teams: [],
      calendarEvents: [],
      error: err?.message || 'Sync failed due to network error.',
    };
  }
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}
