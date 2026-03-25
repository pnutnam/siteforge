import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/auth/jwt';
import { generateTotpSecret, generateTotpUri, encryptTotpSecret } from '@/auth/totp';
import { requireAccountOwnership } from '@/auth/ownership';
import { pool } from '@/database/pool';
import qrcode from 'qrcode';

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

  const { accountId, email } = payload;

  // Validate that the account belongs to the tenant from JWT
  try {
    await requireAccountOwnership(accountId, payload.tenantId);
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Check if 2FA is already enabled
  const existingCheck = await pool.query(
    'SELECT two_factor_enabled FROM owner_accounts WHERE id = $1',
    [accountId]
  );

  if (existingCheck.rows.length > 0 && existingCheck.rows[0].two_factor_enabled === 1) {
    return NextResponse.json({ error: '2FA is already enabled' }, { status: 400 });
  }

  // Generate TOTP secret
  const secret = generateTotpSecret();

  // Generate provisioning URI
  const uri = generateTotpUri(secret, email);

  // Generate QR code as data URL
  const qrCodeUrl = await qrcode.toDataURL(uri);

  // Encrypt the secret before storing
  const encryptedSecret = encryptTotpSecret(secret);

  // Check if there's already a pending secret
  const existingSecret = await pool.query(
    'SELECT account_id FROM totp_secrets WHERE account_id = $1',
    [accountId]
  );

  if (existingSecret.rows.length > 0) {
    // Update existing unverified secret
    await pool.query(
      `UPDATE totp_secrets
       SET encrypted_secret = $1, created_at = NOW(), verified_at = NULL
       WHERE account_id = $2`,
      [encryptedSecret, accountId]
    );
  } else {
    // Insert new secret record
    await pool.query(
      `INSERT INTO totp_secrets (account_id, encrypted_secret, created_at, verified_at)
       VALUES ($1, $2, NOW(), NULL)`,
      [accountId, encryptedSecret]
    );
  }

  return NextResponse.json({
    secret,
    uri,
    qrCodeUrl,
  });
}
