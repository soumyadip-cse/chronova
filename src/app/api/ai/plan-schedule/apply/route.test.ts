import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { eq, inArray } from 'drizzle-orm';
import { tasks, calendarEvents, scheduleBlocks, userProfiles, auditLogs } from '@/db/schema';
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

// Transaction harness: records deletes/inserts instead of touching a database.
let txDeleteCalls = 0;
let txInsertCalls = 0;
let auditInsertValues: Array<Record<string, unknown>> = [];
let insertedBlockRows: Array<Record<string, unknown>> = [];

interface ApplyTx {
  delete: (table: unknown) => { where: () => Promise<{ count: number }> };
  insert: (table: unknown) => {
    values: (vals: unknown) => {
      returning: () => Promise<Array<Record<string, unknown>>>;
    };
  };
}

// Read only lazily (inside async handlers) so the hoisted @/db mock factory
// never touches test-file bindings during module-graph initialization.
const dbTx: ApplyTx = {
  delete: (_table: unknown) => ({
    where: async () => {
      txDeleteCalls += 1;
      return { count: 0 };
    },
  }),
  insert: (table: unknown) => ({
    values: (vals: unknown) => {
      if (table === auditLogs) {
        auditInsertValues.push(vals as Record<string, unknown>);
      }
      return {
        returning: async () => {
          const rows = (Array.isArray(vals) ? vals : [vals]) as Array<Record<string, unknown>>;
          const returned = rows.map((v, i) => ({ id: `generated-block-${i}`, ...v }));
          insertedBlockRows.push(...returned);
          return returned;
        },
      };
    },
  }),
};

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
    transaction: vi.fn(async (fn: (dbTx: ApplyTx) => Promise<unknown>): Promise<unknown> =>
      fn(dbTx)
    ),
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

const USER_ID = '22222222-2222-2222-2222-222222222222';
const TASK_FIT_ID = '33333333-3333-4333-8333-333333333331';
const TASK_OVERDUE_ID = '33333333-3333-4333-8333-333333333332';

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/ai/plan-schedule/apply', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

const authenticatedSession = {
  user: { id: USER_ID, timezone: 'UTC' },
};

function seedTask(overrides: Record<string, unknown> & { id: string }) {
  const rows = tableRows.get(tasks) ?? [];
  rows.push({
    title: overrides.title ?? 'Task',
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
    ...overrides,
  });
  tableRows.set(tasks, rows);
}

beforeEach(() => {
  vi.clearAllMocks();
  tableRows.clear();
  txDeleteCalls = 0;
  txInsertCalls = 0;
  auditInsertValues = [];
  insertedBlockRows = [];
});

