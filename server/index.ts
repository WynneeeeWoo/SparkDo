import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractFilesForUser } from './services/fileExtractor';
import { analyzeFilesWithKimi } from './services/kimiAnalyzer';
import { writeSummary } from './services/summaryWriter';
import { buildAISyncPayload } from './services/aiSyncBuilder';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.LOCAL_API_PORT ? Number(process.env.LOCAL_API_PORT) : 3001;
const DATA_ROOT = path.resolve(__dirname, '../data/homework');

app.use(express.json());

// Allow the Vite dev server to reach the API directly if needed.
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface LocalPost {
  id: string;
  type: 'assignment' | 'post';
  title: string;
  content: string;
  assignedDateTime?: string;
  dueDateTime?: string;
  status?: string;
  maxPoints?: number;
  postedAt?: string;
  author?: string;
  attachments?: string[];
}

interface LocalSubject {
  subject: string;
  description?: string;
  posts: LocalPost[];
}

interface GraphAssignment {
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

interface GraphClass {
  id: string;
  displayName: string;
  description?: string;
  mailNickname?: string;
}

interface GraphEvent {
  id: string;
  subject: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  bodyPreview?: string;
}

interface ChannelPost {
  id: string;
  subject: string;
  content: string;
  className: string;
  postedAt: string;
  author?: string;
  attachments: string[];
}

interface SyncPayload {
  assignments: GraphAssignment[];
  classes: GraphClass[];
  teams: any[];
  calendarEvents: GraphEvent[];
  posts: ChannelPost[];
}

async function readSubject(userId: string, subjectName: string): Promise<LocalSubject | null> {
  const subjectDir = path.join(DATA_ROOT, userId, subjectName);
  try {
    await fs.access(subjectDir);
  } catch {
    return null;
  }

  const postsPath = path.join(subjectDir, 'posts.json');
  let posts: LocalPost[] = [];
  let parsed: any = {};
  try {
    const raw = await fs.readFile(postsPath, 'utf-8');
    parsed = JSON.parse(raw);
    posts = Array.isArray(parsed.posts) ? parsed.posts : [];
  } catch {
    posts = [];
  }

  let description = parsed.description || '';
  try {
    description = await fs.readFile(path.join(subjectDir, 'Description.md'), 'utf-8');
  } catch {
    // keep parsed description
  }

  return { subject: subjectName, description, posts };
}

async function readAllSubjects(userId: string): Promise<LocalSubject[]> {
  const userDir = path.join(DATA_ROOT, userId);
  try {
    await fs.access(userDir);
  } catch {
    return [];
  }

  const entries = await fs.readdir(userDir, { withFileTypes: true });
  const subjects = entries
    .filter((e) => e.isDirectory() && e.name !== 'Summary')
    .map((e) => e.name);

  const results = await Promise.all(subjects.map((name) => readSubject(userId, name)));
  return results.filter((s): s is LocalSubject => s !== null);
}

function buildSyncPayload(subjects: LocalSubject[]): SyncPayload {
  const assignments: GraphAssignment[] = [];
  const classes: GraphClass[] = [];
  const calendarEvents: GraphEvent[] = [];
  const posts: ChannelPost[] = [];

  for (const subject of subjects) {
    const classId = subject.subject.toLowerCase().replace(/\s+/g, '-');

    classes.push({
      id: classId,
      displayName: subject.subject,
      description: subject.description,
      mailNickname: classId,
    });

    for (const post of subject.posts) {
      if (post.type === 'assignment') {
        const assignment: GraphAssignment = {
          id: post.id,
          displayName: post.title,
          instructions: { content: post.content, contentType: 'text' },
          assignedDateTime: post.assignedDateTime,
          dueDateTime: post.dueDateTime,
          status: post.status,
          maxPoints: post.maxPoints,
          className: subject.subject,
          classId,
        };
        assignments.push(assignment);

        if (post.dueDateTime) {
          calendarEvents.push({
            id: `evt-${post.id}`,
            subject: `Due: ${post.title}`,
            start: { dateTime: post.dueDateTime, timeZone: 'Asia/Shanghai' },
            end: { dateTime: post.dueDateTime, timeZone: 'Asia/Shanghai' },
            bodyPreview: post.content,
          });
        }
      } else {
        posts.push({
          id: post.id,
          subject: post.title,
          content: post.content,
          className: subject.subject,
          postedAt: post.postedAt || post.assignedDateTime || new Date().toISOString(),
          author: post.author,
          attachments: post.attachments || [],
        });
      }
    }
  }

  return { assignments, classes, teams: [], calendarEvents, posts };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dataRoot: DATA_ROOT });
});

