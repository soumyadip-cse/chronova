import { NextRequest, NextResponse } from 'next/server';
import {
  authRateLimiter,
  aiRateLimiter,
  exportRateLimiter,
  apiRateLimiter,
} from '@/lib/rate-limiter';
import { ApiError } from '@/lib/api-error';

type RouteHandler = (request: NextRequest) => Promise<NextResponse>;

export function withRateLimit(
  handler: RouteHandler,
  limiter: typeof authRateLimiter
): RouteHandler {
  return async (request: NextRequest) => {
    try {
      await limiter(request);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TOO_MANY_REQUESTS') {
        const retryAfter = (error.details?.retryAfter as number) || 60;
        return NextResponse.json(
          { error: { code: 'TOO_MANY_REQUESTS', message: error.message, details: { retryAfter } } },
          {
            status: 429,
            headers: {
              'Retry-After': retryAfter.toString(),
              'X-RateLimit-Limit': '10',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
            },
          }
        );
      }
      throw error;
    }
    return handler(request);
  };
}

export const withAuthRateLimit = (handler: RouteHandler) => withRateLimit(handler, authRateLimiter);
export const withAIRateLimit = (handler: RouteHandler) => withRateLimit(handler, aiRateLimiter);
export const withExportRateLimit = (handler: RouteHandler) =>
  withRateLimit(handler, exportRateLimiter);
export const withAPIRateLimit = (handler: RouteHandler) => withRateLimit(handler, apiRateLimiter);
