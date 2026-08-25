import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { eq, gte } from 'drizzle-orm';
import { tasks, focusSessions, scheduleBlocks } from '@/db/schema';
import { GET } from './route';

const getSessionMock = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// Raw rows returned by the mocked selects; aggregation runs for real.
const tableRows = new Map<unknown, unknown[]>();

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        const rows = () => tableRows.get(table) ?? [];
        return {
          // Awaitable directly, or chainable into orderBy for the sessions
          // query — mirroring drizzle's real builder surface.
          where: () => ({
            orderBy: async () => rows(),
            then: (resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) =>
              Promise.resolve(rows()).then(resolve, reject),
          }),
          orderBy: async () => rows(),
        };
      },
    }),
  },
}));

// Spy on drizzle condition builders while keeping real behavior so user
// isolation can be asserted on every query the route issues.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    gte: vi.fn(actual.gte),
    and: vi.fn(actual.and),
  };
});

const USER_ID = '44444444-4444-4444-4444-444444444444';

const buildRequest = (query = '') =>
  new NextRequest(`http://localhost:3000/api/insights${query}`, { method: 'GET' });

const authenticatedSession = {
  user: { id: USER_ID, timezone: 'Asia/Kolkata' },
};

beforeEach(() => {
  vi.clearAllMocks();
  tableRows.clear();
});

describe('GET /api/insights', () => {
  it('returns 401 without an authenticated session', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET(buildRequest());
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 for an unsupported days value', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await GET(buildRequest('?days=13'));
    expect(response.status).toBe(400);
  });

  it('defaults to a 30-day read-only aggregation', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    tableRows.set(tasks, []);
    tableRows.set(focusSessions, []);
    tableRows.set(scheduleBlocks, []);

    const response = await GET(buildRequest());
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.days).toBe(30);
    expect(payload.data.plannedVsCompleted).toHaveLength(30);
    expect(Number.isFinite(Date.parse(payload.generatedAt))).toBe(true);
  });

  it('honors days=7 and returns real aggregates derived from rows', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    tableRows.set(tasks, [
      {
        id: 't1',
        title: 'Done task',
        status: 'completed',
        deadlineUtc: null,
        estimatedMinutes: 30,
        completedAtUtc: new Date('2026-08-24T10:00:00Z'),
        createdAt: new Date('2026-08-20T09:00:00Z'),
        projectId: null,
        subjectId: null,
        clientId: null,
        founderGoalId: null,
      },
    ]);
    tableRows.set(focusSessions, [
      { durationMinutes: 45, completedAtUtc: new Date('2026-08-24T11:00:00Z'), interrupted: false },
    ]);
    tableRows.set(scheduleBlocks, []);

    const response = await GET(buildRequest('?days=7'));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.days).toBe(7);
    expect(payload.data.plannedVsCompleted).toHaveLength(7);
    // The session's minutes land on the user-calendar day bucket.
    expect(
      payload.data.plannedVsCompleted.reduce(
        (s: number, d: { completed: number }) => s + d.completed,
        0
      )
    ).toBe(45);
    expect(payload.data.weeklyReflection).toMatch(/45 minutes across 1 session/);
  });

  it('scopes every query to the session user (isolation)', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    tableRows.set(tasks, []);
    tableRows.set(focusSessions, []);
    tableRows.set(scheduleBlocks, []);

    await GET(buildRequest('?days=7'));

    const userScopedColumns = [tasks.userId, focusSessions.userId, scheduleBlocks.userId];
    const eqCalls = vi.mocked(eq).mock.calls;
    const userFilterCalls = eqCalls.filter(([column]) =>
      userScopedColumns.includes(column as never)
    );
    expect(userFilterCalls.length).toBeGreaterThanOrEqual(3);
    for (const [, value] of userFilterCalls) {
      expect(value).toBe(USER_ID);
    }

    // The time-window bound applies to sessions only.
    const gteCalls = vi.mocked(gte).mock.calls;
    expect(gteCalls.some(([column]) => column === focusSessions.completedAtUtc)).toBe(true);
  });
});
