export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { tasks, focusSessions, scheduleBlocks } from '@/db/schema';
import { and, eq, gte, desc } from 'drizzle-orm';
import { z } from 'zod';
import { computeInsights } from '@/lib/insights';

const insightsQuerySchema = z.object({
  days: z.enum(['7', '30']).default('30'),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = insightsQuerySchema.safeParse({ days: searchParams.get('days') ?? undefined });
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const days = Number(parsed.data.days) as 7 | 30;

  // Instant-based window; calendar-day bucketing happens in computeInsights
  // using the user's timezone.
  const nowUtc = new Date();
  const windowStart = new Date(nowUtc.getTime() - days * 24 * 60 * 60 * 1000);

  // Read-only, user-scoped: aggregation can never cross accounts.
  const [taskRows, sessionRows, blockRows] = await Promise.all([
    db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        deadlineUtc: tasks.deadlineUtc,
        estimatedMinutes: tasks.estimatedMinutes,
        completedAtUtc: tasks.completedAtUtc,
        createdAt: tasks.createdAt,
        projectId: tasks.projectId,
        subjectId: tasks.subjectId,
        clientId: tasks.clientId,
        founderGoalId: tasks.founderGoalId,
      })
      .from(tasks)
      .where(eq(tasks.userId, session.user.id)),
    db
      .select({
        durationMinutes: focusSessions.durationMinutes,
        completedAtUtc: focusSessions.completedAtUtc,
        interrupted: focusSessions.interrupted,
      })
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.userId, session.user.id),
          gte(focusSessions.completedAtUtc, windowStart)
        )
      )
      .orderBy(desc(focusSessions.completedAtUtc)),
    db
      .select({
        startUtc: scheduleBlocks.startUtc,
        endUtc: scheduleBlocks.endUtc,
      })
      .from(scheduleBlocks)
      .where(eq(scheduleBlocks.userId, session.user.id)),
  ]);

  const data = computeInsights({
    tasks: taskRows,
    sessions: sessionRows,
    blocks: blockRows,
    days,
    timezone: session.user.timezone || 'UTC',
    nowUtc,
  });

  return NextResponse.json({ days, generatedAt: nowUtc.toISOString(), data });
}
