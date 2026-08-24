import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/db';
import { users, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { withAuthRateLimit } from '@/lib/with-rate-limit';

const signupSchema = z.object({
  name: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

async function signupHandler(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    const firstError =
      fields.email?.[0] || fields.password?.[0] || fields.name?.[0] || 'Invalid input';
    return NextResponse.json({ error: firstError, details: fields }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(users)
        .values({
          email,
          passwordHash,
          role: 'professional',
          timezone: 'UTC',
        })
        .onConflictDoNothing({ target: users.email })
        .returning({ id: users.id });

      if (!inserted[0]) {
        throw new Error('DUPLICATE_EMAIL');
      }

      await tx.insert(userProfiles).values({
        userId: inserted[0].id,
        displayName: name,
        onboardingCompleted: false,
        notificationPrefs: {
          email: true,
          push: true,
          dailySummary: true,
          weeklyReflection: true,
          burnoutAlerts: true,
        },
        workingHours: { start: '09:00', end: '17:00' },
        peakEnergy: 'morning',
      });
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_EMAIL') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Unable to create account. Please try again.' },
      { status: 500 }
    );
  }
}

export const POST = withAuthRateLimit(signupHandler);
