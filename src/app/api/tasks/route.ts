export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const dynamicParams = false;
export const preferredRegion = 'auto';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { tasks, scheduleBlocks, calendarEvents, userProfiles } from '@/db/schema';
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm';
import { z } from 'zod';
import { calculatePriorityScore, rankTasks, generateScheduleProposal } from '@/lib/priority-engine';
import { parseTaskWithAI, parseTaskInputSchema } from '@/lib/ai-task-parser';
import { sanitizeTaskDescription, sanitizeUserInput } from '@/lib/sanitize';

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  deadlineUtc: z.string().datetime().optional().nullable(),
  priorityFlag: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  estimatedMinutes: z.number().int().positive().max(1440).default(30),
  energyRequired: z.enum(['low', 'balanced', 'high']).default('balanced'),
  projectId: z.string().uuid().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  deliverableId: z.string().uuid().optional().nullable(),
  founderGoalId: z.string().uuid().optional().nullable(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['inbox', 'today', 'upcoming', 'completed', 'overdue']).default('inbox'),
  isRecurring: z.boolean().default(false),
  recurrenceRuleId: z.string().uuid().optional().nullable(),
});

const updateTaskSchema = createTaskSchema.partial();

async function getUserContext(userId: string) {
  const [profile, userTasks, calEvents] = await Promise.all([
    db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, userId) }),
    db.select().from(tasks).where(eq(tasks.userId, userId)),
    db.select().from(calendarEvents).where(eq(calendarEvents.userId, userId)),
  ]);

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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = parseInt(searchParams.get('offset') || '0');

  const where = eq(tasks.userId, session.user.id);
  const statusFilter = status ? eq(tasks.status, status as any) : undefined;

  const userTasks = await db
    .select()
    .from(tasks)
    .where(statusFilter ? and(where, statusFilter) : where)
    .orderBy(desc(tasks.priorityScore), asc(tasks.deadlineUtc))
    .limit(limit)
    .offset(offset);

  return NextResponse.json({ tasks: userTasks });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Sanitize user inputs
  const sanitizedData = {
    ...parsed.data,
    title: sanitizeUserInput(parsed.data.title, 500),
    description: parsed.data.description
      ? sanitizeTaskDescription(parsed.data.description)
      : undefined,
  };

  const context = await getUserContext(session.user.id);
  const now = new Date();

  const taskAttributes = {
    ...sanitizedData,
    id: crypto.randomUUID(),
    impact: 50,
    createdAt: now.toISOString(),
    deadlineUtc: sanitizedData.deadlineUtc || null,
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

  const insertData = {
    userId: session.user.id,
    ...sanitizedData,
    priorityScore: score,
    scoreExplanation: explanation,
    impact: 50,
    deadlineUtc: sanitizedData.deadlineUtc ? new Date(sanitizedData.deadlineUtc) : null,
  };

  const [newTask] = await db.insert(tasks).values(insertData).returning();

  return NextResponse.json({ task: newTask }, { status: 201 });
}
