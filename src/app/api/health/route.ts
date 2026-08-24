import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

// Helper to run a promise with timeout
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'fail'; message?: string }> = {
    database: { status: 'fail' },
    auth: { status: 'fail' },
    ai: { status: 'fail' },
  };

  // Check database connection with timeout
  try {
    await withTimeout(db.execute(sql`SELECT 1`), 2000, undefined as any);
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection timeout or error',
    };
  }

  // Check auth configuration
  try {
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32) {
      checks.auth = { status: 'ok' };
    } else {
      checks.auth = { status: 'fail', message: 'NEXTAUTH_SECRET missing or too short' };
    }
  } catch (error) {
    checks.auth = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Check AI provider
  try {
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    if (aiProvider === 'gemini' && process.env.GEMINI_API_KEY) {
      checks.ai = { status: 'ok' };
    } else if (aiProvider === 'claude' && process.env.ANTHROPIC_API_KEY) {
      checks.ai = { status: 'ok' };
    } else {
      checks.ai = { status: 'fail', message: `${aiProvider} API key not configured` };
    }
  } catch (error) {
    checks.ai = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const status = allOk ? 200 : 503;

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
