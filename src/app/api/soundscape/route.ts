export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import { soundscapePresets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const BUILT_IN_SOUNDSCAPES = [
  {
    name: 'Deep Brown Noise',
    type: 'noise',
    ambientTrackA: '/sounds/brown-noise.mp3',
    ambientTrackB: '',
    volumeA: 0.5,
    volumeB: 0,
    isBuiltIn: true,
  },
  {
    name: 'Gentle Rainfall',
    type: 'nature',
    ambientTrackA: '/sounds/rainfall.mp3',
    ambientTrackB: '',
    volumeA: 0.6,
    volumeB: 0,
    isBuiltIn: true,
  },
  {
    name: 'Pure White Noise',
    type: 'noise',
    ambientTrackA: '/sounds/white-noise.mp3',
    ambientTrackB: '',
    volumeA: 0.4,
    volumeB: 0,
    isBuiltIn: true,
  },
  {
    name: 'Soft Pink Noise',
    type: 'noise',
    ambientTrackA: '/sounds/pink-noise.mp3',
    ambientTrackB: '',
    volumeA: 0.5,
    volumeB: 0,
    isBuiltIn: true,
  },
  {
    name: 'Forest Nature',
    type: 'nature',
    ambientTrackA: '/sounds/forest.mp3',
    ambientTrackB: '',
    volumeA: 0.55,
    volumeB: 0,
    isBuiltIn: true,
  },
  {
    name: 'Midnight Atmosphere',
    type: 'ambient',
    ambientTrackA: '/sounds/midnight.mp3',
    ambientTrackB: '',
    volumeA: 0.45,
    volumeB: 0,
    isBuiltIn: true,
  },
  {
    name: 'Quiet Library Ambience',
    type: 'ambient',
    ambientTrackA: '/sounds/library.mp3',
    ambientTrackB: '',
    volumeA: 0.4,
    volumeB: 0,
    isBuiltIn: true,
  },
  {
    name: 'Binaural Alpha Waves',
    type: 'binaural',
    ambientTrackA: '/sounds/alpha-waves.mp3',
    ambientTrackB: '',
    volumeA: 0.35,
    volumeB: 0,
    isBuiltIn: true,
  },
];

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  const userPresets = session?.user?.id
    ? await db.select().from(soundscapePresets).where(eq(soundscapePresets.userId, session.user.id))
    : [];

  const allPresets = [...BUILT_IN_SOUNDSCAPES, ...userPresets];

  return NextResponse.json({ presets: allPresets });
}

const createPresetSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.string().max(50),
  ambientTrackA: z.string().url().optional().nullable(),
  ambientTrackB: z.string().url().optional().nullable(),
  volumeA: z.number().min(0).max(1).default(0.5),
  volumeB: z.number().min(0).max(1).default(0.5),
});

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createPresetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [preset] = await db
    .insert(soundscapePresets)
    .values({
      userId: session.user.id,
      ...parsed.data,
      isBuiltIn: false,
    })
    .returning();

  return NextResponse.json({ preset }, { status: 201 });
}
