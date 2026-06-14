import type { ChannelPost } from '../types';

const AI_CACHE_KEY = 'sparkdo_ai_analysis_cache';
const CACHE_VERSION = 1;

export interface AICache {
  version: number;
  generatedAt: string;
  userId: string;
  assignments: any[];
  classes: any[];
  calendarEvents: any[];
  posts: ChannelPost[];
  summary: AISummaryCache;
}

export interface AISummaryCache {
  today: any[];
  upcoming: any[];
  crossSubject: any;
  recentActivities: any[];
}

export function getAICache(): AICache | null {
  try {
    const raw = localStorage.getItem(AI_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AICache;
    if (parsed.version !== CACHE_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAICache(cache: Omit<AICache, 'version'>) {
  localStorage.setItem(AI_CACHE_KEY, JSON.stringify({ ...cache, version: CACHE_VERSION }));
}

export function clearAICache() {
  localStorage.removeItem(AI_CACHE_KEY);
}
