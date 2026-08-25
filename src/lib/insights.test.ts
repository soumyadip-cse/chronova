import { describe, it, expect } from 'vitest';
import { computeInsights, classifyBurnout } from './insights';
import type { InsightsTaskRow, InsightsSessionRow, InsightsBlockRow } from './insights';

const TZ_UTC = 'UTC';
const NOW_UTC = new Date('2026-08-25T12:00:00Z');

function makeTask(overrides: Partial<InsightsTaskRow> = {}): InsightsTaskRow {
  return {
    id: overrides.id ?? 'task-1',
    title: 'Task',
    status: 'inbox',
    deadlineUtc: null,
    estimatedMinutes: 60,
    completedAtUtc: null,
    createdAt: new Date('2026-08-24T09:00:00Z'),
    projectId: null,
    subjectId: null,
    clientId: null,
    founderGoalId: null,
    ...overrides,
  };
}

function makeSession(overrides: Partial<InsightsSessionRow> = {}): InsightsSessionRow {
  return {
    durationMinutes: 50,
    completedAtUtc: new Date('2026-08-24T10:00:00Z'),
    interrupted: false,
    ...overrides,
  };
}

function makeBlock(overrides: Partial<InsightsBlockRow> = {}): InsightsBlockRow {
  return {
    startUtc: new Date('2026-08-24T09:00:00Z'),
    endUtc: new Date('2026-08-24T10:00:00Z'),
    ...overrides,
  };
}

