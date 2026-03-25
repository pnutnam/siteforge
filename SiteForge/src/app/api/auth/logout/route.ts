/**
 * POST /api/auth/logout
 * Logs out the user by clearing the client-side refresh cookie.
 *
 * Per user decisions:
 * - Logout behavior: Clears client-side cookie only
 * - Refresh token remains valid until natural 30-day expiry
 * - No invalidation of refresh token in Redis
 */

import { NextResponse } from 'next/server';
import { clearRefreshCookie } from '@/auth/refresh';

export async function POST() {
  // Clear the client-side cookie
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  const cookieOptions = clearRefreshCookie();
  response.cookies.set(cookieOptions);

  return response;
}
