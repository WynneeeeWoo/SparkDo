import type { ChannelPost } from '../types';

export interface AISummary {
  generatedAt: string;
  sourceFiles: { subject: string; fileName: string; error?: string }[];
  today: AIAnalyzedAssignment[];
  upcoming: AIAnalyzedAssignment[];
  crossSubject: AICrossSubject;
  recentActivities: AIAnalyzedActivity[];
}

export interface AIAnalyzedAssignment {
  id: string;
  title: string;
  content: string;
  className: string;
  dueDateTime: string;
  assignedDateTime?: string;
  status?: string;
  maxPoints?: number;
}

export interface AICrossSubject {
  totalAssignments: number;
  completed: number;
  overdue: number;
  bySubject: Record<string, number>;
}

export interface AIAnalyzedActivity {
  id: string;
  subject: string;
  content: string;
  className: string;
  postedAt: string;
  author?: string;
  attachments?: string[];
}

export interface AIAnalyzeResponse {
  success: boolean;
  generatedAt: string;
  sourceFiles: { subject: string; fileName: string; error?: string }[];
  summary: AISummary;
  syncPayload: {
    assignments: any[];
    classes: any[];
    teams: any[];
    calendarEvents: any[];
    posts: ChannelPost[];
  };
}

export async function analyzeFiles(userId: string): Promise<AIAnalyzeResponse> {
  const res = await fetch(`/api/analyze/${encodeURIComponent(userId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || `Analysis failed: ${res.status}`);
  }
  return body as AIAnalyzeResponse;
}
