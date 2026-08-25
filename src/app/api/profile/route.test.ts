import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { users, userProfiles } from '@/db/schema';
import { GET, PATCH } from './route';

const getSessionMock = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => getSessionMock(...args),
}));

vi.mock('@/lib/auth', () => ({ authOptions: {} }));

const USER_ID = '12121212-1212-4212-8212-121212121212';

const defaultUserRow = {
  id: USER_ID,
  email: 'profile@test.local',
  role: 'professional',
  timezone: 'UTC',
};

let profileRow: Record<string, unknown> | undefined;
const userUpdates: Array<Record<string, unknown>> = [];
const profileUpdates: Array<Record<string, unknown>> = [];

vi.mock('@/db', () => ({
  db: {
    query: {
      userProfiles: {
        findFirst: vi.fn(async () => profileRow),
      },
    },
    select: () => ({
      from: () => {
        const rows = [defaultUserRow];
        return {
          // Awaitable directly, or chainable into .limit(1) as the route does.
          where: () => ({
            limit: async () => rows,
            then: (resolve: (v: unknown[]) => void, reject?: (e: unknown) => void) =>
              Promise.resolve(rows).then(resolve, reject),
          }),
          limit: async () => rows,
        };
      },
    }),
    transaction: vi.fn(
      async (
        fn: (tx: {
          update: (table: unknown) => {
            set: (v: Record<string, unknown>) => { where: () => Promise<{ count: number }> };
          };
        }) => Promise<unknown>
      ) =>
        fn({
          update: (table: unknown) => ({
            set: (v: Record<string, unknown>) => ({
              where: async () => {
                if (table === users) {
                  userUpdates.push(v);
                  // Simulate persistence so post-tx reads see the change.
                  Object.assign(defaultUserRow, v);
                }
                if (table === userProfiles) {
                  profileUpdates.push(v);
                  profileRow = { ...(profileRow ?? {}), ...v };
                }
                return { count: 1 };
              },
            }),
          }),
        })
    ),
  },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...actual,
    eq: vi.fn(actual.eq),
    and: vi.fn(actual.and),
  };
});

const buildPatchRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

const authenticatedSession = {
  user: { id: USER_ID, timezone: 'UTC' },
};

beforeEach(() => {
  vi.clearAllMocks();
  profileRow = {
    displayName: 'Tester',
    onboardingCompleted: false,
    notificationPrefs: null,
    energyProfile: null,
    workingHours: { start: '09:00', end: '17:00' },
    peakEnergy: 'morning',
    focusSessionLength: 50,
    productivityChallenge: null,
    theme: 'system',
    reducedMotion: false,
    planningHorizon: 'day',
    aiAggressiveness: 'balanced',
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };
  userUpdates.length = 0;
  profileUpdates.length = 0;
});

describe('GET /api/profile', () => {
  it('returns 401 without an authenticated session', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: 'Unauthorized' });
  });

  it('returns the merged users + profile view with defaults', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    profileRow = undefined;

    const response = await GET();
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.profile).toMatchObject({
      id: USER_ID,
      email: 'profile@test.local',
      timezone: 'UTC',
      onboardingCompleted: false,
      focusSessionLength: 50,
    });
  });
});

describe('PATCH /api/profile', () => {
  it('returns 401 without an authenticated session', async () => {
    getSessionMock.mockResolvedValueOnce(null);

    const response = await PATCH(buildPatchRequest({ timezone: 'UTC' }));
    expect(response.status).toBe(401);
  });

  it('rejects an unresolvable timezone', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await PATCH(buildPatchRequest({ timezone: 'Mars/Olympus_Mons' }));
    expect(response.status).toBe(400);
    expect(userUpdates).toHaveLength(0);
  });

  it('accepts a valid IANA timezone', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await PATCH(buildPatchRequest({ timezone: 'Asia/Kolkata' }));
    expect(response.status).toBe(200);
    expect(userUpdates[0]).toMatchObject({ timezone: 'Asia/Kolkata' });
  });

  it('rejects working hours that end before they start', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await PATCH(
      buildPatchRequest({ workingHours: { start: '18:00', end: '09:00' } })
    );
    expect(response.status).toBe(400);

    getSessionMock.mockResolvedValueOnce(authenticatedSession);
    const malformed = await PATCH(
      buildPatchRequest({ workingHours: { start: '9am', end: '5pm' } })
    );
    expect(malformed.status).toBe(400);
  });

  it('rejects an out-of-range focus session length', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await PATCH(buildPatchRequest({ focusSessionLength: 200 }));
    expect(response.status).toBe(400);
  });

  it('updates users.timezone and profile fields together', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await PATCH(
      buildPatchRequest({
        timezone: 'Asia/Kolkata',
        workingHours: { start: '10:00', end: '14:00' },
        peakEnergy: 'afternoon',
        focusSessionLength: 45,
        completed: true,
      })
    );
    expect(response.status).toBe(200);

    // users row carries the scheduler-facing timezone…
    expect(userUpdates).toEqual([{ timezone: 'Asia/Kolkata' }]);

    // …while the profile row carries the rest plus the one-way latch.
    expect(profileUpdates).toHaveLength(1);
    expect(profileUpdates[0]).toMatchObject({
      workingHours: { start: '10:00', end: '14:00' },
      peakEnergy: 'afternoon',
      focusSessionLength: 45,
      onboardingCompleted: true,
    });

    const payload = await response.json();
    expect(payload.profile.timezone).toBe('Asia/Kolkata');
    expect(payload.profile.onboardingCompleted).toBe(true);
  });

  it('treats completed:false as a no-op (one-way latch)', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await PATCH(buildPatchRequest({ reducedMotion: true, completed: false }));
    expect(response.status).toBe(200);
    expect(profileUpdates[0]).not.toHaveProperty('onboardingCompleted');
    expect(profileUpdates[0]).toMatchObject({ reducedMotion: true });
  });

  it('rejects unknown fields', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    const response = await PATCH(buildPatchRequest({ isAdmin: true }));
    expect(response.status).toBe(400);
  });

  it('scopes updates to the session user only', async () => {
    getSessionMock.mockResolvedValueOnce(authenticatedSession);

    await PATCH(buildPatchRequest({ timezone: 'Europe/Berlin' }));

    const eqCalls = vi.mocked(eq).mock.calls;
    const valueFor = (column: unknown): unknown[] =>
      eqCalls.filter(([c]) => c === column).map(([, v]) => v);

    // The route re-reads after the transaction, so multiple scoped calls are
    // expected — every one of them must target the session user.
    expect(valueFor(users.id).length).toBeGreaterThanOrEqual(1);
    expect(valueFor(users.id).every((v) => v === USER_ID)).toBe(true);
    expect(valueFor(userProfiles.userId).every((v) => v === USER_ID)).toBe(true);
  });
});
