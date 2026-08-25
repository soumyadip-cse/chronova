import { getWallClock, wallClockToUtc, addWallDays, type TzParts } from '@/lib/tz-utils';
import type { InsightData } from '@/types';

// ---------- Input row contracts (raw, user-scoped DB rows) ----------

export interface InsightsTaskRow {
  id: string;
  title: string;
  status: string;
  deadlineUtc: Date | null;
  estimatedMinutes: number;
  completedAtUtc: Date | null;
  createdAt: Date;
  projectId: string | null;
  subjectId: string | null;
  clientId: string | null;
  founderGoalId: string | null;
}

export interface InsightsSessionRow {
  durationMinutes: number;
  completedAtUtc: Date;
  interrupted: boolean | null;
}

export interface InsightsBlockRow {
  startUtc: Date;
  endUtc: Date;
}

export interface ComputeInsightsInput {
  tasks: InsightsTaskRow[];
  sessions: InsightsSessionRow[];
  blocks: InsightsBlockRow[];
  days: 7 | 30;
  timezone: string;
  nowUtc: Date;
}

// ---------- Internal helpers ----------

function dayKey(parts: TzParts): string {
  const m = String(parts.month).padStart(2, '0');
  const d = String(parts.day).padStart(2, '0');
  return `${parts.year}-${m}-${d}`;
}

function startOfDayUtc(parts: TzParts, timeZone: string): Date {
  return wallClockToUtc(parts.year, parts.month, parts.day, 0, 0, timeZone);
}

/** The last `days` user-calendar days ending today, oldest first. */
function buildDayWindows(
  nowUtc: Date,
  timeZone: string,
  days: number
): Array<{ key: string; startUtc: Date; endUtc: Date }> {
  const today = getWallClock(nowUtc, timeZone);
  return Array.from({ length: days }, (_, i) => {
    const parts = addWallDays(today, -(days - 1 - i));
    return {
      key: dayKey(parts),
      startUtc: startOfDayUtc(parts, timeZone),
      endUtc: startOfDayUtc(addWallDays(parts, 1), timeZone),
    };
  });
}

function inWindow(instant: Date, windowStart: Date): boolean {
  return instant.getTime() >= windowStart.getTime();
}

function domainOf(task: InsightsTaskRow): string {
  if (task.subjectId) return 'Academic';
  if (task.clientId) return 'Client';
  if (task.projectId) return 'Project';
  if (task.founderGoalId) return 'Strategic';
  return 'Unassigned';
}

/** Burnout heuristic thresholds (documented, deterministic):
 *  - high: >20 focus hours in the window AND >40% of sessions interrupted
 *  - medium: >10 focus hours OR >50% interruption ratio (with >=3 sessions)
 *  - low: everything else, including insufficient data (<3 sessions)      */
export function classifyBurnout(
  totalFocusMinutes: number,
  sessions: number,
  interruptedSessions: number
): InsightData['burnoutRisk'] {
  if (sessions < 3) return 'low';
  const ratio = interruptedSessions / sessions;
  const hours = totalFocusMinutes / 60;
  if (hours > 20 && ratio > 0.4) return 'high';
  if (hours > 10 || ratio > 0.5) return 'medium';
  return 'low';
}

// ---------- Main computation ----------

