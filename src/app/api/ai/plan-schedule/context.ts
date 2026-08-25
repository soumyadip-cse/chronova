import { and, eq, gt, inArray, lt } from 'drizzle-orm';
import { db } from '@/db';
import { tasks, calendarEvents, scheduleBlocks, userProfiles } from '@/db/schema';
import { rankTasks, type SchedulingContext, type TaskAttributes } from '@/lib/priority-engine';

export type TaskRow = typeof tasks.$inferSelect;
export type CalendarEventRow = typeof calendarEvents.$inferSelect;
export type ScheduleBlockRow = typeof scheduleBlocks.$inferSelect;
export type UserProfileRow = typeof userProfiles.$inferSelect;

/** Everything the deterministic scheduler needs about one user's world. */
export interface SchedulingData {
  profile: UserProfileRow | undefined;
  userTasks: TaskRow[];
  calendarEvents: CalendarEventRow[];
  scheduleBlocks: ScheduleBlockRow[];
}

/**
 * Load live scheduling inputs for a user. Every query is scoped to the user and
 * uses interval-overlap semantics (start < boundEnd AND end > boundStart) so
 * midnight-spanning entries are never missed.
 */
export async function loadSchedulingData(
  userId: string,
  overlapWindow?: { startUtc: Date; endUtc: Date }
): Promise<SchedulingData> {
  const overlap = overlapWindow ?? {
    startUtc: new Date(0),
    endUtc: new Date('9999-12-31T23:59:59.999Z'),
  };

  const [profile, userTasks, calEvents, blocks] = await Promise.all([
    db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) }),
    db
      .select()
      .from(tasks)
      .where(and(eq(tasks.userId, userId), inArray(tasks.status, ['inbox', 'today', 'upcoming']))),
    db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          lt(calendarEvents.startUtc, overlap.endUtc),
          gt(calendarEvents.endUtc, overlap.startUtc)
        )
      ),
    db
      .select()
      .from(scheduleBlocks)
      .where(
        and(
          eq(scheduleBlocks.userId, userId),
          lt(scheduleBlocks.startUtc, overlap.endUtc),
          gt(scheduleBlocks.endUtc, overlap.startUtc)
        )
      ),
  ]);

  return { profile, userTasks, calendarEvents: calEvents, scheduleBlocks: blocks };
}

/** Map persisted block rows into engine busy-interval form. */
export function blocksToScheduledTasks(
  blocks: Array<Pick<ScheduleBlockRow, 'id' | 'startUtc' | 'endUtc'>>
): SchedulingContext['scheduledTasks'] {
  return blocks.map((b) => ({
    id: b.id,
    startUtc: new Date(b.startUtc),
    endUtc: new Date(b.endUtc),
    energyRequired: 'balanced' as const,
  }));
}

/**
 * Build the engine context. Busy intervals = calendar events + supplied blocks
 * (defaults to every loaded block). Timezone comes from the authenticated
 * session, falling back to UTC.
 */
export function buildSchedulingContext(
  data: SchedulingData,
  options: {
    userTimezone?: string | null;
    scheduledTasks?: SchedulingContext['scheduledTasks'];
  } = {}
): SchedulingContext {
  return {
    currentTimeUtc: new Date(),
    userTimezone: options.userTimezone || 'UTC',
    energyProfile: data.profile?.energyProfile || { morning: 0.7, afternoon: 0.5, evening: 0.4 },
    scheduledTasks:
      options.scheduledTasks ??
      blocksToScheduledTasks(
        data.scheduleBlocks.map((b) => ({ id: b.id, startUtc: b.startUtc, endUtc: b.endUtc }))
      ),
    calendarEvents: data.calendarEvents.map((e) => ({
      startUtc: new Date(e.startUtc),
      endUtc: new Date(e.endUtc),
    })),
    workingHours: data.profile?.workingHours || { start: '09:00', end: '17:00' },
  };
}

/** Map task rows into validated engine input (shared by plan + apply). */
export function buildTaskAttributes(userTasks: TaskRow[]): TaskAttributes[] {
  return userTasks.map((t) => ({
    id: t.id,
    title: t.title,
    deadlineUtc: t.deadlineUtc?.toISOString() || null,
    priorityFlag: t.priorityFlag,
    estimatedMinutes: t.estimatedMinutes,
    energyRequired: t.energyRequired,
    impact: 50,
    tags: t.tags || [],
    projectId: t.projectId || undefined,
    subjectId: t.subjectId || undefined,
    clientId: t.clientId || undefined,
    deliverableId: t.deliverableId || undefined,
    founderGoalId: t.founderGoalId || undefined,
    isRecurring: t.isRecurring ?? false,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));
}

/** Rank helper shared by both routes so ordering is byte-for-byte consistent. */
export function rankSchedulingTasks(data: SchedulingData, context: SchedulingContext) {
  return rankTasks(buildTaskAttributes(data.userTasks), context, context.currentTimeUtc);
}
