export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateScheduleProposal, rankTasks, SchedulingContext } from '@/lib/priority-engine';
import { withAIRateLimit } from '@/lib/with-rate-limit';
import { userDayBounds } from '@/lib/tz-utils';
import { z } from 'zod';
import {
  loadSchedulingData,
  blocksToScheduledTasks,
  buildSchedulingContext,
  buildTaskAttributes,
} from './context';

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
  const data = await loadSchedulingData(session.user.id, {
    startUtc: dayStartUtc,
    endUtc: dayEndUtc,
  });

  const context: SchedulingContext = buildSchedulingContext(data, {
    userTimezone,
    scheduledTasks: blocksToScheduledTasks(
      data.scheduleBlocks.map((b) => ({ id: b.id, startUtc: b.startUtc, endUtc: b.endUtc }))
    ),
  });

  const ranked = rankTasks(buildTaskAttributes(data.userTasks), context, context.currentTimeUtc);
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
