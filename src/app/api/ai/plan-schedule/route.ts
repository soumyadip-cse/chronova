export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { tasks, calendarEvents, scheduleBlocks, userProfiles } from '@/db/schema';
import { eq, and, gt, lt, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { generateScheduleProposal, rankTasks, SchedulingContext } from '@/lib/priority-engine';
import { withAIRateLimit } from '@/lib/with-rate-limit';
import { userDayBounds } from '@/lib/tz-utils';

const planScheduleSchema = z.object({
  date: z.string().datetime().optional(),
  forceRebalance: z.boolean().default(false),
});

async function handlePlanSchedule(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = planScheduleSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Day boundaries are derived in the USER'S timezone, never server-local.
  const userTimezone = session.user.timezone || 'UTC';
  const requestedAt = parsed.data.date ? new Date(parsed.data.date) : new Date();
  const { dayStartUtc, dayEndUtc } = userDayBounds(requestedAt, userTimezone);

  // Interval-overlap semantics: an entry conflicts with the planning day when
  // it starts before the day ends AND ends after the day starts. Day-bucketed
  // filters (start BETWEEN day AND day+1) would miss midnight-spanning events.
  const [profile, userTasks, calEvents, existingBlocks] = await Promise.all([
    db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, session.user.id) }),
    db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, session.user.id),
          inArray(tasks.status, ['inbox', 'today', 'upcoming'])
        )
      ),
    db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, session.user.id),
          lt(calendarEvents.startUtc, dayEndUtc),
          gt(calendarEvents.endUtc, dayStartUtc)
        )
      ),
    db
      .select()
      .from(scheduleBlocks)
      .where(
        and(
          eq(scheduleBlocks.userId, session.user.id),
          lt(scheduleBlocks.startUtc, dayEndUtc),
          gt(scheduleBlocks.endUtc, dayStartUtc)
        )
      ),
  ]);

  const context: SchedulingContext = {
    currentTimeUtc: new Date(),
    userTimezone,
    energyProfile: profile?.energyProfile || { morning: 0.7, afternoon: 0.5, evening: 0.4 },
    scheduledTasks: existingBlocks.map((b) => ({
      id: b.id,
      startUtc: new Date(b.startUtc),
      endUtc: new Date(b.endUtc),
      energyRequired: 'balanced' as const,
    })),
    calendarEvents: calEvents.map((e) => ({
      startUtc: new Date(e.startUtc),
      endUtc: new Date(e.endUtc),
    })),
    workingHours: profile?.workingHours || { start: '09:00', end: '17:00' },
  };

  const taskAttributes = userTasks.map((t) => ({
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

  const ranked = rankTasks(taskAttributes, context, context.currentTimeUtc);
  const plan = generateScheduleProposal(ranked, context);

  // Display-only: proposals are returned for review and are NOT persisted into
  // schedule_blocks here. Persisting stays an explicit user action.
  return NextResponse.json({
    date: dayStartUtc.toISOString(),
    scheduled: plan.scheduled,
    proposals: plan.scheduled,
    unschedulable: plan.unschedulable,
    skipped: plan.skipped,
    rankedTasks: ranked,
  });
}

export const POST = withAIRateLimit(handlePlanSchedule);
