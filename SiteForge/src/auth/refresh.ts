import crypto from 'crypto';
import Redis from 'ioredis';
import type { RefreshTokenData } from './types.js';

const REFRESH_TOKEN_COOKIE_NAME = 'sf_refresh';
const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

// Redis connection (same as BullMQ)
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

/**
 * Hash a refresh token for storage lookup.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new refresh token and store it in Redis.
 * Returns the raw token (hashed version stored in Redis).
 */
export async function createRefreshToken(accountId: string, tenantId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  const data: RefreshTokenData = {
    accountId,
    tenantId,
    version: 1,
  };

  await redis.set(
    `refresh:${tokenHash}`,
    JSON.stringify(data),
    'EX',
    REFRESH_TOKEN_EXPIRY_SECONDS
  );

  return token;
}

/**
 * Verify a refresh token and return its data if valid.
 */
export async function verifyRefreshToken(token: string): Promise<RefreshTokenData | null> {
  const tokenHash = hashToken(token);
  const data = await redis.get(`refresh:${tokenHash}`);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as RefreshTokenData;
  } catch {
    return null;
  }
}

/**
 * Invalidate a refresh token by deleting it from Redis.
 */
export async function invalidateRefreshToken(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await redis.del(`refresh:${tokenHash}`);
}

/**
 * Set refresh token as an httpOnly cookie.
 */
export function setRefreshCookie(token: string): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    path: '/',
  };
}

/**
 * Clear the refresh token cookie.
 */
export function clearRefreshCookie(): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  maxAge: number;
  path: string;
} {
  return {
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  };
}