describe('computeInsights', () => {
  it('produces an honest empty state with zero data', () => {
    const out = computeInsights({
      tasks: [],
      sessions: [],
      blocks: [],
      days: 7,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    expect(out.plannedVsCompleted).toHaveLength(7);
    expect(out.plannedVsCompleted.every((d) => d.planned === 0 && d.completed === 0)).toBe(true);
    expect(out.productiveHours.every((h) => h.productivity === 0)).toBe(true);
    expect(out.burnoutRisk).toBe('low');
    expect(out.weeklyReflection).toMatch(/No focus time recorded/i);
    expect(out.recommendations.some((r) => r.length > 0)).toBe(true);
  });

  it('aggregates sessions within a 7-day window only', () => {
    const inside = makeSession({
      durationMinutes: 40,
      completedAtUtc: new Date('2026-08-24T10:00:00Z'),
    });
    const outside = makeSession({
      durationMinutes: 999,
      completedAtUtc: new Date('2026-07-01T10:00:00Z'),
    });

    const out = computeInsights({
      tasks: [],
      sessions: [inside, outside],
      blocks: [],
      days: 7,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    const totalCompleted = out.plannedVsCompleted.reduce((sum, d) => sum + d.completed, 0);
    expect(totalCompleted).toBe(40);
  });

  it('aggregates across a full 30-day window', () => {
    const sessions = [
      makeSession({ durationMinutes: 30, completedAtUtc: new Date('2026-08-01T10:00:00Z') }),
      makeSession({ durationMinutes: 20, completedAtUtc: new Date('2026-08-24T10:00:00Z') }),
    ];

    const out = computeInsights({
      tasks: [],
      sessions,
      blocks: [],
      days: 30,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    expect(out.plannedVsCompleted).toHaveLength(30);
    const total = out.plannedVsCompleted.reduce((sum, d) => sum + d.completed, 0);
    expect(total).toBe(50);
  });

  it('buckets productive hours by USER wall clock, not UTC', () => {
    // 18:00 UTC is 23:30 in Asia/Kolkata (+5:30) on the same date.
    const session = makeSession({
      durationMinutes: 25,
      completedAtUtc: new Date('2026-08-10T18:00:00Z'),
    });

    const out = computeInsights({
      tasks: [],
      sessions: [session],
      blocks: [],
      days: 30,
      timezone: 'Asia/Kolkata',
      nowUtc: NOW_UTC,
    });

    expect(out.productiveHours[23].productivity).toBe(25);
    expect(out.productiveHours[18].productivity).toBe(0);
  });

  it('handles DST correctly when bucketing calendar days', () => {
    // 02:00 UTC in July = 22:00 EDT (UTC-4) on the PREVIOUS New York day.
    const summer = makeSession({
      durationMinutes: 30,
      completedAtUtc: new Date('2026-07-15T02:00:00Z'),
    });
    // 05:00 UTC in January = 00:00 EST (UTC-5) that same day.
    const winter = makeSession({
      durationMinutes: 45,
      completedAtUtc: new Date('2026-01-15T05:00:00Z'),
    });

    const summerOut = computeInsights({
      tasks: [],
      sessions: [summer],
      blocks: [],
      days: 7,
      timezone: 'America/New_York',
      nowUtc: new Date('2026-07-20T12:00:00Z'),
    });
    const byKeySummer = Object.fromEntries(
      summerOut.plannedVsCompleted.map((d) => [d.date, d.completed])
    );
    expect(byKeySummer['2026-07-14']).toBe(30);
    expect(byKeySummer['2026-07-15'] ?? 0).toBe(0);

    const winterOut = computeInsights({
      tasks: [],
      sessions: [winter],
      blocks: [],
      days: 7,
      timezone: 'America/New_York',
      nowUtc: new Date('2026-01-20T12:00:00Z'),
    });
    const byKeyWinter = Object.fromEntries(
      winterOut.plannedVsCompleted.map((d) => [d.date, d.completed])
    );
    expect(byKeyWinter['2026-01-15']).toBe(45);
    expect(byKeyWinter['2026-01-14']).toBe(0);
  });

  it('uses applied blocks as planned minutes when present', () => {
    const out = computeInsights({
      tasks: [makeTask({ deadlineUtc: new Date('2026-08-24T17:00:00Z') })],
      sessions: [],
      blocks: [makeBlock()],
      days: 7,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    const day24 = out.plannedVsCompleted.find((d) => d.date === '2026-08-24');
    expect(day24?.planned).toBe(60); // from the block
  });

  it('falls back to open-task due estimates when no blocks exist', () => {
    const out = computeInsights({
      tasks: [makeTask({ deadlineUtc: new Date('2026-08-24T17:00:00Z'), estimatedMinutes: 90 })],
      sessions: [],
      blocks: [],
      days: 7,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    const day24 = out.plannedVsCompleted.find((d) => d.date === '2026-08-24');
    expect(day24?.planned).toBe(90);
  });

  it('counts rollover as still-open tasks created over a week before each week start', () => {
    const oldOpen = makeTask({ id: 'old-open', createdAt: new Date('2026-06-01T00:00:00Z') });
    const recentOpen = makeTask({ id: 'recent-open', createdAt: new Date('2026-08-20T00:00:00Z') });
    const oldDone = makeTask({
      id: 'old-done',
      createdAt: new Date('2026-06-01T00:00:00Z'),
      status: 'completed',
      completedAtUtc: new Date('2026-08-23T00:00:00Z'),
    });

    const out = computeInsights({
      tasks: [oldOpen, recentOpen, oldDone],
      sessions: [],
      blocks: [],
      days: 7,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    // Single week bucket for a 7-day window.
    expect(out.rolloverPattern).toHaveLength(1);
    // Only oldOpen qualifies: recent is young, oldDone is closed.
    expect(out.rolloverPattern[0].rolledOver).toBe(1);
  });

  it('groups open workload by domain with real estimates', () => {
    const out = computeInsights({
      tasks: [
        makeTask({ projectId: 'p1', estimatedMinutes: 120 }),
        makeTask({ clientId: 'c1', estimatedMinutes: 60 }),
        makeTask({ subjectId: 's1', estimatedMinutes: 30 }),
      ],
      sessions: [],
      blocks: [],
      days: 7,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    expect(out.workloadBalance).toEqual([
      { category: 'Project', hours: 2 },
      { category: 'Client', hours: 1 },
      { category: 'Academic', hours: 0.5 },
    ]);
  });

  it('grounds the weekly reflection and recommendations in computed numbers', () => {
    const out = computeInsights({
      tasks: [makeTask({ deadlineUtc: new Date('2026-08-20T00:00:00Z') })], // overdue
      sessions: [makeSession({ durationMinutes: 60 }), makeSession(), makeSession()],
      blocks: [],
      days: 7,
      timezone: TZ_UTC,
      nowUtc: NOW_UTC,
    });

    expect(out.weeklyReflection).toMatch(/160 minutes across 3 sessions/);
    expect(out.recommendations.some((r) => r.match(/slipped past their deadline/i))).toBe(true);
  });
});

describe('classifyBurnout thresholds', () => {
  it('returns low when there are fewer than 3 sessions', () => {
    expect(classifyBurnout(2000, 2, 2)).toBe('low');
  });

  it('requires both high volume AND high interruption ratio for high risk', () => {
    expect(classifyBurnout(1300, 10, 5)).toBe('high'); // ~21.7h, 50%
    expect(classifyBurnout(1300, 10, 3)).not.toBe('high'); // 30% ratio
    expect(classifyBurnout(300, 10, 9)).not.toBe('high'); // 5h only
  });

  it('returns medium on volume OR interruption alone', () => {
    expect(classifyBurnout(700, 10, 0)).toBe('medium'); // ~11.7h, 0% interrupts
    expect(classifyBurnout(300, 10, 6)).toBe('medium'); // 60% interrupts
  });

  it('returns low under all thresholds', () => {
    expect(classifyBurnout(300, 10, 3)).toBe('low');
  });
});
