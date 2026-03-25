/**
 * POST /api/auth/refresh
 * Refreshes the access token using the refresh token from httpOnly cookie.
 *
 * Per user decisions:
 * - Access token: 15 minutes
 * - Refresh token: 30 days, httpOnly cookie (sf_refresh), no rotation on use
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAccessToken } from '@/auth/jwt';
import { verifyRefreshToken, createRefreshToken, setRefreshCookie } from '@/auth/refresh';
import { pool } from '@/database/pool';

const REFRESH_TOKEN_COOKIE_NAME = 'sf_refresh';

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    // 1. Read refresh token from cookie
    const cookies = request.cookies;
    const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token provided' }, { status: 401 });
    }

    // 2. Verify refresh token using verifyRefreshToken (checks Redis)
    const tokenData = await verifyRefreshToken(refreshToken);
    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const { accountId, tenantId } = tokenData;

    // 3. Look up account details (email, businessId, tenantId, status) from owner_accounts table
    const accountResult = await client.query(
      'SELECT id, email, business_id, tenant_id, status FROM owner_accounts WHERE id = $1',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 401 });
    }

    const account = accountResult.rows[0];

    // 4. If account status is not 'active', return 403
    if (account.status !== 'active') {
      return NextResponse.json({ error: 'Account not active' }, { status: 403 });
    }

    // 5. Create new access token using createAccessToken with claims from account
    const newAccessToken = await createAccessToken({
      accountId: account.id,
      tenantId: account.tenant_id,
      businessId: account.business_id,
      email: account.email,
      status: account.status,
    });

    // 6. Optionally create new refresh token (no rotation - reuse allowed)
    // Per user decisions: refresh tokens are NOT rotated on use
    // We create a new one to refresh the expiry
    const newRefreshToken = await createRefreshToken(accountId, tenantId);

    // 7. Return { token: newAccessToken } with the new access token in response body
    // Set new refresh cookie with updated expiry
    const response = NextResponse.json({ token: newAccessToken });
    const cookieOptions = setRefreshCookie(newRefreshToken);
    response.cookies.set(cookieOptions);

    return response;
  } catch (error) {
    console.error('refresh error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
