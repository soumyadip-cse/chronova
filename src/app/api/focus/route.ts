export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { focusSessions, tasks, scheduleBlocks, soundscapePresets } from '@/db/schema';
import { eq, and, desc, gte, lte, sum, SQL } from 'drizzle-orm';
import { z } from 'zod';

const createFocusSessionSchema = z.object({
  taskId: z.string().uuid().optional().nullable(),
  scheduleBlockId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().positive().max(1440),
  soundscapeUsed: z.string().uuid().optional().nullable(),
  notes: z.string().optional(),
  energyLevel: z.enum(['low', 'balanced', 'high']).optional(),
  interrupted: z.boolean().default(false),
  interruptionReason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const limit = parseInt(searchParams.get('limit') || '50');

  let where: SQL<unknown> = eq(focusSessions.userId, session.user.id);

  if (start && end) {
    const dateStart = new Date(start);
    const dateEnd = new Date(end);
    if (!isNaN(dateStart.getTime()) && !isNaN(dateEnd.getTime())) {
      where = and(
        where,
        gte(focusSessions.completedAtUtc, dateStart),
        lte(focusSessions.completedAtUtc, dateEnd)
      ) as SQL<unknown>;
    }
  }

  const sessions = await db
    .select({
      id: focusSessions.id,
      taskId: focusSessions.taskId,
      scheduleBlockId: focusSessions.scheduleBlockId,
      durationMinutes: focusSessions.durationMinutes,
      completedAtUtc: focusSessions.completedAtUtc,
      soundscapeUsed: focusSessions.soundscapeUsed,
      notes: focusSessions.notes,
      energyLevel: focusSessions.energyLevel,
      interrupted: focusSessions.interrupted,
      interruptionReason: focusSessions.interruptionReason,
      taskTitle: tasks.title,
      taskColor: tasks.projectId,
      soundscapeName: soundscapePresets.name,
    })
    .from(focusSessions)
    .leftJoin(tasks, eq(focusSessions.taskId, tasks.id))
    .leftJoin(soundscapePresets, eq(focusSessions.soundscapeUsed, soundscapePresets.id))
    .where(where)
    .orderBy(desc(focusSessions.completedAtUtc))
    .limit(limit);

  const totalMinutes = await db
    .select({ total: sum(focusSessions.durationMinutes) })
    .from(focusSessions)
    .where(where);

  return NextResponse.json({ sessions, totalMinutes: totalMinutes[0]?.total || 0 });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createFocusSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date();

  const [sessionRecord] = await db
    .insert(focusSessions)
    .values({
      userId: session.user.id,
      ...parsed.data,
      completedAtUtc: now,
    })
    .returning();

  if (parsed.data.scheduleBlockId) {
    await db
      .update(scheduleBlocks)
      .set({ isCompleted: true })
      .where(
        and(
          eq(scheduleBlocks.id, parsed.data.scheduleBlockId),
          eq(scheduleBlocks.userId, session.user.id)
        )
      );
  }

  if (parsed.data.taskId) {
    await db
      .update(tasks)
      .set({ status: 'completed', completedAtUtc: now })
      .where(and(eq(tasks.id, parsed.data.taskId), eq(tasks.userId, session.user.id)));
  }

  return NextResponse.json({ session: sessionRecord }, { status: 201 });
}
