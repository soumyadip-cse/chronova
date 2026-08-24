import { NextRequest, NextResponse } from 'next/server';
import { ApiError } from '@/lib/api-error';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest, prefix: string): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  return `${prefix}:${ip}:${hashString(userAgent)}`;
}

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

setInterval(cleanupExpiredEntries, 60000);

export function createRateLimiter(config: RateLimitConfig) {
  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    const key = getClientKey(request, config.keyPrefix);
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let record = rateLimitStore.get(key);

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + config.windowMs };
      rateLimitStore.set(key, record);
    }

    record.count++;

    const remaining = Math.max(0, config.maxRequests - record.count);
    const resetAt = new Date(record.resetAt).toISOString();

    const responseHeaders = {
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetAt,
    };

    if (record.count > config.maxRequests) {
      const retryAfter = Math.ceil((record.resetAt - now) / 1000);
      throw ApiError.tooManyRequests('Too many requests', retryAfter);
    }

    return null;
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 10,
  keyPrefix: 'auth',
});

export const aiRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60,
  keyPrefix: 'ai',
});

export const exportRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 5,
  keyPrefix: 'export',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'api',
});
