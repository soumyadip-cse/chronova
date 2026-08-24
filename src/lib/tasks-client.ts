import type { Task, TaskStatus, TaskPriority, EnergyLevel } from '@/types';

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
