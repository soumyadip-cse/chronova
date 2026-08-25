import type {
  Task,
  TaskStatus,
  TaskPriority,
  EnergyLevel,
  CalendarEvent,
  ScheduledBlock,
  PlanApplyResponse,
  FocusSessionEndInfo,
  InsightsResponse,
} from '@/types';

interface ApiTaskRow {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  deadlineUtc?: string | null;
  priorityFlag: TaskPriority;
  estimatedMinutes: number;
  energyRequired: EnergyLevel;
  status: TaskStatus;
  priorityScore: number;
  scoreExplanation?: string | null;
  tags?: string[] | null;
  aiReasoning?: string | null;
  isRecurring?: boolean | null;
  completedAtUtc?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapApiTask(row: ApiTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    priority: row.priorityFlag,
    aiPriorityScore: Math.round(row.priorityScore),
    dueDate: row.deadlineUtc ? new Date(row.deadlineUtc) : undefined,
    estimatedEffort: row.estimatedMinutes,
    impact: 50,
    energyRequired: row.energyRequired,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    completedAt: row.completedAtUtc ? new Date(row.completedAtUtc) : undefined,
    aiReasoning: row.scoreExplanation ?? row.aiReasoning ?? undefined,
    tags: row.tags ?? [],
    isRecurring: row.isRecurring ?? false,
  };
}

export class TasksApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'TasksApiError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') return data.error;
  } catch {
    // fall through
  }
  if (res.status === 401) return 'You must be signed in.';
  if (res.status === 404) return 'Task not found.';
  return `Request failed (${res.status}). Please try again.`;
}

export async function fetchTasks(): Promise<Task[]> {
  const res = await fetch('/api/tasks', { cache: 'no-store' });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
  const data = await res.json();
  return ((data.tasks ?? []) as ApiTaskRow[]).map(mapApiTask);
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  deadlineUtc?: string | null;
  priorityFlag?: TaskPriority;
  estimatedMinutes?: number;
  energyRequired?: EnergyLevel;
  status?: TaskStatus;
  tags?: string[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
  const data = await res.json();
  return mapApiTask(data.task as ApiTaskRow);
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  deadlineUtc?: string | null;
  priorityFlag?: TaskPriority;
  estimatedMinutes?: number;
  energyRequired?: EnergyLevel;
  status?: TaskStatus;
  tags?: string[];
}

export async function updateTask(id: string, patch: UpdateTaskInput): Promise<Task> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
  const data = await res.json();
  return mapApiTask(data.task as ApiTaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/tasks/${id}?confirm=true`, { method: 'DELETE' });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
}

interface ApiCalendarEventRow {
  id: string;
  title: string;
  description?: string | null;
  startUtc: string;
  endUtc: string;
  isAllDay?: boolean | null;
  color?: string | null;
  location?: string | null;
  source?: string | null;
}

export async function fetchCalendarEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    view: 'week',
  });
  const res = await fetch(`/api/calendar?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
  const data = await res.json();
  return ((data.events ?? []) as ApiCalendarEventRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    // UTC instants rendered via local Date — consistent conversion at the boundary only.
    start: new Date(row.startUtc),
    end: new Date(row.endUtc),
    type: 'focus' as const,
    color: row.color ?? '#8B5CF6',
    isAllDay: row.isAllDay ?? false,
    location: row.location ?? undefined,
  }));
}

/**
 * Display-only mapping of task deadlines onto the calendar. This does NOT
 * schedule anything — a task with no deadline simply produces no entry.
 */
export function tasksAsDeadlineEvents(tasks: Task[]): CalendarEvent[] {
  return tasks
    .filter((t) => t.dueDate instanceof Date && !Number.isNaN(t.dueDate.getTime()))
    .map((t) => {
      const start = t.dueDate as Date;
      const end = new Date(start.getTime() + Math.max(t.estimatedEffort, 15) * 60 * 1000);
      return {
        id: `task-deadline-${t.id}`,
        title: `⏰ ${t.title}`,
        start,
        end,
        type: 'focus' as const,
        color:
          t.priority === 'critical' ? '#EF4444' : t.priority === 'high' ? '#F59E0B' : '#3B82F6',
        taskId: t.id,
        isAllDay: false,
      };
    });
}

