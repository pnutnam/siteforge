import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, createAccessToken } from '@/auth/jwt';
import { verifyTotpCode, decryptTotpSecret } from '@/auth/totp';
import { checkTotpRateLimit, getRateLimitHeaders, clearTotpRateLimit } from '@/auth/rate-limiter';
import { pool } from '@/database/pool';

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

  const { accountId } = payload;

  // Check rate limit before processing TOTP verification
  const rateLimitResult = await checkTotpRateLimit(accountId);
  if (!rateLimitResult.allowed) {
    const headers = getRateLimitHeaders(rateLimitResult);
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again later.', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers }
    );
  }

  // Parse request body
  const body = await request.json();
  const { code } = body;

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Verification code is required' }, { status: 400 });
  }

  // Look up the pending TOTP secret
  const secretResult = await pool.query(
    'SELECT encrypted_secret, verified_at FROM totp_secrets WHERE account_id = $1',
    [accountId]
  );

  if (secretResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'No pending 2FA setup. Please initiate setup first.' },
      { status: 400 }
    );
  }

  const { encrypted_secret, verified_at } = secretResult.rows[0];

  // Check if already verified
  if (verified_at) {
    return NextResponse.json(
      { error: '2FA is already enabled. Cannot verify again.' },
      { status: 400 }
    );
  }

  // Decrypt the stored secret
  let decryptedSecret: string;
  try {
    decryptedSecret = decryptTotpSecret(encrypted_secret);
  } catch {
    return NextResponse.json(
      { error: 'Failed to decrypt TOTP secret. Please re-initiate setup.' },
      { status: 500 }
    );
  }

  // Verify the submitted code
  const isValid = verifyTotpCode(decryptedSecret, code);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid verification code' },
      { status: 400 }
    );
  }

  // Clear rate limit on successful verification
  await clearTotpRateLimit(accountId);

  // Update totp_secrets.verifiedAt
  await pool.query(
    'UPDATE totp_secrets SET verified_at = NOW() WHERE account_id = $1',
    [accountId]
  );

  // Update owner_accounts.two_factor_enabled = 1 and two_factor_enabled_at = NOW()
  await pool.query(
    'UPDATE owner_accounts SET two_factor_enabled = 1, two_factor_enabled_at = NOW() WHERE id = $1',
    [accountId]
  );

  // Issue new JWT access token with updated status
  const newToken = await createAccessToken({
    ...payload,
    status: 'active',
  });

  const response = NextResponse.json({
    success: true,
    message: '2FA enabled successfully',
  });

  // Set the new token as HttpOnly cookie
  response.cookies.set('sf_session', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes
    path: '/',
  });

  return response;
}
