/**
 * Redis-based sliding window rate limiter for TOTP verification.
 *
 * Settings (per user decisions):
 * - Window: 5 minutes (300000 ms)
 * - Max attempts: 3 per account
 * - Key prefix: 'ratelimit:totp:'
 */

import Redis from 'ioredis';
import { redisConfig } from '@/jobs/queue';

// Create a dedicated Redis connection for rate limiting
const redis = new Redis(redisConfig.url);

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 3;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number; // seconds until next allowed attempt
  limit: number;
  reset?: number; // Unix timestamp when window resets
}

/**
 * Check if a TOTP verification attempt is allowed for an account.
 * Uses Redis sorted sets with timestamp scores for sliding window.
 *
 * @param accountId - The account ID to check rate limit for
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkTotpRateLimit(accountId: string): Promise<RateLimitResult> {
  const key = `ratelimit:totp:${accountId}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;

  // Atomic: remove old entries + count current + add new entry
  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zcard(key);
  multi.zadd(key, now, `${now}:${Math.random()}`);
  multi.expire(key, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));

  const results = await multi.exec();
  if (!results) {
    // Redis transaction failed
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      limit: RATE_LIMIT_MAX,
    };
  }

  const currentCount = results[1][1] as number;

  if (currentCount >= RATE_LIMIT_MAX) {
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const oldestTime = Number(oldest[1]);
    const retryAfterMs = oldestTime + RATE_LIMIT_WINDOW_MS - now;
    const reset = Math.ceil((oldestTime + RATE_LIMIT_WINDOW_MS) / 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil(retryAfterMs / 1000),
      limit: RATE_LIMIT_MAX,
      reset,
    };
  }

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - currentCount - 1,
    limit: RATE_LIMIT_MAX,
    reset: Math.ceil((now + RATE_LIMIT_WINDOW_MS) / 1000),
  };
}

/**
 * Get rate limit headers for 429 responses.
 *
 * @param result - The RateLimitResult from checkTotpRateLimit
 * @returns Headers object with X-RateLimit-* and Retry-After
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset || Math.ceil(Date.now() / 1000) + 300),
  };
  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }
  return headers;
}

/**
 * Clear the rate limit counter for an account after successful verification.
 *
 * @param accountId - The account ID to clear rate limit for
 */
export async function clearTotpRateLimit(accountId: string): Promise<void> {
  await redis.del(`ratelimit:totp:${accountId}`);
}
