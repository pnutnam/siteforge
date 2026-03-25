import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/auth/jwt';
import { pool } from '@/database/pool';

export async function GET(request: NextRequest) {
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

  // Look up owner_accounts.two_factor_enabled and two_factor_enabled_at
  const result = await pool.query(
    'SELECT two_factor_enabled, two_factor_enabled_at FROM owner_accounts WHERE id = $1',
    [accountId]
  );

  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }

  const { two_factor_enabled, two_factor_enabled_at } = result.rows[0];

  return NextResponse.json({
    enabled: two_factor_enabled === 1,
    enabledAt: two_factor_enabled_at || null,
  });
}
