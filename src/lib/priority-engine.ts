import { z } from 'zod';

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
  const slotHour = slotStartUtc.getUTCHours();
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
  return Math.max(0, 100 * (1 - diff));
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
  focusWindowMinutes: number = 50
): Array<{ taskId: string; startUtc: Date; endUtc: Date; priorityScore: number }> {
  const ranked = rankTasks(tasks, context, new Date());
  const proposals: Array<{ taskId: string; startUtc: Date; endUtc: Date; priorityScore: number }> =
    [];
  let currentTime = new Date(context.currentTimeUtc);

  const workingStart = parseTime(context.workingHours.start);
  const workingEnd = parseTime(context.workingHours.end);

  for (const task of ranked) {
    if (task.status === 'completed') continue;

    const taskEnd = new Date(currentTime.getTime() + task.estimatedMinutes * 60 * 1000);

    if (hasConflict(currentTime, taskEnd, context.calendarEvents)) {
      currentTime = findNextAvailableSlot(currentTime, task.estimatedMinutes, context);
      continue;
    }

    if (isOutsideWorkingHours(currentTime, taskEnd, workingStart, workingEnd)) {
      currentTime = nextWorkingDayStart(currentTime, workingStart);
      continue;
    }

    proposals.push({
      taskId: task.id || '',
      startUtc: new Date(currentTime),
      endUtc: new Date(currentTime.getTime() + task.estimatedMinutes * 60 * 1000),
      priorityScore: task.priorityScore,
    });

    currentTime = new Date(
      currentTime.getTime() + task.estimatedMinutes * 60 * 1000 + 10 * 60 * 1000
    );
  }

  return proposals;
}

function hasConflict(
  start: Date,
  end: Date,
  events: Array<{ startUtc: Date; endUtc: Date }>
): boolean {
  return events.some((e) => start < e.endUtc && end > e.startUtc);
}

function findNextAvailableSlot(
  from: Date,
  durationMinutes: number,
  context: SchedulingContext
): Date {
  let candidate = new Date(from);
  for (let i = 0; i < 100; i++) {
    const end = new Date(candidate.getTime() + durationMinutes * 60 * 1000);
    if (
      !hasConflict(candidate, end, context.calendarEvents) &&
      !isOutsideWorkingHours(
        candidate,
        end,
        parseTime(context.workingHours.start),
        parseTime(context.workingHours.end)
      )
    ) {
      return candidate;
    }
    candidate = new Date(candidate.getTime() + 30 * 60 * 1000);
  }
  return from;
}

function isOutsideWorkingHours(
  start: Date,
  end: Date,
  workStart: number,
  workEnd: number
): boolean {
  const startHour = start.getUTCHours() + start.getUTCMinutes() / 60;
  const endHour = end.getUTCHours() + end.getUTCMinutes() / 60;
  return startHour < workStart || endHour > workEnd;
}

function nextWorkingDayStart(date: Date, workStart: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + 1);
  next.setUTCHours(workStart, 0, 0, 0);
  return next;
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + minutes / 60;
}
