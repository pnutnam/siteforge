/**
 * POST /api/auth/logout
 * Logs out the user by clearing the client-side refresh cookie.
 *
 * Per user decisions:
 * - Logout behavior: Clears client-side cookie only
 * - Refresh token remains valid until natural 30-day expiry
 * - No invalidation of refresh token in Redis
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/auth/jwt';
import { requireAccountOwnership } from '@/auth/ownership';
import { clearRefreshCookie } from '@/auth/refresh';

export async function POST(request: NextRequest) {
  // Extract token from cookie or header
  const token = request.cookies.get('sf_session')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Validate that the account belongs to the tenant from JWT
  try {
    await requireAccountOwnership(payload.accountId, payload.tenantId);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Clear the client-side cookie
  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });

  const cookieOptions = clearRefreshCookie();
  response.cookies.set(cookieOptions);

  return response;
}
