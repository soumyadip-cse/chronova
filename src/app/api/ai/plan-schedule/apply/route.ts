export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { scheduleBlocks, auditLogs } from '@/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import {
  generateScheduleProposal,
  rankTasks,
  DEFAULT_SCHEDULING_HORIZON_DAYS,
} from '@/lib/priority-engine';
import { withAIRateLimit } from '@/lib/with-rate-limit';
import { loadSchedulingData, buildSchedulingContext, buildTaskAttributes } from '../context';

const applySchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1).max(50),
});

// Blocks outside this window are never touched by an apply: they were placed
// deliberately beyond today's planning reach and must survive rebalancing.
function replaceHorizonEnd(from: Date): Date {
  return new Date(from.getTime() + DEFAULT_SCHEDULING_HORIZON_DAYS * 24 * 60 * 60 * 1000);
}

async function handleApplyPlan(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Dedupe while preserving the author's intent; duplicates carry no meaning.
  const requestedIds = Array.from(new Set(parsed.data.taskIds));
  const userId = session.user.id;
  const userTimezone = session.user.timezone || 'UTC';

  const data = await loadSchedulingData(userId);

  const now = new Date();
  const horizonEnd = replaceHorizonEnd(now);

  // Partition existing blocks:
  //   KEEP    — locked, completed, already past, or placed beyond the replace
  //             horizon. They stay on the calendar AND stay busy.
  //   REPLACE — unlocked future blocks inside the horizon. Re-applying replaces
  //             them with the freshly computed plan.
  const keepBlocks = data.scheduleBlocks.filter(
    (b) =>
      b.isLocked || b.isCompleted || new Date(b.endUtc) <= now || new Date(b.startUtc) >= horizonEnd
  );
  const replaceBlockIds = data.scheduleBlocks
    .filter((b) => !keepBlocks.includes(b))
    .map((b) => b.id);

  // Recompute from LIVE state: kept blocks + real calendar events are busy, so
  // the engine can never propose overlaps with protected time.
  const context = buildSchedulingContext(data, {
    userTimezone,
    scheduledTasks: keepBlocks.map((b) => ({
      id: b.id,
      startUtc: new Date(b.startUtc),
      endUtc: new Date(b.endUtc),
      energyRequired: 'balanced' as const,
    })),
  });

  const ranked = rankTasks(buildTaskAttributes(data.userTasks), context, context.currentTimeUtc);
  const plan = generateScheduleProposal(ranked, context);

  const scheduledById = new Map(plan.scheduled.map((p) => [p.taskId, p]));
  const unschedulableById = new Map(plan.unschedulable.map((u) => [u.taskId, u]));
  const skippedById = new Map(plan.skipped.map((s) => [s.taskId, s]));

  const taskById = new Map(data.userTasks.map((t) => [t.id, t]));
  const appliedRows: Array<{
    taskId: string;
    startUtc: Date;
    endUtc: Date;
    priorityScore: number;
  }> = [];
  const failed: Array<{ taskId: string; reason: string }> = [];

  for (const taskId of requestedIds) {
    const proposal = scheduledById.get(taskId);
    if (!proposal) {
      if (unschedulableById.has(taskId)) {
        failed.push({
          taskId,
          reason: unschedulableById.get(taskId)!.reason,
        });
      } else if (skippedById.has(taskId)) {
        failed.push({ taskId, reason: 'already_completed' });
      } else {
        failed.push({ taskId, reason: 'not_schedulable' });
      }
      continue;
    }

    // Defense-in-depth deadline re-check against live data before persisting.
    const deadline = taskById.get(taskId)?.deadlineUtc;
    if (deadline && new Date(proposal.endUtc) > new Date(deadline)) {
      failed.push({ taskId, reason: 'past_deadline' });
      continue;
    }

    appliedRows.push({
      taskId,
      startUtc: proposal.startUtc,
      endUtc: proposal.endUtc,
      priorityScore: proposal.priorityScore,
    });
  }

  if (appliedRows.length === 0) {
    return NextResponse.json({ applied: [], failed });
  }

  try {
    const inserted = await db.transaction(async (tx) => {
      if (replaceBlockIds.length > 0) {
        await tx
          .delete(scheduleBlocks)
          .where(
            and(eq(scheduleBlocks.userId, userId), inArray(scheduleBlocks.id, replaceBlockIds))
          );
      }

      const rows = await tx
        .insert(scheduleBlocks)
        .values(
          appliedRows.map((r) => ({
            userId,
            taskId: r.taskId,
            startUtc: r.startUtc,
            endUtc: r.endUtc,
          }))
        )
        .returning({
          id: scheduleBlocks.id,
          taskId: scheduleBlocks.taskId,
          startUtc: scheduleBlocks.startUtc,
          endUtc: scheduleBlocks.endUtc,
        });

      await tx.insert(auditLogs).values({
        userId,
        action: 'schedule_change',
        metadataJson: {
          source: 'ai_plan_apply',
          appliedCount: rows.length,
          replacedCount: replaceBlockIds.length,
          taskIds: appliedRows.map((r) => r.taskId),
        },
      });

      return rows;
    });

    return NextResponse.json({
      applied: inserted.map((row) => ({
        taskId: row.taskId!,
        blockId: row.id,
        startUtc: row.startUtc.toISOString(),
        endUtc: row.endUtc.toISOString(),
      })),
      failed,
    });
  } catch (error) {
    console.error('Failed to persist schedule blocks:', error);
    return NextResponse.json(
      { error: 'Unable to save your schedule right now. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withAIRateLimit(handleApplyPlan);
