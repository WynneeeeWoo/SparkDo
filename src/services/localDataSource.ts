import type { ChannelPost } from '../types';

export interface LocalSyncPayload {
  assignments: any[];
  classes: any[];
  teams: any[];
  calendarEvents: any[];
  posts: ChannelPost[];
}

export class LocalDataSourceError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'LocalDataSourceError';
  }
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    let message = `Local API error: ${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore
    }
    throw new LocalDataSourceError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export function fetchLocalHomework(userId: string): Promise<LocalSyncPayload> {
  return apiFetch<LocalSyncPayload>(`/api/homework/${encodeURIComponent(userId)}`);
}

export function fetchLocalSubject(userId: string, subject: string): Promise<LocalSyncPayload> {
  return apiFetch<LocalSyncPayload>(`/api/homework/${encodeURIComponent(userId)}/${encodeURIComponent(subject)}`);
}

export function fetchLocalSummary(
  userId: string,
  kind: 'today' | 'upcoming' | 'cross-subject'
): Promise<any> {
  return apiFetch(`/api/homework/${encodeURIComponent(userId)}/summary/${kind}`);
}

export function listLocalUsers(): Promise<string[]> {
  return apiFetch<string[]>('/api/users');
}
