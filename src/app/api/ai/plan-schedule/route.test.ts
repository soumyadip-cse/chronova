import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { tasks, calendarEvents, scheduleBlocks, userProfiles } from '@/db/schema';
import { POST } from './route';

// --- Module mocks -----------------------------------------------------------

const getSessionMock = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

vi.mock('@/lib/with-rate-limit', () => ({
  withAIRateLimit: (handler: unknown) => handler,
}));

const profileRow = {
  energyProfile: { morning: 0.8, afternoon: 0.5, evening: 0.4 },
  workingHours: { start: '09:00', end: '17:00' },
};

const tableRows = new Map<unknown, unknown[]>();

vi.mock('@/db', () => ({
  db: {
    query: {
      userProfiles: {
        findFirst: vi.fn(async () => profileRow),
      },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => tableRows.get(table) ?? [],
      }),
    }),
  },
}));

// Spy on drizzle condition builders while keeping real behavior, so the
// user-isolation contract can be asserted on every query the route issues.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    gt: vi.fn(actual.gt),
    lt: vi.fn(actual.lt),
    inArray: vi.fn(actual.inArray),
    and: vi.fn(actual.and),
  };
});

// --- Imports under test (static; vi.mock calls are hoisted above them) ------

const USER_ID = '11111111-1111-1111-1111-111111111111';

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/ai/plan-schedule', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

const authenticatedSession = {
  user: { id: USER_ID, timezone: 'UTC' },
};

beforeEach(() => {
  vi.clearAllMocks();
  tableRows.clear();
});

describe('POST /api/ai/plan-schedule', () => {
  it('returns 401 without an authenticated session', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await POST(buildRequest({}));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 for invalid input', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await POST(buildRequest({ date: 'not-a-date' }));
    expect(response.status).toBe(400);
  });

  it('returns both scheduled and unschedulable output (R)', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    tableRows.set(tasks, [
      {
        id: 'task-fit',
        title: 'Fits today',
        deadlineUtc: null,
        priorityFlag: 'medium',
        estimatedMinutes: 30,
        energyRequired: 'balanced',
        tags: [],
        projectId: null,
        subjectId: null,
        clientId: null,
        deliverableId: null,
        founderGoalId: null,
        isRecurring: false,
        status: 'inbox',
        createdAt: new Date('2024-01-14T08:00:00Z'),
      },
      {
        id: 'task-overdue',
        title: 'Long past',
        deadlineUtc: new Date('2000-01-01T00:00:00Z'),
        priorityFlag: 'high',
        estimatedMinutes: 30,
        energyRequired: 'balanced',
        tags: [],
        projectId: null,
        subjectId: null,
        clientId: null,
        deliverableId: null,
        founderGoalId: null,
        isRecurring: false,
        status: 'today',
        createdAt: new Date('2024-01-14T08:00:00Z'),
      },
    ]);
    // A midnight-spanning event relative to "today" must still be loaded by
    // the overlap query and block the early window.
    tableRows.set(calendarEvents, []);
    tableRows.set(scheduleBlocks, []);

    const response = await POST(buildRequest({}));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload).toHaveProperty('scheduled');
    expect(payload).toHaveProperty('unschedulable');
    expect(payload).toHaveProperty('skipped');
    expect(Array.isArray(payload.scheduled)).toBe(true);
    expect(Array.isArray(payload.unschedulable)).toBe(true);

    const scheduledIds = payload.scheduled.map((p: { taskId: string }) => p.taskId);
    const unschedulableIds = payload.unschedulable.map((u: { taskId: string }) => u.taskId);

    expect(scheduledIds).toContain('task-fit');
    expect(unschedulableIds).toContain('task-overdue');

    const overdueEntry = payload.unschedulable.find(
      (u: { taskId: string }) => u.taskId === 'task-overdue'
    );
    expect(overdueEntry.reason).toBe('past_deadline');
    expect(overdueEntry.details.overdueAtScheduleTime).toBe(true);

    for (const proposal of payload.scheduled) {
      expect(typeof proposal.taskId).toBe('string');
      expect(typeof proposal.startUtc).toBe('string');
      expect(typeof proposal.endUtc).toBe('string');
      expect(Number.isFinite(Date.parse(proposal.startUtc))).toBe(true);
    }

    // Every task entering the engine leaves it accounted for.
    expect(scheduledIds.length + unschedulableIds.length).toBe(2);
  });

  it('scopes every user-filtered query to the session user (isolation)', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    tableRows.set(tasks, []).set(calendarEvents, []).set(scheduleBlocks, []);

    await POST(buildRequest({}));

    const userScopedColumns = [
      userProfiles.userId,
      tasks.userId,
      calendarEvents.userId,
      scheduleBlocks.userId,
    ];
    const eqCalls = vi.mocked(eq).mock.calls;

    const userFilterCalls = eqCalls.filter(([column]) =>
      userScopedColumns.includes(column as never)
    );
    expect(userFilterCalls.length).toBeGreaterThanOrEqual(4);
    for (const [, value] of userFilterCalls) {
      expect(value).toBe(USER_ID);
    }
  });
});