app.get('/api/users', async (_req, res) => {
  try {
    await fs.access(DATA_ROOT);
  } catch {
    return res.json([]);
  }
  const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true });
  const users = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  res.json(users);
});

app.get('/api/homework/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const subjects = await readAllSubjects(userId);
  if (subjects.length === 0) {
    return res.status(404).json({ error: `No homework data found for user "${userId}"` });
  }
  res.json(buildSyncPayload(subjects));
});

app.get('/api/homework/:userId/:subject', async (req: Request, res: Response) => {
  const { userId, subject } = req.params;
  const data = await readSubject(userId, subject);
  if (!data) {
    return res.status(404).json({ error: `Subject "${subject}" not found for user "${userId}"` });
  }
  res.json(buildSyncPayload([data]));
});

app.get('/api/homework/:userId/summary/today', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const subjects = await readAllSubjects(userId);
  const payload = buildSyncPayload(subjects);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const todayAssignments = payload.assignments.filter((a) => {
    if (!a.dueDateTime) return false;
    const d = new Date(a.dueDateTime);
    return d >= today && d < tomorrow;
  });

  res.json({
    date: today.toISOString(),
    count: todayAssignments.length,
    assignments: todayAssignments,
  });
});

app.get('/api/homework/:userId/summary/upcoming', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const subjects = await readAllSubjects(userId);
  const payload = buildSyncPayload(subjects);

  const now = new Date();
  const upcoming = payload.assignments
    .filter((a) => a.dueDateTime && new Date(a.dueDateTime) >= now)
    .sort((a, b) => new Date(a.dueDateTime!).getTime() - new Date(b.dueDateTime!).getTime());

  res.json({
    count: upcoming.length,
    assignments: upcoming,
  });
});

app.get('/api/homework/:userId/summary/cross-subject', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const subjects = await readAllSubjects(userId);
  const payload = buildSyncPayload(subjects);

  const bySubject: Record<string, { assignments: number; posts: number }> = {};
  for (const cls of payload.classes) {
    bySubject[cls.displayName] = { assignments: 0, posts: 0 };
  }
  for (const a of payload.assignments) {
    const name = a.className || 'General';
    bySubject[name] = bySubject[name] || { assignments: 0, posts: 0 };
    bySubject[name].assignments += 1;
  }
  for (const p of payload.posts) {
    bySubject[p.className] = bySubject[p.className] || { assignments: 0, posts: 0 };
    bySubject[p.className].posts += 1;
  }

  const overdue = payload.assignments.filter((a) => {
    if (!a.dueDateTime || a.status === 'completed' || a.status === 'turnedIn') return false;
    return new Date(a.dueDateTime) < new Date();
  });

  res.json({
    totalAssignments: payload.assignments.length,
    totalPosts: payload.posts.length,
    completed: payload.assignments.filter((a) => a.status === 'completed' || a.status === 'turnedIn').length,
    overdue: overdue.length,
    overdueAssignments: overdue,
    bySubject,
  });
});

// Analyze all files in a user's subject folders with Kimi K2.6.
app.post('/api/analyze/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const files = await extractFilesForUser(userId, DATA_ROOT);
    const readableFiles = files.filter((f) => !f.error && f.text.trim().length > 0);

    if (readableFiles.length === 0) {
      return res.status(400).json({
        error: `No readable files found for user "${userId}". Add files to the subject Files folders first.`,
      });
    }

    const result = await analyzeFilesWithKimi(readableFiles);
    const summary = await writeSummary(userId, DATA_ROOT, result, files);
    const syncPayload = buildAISyncPayload(result);

    res.json({
      success: true,
      generatedAt: summary.generatedAt,
      sourceFiles: summary.sourceFiles,
      summary: {
        today: summary.today,
        upcoming: summary.upcoming,
        crossSubject: summary.crossSubject,
        recentActivities: summary.recentActivities,
      },
      syncPayload,
    });
  } catch (err: any) {
    console.error('[Analyze error]', err);
    res.status(500).json({
      error: err?.message || 'Analysis failed.',
    });
  }
});

// Serve attachment files from each subject's Files folder.
app.get('/api/files/:userId/:subject/:filename', async (req: Request, res: Response) => {
  const { userId, subject, filename } = req.params;
  const filePath = path.join(DATA_ROOT, userId, subject, 'Files', filename);
  try {
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
});

app.listen(PORT, () => {
  console.log(`SparkDo local API listening on http://localhost:${PORT}`);
  console.log(`Scanning homework data from: ${DATA_ROOT}`);
});