// ---------- Persisted schedule blocks ----------

interface ApiScheduleBlockRow {
  id: string;
  taskId: string | null;
  startUtc: string;
  endUtc: string;
  isLocked: boolean | null;
  isCompleted: boolean | null;
  taskTitle?: string | null;
}

export interface CalendarWindow {
  events: CalendarEvent[];
  blocks: ScheduledBlock[];
}

/**
 * Fetch calendar events AND persisted scheduler blocks for a window. Blocks are
 * returned raw so callers can render or map them; events keep the same shape as
 * fetchCalendarEvents.
 */
export async function fetchCalendarWithBlocks(start: Date, end: Date): Promise<CalendarWindow> {
  const params = new URLSearchParams({
    start: start.toISOString(),
    end: end.toISOString(),
    view: 'week',
  });
  const res = await fetch(`/api/calendar?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
  const data = await res.json();

  const events = ((data.events ?? []) as ApiCalendarEventRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    start: new Date(row.startUtc),
    end: new Date(row.endUtc),
    type: 'focus' as const,
    color: row.color ?? '#8B5CF6',
    isAllDay: row.isAllDay ?? false,
    location: row.location ?? undefined,
  }));

  const blocks = ((data.scheduleBlocks ?? []) as ApiScheduleBlockRow[])
    .filter((b): b is ApiScheduleBlockRow & { taskId: string } => typeof b.taskId === 'string')
    .map((b) => ({
      id: b.id,
      taskId: b.taskId,
      title: b.taskTitle ?? 'Scheduled task',
      startUtc: b.startUtc,
      endUtc: b.endUtc,
      isLocked: b.isLocked ?? false,
      isCompleted: b.isCompleted ?? false,
    }));

  return { events, blocks };
}

/** Map persisted blocks onto the calendar with a distinct visual identity. */
export function scheduleBlocksAsEvents(blocks: ScheduledBlock[]): CalendarEvent[] {
  return blocks.map((b) => {
    const start = new Date(b.startUtc);
    return {
      id: `block-${b.id}`,
      title: b.title || 'Scheduled task',
      start,
      end: new Date(b.endUtc),
      type: 'schedule' as const,
      color: '#6366F1',
      taskId: b.taskId,
      scheduleBlockId: b.id,
      isLocked: b.isLocked,
      isCompleted: b.isCompleted,
      isAllDay: false,
    };
  });
}

/**
 * Ask the server to persist scheduler placements for the given tasks. Only
 * taskIds travel to the server — it recomputes all times authoritatively.
 */
export async function applyPlanSchedule(taskIds: string[]): Promise<PlanApplyResponse> {
  const res = await fetch('/api/ai/plan-schedule/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskIds }),
  });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
  const data = (await res.json()) as PlanApplyResponse;
  return {
    applied: Array.isArray(data.applied) ? data.applied : [],
    failed: Array.isArray(data.failed) ? data.failed : [],
  };
}

// ---------- Focus telemetry ----------

export interface CompleteFocusInput extends FocusSessionEndInfo {
  taskId?: string | null;
  scheduleBlockId?: string | null;
}

/**
 * Persist a finished focus session through the existing /api/focus pipeline.
 * The server owns completion side-effects: the schedule block and task are
 * marked complete server-side, scoped to the session user.
 */
export async function completeFocusSession(input: CompleteFocusInput): Promise<void> {
  const res = await fetch('/api/focus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskId: input.taskId ?? null,
      scheduleBlockId: input.scheduleBlockId ?? null,
      durationMinutes: Math.max(1, Math.round(input.elapsedMinutes)),
      interrupted: input.interrupted,
    }),
  });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
}

// ---------- Insights ----------

export type InsightsRange = 7 | 30;

export async function fetchInsights(days: InsightsRange): Promise<InsightsResponse> {
  const res = await fetch(`/api/insights?days=${days}`, { cache: 'no-store' });
  if (!res.ok) throw new TasksApiError(res.status, await parseError(res));
  return (await res.json()) as InsightsResponse;
}