export function computeInsights(input: ComputeInsightsInput): InsightData {
  const { tasks, sessions, blocks, days, timezone, nowUtc } = input;

  // Instant-based filtering window; day bucketing uses the user's calendar.
  const windowStart = new Date(nowUtc.getTime() - days * 24 * 60 * 60 * 1000);

  const dayWindows = buildDayWindows(nowUtc, timezone, days);
  const minutesInDay = new Map<string, number>();
  for (const w of dayWindows) minutesInDay.set(w.key, 0);

  let totalFocusMinutes = 0;
  let interruptedSessions = 0;
  const sessionCount = sessions.length;

  const hourBuckets: Array<{
    hour: number;
    productivity: number;
    confidence: number;
    sessions: number;
  }> = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    productivity: 0,
    confidence: 0,
    sessions: 0,
  }));

  for (const s of sessions) {
    if (!inWindow(s.completedAtUtc, windowStart)) continue;
    const mins = s.durationMinutes;
    totalFocusMinutes += mins;
    if (s.interrupted) interruptedSessions += 1;

    const wall = getWallClock(s.completedAtUtc, timezone);
    const bucket = hourBuckets[wall.hour];
    bucket.productivity += mins;
    bucket.sessions += 1;

    for (const w of dayWindows) {
      if (
        s.completedAtUtc.getTime() >= w.startUtc.getTime() &&
        s.completedAtUtc.getTime() < w.endUtc.getTime()
      ) {
        minutesInDay.set(w.key, (minutesInDay.get(w.key) ?? 0) + mins);
        break;
      }
    }
  }

  // Planned minutes per day come from applied schedule blocks. When the whole
  // window contains no blocks, fall back to estimates of tasks due that day so
  // the planned series still reflects real intent instead of flat zeros.
  let blockMinutesTotal = 0;
  for (const b of blocks)
    blockMinutesTotal += Math.max(0, (b.endUtc.getTime() - b.startUtc.getTime()) / 60000);
  const useBlocksAsPlanned = blockMinutesTotal > 0;

  const plannedVsCompleted: InsightData['plannedVsCompleted'] = dayWindows.map((w) => {
    let planned = 0;
    if (useBlocksAsPlanned) {
      for (const b of blocks) {
        if (
          b.startUtc.getTime() >= w.startUtc.getTime() &&
          b.startUtc.getTime() < w.endUtc.getTime()
        ) {
          planned += Math.max(0, (b.endUtc.getTime() - b.startUtc.getTime()) / 60000);
        }
      }
    } else {
      for (const t of tasks) {
        if (
          t.deadlineUtc &&
          !t.completedAtUtc &&
          t.deadlineUtc.getTime() >= w.startUtc.getTime() &&
          t.deadlineUtc.getTime() < w.endUtc.getTime()
        ) {
          planned += t.estimatedMinutes;
        }
      }
    }
    return { date: w.key, planned: Math.round(planned), completed: minutesInDay.get(w.key) ?? 0 };
  });

  const productiveHours = hourBuckets.map((b) => ({
    hour: b.hour,
    productivity: b.productivity,
    confidence: Math.min(1, b.sessions / 5),
  }));

  // Rollover: per-week count of still-open tasks that were created more than
  // 7 days before that week began (they demonstrably carried over).
  const rolloverPattern: InsightData['rolloverPattern'] = [];
  const weekCount = Math.max(1, Math.floor(days / 7));
  const thisWeek = getWallClock(nowUtc, timezone);
  const openTasks = tasks.filter((t) => t.status !== 'completed');
  for (let w = weekCount - 1; w >= 0; w--) {
    const weekStartParts = addWallDays(thisWeek, -(w * 7 + ((thisWeek.day + 6) % 7)));
    const threshold = addWallDays(weekStartParts, -7);
    const thresholdUtc = startOfDayUtc(threshold, timezone);
    const rolledOver = openTasks.filter(
      (t) => t.createdAt.getTime() <= thresholdUtc.getTime()
    ).length;
    rolloverPattern.push({ date: dayKey(weekStartParts), rolledOver });
  }

  // Workload balance: open estimated hours grouped by task domain.
  const domainMinutes = new Map<string, number>();
  for (const t of openTasks) {
    const label = domainOf(t);
    domainMinutes.set(label, (domainMinutes.get(label) ?? 0) + (t.estimatedMinutes || 0));
  }
  const workloadBalance = Array.from(domainMinutes.entries())
    .map(([category, minutes]) => ({ category, hours: Math.round((minutes / 60) * 10) / 10 }))
    .sort((a, b) => b.hours - a.hours);

  const burnoutRisk = classifyBurnout(totalFocusMinutes, sessionCount, interruptedSessions);

  const tasksCompleted = tasks.filter(
    (t) => t.completedAtUtc && inWindow(t.completedAtUtc, windowStart)
  ).length;
  const bestHour = [...productiveHours].sort((a, b) => b.productivity - a.productivity)[0];
  const overdueOpen = openTasks.filter(
    (t) => t.deadlineUtc && t.deadlineUtc.getTime() <= nowUtc.getTime()
  ).length;
  const topDomain = workloadBalance[0];
  const interruptRatio =
    sessionCount >= 3 ? Math.round((interruptedSessions / sessionCount) * 100) : 0;

  const reflectionParts: string[] = [];
  reflectionParts.push(
    totalFocusMinutes > 0
      ? `You focused for ${Math.round(totalFocusMinutes)} minutes across ${sessionCount} session${sessionCount === 1 ? '' : 's'} and finished ${tasksCompleted} task${tasksCompleted === 1 ? '' : 's'}.`
      : `No focus time recorded in the last ${days} days yet.`
  );
  if (bestHour && bestHour.productivity > 0) {
    const h12 = ((bestHour.hour + 11) % 12) + 1;
    const ampm = bestHour.hour < 12 ? 'am' : 'pm';
    reflectionParts.push(`Your strongest hour was around ${h12}${ampm}.`);
  }
  if (topDomain && topDomain.hours > 0) {
    reflectionParts.push(
      `${topDomain.category} work carries the most open load (${topDomain.hours}h).`
    );
  }
  const weeklyReflection = reflectionParts.join(' ');

  const recommendations: string[] = [];
  if (totalFocusMinutes === 0) {
    recommendations.push(
      'Plan your day in the Planner, then run your first focus session to unlock trends.'
    );
  }
  if (bestHour && bestHour.productivity > 0 && plannedVsCompleted.some((d) => d.planned === 0)) {
    recommendations.push(
      `Schedule deep work near ${((bestHour.hour + 11) % 12) + 1}${bestHour.hour < 12 ? 'am' : 'pm'} — that is when you actually focus best.`
    );
  }
  if (interruptRatio >= 50) {
    recommendations.push(
      'More than half your sessions get interrupted — try shorter 25-minute blocks.'
    );
  }
  if (overdueOpen > 0) {
    recommendations.push(
      `${overdueOpen} open task${overdueOpen === 1 ? ' has' : 's have'} slipped past their deadline — triage or reschedule them.`
    );
  }
  if (recommendations.length === 0) {
    recommendations.push(
      'Balance looks healthy. Keep planning your day and protecting focus blocks.'
    );
  }

  return {
    plannedVsCompleted,
    productiveHours,
    rolloverPattern,
    workloadBalance,
    burnoutRisk,
    weeklyReflection,
    recommendations,
  };
}
