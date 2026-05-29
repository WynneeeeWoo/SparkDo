# SparkDo AI Schema — Input / Output Contracts

> This document defines the data contracts for all AI-powered features in SparkDo.  
> Used by: Frontend React components → AI service layer (Gemini API via `@google/genai`)

---

## 1. Assignment Parser

**Purpose:** Transform raw Microsoft Teams assignments into structured, actionable tasks.

### Input

```typescript
interface AssignmentParserInput {
  /** Raw assignment title from Teams */
  title: string;

  /** Instructions object from Graph API */
  instructions?: {
    content: string;
    contentType: 'text' | 'html';
  };

  /** ISO 8601 due date */
  dueDateTime?: string;

  /** ISO 8601 assign date */
  assignedDateTime?: string;

  /** Resolved class / team name */
  className: string;

  /** Raw point value if available */
  maxPoints?: number;

  /** Existing user tasks (for conflict detection) */
  existingTasks?: Array<{
    title: string;
    dueDateTime: string;
  }>;
}
```

### Output

```typescript
interface AssignmentParserOutput {
  /** Clean, normalized title */
  title: string;

  /** One-paragraph summary of what the student needs to do */
  description: string;

  /** Auto-detected priority based on due date, word count, and point value */
  priority: 'urgent' | 'high' | 'standard' | 'pending';

  /** Estimated time to complete (minutes) */
  estimatedMinutes: number;

  /** Academic category for filtering */
  category:
    | 'essay'
    | 'problem_set'
    | 'reading'
    | 'project'
    | 'exam_prep'
    | 'lab_report'
    | 'presentation'
    | 'other';

  /** Suggested subtasks to break the assignment into manageable chunks */
  subtasks: string[];

  /** AI-recommended date to start working (ISO 8601) */
  suggestedStartDate: string;

  /** AI confidence score 0.0–1.0 */
  confidence: number;
}
```

### System Prompt (Reference)

```text
You are a helpful academic assistant. Parse the following assignment and return a structured JSON object.
Rules:
- Summarize instructions into 1–2 sentences a parent could understand.
- Estimate time based on assignment type and length.
- If due date is within 48 hours, priority must be "urgent".
- Suggest 2–5 subtasks that break the work into 25–45 minute chunks.
- Suggest starting 2–3 days before the due date (or immediately if urgent).
Output must be valid JSON only.
```

---

## 2. Weekly Study Plan Generator

**Purpose:** Generate an optimized day-by-day study schedule from the student's upcoming workload.

### Input

```typescript
interface StudyPlanInput {
  /** Upcoming parsed tasks */
  tasks: Array<{
    id: string;
    title: string;
    estimatedMinutes: number;
    priority: 'urgent' | 'high' | 'standard' | 'pending';
    dueDateTime: string;
    category: string;
  }>;

  /** Calendar events from Outlook/Teams (blocked time) */
  calendarEvents?: Array<{
    subject: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
  }>;

  /** User preferences */
  preferences: {
    /** Preferred study session length in minutes */
    sessionLength: number; // default: 45

    /** Preferred break length in minutes */
    breakLength: number; // default: 10

    /** Earliest daily start time (HH:mm) */
    dayStart: string; // default: "15:00"

    /** Latest daily end time (HH:mm) */
    dayEnd: string; // default: "21:00"

    /** Days off (0=Sun, 6=Sat) */
    daysOff: number[]; // default: [0, 6]
  };
}
```

### Output

```typescript
interface StudyPlanOutput {
  /** ISO week date (e.g. "2024-W47") */
  week: string;

  /** Day-by-day schedule */
  days: Array<{
    date: string; // ISO date
    dayName: string;
    blocks: Array<{
      type: 'study' | 'break' | 'existing_event' | 'free';
      startTime: string; // HH:mm
      endTime: string; // HH:mm
      taskId?: string;
      taskTitle?: string;
      notes?: string;
    }>;
    totalStudyMinutes: number;
    isRestDay: boolean;
  }>;

  /** Warnings for the parent/student */
  warnings: string[];
}
```

---

## 3. Parent Summary Digest

**Purpose:** Provide parents with a concise weekly overview of their child's academic status.

### Input

```typescript
interface ParentDigestInput {
  /** Child's display name */
  studentName: string;

  /** All current tasks with status */
  tasks: Array<{
    title: string;
    dueDateTime: string;
    priority: string;
    completed: boolean;
    estimatedMinutes: number;
  }>;

  /** Date range for the digest */
  weekStart: string;
  weekEnd: string;
}
```

### Output

```typescript
interface ParentDigestOutput {
  /** Friendly greeting + summary paragraph */
  summaryParagraph: string;

  /** Key stats for quick scanning */
  stats: {
    totalAssignments: number;
    completed: number;
    overdue: number;
    upcomingThisWeek: number;
    totalEstimatedHours: number;
  };

  /** Red-flag alerts requiring parent attention */
  redFlags: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    relatedTask?: string;
  }>;

  /** One-sentence encouragement or tip */
  tip: string;
}
```

---

## 4. Smart Task Prioritizer (Real-time)

**Purpose:** Re-rank the task list whenever new assignments arrive or deadlines shift.

### Input

```typescript
interface PrioritizerInput {
  tasks: Array<{
    id: string;
    title: string;
    dueDateTime: string;
    priority: string;
    estimatedMinutes: number;
    category: string;
    completed: boolean;
  }>;

  /** Current date/time for relative calculation */
  now: string;
}
```

### Output

```typescript
interface PrioritizerOutput {
  /** Re-ordered task IDs from most to least urgent */
  rankedTaskIds: string[];

  /** Per-task AI rationale (1 sentence) */
  rationales: Record<string, string>;

  /** Suggested "Daily Focus" task ID */
  dailyFocusTaskId: string;
}
```

---

## Error Handling

All AI features should gracefully degrade:

| Scenario | Behavior |
|----------|----------|
| AI service timeout | Return raw assignment data with `priority: "standard"` |
| Invalid JSON from AI | Fallback to rule-based parsing (regex + heuristics) |
| Rate limit | Queue request and retry with exponential backoff |
| Missing `GEMINI_API_KEY` | Skip AI enrichment; show raw data only |

---

## Implementation Notes

- All AI calls should be made from a central `src/services/aiService.ts` module.
- Use `@google/genai` (already in `package.json`) for Gemini API.
- Cache AI responses in `localStorage` keyed by assignment ID to avoid re-parsing.
- Maximum prompt length: ~30,000 tokens (Gemini 1.5 Flash limit).
- Always sanitize HTML instructions before sending to AI (strip tags or convert to markdown).
