import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { focusSessions, scheduleBlocks, tasks } from '@/db/schema';
import { POST } from './route';

const getSessionMock = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

// --- Insert/update harness ---------------------------------------------------

let insertedSession: Record<string, unknown> | null = null;
const blockUpdates: Array<{ set: Record<string, unknown> }> = [];
const taskUpdates: Array<{ set: Record<string, unknown> }> = [];

// Result of the ownership lookup for scheduleBlocks; tests configure it to
// simulate a block that does or does not belong to the session user.
let ownershipLookup: unknown[] = [];

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        const rows = () => (table === scheduleBlocks ? ownershipLookup : []);
        return {
          // Awaitable directly, or chainable into .limit(1) as the route does.
          where: () => ({
            limit: async () => rows(),
            then: (resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) =>
              Promise.resolve(rows()).then(resolve, reject),
          }),
          orderBy: async () => rows(),
          limit: async () => rows(),
        };
      },
    }),
    insert: (table: unknown) => ({
      values: (vals: unknown) => ({
        returning: async () => {
          if (table === focusSessions) {
            insertedSession = vals as Record<string, unknown>;
            return [{ id: 'session-1', ...insertedSession }];
          }
          return [{ id: 'row-1' }];
        },
      }),
    }),
    update: (table: unknown) => ({
      set: (setVals: Record<string, unknown>) => ({
        where: async () => {
          if (table === scheduleBlocks) blockUpdates.push({ set: setVals });
          if (table === tasks) taskUpdates.push({ set: setVals });
          return { count: 1 };
        },
      }),
    }),
  },
}));

// Keep drizzle builders real but observable.
vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    and: vi.fn(actual.and),
  };
});

const USER_ID = '55555555-5555-5555-5555-555555555555';

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/focus', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

const authenticatedSession = {
  user: { id: USER_ID, timezone: 'UTC' },
};

beforeEach(() => {
  vi.clearAllMocks();
  insertedSession = null;
  blockUpdates.length = 0;
  taskUpdates.length = 0;
  ownershipLookup = [];
});

describe('POST /api/focus', () => {
  it('returns 401 without an authenticated session', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await POST(buildRequest({ durationMinutes: 25 }));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns 400 for invalid payloads', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const zeroDuration = await POST(buildRequest({ durationMinutes: 0 }));
    expect(zeroDuration.status).toBe(400);

    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const missing = await POST(buildRequest({}));
    expect(missing.status).toBe(400);
  });

  it('persists a completed focus session', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await POST(
      buildRequest({ taskId: null, durationMinutes: 30, interrupted: false })
    );
    expect(response.status).toBe(201);

    expect(insertedSession).not.toBeNull();
    expect(insertedSession!.userId).toBe(USER_ID);
    expect(insertedSession!.durationMinutes).toBe(30);
    expect(insertedSession!.interrupted).toBe(false);
    expect(insertedSession!.completedAtUtc).toBeInstanceOf(Date);
  });

  it('persists an interrupted session with its reason', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await POST(
      buildRequest({
        durationMinutes: 12,
        interrupted: true,
        interruptionReason: 'Meeting pulled me away',
      })
    );
    expect(response.status).toBe(201);
    expect(insertedSession!.interrupted).toBe(true);
    expect(insertedSession!.interruptionReason).toBe('Meeting pulled me away');
  });

  it('marks the associated schedule block completed when provided', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const blockId = '66666666-6666-6666-6666-666666666666';
    ownershipLookup = [{ id: blockId }]; // lookup confirms the caller owns it

    const response = await POST(
      buildRequest({ taskId: null, scheduleBlockId: blockId, durationMinutes: 25 })
    );
    expect(response.status).toBe(201);
    expect(blockUpdates).toHaveLength(1);
    expect(blockUpdates[0].set).toMatchObject({ isCompleted: true });
  });

  it('strips a foreign scheduleBlockId and never completes another user block', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const foreignBlockId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

    // Ownership lookup finds nothing for this caller.
    const response = await POST(
      buildRequest({ taskId: null, scheduleBlockId: foreignBlockId, durationMinutes: 25 })
    );
    expect(response.status).toBe(201);

    // The session row is still recorded, but without the foreign reference.
    expect(insertedSession).not.toBeNull();
    expect(insertedSession!.scheduleBlockId ?? null).toBeNull();

    // No completion write may target a block at all.
    expect(blockUpdates).toHaveLength(0);
  });

  it('marks the associated task completed when provided', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const taskId = '77777777-7777-7777-7777-777777777777';

    const response = await POST(buildRequest({ taskId, durationMinutes: 50 }));
    expect(response.status).toBe(201);
    expect(taskUpdates).toHaveLength(1);
    expect(taskUpdates[0].set).toMatchObject({ status: 'completed' });
    expect(taskUpdates[0].set.completedAtUtc).toBeInstanceOf(Date);
  });

  it('scopes every mutation to the session user (foreign rows untouched)', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const foreignTaskId = '88888888-8888-8888-8888-888888888888';
    const foreignBlockId = '99999999-9999-9999-9999-999999999999';

    await POST(
      buildRequest({
        taskId: foreignTaskId,
        scheduleBlockId: foreignBlockId,
        durationMinutes: 20,
      })
    );

    // Both update WHERE clauses pair the row id with the session user id, so
    // another user's task/block can never be modified.
    const eqCalls = vi.mocked(eq).mock.calls;
    const findValue = (column: unknown): unknown => eqCalls.find(([c]) => c === column)?.[1];

    expect(findValue(scheduleBlocks.id)).toBe(foreignBlockId);
    expect(findValue(scheduleBlocks.userId)).toBe(USER_ID);

    expect(findValue(tasks.id)).toBe(foreignTaskId);
    expect(findValue(tasks.userId)).toBe(USER_ID);
  });

  it('rejects non-uuid task/block references', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const response = await POST(buildRequest({ taskId: 'not-a-uuid', durationMinutes: 20 }));
    expect(response.status).toBe(400);
  });
});
