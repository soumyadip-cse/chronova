import { describe, it, expect } from 'vitest';
import { generateScheduleProposal, calculateEnergyMatch } from '@/lib/priority-engine';
import type { SchedulingContext, TaskAttributes, SchedulePlanResult } from '@/lib/priority-engine';
import { getWallClock } from '@/lib/tz-utils';

const BASE_TIME = new Date('2024-01-15T12:00:00Z'); // Monday

const createContext = (overrides: Partial<SchedulingContext> = {}): SchedulingContext => ({
  currentTimeUtc: BASE_TIME,
  userTimezone: 'UTC',
  energyProfile: { morning: 0.8, afternoon: 0.5, evening: 0.3 },
  scheduledTasks: [],
  calendarEvents: [],
  workingHours: { start: '09:00', end: '17:00' },
  ...overrides,
});

const createTask = (overrides: Partial<TaskAttributes> = {}): TaskAttributes => ({
  id: 'task-1',
  deadlineUtc: null,
  priorityFlag: 'medium',
  estimatedMinutes: 30,
  energyRequired: 'balanced',
  impact: 50,
  tags: [],
  projectId: null,
  subjectId: null,
  clientId: null,
  deliverableId: null,
  founderGoalId: null,
  isRecurring: false,
  status: 'inbox',
  createdAt: '2024-01-14T08:00:00.000Z',
  ...overrides,
});

