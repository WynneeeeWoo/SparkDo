import OpenAI from 'openai';
import type { ExtractedFile } from './fileExtractor';

export interface AIAssignment {
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

export interface AIActivity {
  id: string;
  subject: string;
  content: string;
  className: string;
  postedAt: string;
  author?: string;
  attachments?: string[];
}

export interface AIAnalysisResult {
  today: AIAssignment[];
  upcoming: AIAssignment[];
  crossSubject: AICrossSubject;
  recentActivities: AIActivity[];
}

const SYSTEM_PROMPT = `You are an academic assistant that extracts homework, deadlines, and recent activities from school files.

Current date: {CURRENT_DATE}
Time zone: Asia/Shanghai (+08:00)

Rules:
- Read the provided file extracts (slides, spreadsheets, PDFs, etc.).
- Identify every assignment, quiz, test, project, essay, lab report, or task with a deadline.
- Also identify announcements, reminders, or channel posts that are NOT assignments.
- Return ONLY a valid JSON object. Do not add markdown, commentary, or explanations.
- Use ISO 8601 date-time strings with +08:00 offset (e.g. "2026-06-14T23:59:00+08:00").
- If a due time is not specified, use 23:59:00+08:00 on the due date.
- If no year is given, assume the current year 2026.
- Assign a unique id in the format "ai-<subject>-<nnn>" for assignments and "ai-act-<nnn>" for activities.
- Use the exact subject/class name when known; otherwise infer from context.

Required JSON shape:
{
  "today": [
    {
      "id": "ai-math-001",
      "title": "...",
      "content": "...",
      "className": "Math",
      "dueDateTime": "2026-06-14T23:59:00+08:00",
      "status": "assigned",
      "maxPoints": 100
    }
  ],
  "upcoming": [ /* same shape */ ],
  "crossSubject": {
    "totalAssignments": 5,
    "completed": 0,
    "overdue": 0,
    "bySubject": { "Math": 2, "English": 3 }
  },
  "recentActivities": [
    {
      "id": "ai-act-001",
      "subject": "Quiz reminder",
      "content": "...",
      "className": "Math",
      "postedAt": "2026-06-14T08:00:00+08:00"
    }
  ]
}

If a section has no items, return an empty array/object.`;

function formatCurrentDate(): string {
  const d = new Date();
  return d.toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T') + '+08:00';
}

function buildUserPrompt(files: ExtractedFile[]): string {
  const header = `Today is ${formatCurrentDate()}.\n\nExtract homework, deadlines, and recent activities from the following files.\n`;
  const body = files
    .map((f, i) => {
      const status = f.error ? `[EXTRACTION ERROR: ${f.error}]` : f.text || '[No text]';
      return `--- FILE ${i + 1} ---\nSubject: ${f.subject}\nFile: ${f.fileName}\n\n${status}`;
    })
    .join('\n\n');
  return `${header}\n${body}\n\nReturn only JSON.`;
}

function extractJsonBlock(text: string): string {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return codeBlock[1].trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1);
  }
  return text.trim();
}

function normalizeResult(raw: any): AIAnalysisResult {
  return {
    today: Array.isArray(raw?.today) ? raw.today : [],
    upcoming: Array.isArray(raw?.upcoming) ? raw.upcoming : [],
    crossSubject: {
      totalAssignments: Number(raw?.crossSubject?.totalAssignments) || 0,
      completed: Number(raw?.crossSubject?.completed) || 0,
      overdue: Number(raw?.crossSubject?.overdue) || 0,
      bySubject: raw?.crossSubject?.bySubject && typeof raw.crossSubject.bySubject === 'object'
        ? raw.crossSubject.bySubject
        : {},
    },
    recentActivities: Array.isArray(raw?.recentActivities) ? raw.recentActivities : [],
  };
}

export class KimiAnalyzerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KimiAnalyzerError';
  }
}

export async function analyzeFilesWithKimi(files: ExtractedFile[]): Promise<AIAnalysisResult> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  const baseURL = process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1';
  const model = process.env.MOONSHOT_MODEL || 'kimi-k2.6';

  if (!apiKey) {
    throw new KimiAnalyzerError('MOONSHOT_API_KEY is not configured.');
  }

  if (files.length === 0) {
    throw new KimiAnalyzerError('No files provided for analysis.');
  }

  const client = new OpenAI({ apiKey, baseURL });

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT.replace('{CURRENT_DATE}', formatCurrentDate()) },
        { role: 'user', content: buildUserPrompt(files) },
      ],
      temperature: 1,
      max_tokens: 8_000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new KimiAnalyzerError('Kimi returned an empty response.');
    }

    const jsonText = extractJsonBlock(content);
    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err: any) {
      throw new KimiAnalyzerError(`Kimi returned invalid JSON: ${err?.message || 'parse error'}`);
    }

    return normalizeResult(parsed);
  } catch (err: any) {
    if (err instanceof KimiAnalyzerError) throw err;
    throw new KimiAnalyzerError(err?.message || 'Kimi analysis request failed.');
  }
}
