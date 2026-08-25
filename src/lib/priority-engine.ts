import { z } from 'zod';
import { getWallClock, wallClockToUtc, addWallDays, type TzParts } from '@/lib/tz-utils';

export const taskAttributesSchema = z.object({
  id: z.string().uuid().optional(),
  deadlineUtc: z.string().datetime().optional().nullable(),
  priorityFlag: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedMinutes: z.number().int().positive().default(30),
  energyRequired: z.enum(['low', 'balanced', 'high']).default('balanced'),
  impact: z.number().min(0).max(100).default(50),
  tags: z.array(z.string()).default([]),
  projectId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  deliverableId: z.string().uuid().optional().nullable(),
  founderGoalId: z.string().uuid().optional().nullable(),
  isRecurring: z.boolean().default(false),
  status: z.enum(['inbox', 'today', 'upcoming', 'completed', 'overdue']).default('inbox'),
  createdAt: z.string().datetime(),
});

export type TaskAttributes = z.infer<typeof taskAttributesSchema>;

export interface UserEnergyProfile {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface SchedulingContext {
  currentTimeUtc: Date;
  userTimezone: string;
  energyProfile: UserEnergyProfile;
  scheduledTasks: Array<{
    id: string;
    startUtc: Date;
    endUtc: Date;
    energyRequired: 'low' | 'balanced' | 'high';
  }>;
  calendarEvents: Array<{
    startUtc: Date;
    endUtc: Date;
  }>;
  workingHours: { start: string; end: string };
}

const PRIORITY_WEIGHTS = {
  urgency: 0.35,
  impact: 0.25,
  energyMatch: 0.15,
  userOverride: 0.1,
  dependencyBoost: 0.15,
  contextSwitchPenalty: 0.1,
  effortDrag: 0.05,
} as const;

const PRIORITY_MULTIPLIERS = {
  low: 0.8,
  medium: 1.0,
  high: 1.3,
  critical: 1.6,
} as const;

// ---------- Scheduling engine result contracts ----------

export type UnschedulableReason =
  'conflict_exhausted' | 'past_deadline' | 'exceeds_horizon' | 'no_working_window';

export interface ScheduledProposal {
  taskId: string;
  startUtc: Date;
  endUtc: Date;
  priorityScore: number;
}

export interface UnschedulableTask {
  taskId: string;
  reason: UnschedulableReason;
  details?: Record<string, unknown>;
}

/**
 * Every task entering the scheduler ends up in exactly one of:
 * scheduled / unschedulable / skipped (completed tasks only).
 * The engine never silently drops a task.
 */
export interface SchedulePlanResult {
  scheduled: ScheduledProposal[];
  unschedulable: UnschedulableTask[];
  skipped: Array<{ taskId: string; reason: 'completed' }>;
}

/** Deterministic upper bound on how far the scheduler searches for placement. */
export const DEFAULT_SCHEDULING_HORIZON_DAYS = 14;

const PLACEMENT_BUFFER_MINUTES = 10;
const MAX_PLACEMENT_ITERATIONS = 5000;

export function calculateUrgency(deadlineUtc: Date | null, currentTimeUtc: Date): number {
  if (!deadlineUtc) return 5;

  const hoursUntilDeadline = (deadlineUtc.getTime() - currentTimeUtc.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDeadline <= 0) return 100;
  if (hoursUntilDeadline <= 1) return 95;
  if (hoursUntilDeadline <= 3) return 90;
  if (hoursUntilDeadline <= 6) return 80;
  if (hoursUntilDeadline <= 12) return 70;
  if (hoursUntilDeadline <= 24) return 60;
  if (hoursUntilDeadline <= 48) return 45;
  if (hoursUntilDeadline <= 72) return 30;
  if (hoursUntilDeadline <= 168) return 15;
  return 5;
}

export function calculateImpact(attributes: TaskAttributes): number {
  return Math.min(100, Math.max(0, attributes.impact));
}

export function calculateEnergyMatch(
  taskEnergy: 'low' | 'balanced' | 'high',
  context: SchedulingContext,
  slotStartUtc: Date
): number {
  // Bucket by the USER'S wall-clock hour, not UTC: 10:00Z is evening in Tokyo.
  const timeZone = context.userTimezone || 'UTC';
  const wall = getWallClock(slotStartUtc, timeZone);
  const slotHour = wall.hour + wall.minute / 60;
  let userEnergyAtSlot: number;

  if (slotHour >= 5 && slotHour < 12) {
    userEnergyAtSlot = context.energyProfile.morning;
  } else if (slotHour >= 12 && slotHour < 17) {
    userEnergyAtSlot = context.energyProfile.afternoon;
  } else {
    userEnergyAtSlot = context.energyProfile.evening;
  }

  const taskEnergyValue = { low: 0.3, balanced: 0.6, high: 0.9 }[taskEnergy];

  const diff = Math.abs(userEnergyAtSlot - taskEnergyValue);
  // Integer sub-score: avoids float artifacts (e.g. 39.999... for exact 40).
  return Math.round(Math.max(0, 100 * (1 - diff)));
}

export function calculateUserOverride(
  priorityFlag: 'low' | 'medium' | 'high' | 'critical'
): number {
  return Math.round((PRIORITY_MULTIPLIERS[priorityFlag] - 1) * 100);
}

export function calculateDependencyBoost(taskId: string, allTasks: TaskAttributes[]): number {
  const dependents = allTasks.filter(
    (t) =>
      t.tags.includes(`depends:${taskId}`) ||
      t.projectId === allTasks.find((t) => t.id === taskId)?.projectId
  );

  return Math.min(30, dependents.length * 10);
}

export function calculateContextSwitchPenalty(
  task: TaskAttributes,
  previousTask: TaskAttributes | null
): number {
  if (!previousTask) return 0;

  const currentDomain = getTaskDomain(task);
  const previousDomain = getTaskDomain(previousTask);

  if (currentDomain !== previousDomain && currentDomain && previousDomain) {
    return 25;
  }
  return 0;
}

export function getTaskDomain(task: TaskAttributes): string | null {
  if (task.subjectId) return 'academic';
  if (task.projectId) return 'project';
  if (task.clientId) return 'client';
  if (task.deliverableId) return 'deliverable';
  if (task.founderGoalId) return 'strategic';
  return null;
}

export function calculateEffortDrag(
  estimatedMinutes: number,
  availableWindowMinutes: number
): number {
  if (estimatedMinutes > availableWindowMinutes * 0.8) {
    return 20;
  }
  if (estimatedMinutes > availableWindowMinutes * 0.5) {
    return 10;
  }
  return 0;
}

export function calculatePriorityScore(
  task: TaskAttributes,
  context: SchedulingContext,
  allTasks: TaskAttributes[],
  slotStartUtc: Date,
  previousTask: TaskAttributes | null
): { score: number; explanation: string } {
  const urgency = calculateUrgency(
    task.deadlineUtc ? new Date(task.deadlineUtc) : null,
    context.currentTimeUtc
  );
  const impact = calculateImpact(task);
  const energyMatch = calculateEnergyMatch(task.energyRequired, context, slotStartUtc);
  const userOverride = calculateUserOverride(task.priorityFlag);
  const dependencyBoost = calculateDependencyBoost(task.id || '', allTasks);
  const contextSwitch = calculateContextSwitchPenalty(task, previousTask);
  const effortDrag = calculateEffortDrag(task.estimatedMinutes, 120);

  const rawScore =
    PRIORITY_WEIGHTS.urgency * urgency +
    PRIORITY_WEIGHTS.impact * impact +
    PRIORITY_WEIGHTS.energyMatch * energyMatch +
    PRIORITY_WEIGHTS.userOverride * userOverride +
    PRIORITY_WEIGHTS.dependencyBoost * dependencyBoost -
    PRIORITY_WEIGHTS.contextSwitchPenalty * contextSwitch -
    PRIORITY_WEIGHTS.effortDrag * effortDrag;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  const explanationParts: string[] = [];
  if (urgency > 70)
    explanationParts.push(
      `Due in ${formatHoursUntil(task.deadlineUtc ? new Date(task.deadlineUtc!) : null, context.currentTimeUtc)}`
    );
  if (impact > 70) explanationParts.push('High impact');
  if (energyMatch > 70) explanationParts.push('Matches energy peak');
  if (userOverride > 0) explanationParts.push(`${task.priorityFlag} priority`);
  if (dependencyBoost > 0)
    explanationParts.push(`Unlocks ${Math.round(dependencyBoost / 10)} tasks`);
  if (contextSwitch > 0) explanationParts.push('Context switch penalty');

  const explanation =
    explanationParts.length > 0 ? explanationParts.join(' • ') : 'Standard priority';

  return { score, explanation };
}

function formatHoursUntil(deadline: Date | null, now: Date): string {
  if (!deadline) return 'No deadline';
  const hours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hours < 1) return '< 1 hour';
  if (hours < 24) return `${Math.round(hours)} hours`;
  return `${Math.round(hours / 24)} days`;
}

