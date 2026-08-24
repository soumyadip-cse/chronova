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

type CheckStatus = 'ok' | 'fail' | 'not_configured';

export async function GET() {
  const checks: Record<string, { status: CheckStatus; message?: string }> = {
    database: { status: 'fail' },
    auth: { status: 'fail' },
    ai: { status: 'fail' },
  };

  // CRITICAL: Check database connection with timeout
  try {
    await withTimeout(db.execute(sql`SELECT 1`), 2000, undefined as any);
    checks.database = { status: 'ok' };
  } catch (error) {
    console.error('Health check database failure:', error);
    checks.database = {
      status: 'fail',
      message: 'Database unavailable',
    };
  }

  // CRITICAL: Check auth configuration
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

  // OPTIONAL: Check AI provider — absence degrades gracefully (heuristic fallback),
  // so an unconfigured key must NOT make the whole service report unhealthy.
  try {
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    if (aiProvider === 'gemini' && process.env.GEMINI_API_KEY) {
      checks.ai = { status: 'ok' };
    } else if (aiProvider === 'claude' && process.env.ANTHROPIC_API_KEY) {
      checks.ai = { status: 'ok' };
    } else {
      checks.ai = {
        status: 'not_configured',
        message: `${aiProvider} API key not configured — heuristic task parsing active`,
      };
    }
  } catch (error) {
    checks.ai = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Only CRITICAL dependencies (database, auth) determine liveness.
  const criticalsOk = checks.database.status === 'ok' && checks.auth.status === 'ok';
  const httpStatus = criticalsOk ? 200 : 503;
  const overallStatus = criticalsOk ? 'ok' : 'degraded';

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: httpStatus }
  );
}
