export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// ---------- Validation ----------

/** Accepts any IANA zone that the runtime can actually resolve. */
function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be HH:MM (24h)');

const profilePatchSchema = z
  .object({
    displayName: z.string().trim().max(100).optional(),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .refine(isValidTimeZone, 'Unknown timezone')
      .optional(),
    workingHours: z
      .object({ start: timeString, end: timeString })
      .refine((w) => w.start < w.end, 'Working hours must end after they start')
      .optional(),
    peakEnergy: z.enum(['morning', 'afternoon', 'evening']).optional(),
    focusSessionLength: z.number().int().min(15).max(120).optional(),
    productivityChallenge: z.string().trim().max(200).optional(),
    planningHorizon: z.enum(['day', 'week', 'month']).optional(),
    aiAggressiveness: z.enum(['conservative', 'balanced', 'aggressive']).optional(),
    reducedMotion: z.boolean().optional(),
    completed: z.boolean().optional(),
  })
  .strict();

type ProfilePatch = z.infer<typeof profilePatchSchema>;

// ---------- Handlers ----------

async function loadOwnedProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      timezone: users.timezone,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, userId),
  });

  return { user, profile };
}

function toMergedView(
  user: NonNullable<Awaited<ReturnType<typeof loadOwnedProfile>>['user']>,
  profile: Awaited<ReturnType<typeof loadOwnedProfile>>['profile']
) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    timezone: user.timezone,
    displayName: profile?.displayName ?? null,
    onboardingCompleted: profile?.onboardingCompleted ?? false,
    energyProfile: profile?.energyProfile ?? null,
    notificationPrefs: profile?.notificationPrefs ?? null,
    workingHours: profile?.workingHours ?? { start: '09:00', end: '17:00' },
    peakEnergy: profile?.peakEnergy ?? 'morning',
    focusSessionLength: profile?.focusSessionLength ?? 50,
    productivityChallenge: profile?.productivityChallenge ?? null,
    theme: profile?.theme ?? 'system',
    reducedMotion: profile?.reducedMotion ?? false,
    planningHorizon: profile?.planningHorizon ?? 'day',
    aiAggressiveness: profile?.aiAggressiveness ?? 'balanced',
    createdAt: profile?.createdAt ?? null,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { user, profile } = await loadOwnedProfile(session.user.id);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({ profile: toMergedView(user, profile) });
}

export async function PATCH(request: NextRequest) {
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

  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const patch: ProfilePatch = parsed.data;
  const userId = session.user.id;

  // The user row and profile row are updated together so `users.timezone`
  // (the value the scheduler consumes via the session) can never drift from
  // the profile view.
  const { user } = await loadOwnedProfile(userId);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await db.transaction(async (tx) => {
      if (patch.timezone !== undefined) {
        await tx.update(users).set({ timezone: patch.timezone }).where(eq(users.id, userId));
      }

      const profileUpdate: Record<string, unknown> = {};
      if (patch.displayName !== undefined) profileUpdate.displayName = patch.displayName || null;
      if (patch.workingHours !== undefined) profileUpdate.workingHours = patch.workingHours;
      if (patch.peakEnergy !== undefined) profileUpdate.peakEnergy = patch.peakEnergy;
      if (patch.focusSessionLength !== undefined)
        profileUpdate.focusSessionLength = patch.focusSessionLength;
      if (patch.productivityChallenge !== undefined)
        profileUpdate.productivityChallenge = patch.productivityChallenge || null;
      if (patch.planningHorizon !== undefined)
        profileUpdate.planningHorizon = patch.planningHorizon;
      if (patch.aiAggressiveness !== undefined)
        profileUpdate.aiAggressiveness = patch.aiAggressiveness;
      if (patch.reducedMotion !== undefined) profileUpdate.reducedMotion = patch.reducedMotion;
      // Onboarding completion is a one-way latch: it can only be set true.
      if (patch.completed === true) profileUpdate.onboardingCompleted = true;

      if (Object.keys(profileUpdate).length > 0) {
        await tx.update(userProfiles).set(profileUpdate).where(eq(userProfiles.userId, userId));
      }
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    return NextResponse.json(
      { error: 'Unable to save your profile right now. Please try again.' },
      { status: 500 }
    );
  }

  const fresh = await loadOwnedProfile(userId);
  return NextResponse.json({ profile: toMergedView(fresh.user!, fresh.profile) });
}