export function rankTasks(
  tasks: TaskAttributes[],
  context: SchedulingContext,
  slotStartUtc: Date
): Array<TaskAttributes & { priorityScore: number; scoreExplanation: string }> {
  const ranked = tasks.map((task, index) => {
    const previousTask = index > 0 ? tasks[index - 1] : null;
    const { score, explanation } = calculatePriorityScore(
      task,
      context,
      tasks,
      slotStartUtc,
      previousTask
    );
    return { ...task, priorityScore: score, scoreExplanation: explanation };
  });

  return ranked.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    const aDeadline = a.deadlineUtc ? new Date(a.deadlineUtc).getTime() : Infinity;
    const bDeadline = b.deadlineUtc ? new Date(b.deadlineUtc).getTime() : Infinity;
    if (aDeadline !== bDeadline) return aDeadline - bDeadline;
    const aPriority = { critical: 4, high: 3, medium: 2, low: 1 }[a.priorityFlag];
    const bPriority = { critical: 4, high: 3, medium: 2, low: 1 }[b.priorityFlag];
    if (aPriority !== bPriority) return bPriority - aPriority;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function generateScheduleProposal(
  tasks: TaskAttributes[],
  context: SchedulingContext,
  _focusWindowMinutes: number = 50,
  options: { horizonDays?: number } = {}
): SchedulePlanResult {
  const timeZone = context.userTimezone || 'UTC';
  const ranked = rankTasks(tasks, context, context.currentTimeUtc);

  // Busy intervals: BOTH calendar events and previously placed schedule blocks
  // block placement under the same overlap rule (start < busyEnd && end > busyStart).
  const busyIntervals: Array<{ startUtc: Date; endUtc: Date }> = [
    ...context.calendarEvents,
    ...context.scheduledTasks.map((b) => ({ startUtc: b.startUtc, endUtc: b.endUtc })),
  ].filter((i) => i.endUtc.getTime() > i.startUtc.getTime());

  const workingWindow = parseWorkingWindow(context.workingHours);
  const horizonDays = options.horizonDays ?? DEFAULT_SCHEDULING_HORIZON_DAYS;

  const scheduled: ScheduledProposal[] = [];
  const unschedulable: UnschedulableTask[] = [];
  const skipped: Array<{ taskId: string; reason: 'completed' }> = [];

  let cursor = new Date(context.currentTimeUtc);
  if (!Number.isFinite(cursor.getTime())) {
    cursor = new Date();
  }
  const horizonEnd = computeHorizonEnd(cursor, timeZone, workingWindow, horizonDays);

  for (const task of ranked) {
    if (task.status === 'completed') {
      skipped.push({ taskId: task.id || '', reason: 'completed' });
      continue;
    }

    const taskId = task.id || '';

    if (!workingWindow) {
      unschedulable.push({
        taskId,
        reason: 'no_working_window',
        details: { workingHours: context.workingHours },
      });
      continue;
    }

    const windowMinutes = workingWindow.endMin - workingWindow.startMin;
    if (task.estimatedMinutes > windowMinutes) {
      unschedulable.push({
        taskId,
        reason: 'no_working_window',
        details: {
          estimatedMinutes: task.estimatedMinutes,
          dailyWindowMinutes: windowMinutes,
          workingHours: context.workingHours,
        },
      });
      continue;
    }

    const deadline = task.deadlineUtc ? new Date(task.deadlineUtc) : null;
    const validDeadline = deadline && Number.isFinite(deadline.getTime()) ? deadline : null;

    if (validDeadline && validDeadline.getTime() <= context.currentTimeUtc.getTime()) {
      unschedulable.push({
        taskId,
        reason: 'past_deadline',
        details: {
          overdueAtScheduleTime: true,
          deadlineUtc: validDeadline.toISOString(),
        },
      });
      continue;
    }

    const fit = findEarliestFit(
      cursor,
      task.estimatedMinutes,
      workingWindow,
      timeZone,
      busyIntervals,
      horizonEnd
    );

    if (!fit) {
      // No conflict-free working slot exists before the horizon.
      if (validDeadline && validDeadline.getTime() <= horizonEnd.getTime()) {
        // The deadline lies inside the searched range, so conflicts/availability
        // — not the horizon — are what prevented placement.
        unschedulable.push({
          taskId,
          reason: 'conflict_exhausted',
          details: {
            deadlineUtc: validDeadline.toISOString(),
            horizonEndUtc: horizonEnd.toISOString(),
          },
        });
      } else {
        unschedulable.push({
          taskId,
          reason: 'exceeds_horizon',
          details: {
            horizonDays,
            horizonEndUtc: horizonEnd.toISOString(),
          },
        });
      }
      continue;
    }

    // Deadline feasibility: never place a task so it completes after its deadline.
    if (validDeadline && fit.end.getTime() > validDeadline.getTime()) {
      unschedulable.push({
        taskId,
        reason: 'past_deadline',
        details: {
          overdueAtScheduleTime: false,
          deadlineUtc: validDeadline.toISOString(),
          earliestCompletionUtc: fit.end.toISOString(),
        },
      });
      continue;
    }

    scheduled.push({
      taskId,
      startUtc: fit.start,
      endUtc: fit.end,
      priorityScore: task.priorityScore,
    });

    // The next candidate starts after this block plus a deterministic buffer.
    cursor = new Date(fit.end.getTime() + PLACEMENT_BUFFER_MINUTES * 60 * 1000);
  }

  return { scheduled, unschedulable, skipped };
}

// ---------- Placement internals (all wall-clock math is user-timezone based) ----------

interface WorkingWindow {
  startMin: number;
  endMin: number;
}

function parseWorkingWindow(workingHours: { start: string; end: string }): WorkingWindow | null {
  const start = parseTime(workingHours?.start ?? '');
  const end = parseTime(workingHours?.end ?? '');
  if (start === null || end === null) return null;
  if (start >= end || start < 0 || end > 24 * 60) return null;
  return { startMin: start, endMin: end };
}

function parseTime(timeStr: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function minutesOfDay(parts: TzParts): number {
  return parts.hour * 60 + parts.minute;
}

function computeHorizonEnd(
  from: Date,
  timeZone: string,
  window: WorkingWindow | null,
  horizonDays: number
): Date {
  const parts = getWallClock(from, timeZone);
  const target = addWallDays(parts, Math.max(0, Math.floor(horizonDays)));
  const endHour = window ? Math.floor(window.endMin / 60) : 23;
  const endMinute = window ? window.endMin % 60 : 59;
  return wallClockToUtc(target.year, target.month, target.day, endHour, endMinute, timeZone);
}

interface BusyInterval {
  startUtc: Date;
  endUtc: Date;
}

function findOverlap(intervals: BusyInterval[], start: Date, end: Date): BusyInterval | undefined {
  return intervals.find(
    (i) => start.getTime() < i.endUtc.getTime() && end.getTime() > i.startUtc.getTime()
  );
}

/**
 * Earliest conflict-free slot of `durationMinutes` that fits inside the user's
 * working window on some day, starting no earlier than `from`, ending no later
 * than `bound`. All day/window arithmetic happens on the user's wall clock and
 * converts back to UTC through DST-safe wallClockToUtc. Returns null when no
 * such slot exists within the bound — failure is always explicit.
 */
function findEarliestFit(
  from: Date,
  durationMinutes: number,
  window: WorkingWindow,
  timeZone: string,
  busyIntervals: BusyInterval[],
  bound: Date
): { start: Date; end: Date } | null {
  const durationMs = durationMinutes * 60 * 1000;
  let candidate = new Date(from.getTime());

  for (let iteration = 0; iteration < MAX_PLACEMENT_ITERATIONS; iteration++) {
    const normalized = normalizeToWindow(candidate, durationMs, window, timeZone);

    if (normalized.getTime() !== candidate.getTime()) {
      candidate = normalized;
      continue;
    }

    const end = new Date(candidate.getTime() + durationMs);
    const overlap = findOverlap(busyIntervals, candidate, end);
    if (overlap) {
      // Jump past the blocking interval instead of blind stepping.
      candidate = new Date(overlap.endUtc.getTime());
      continue;
    }

    if (candidate.getTime() >= bound.getTime() || end.getTime() > bound.getTime()) {
      return null;
    }
    return { start: new Date(candidate.getTime()), end };
  }

  return null;
}

/**
 * Move a UTC instant forward to the next instant whose user wall clock lies on
 * a day where [wallStart, wallStart+duration] fits inside the working window.
 * Never moves backwards. Returns input unchanged when already acceptable.
 */
function normalizeToWindow(
  instant: Date,
  durationMs: number,
  window: WorkingWindow,
  timeZone: string
): Date {
  const wall = getWallClock(instant, timeZone);
  const currentMin = minutesOfDay(wall);

  const startTarget = (parts: TzParts): Date =>
    wallClockToUtc(
      parts.year,
      parts.month,
      parts.day,
      Math.floor(window.startMin / 60),
      window.startMin % 60,
      timeZone
    );

  if (currentMin < window.startMin) {
    return startTarget(wall);
  }

  if (currentMin >= window.endMin) {
    return startTarget(addWallDays(wall, 1));
  }

  // Inside today's window: does the whole duration stay within it?
  const endWall = getWallClock(new Date(instant.getTime() + durationMs), timeZone);
  const crossesMidnight =
    endWall.year !== wall.year || endWall.month !== wall.month || endWall.day !== wall.day;
  const endMinOfDay = endWall.hour * 60 + endWall.minute;
  if (crossesMidnight || endMinOfDay > window.endMin) {
    return startTarget(addWallDays(wall, 1));
  }

  return new Date(instant.getTime());
}
