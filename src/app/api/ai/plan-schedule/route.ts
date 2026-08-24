export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { tasks, calendarEvents, scheduleBlocks, userProfiles } from '@/db/schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { generateScheduleProposal, rankTasks, SchedulingContext } from '@/lib/priority-engine';
import { withAIRateLimit } from '@/lib/with-rate-limit';

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

  const targetDate = parsed.data.date ? new Date(parsed.data.date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

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
          gte(calendarEvents.startUtc, targetDate),
          lte(calendarEvents.startUtc, nextDay)
        )
      ),
    db
      .select()
      .from(scheduleBlocks)
      .where(
        and(
          eq(scheduleBlocks.userId, session.user.id),
          gte(scheduleBlocks.startUtc, targetDate),
          lte(scheduleBlocks.startUtc, nextDay)
        )
      ),
  ]);

  const now = new Date();

  const context: SchedulingContext = {
    currentTimeUtc: now,
    userTimezone: session.user.timezone,
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

  const ranked = rankTasks(taskAttributes, context, targetDate);
  const proposals = generateScheduleProposal(ranked, context);

  return NextResponse.json({
    proposals,
    rankedTasks: ranked,
    date: targetDate.toISOString(),
  });
}

export const POST = withAIRateLimit(handlePlanSchedule);
