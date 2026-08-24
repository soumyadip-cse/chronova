export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { calendarEvents, scheduleBlocks, tasks } from '@/db/schema';
import { eq, and, gte, lte, asc } from 'drizzle-orm';
import { z } from 'zod';

const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  startUtc: z.string().datetime(),
  endUtc: z.string().datetime(),
  isAllDay: z.boolean().default(false),
  color: z.string().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string()).optional(),
  meetingUrl: z.string().optional(),
  source: z.enum(['manual', 'google_calendar']).default('manual'),
  externalId: z.string().optional(),
  isReadOnly: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const view = searchParams.get('view') || 'week';

  let startDate: Date, endDate: Date;

  if (start && end) {
    startDate = new Date(start);
    endDate = new Date(end);
  } else {
    const now = new Date();
    if (view === 'day') {
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
    } else if (view === 'week') {
      const day = now.getDay();
      startDate = new Date(now);
      startDate.setDate(now.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }
  }

  const [events, blocks] = await Promise.all([
    db
      .select()
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, session.user.id),
          gte(calendarEvents.startUtc, startDate),
          lte(calendarEvents.startUtc, endDate)
        )
      )
      .orderBy(asc(calendarEvents.startUtc)),
    db
      .select({
        id: scheduleBlocks.id,
        taskId: scheduleBlocks.taskId,
        startUtc: scheduleBlocks.startUtc,
        endUtc: scheduleBlocks.endUtc,
        isLocked: scheduleBlocks.isLocked,
        isCompleted: scheduleBlocks.isCompleted,
        taskTitle: tasks.title,
        taskPriority: tasks.priorityFlag,
        taskEnergy: tasks.energyRequired,
      })
      .from(scheduleBlocks)
      .innerJoin(tasks, eq(scheduleBlocks.taskId, tasks.id))
      .where(
        and(
          eq(scheduleBlocks.userId, session.user.id),
          gte(scheduleBlocks.startUtc, startDate),
          lte(scheduleBlocks.startUtc, endDate)
        )
      )
      .orderBy(asc(scheduleBlocks.startUtc)),
  ]);

  return NextResponse.json({ events, scheduleBlocks: blocks });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEventSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [event] = await db
    .insert(calendarEvents)
    .values({
      userId: session.user.id,
      ...parsed.data,
      startUtc: new Date(parsed.data.startUtc),
      endUtc: new Date(parsed.data.endUtc),
    })
    .returning();

  return NextResponse.json({ event }, { status: 201 });
}
