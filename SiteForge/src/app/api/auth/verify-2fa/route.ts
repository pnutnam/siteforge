/**
 * POST /api/auth/verify-2fa
 * Verifies TOTP code and enables 2FA for the account.
 *
 * Rate limiting: 3 failed attempts per 5-minute window per account.
 * Rate limit counter is cleared on successful verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/auth/jwt';
import { verifyTotpCode, decryptTotpSecret } from '@/auth/totp';
import { checkTotpRateLimit, getRateLimitHeaders, clearTotpRateLimit } from '@/auth/rate-limiter';
import { pool } from '@/database/pool';

export async function POST(request: NextRequest) {
  const client = await pool.connect();

  try {
    // 1. Verify JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyAccessToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { accountId } = payload;

    // 2. Check rate limit BEFORE processing the TOTP code
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
      return NextResponse.json({ error: 'TOTP code is required' }, { status: 400 });
    }

    // 3. Look up pending TOTP secret
    const totpResult = await client.query(
      'SELECT encrypted_secret FROM totp_secrets WHERE account_id = $1',
      [accountId]
    );

    if (totpResult.rows.length === 0) {
      return NextResponse.json({ error: 'TOTP not set up for this account' }, { status: 400 });
    }

    const totpRecord = totpResult.rows[0];

    // 4. Decrypt secret
    let secret: string;
    try {
      secret = decryptTotpSecret(totpRecord.encrypted_secret);
    } catch {
      return NextResponse.json({ error: 'Failed to decrypt TOTP secret' }, { status: 500 });
    }

    // 5. Verify code
    const isValid = verifyTotpCode(secret, code);

    if (!isValid) {
      // FAILED: Do NOT clear rate limit, let it accumulate
      return NextResponse.json({ error: 'Invalid TOTP code' }, { status: 400 });
    }

    // SUCCESS: Clear rate limit counter
    await clearTotpRateLimit(accountId);

    // 6. Update owner_accounts: set twoFactorEnabled = 1 and record timestamp
    await client.query(
      'UPDATE owner_accounts SET two_factor_enabled = 1, two_factor_enabled_at = $1 WHERE id = $2',
      [new Date(), accountId]
    );

    // 7. Update totp_secrets: record verification time
    await client.query(
      'UPDATE totp_secrets SET verified_at = $1 WHERE account_id = $2',
      [new Date(), accountId]
    );

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
    });
  } catch (error) {
    console.error('verify-2fa error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    client.release();
  }
}