describe('Scheduling engine (Phase 5)', () => {
  describe('A. UTC user working-hours placement', () => {
    it('places a task immediately when inside the working window', () => {
      const result = generateScheduleProposal([createTask()], createContext());
      expect(result.scheduled).toHaveLength(1);
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-01-15T12:00:00.000Z');
      expect(result.scheduled[0].endUtc.toISOString()).toBe('2024-01-15T12:30:00.000Z');
    });

    it('waits for the working window to open when scheduled before it', () => {
      const ctx = createContext({ currentTimeUtc: new Date('2024-01-15T07:00:00Z') });
      const result = generateScheduleProposal([createTask()], ctx);
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-01-15T09:00:00.000Z');
    });
  });

  describe('B. Non-UTC user working-hours placement', () => {
    it('interprets 09:00-17:00 as New York wall clock (EST = UTC-5)', () => {
      const ctx = createContext({
        userTimezone: 'America/New_York',
        // 08:00 EST — one hour before the window opens
        currentTimeUtc: new Date('2024-01-15T13:00:00Z'),
      });
      const result = generateScheduleProposal([createTask()], ctx);
      // 09:00 EST == 14:00Z, NOT 09:00Z
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-01-15T14:00:00.000Z');
    });
  });

  describe('C. DST transition', () => {
    it('rolls across the spring-forward boundary using the new local offset', () => {
      const ctx = createContext({
        userTimezone: 'America/New_York',
        // Sat 2024-03-09 16:30 EST — inside the window, but a 60-min task
        // would end at 17:30 EST which exceeds the window.
        currentTimeUtc: new Date('2024-03-09T21:30:00Z'),
      });
      const result = generateScheduleProposal([createTask({ estimatedMinutes: 60 })], ctx);
      // Next viable start: Sun 2024-03-10 09:00 *EDT* (UTC-4) == 13:00Z.
      // Pre-DST offset would have produced 14:00Z.
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-03-10T13:00:00.000Z');
      const wall = getWallClock(result.scheduled[0].startUtc, 'America/New_York');
      expect(wall.day).toBe(10);
      expect(wall.hour).toBe(9);
    });
  });

  describe('D. Energy bucket timezone correctness', () => {
    it('buckets by the user wall clock, not UTC', () => {
      const slot = new Date('2024-01-15T10:00:00Z'); // 19:00 in Tokyo

      const tokyoCtx = createContext({
        userTimezone: 'Asia/Tokyo',
        energyProfile: { morning: 0.9, afternoon: 0.5, evening: 0.3 },
      });
      // 19:00 JST is evening (0.3); high-energy task (0.9) mismatches -> 40
      expect(calculateEnergyMatch('high', tokyoCtx, slot)).toBe(40);

      const utcCtx = createContext({
        userTimezone: 'UTC',
        energyProfile: { morning: 0.9, afternoon: 0.5, evening: 0.3 },
      });
      // 10:00 UTC is morning (0.9); perfect match -> 100
      expect(calculateEnergyMatch('high', utcCtx, slot)).toBe(100);
    });

    it('schedules high-energy work into the user-local morning peak', () => {
      const ctx = createContext({
        userTimezone: 'Asia/Tokyo',
        currentTimeUtc: new Date('2024-01-15T00:30:00Z'), // 09:30 JST
        energyProfile: { morning: 0.95, afternoon: 0.5, evening: 0.3 },
      });
      const highTask = createTask({ id: 'high', energyRequired: 'high' });
      const lowTask = createTask({ id: 'low', energyRequired: 'low' });
      const result = generateScheduleProposal([lowTask, highTask], ctx);
      // High-energy task scores higher in the JST morning peak and goes first.
      expect(result.scheduled[0].taskId).toBe('high');
    });
  });

  describe('E. Calendar event conflict', () => {
    it('jumps past an event that overlaps the current time', () => {
      const ctx = createContext({
        calendarEvents: [
          {
            startUtc: new Date('2024-01-15T12:00:00Z'),
            endUtc: new Date('2024-01-15T13:00:00Z'),
          },
        ],
      });
      const result = generateScheduleProposal([createTask()], ctx);
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-01-15T13:00:00.000Z');
    });
  });

  describe('F. ScheduleBlock conflict', () => {
    it('treats existing schedule blocks as busy time', () => {
      const ctx = createContext({
        scheduledTasks: [
          {
            id: 'block-1',
            startUtc: new Date('2024-01-15T12:00:00Z'),
            endUtc: new Date('2024-01-15T13:30:00Z'),
            energyRequired: 'balanced' as const,
          },
        ],
      });
      const result = generateScheduleProposal([createTask()], ctx);
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-01-15T13:30:00.000Z');
    });

    it('treats calendar events and schedule blocks identically', () => {
      const withEvent = createContext({
        calendarEvents: [
          { startUtc: new Date('2024-01-15T12:00:00Z'), endUtc: new Date('2024-01-15T13:00:00Z') },
        ],
      });
      const withBlock = createContext({
        scheduledTasks: [
          {
            id: 'block-1',
            startUtc: new Date('2024-01-15T12:00:00Z'),
            endUtc: new Date('2024-01-15T13:00:00Z'),
            energyRequired: 'balanced' as const,
          },
        ],
      });
      const r1 = generateScheduleProposal([createTask()], withEvent);
      const r2 = generateScheduleProposal([createTask()], withBlock);
      expect(r1.scheduled[0].startUtc.toISOString()).toBe(r2.scheduled[0].startUtc.toISOString());
    });
  });

  describe('G. Midnight-spanning event conflict', () => {
    it('detects an event that begins the previous day and spills into the window', () => {
      const ctx = createContext({
        // Starts 20:00Z on Jan 15 (outside today's window), crosses midnight,
        // and blocks the first half of Jan 16's 09:00 window.
        calendarEvents: [
          {
            startUtc: new Date('2024-01-15T20:00:00Z'),
            endUtc: new Date('2024-01-16T09:30:00Z'),
          },
        ],
        currentTimeUtc: new Date('2024-01-15T20:00:00Z'),
      });
      const result = generateScheduleProposal([createTask()], ctx);
      // Naive day-bucketed queries miss this event entirely; overlap math does not.
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-01-16T09:30:00.000Z');
    });
  });

  describe('H. Working-hours rollover to next valid day', () => {
    it('moves to the next day when the duration exceeds the remaining window', () => {
      const ctx = createContext({
        // Friday 16:30 UTC; a 120-min task cannot finish by 17:00.
        currentTimeUtc: new Date('2024-01-19T16:30:00Z'),
      });
      const result = generateScheduleProposal([createTask({ estimatedMinutes: 120 })], ctx);
      // The engine has no weekend policy: the next calendar day is used.
      expect(result.scheduled[0].startUtc.toISOString()).toBe('2024-01-20T09:00:00.000Z');
    });
  });

  describe('I. Deadline-feasible placement', () => {
    it('accepts a placement that completes before the deadline', () => {
      const result = generateScheduleProposal(
        [createTask({ deadlineUtc: '2024-01-15T13:00:00.000Z' })],
        createContext()
      );
      expect(result.unschedulable).toHaveLength(0);
      expect(result.scheduled[0].endUtc.toISOString()).toBe('2024-01-15T12:30:00.000Z');
    });
  });

  describe('J. Deadline-impossible task', () => {
    it('rejects a task whose earliest completion falls after its deadline', () => {
      const ctx = createContext({
        calendarEvents: [
          // Fills the entire remaining working window today.
          {
            startUtc: new Date('2024-01-15T12:00:00Z'),
            endUtc: new Date('2024-01-15T17:00:00Z'),
          },
        ],
      });
      const result = generateScheduleProposal(
        [
          createTask({
            id: 'doomed',
            estimatedMinutes: 60,
            deadlineUtc: '2024-01-15T23:00:00.000Z',
          }),
        ],
        ctx
      );
      expect(result.scheduled).toHaveLength(0);
      expect(result.unschedulable).toHaveLength(1);
      expect(result.unschedulable[0]).toMatchObject({
        taskId: 'doomed',
        reason: 'past_deadline',
      });
      expect(result.unschedulable[0].details).toMatchObject({
        overdueAtScheduleTime: false,
        deadlineUtc: '2024-01-15T23:00:00.000Z',
      });
      expect(
        typeof (result.unschedulable[0].details as Record<string, unknown>).earliestCompletionUtc
      ).toBe('string');
    });
  });

  describe('K. Already-overdue task', () => {
    it('classifies overdue-at-entry distinctly from deadline-impossible', () => {
      const result = generateScheduleProposal(
        [createTask({ id: 'late', deadlineUtc: '2024-01-15T11:00:00.000Z' })],
        createContext()
      );
      expect(result.scheduled).toHaveLength(0);
      expect(result.unschedulable[0]).toMatchObject({
        taskId: 'late',
        reason: 'past_deadline',
      });
      expect(result.unschedulable[0].details).toMatchObject({
        overdueAtScheduleTime: true,
        deadlineUtc: '2024-01-15T11:00:00.000Z',
      });
    });

    it('preserves the no-deadline distinction (never classified as past_deadline)', () => {
      const result = generateScheduleProposal([createTask({ deadlineUtc: null })], createContext());
      expect(result.unschedulable).toHaveLength(0);
      expect(result.scheduled).toHaveLength(1);
    });
  });

  describe('L. Conflict exhaustion', () => {
    it('reports conflict_exhausted when conflicts consume the range before an in-horizon deadline', () => {
      const ctx = createContext({
        calendarEvents: [
          {
            startUtc: new Date('2024-01-15T12:00:00Z'),
            // Extends beyond the default 14-day horizon.
            endUtc: new Date('2024-02-05T00:00:00Z'),
          },
        ],
      });
      const result = generateScheduleProposal(
        [
          createTask({
            id: 'boxed-in',
            deadlineUtc: '2024-01-16T12:00:00.000Z',
          }),
        ],
        ctx
      );
      expect(result.scheduled).toHaveLength(0);
      expect(result.unschedulable[0]).toMatchObject({
        taskId: 'boxed-in',
        reason: 'conflict_exhausted',
      });
    });
  });

  describe('M. Scheduling horizon exhaustion', () => {
    it('bounds the search deterministically and reports exceeds_horizon', () => {
      const ctx = createContext({
        calendarEvents: [
          {
            startUtc: new Date('2024-01-15T12:00:00Z'),
            endUtc: new Date('2024-06-01T00:00:00Z'),
          },
        ],
      });
      const result = generateScheduleProposal(
        [createTask({ id: 'far-out', deadlineUtc: null })],
        ctx
      );
      expect(result.scheduled).toHaveLength(0);
      expect(result.unschedulable[0]).toMatchObject({
        taskId: 'far-out',
        reason: 'exceeds_horizon',
      });
      expect(result.unschedulable[0].details).toMatchObject({ horizonDays: 14 });
      expect(
        typeof (result.unschedulable[0].details as Record<string, unknown>).horizonEndUtc
      ).toBe('string');
    });

    it('honors an explicit shorter horizon', () => {
      const ctx = createContext({
        calendarEvents: [
          {
            startUtc: new Date('2024-01-15T12:00:00Z'),
            endUtc: new Date('2024-01-17T00:00:00Z'),
          },
        ],
      });
      const result = generateScheduleProposal([createTask({ id: 'tight' })], ctx, 50, {
        horizonDays: 1,
      });
      expect(result.unschedulable[0]).toMatchObject({
        taskId: 'tight',
        reason: 'exceeds_horizon',
      });
      expect(result.unschedulable[0].details).toMatchObject({ horizonDays: 1 });
    });
  });

  describe('N. no_working_window classification', () => {
    it('classifies every pending task when working hours are invalid', () => {
      const ctx = createContext({ workingHours: { start: '17:00', end: '09:00' } });
      const result = generateScheduleProposal(
        [createTask({ id: 'a' }), createTask({ id: 'b' })],
        ctx
      );
      expect(result.scheduled).toHaveLength(0);
      expect(result.unschedulable.map((u) => u.reason)).toEqual([
        'no_working_window',
        'no_working_window',
      ]);
    });

    it('classifies tasks longer than the daily window', () => {
      const result = generateScheduleProposal(
        [createTask({ id: 'marathon', estimatedMinutes: 600 })],
        createContext()
      );
      expect(result.scheduled).toHaveLength(0);
      expect(result.unschedulable[0]).toMatchObject({
        taskId: 'marathon',
        reason: 'no_working_window',
      });
      expect(result.unschedulable[0].details).toMatchObject({
        estimatedMinutes: 600,
        dailyWindowMinutes: 480,
      });
    });
  });

  describe('O. Every input task accounted for', () => {
    it('routes each task into exactly one of scheduled/unschedulable/skipped', () => {
      const tasks = [
        createTask({ id: 'done-1', status: 'completed' }),
        createTask({ id: 'done-2', status: 'completed' }),
        createTask({ id: 'fit-1' }),
        createTask({ id: 'fit-2', estimatedMinutes: 45 }),
        createTask({ id: 'overdue', deadlineUtc: '2024-01-15T10:00:00.000Z' }),
        createTask({ id: 'too-big', estimatedMinutes: 900 }),
      ];
      const result = generateScheduleProposal(tasks, createContext());
      const accounted = [
        ...result.scheduled.map((p) => p.taskId),
        ...result.unschedulable.map((u) => u.taskId),
        ...result.skipped.map((s) => s.taskId),
      ];
      expect(accounted).toHaveLength(tasks.length);
      expect(new Set(accounted)).toEqual(new Set(tasks.map((t) => t.id)));
    });

    it('leaves a deterministic gap between consecutive placements', () => {
      const result = generateScheduleProposal(
        [createTask({ id: 'first' }), createTask({ id: 'second' })],
        createContext()
      );
      const [first, second] = result.scheduled;
      expect(first.endUtc.toISOString()).toBe('2024-01-15T12:30:00.000Z');
      expect(second.startUtc.toISOString()).toBe('2024-01-15T12:40:00.000Z');
    });
  });

  describe('P/Q. Determinism and stability', () => {
    const buildBatch = () => [
      createTask({
        id: 'urgent',
        priorityFlag: 'critical',
        deadlineUtc: '2024-01-15T14:00:00.000Z',
      }),
      createTask({ id: 'chill', priorityFlag: 'low', impact: 10 }),
      createTask({ id: 'mid', priorityFlag: 'medium', estimatedMinutes: 90 }),
      createTask({ id: 'blocked' }),
    ];
    const conflictedCtx = () =>
      createContext({
        calendarEvents: [
          { startUtc: new Date('2024-01-15T12:00:00Z'), endUtc: new Date('2024-01-15T13:00:00Z') },
        ],
      });

    it('produces identical output for identical input (P)', () => {
      const a = generateScheduleProposal(buildBatch(), conflictedCtx());
      const b = generateScheduleProposal(buildBatch(), conflictedCtx());
      expect(serialize(a)).toBe(serialize(b));
    });

    it('keeps ordering stable across repeated runs (Q)', () => {
      const orders = Array.from({ length: 5 }, () =>
        generateScheduleProposal(buildBatch(), conflictedCtx())
          .scheduled.map((p) => p.taskId)
          .join(',')
      );
      expect(new Set(orders).size).toBe(1);
      expect(orders[0]).toBe('urgent,mid,blocked,chill');
    });
  });

  function serialize(result: SchedulePlanResult): string {
    return JSON.stringify({
      scheduled: result.scheduled.map((p) => ({
        taskId: p.taskId,
        start: p.startUtc.toISOString(),
        end: p.endUtc.toISOString(),
        score: p.priorityScore,
      })),
      unschedulable: result.unschedulable,
      skipped: result.skipped,
    });
  }
});
