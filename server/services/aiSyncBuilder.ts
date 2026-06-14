import type { AIAnalysisResult, AIAssignment, AIActivity } from './llmAnalyzer';

export interface GraphAssignment {
  id: string;
  displayName: string;
  instructions?: { content: string; contentType: 'text' | 'html' };
  assignedDateTime?: string;
  dueDateTime?: string;
  status?: string;
  maxPoints?: number;
  className?: string;
  classId?: string;
}

export interface GraphClass {
  id: string;
  displayName: string;
  description?: string;
  mailNickname?: string;
}

export interface GraphEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
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

export interface AISyncPayload {
  assignments: GraphAssignment[];
  classes: GraphClass[];
  teams: any[];
  calendarEvents: GraphEvent[];
  posts: ChannelPost[];
}

function toClassId(className: string): string {
  return className.toLowerCase().replace(/\s+/g, '-');
}

function assignmentToGraph(a: AIAssignment): GraphAssignment {
  return {
    id: a.id,
    displayName: a.title,
    instructions: { content: a.content, contentType: 'text' },
    assignedDateTime: a.assignedDateTime || new Date().toISOString(),
    dueDateTime: a.dueDateTime,
    status: a.status || 'assigned',
    maxPoints: a.maxPoints,
    className: a.className,
    classId: toClassId(a.className),
  };
}

function assignmentToEvent(a: AIAssignment): GraphEvent | null {
  if (!a.dueDateTime) return null;
  return {
    id: `evt-${a.id}`,
    subject: `Due: ${a.title}`,
    start: { dateTime: a.dueDateTime, timeZone: 'Asia/Shanghai' },
    end: { dateTime: a.dueDateTime, timeZone: 'Asia/Shanghai' },
    bodyPreview: a.content,
  };
}

function activityToPost(a: AIActivity): ChannelPost {
  return {
    id: a.id,
    subject: a.subject,
    content: a.content,
    className: a.className,
    postedAt: a.postedAt || new Date().toISOString(),
    author: a.author,
    attachments: a.attachments || [],
  };
}

export function buildAISyncPayload(result: AIAnalysisResult): AISyncPayload {
  const assignments: GraphAssignment[] = [];
  const calendarEvents: GraphEvent[] = [];
  const classNames = new Set<string>();

  for (const a of [...result.today, ...result.upcoming]) {
    if (!a.id || !a.title || !a.className) continue;
    assignments.push(assignmentToGraph(a));
    classNames.add(a.className);

    const evt = assignmentToEvent(a);
    if (evt) calendarEvents.push(evt);
  }

  const classes: GraphClass[] = Array.from(classNames).map((name) => ({
    id: toClassId(name),
    displayName: name,
    description: `AI-detected class ${name}`,
    mailNickname: toClassId(name),
  }));

  const posts: ChannelPost[] = result.recentActivities
    .filter((a) => a.id && a.subject && a.className)
    .map(activityToPost);

  return { assignments, classes, teams: [], calendarEvents, posts };
}