describe('POST /api/ai/plan-schedule/apply', () => {
  it('returns 401 without an authenticated session', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await POST(
      buildRequest({ taskIds: ['11111111-1111-4111-8111-111111111111'] })
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 for invalid input (empty list, bad uuid)', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const empty = await POST(buildRequest({ taskIds: [] }));
    expect(empty.status).toBe(400);

    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const badUuid = await POST(buildRequest({ taskIds: ['not-a-uuid'] }));
    expect(badUuid.status).toBe(400);

    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const missing = await POST(buildRequest({}));
    expect(missing.status).toBe(400);
  });

  it('persists placements for schedulable tasks and reports unschedulable ones', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    seedTask({ id: TASK_FIT_ID, title: 'Fits today' });
    seedTask({
      id: TASK_OVERDUE_ID,
      title: 'Long past',
      deadlineUtc: new Date('2000-01-01T00:00:00Z'),
    });
    tableRows.set(calendarEvents, []);
    tableRows.set(scheduleBlocks, []);

    const response = await POST(
      buildRequest({
        taskIds: [TASK_FIT_ID, TASK_OVERDUE_ID],
      })
    );
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(Array.isArray(payload.applied)).toBe(true);
    expect(payload.applied).toHaveLength(1);
    expect(payload.applied[0].taskId).toBe(TASK_FIT_ID);
    expect(typeof payload.applied[0].blockId).toBe('string');
    expect(Number.isFinite(Date.parse(payload.applied[0].startUtc))).toBe(true);
    expect(Number.isFinite(Date.parse(payload.applied[0].endUtc))).toBe(true);

    expect(payload.failed).toHaveLength(1);
    expect(payload.failed[0].taskId).toBe(TASK_OVERDUE_ID);
    expect(payload.failed[0].reason).toBe('past_deadline');

    // Blocks were written inside a transaction along with an audit entry.
    expect(insertedBlockRows).toHaveLength(1);
    expect(insertedBlockRows[0].userId).toBe(USER_ID);
    expect(insertedBlockRows[0].taskId).toBe(TASK_FIT_ID);
    expect(auditInsertValues).toHaveLength(1);
    expect(auditInsertValues[0].action).toBe('schedule_change');
    expect(auditInsertValues[0].userId).toBe(USER_ID);
  });

  it('replaces unlocked future blocks but preserves locked ones', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    seedTask({ id: TASK_FIT_ID, title: 'Refit me' });

    const now = Date.now();
    const replaceable = {
      id: 'block-replaceable',
      userId: USER_ID,
      taskId: 'some-old-task',
      startUtc: new Date(now + 24 * 3600 * 1000),
      endUtc: new Date(now + 25 * 3600 * 1000),
      isLocked: false,
      isCompleted: false,
    };
    const locked = {
      ...replaceable,
      id: 'block-locked',
      taskId: 'protected-task',
      isLocked: true,
    };

    tableRows.set(calendarEvents, []);
    tableRows.set(scheduleBlocks, [replaceable, locked]);

    const response = await POST(buildRequest({ taskIds: [TASK_FIT_ID] }));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.applied).toHaveLength(1);

    // Exactly one delete statement ran, scoped by an inArray over block ids.
    expect(txDeleteCalls).toBe(1);
    const inArrayCalls = vi.mocked(inArray).mock.calls;
    const blockIdCall = inArrayCalls.find(
      ([column]) => column === scheduleBlocks.id || (column as { name?: string })?.name === 'id'
    );
    expect(blockIdCall).toBeDefined();
    const ids = blockIdCall![1] as string[];
    expect(ids).toContain('block-replaceable');
    expect(ids).not.toContain('block-locked');
  });

  it('never deletes anything when nothing can be applied', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    seedTask({
      id: TASK_OVERDUE_ID,
      deadlineUtc: new Date('2000-01-01T00:00:00Z'),
    });
    tableRows.set(calendarEvents, []);
    tableRows.set(scheduleBlocks, []);

    const response = await POST(buildRequest({ taskIds: [TASK_OVERDUE_ID] }));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.applied).toHaveLength(0);
    expect(payload.failed[0].reason).toBe('past_deadline');

    expect(txDeleteCalls).toBe(0);
    expect(insertedBlockRows).toHaveLength(0);
    expect(auditInsertValues).toHaveLength(0);
  });

  it('reports unknown task ids instead of throwing', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    tableRows.set(calendarEvents, []);
    tableRows.set(scheduleBlocks, []);

    const response = await POST(
      buildRequest({ taskIds: ['99999999-9999-4999-8999-999999999999'] })
    );
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.applied).toHaveLength(0);
    expect(payload.failed[0].reason).toBe('not_schedulable');
    expect(txDeleteCalls).toBe(0);
  });

  it('scopes every user-filtered query and mutation to the session user', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    seedTask({ id: TASK_FIT_ID, title: 'Mine only' });
    tableRows.set(calendarEvents, []);
    tableRows.set(scheduleBlocks, []);

    const response = await POST(buildRequest({ taskIds: [TASK_FIT_ID] }));
    expect(response.status).toBe(200);
    await response.json();

    const userScopedColumns = [
      userProfiles.userId,
      tasks.userId,
      calendarEvents.userId,
      scheduleBlocks.userId,
      auditLogs.userId,
    ];
    const eqCalls = vi.mocked(eq).mock.calls;

    const userFilterCalls = eqCalls.filter(([column]) =>
      userScopedColumns.includes(column as never)
    );
    // Four user-scoped selects always run; delete/audit scoping is exercised by
    // the replacement test above.
    expect(userFilterCalls.length).toBeGreaterThanOrEqual(4);
    for (const [, value] of userFilterCalls) {
      expect(value).toBe(USER_ID);
    }
  });
});
