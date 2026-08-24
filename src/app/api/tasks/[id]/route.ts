import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { tasks, scheduleBlocks, focusSessions, userProfiles, calendarEvents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { calculatePriorityScore } from '@/lib/priority-engine';

const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional().nullable(),
  deadlineUtc: z.string().datetime().optional().nullable(),
  priorityFlag: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  estimatedMinutes: z.number().int().positive().max(1440).optional(),
  energyRequired: z.enum(['low', 'balanced', 'high']).optional(),
  status: z.enum(['inbox', 'today', 'upcoming', 'completed', 'overdue']).optional(),
  tags: z.array(z.string()).optional(),
  projectId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  deliverableId: z.string().uuid().optional().nullable(),
  founderGoalId: z.string().uuid().optional().nullable(),
});

async function getUserContext(userId: string) {
  const profile = await db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) });
  const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
  const calEvents = await db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId));

  return {
    energyProfile: profile?.energyProfile || { morning: 0.7, afternoon: 0.5, evening: 0.4 },
    workingHours: profile?.workingHours || { start: '09:00', end: '17:00' },
    tasks: userTasks.map((t) => ({
      ...t,
      impact: 50,
      tags: t.tags || [],
      isRecurring: t.isRecurring ?? false,
      createdAt: t.createdAt.toISOString(),
      deadlineUtc: t.deadlineUtc?.toISOString() || null,
    })),
    calendarEvents: calEvents,
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const task = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .limit(1);

  if (!task[0]) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  return NextResponse.json({ task: task[0] });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const context = await getUserContext(session.user.id);
  const now = new Date();

  const updatedData = { ...existing[0], ...parsed.data };
  const taskAttributes = {
    ...updatedData,
    impact: 50,
    tags: updatedData.tags || [],
    isRecurring: updatedData.isRecurring ?? false,
    createdAt:
      updatedData.createdAt instanceof Date
        ? updatedData.createdAt.toISOString()
        : updatedData.createdAt,
    deadlineUtc:
      updatedData.deadlineUtc instanceof Date
        ? updatedData.deadlineUtc.toISOString()
        : updatedData.deadlineUtc || null,
  };

  const { score, explanation } = calculatePriorityScore(
    taskAttributes,
    {
      currentTimeUtc: now,
      userTimezone: session.user.timezone,
      energyProfile: context.energyProfile,
      scheduledTasks: [],
      calendarEvents: context.calendarEvents.map((e) => ({
        startUtc: new Date(e.startUtc),
        endUtc: new Date(e.endUtc),
      })),
      workingHours: context.workingHours,
    },
    context.tasks,
    now,
    null
  );

  const updateData = {
    ...parsed.data,
    priorityScore: score,
    scoreExplanation: explanation,
    updatedAt: now,
    deadlineUtc: parsed.data.deadlineUtc ? new Date(parsed.data.deadlineUtc) : null,
  };

  const [updated] = await db
    .update(tasks)
    .set(updateData)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .returning();

  return NextResponse.json({ task: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const confirm = searchParams.get('confirm') === 'true';

  if (!confirm) {
    return NextResponse.json(
      { error: 'Confirmation required', requiresConfirm: true },
      { status: 400 }
    );
  }

  const existing = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
    .limit(1);
  if (!existing[0]) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  await db
    .delete(scheduleBlocks)
    .where(and(eq(scheduleBlocks.taskId, id), eq(scheduleBlocks.userId, session.user.id)));
  await db
    .delete(focusSessions)
    .where(and(eq(focusSessions.taskId, id), eq(focusSessions.userId, session.user.id)));
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
