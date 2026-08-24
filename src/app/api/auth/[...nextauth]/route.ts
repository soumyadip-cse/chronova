import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { authRateLimiter } from '@/lib/rate-limiter';
import { ApiError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = NextAuth(authOptions);

type Ctx = { params: Promise<{ nextauth: string[] }> };

async function limitedPost(request: NextRequest, context: Ctx) {
  try {
    const limited = await authRateLimiter(request);
    if (limited) {
      return limited;
    }
  } catch (error) {
    if (error instanceof ApiError && error.code === 'TOO_MANY_REQUESTS') {
      const retryAfter = (error.details?.retryAfter as number) || 60;
      return NextResponse.json(
        {
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: error.message,
            details: { retryAfter },
          },
        },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      );
    }
    throw error;
  }
  return handler(request, context);
}

export { handler as GET, limitedPost as POST };
