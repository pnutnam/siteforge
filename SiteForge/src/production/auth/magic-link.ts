import { pool } from '../../database/pool';
import crypto from 'crypto';

const MAGIC_LINK_TOKEN_BYTES = 32;
const MAGIC_LINK_EXPIRY_HOURS = 1;

export interface MagicLinkResult {
  success: boolean;
  message: string;
  token?: string;
  expiresAt?: Date;
}

/**
 * Generate magic link token for email.
 * Creates or updates owner_accounts record with time-limited token.
 */
export async function createMagicLink(
  tenantId: string,
  businessId: string,
  email: string
): Promise<MagicLinkResult> {
  const token = crypto.randomBytes(MAGIC_LINK_TOKEN_BYTES).toString('hex');
  const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000);

  const result = await pool.query(`
    INSERT INTO owner_accounts (tenant_id, business_id, email, magic_link_token, magic_link_expires_at, status)
    VALUES ($1, $2, $3, $4, $5, 'pending')
    ON CONFLICT (email) DO UPDATE
      SET magic_link_token = EXCLUDED.magic_link_token,
          magic_link_expires_at = EXCLUDED.magic_link_expires_at,
          tenant_id = EXCLUDED.tenant_id,
          business_id = EXCLUDED.business_id
    RETURNING id, status
  `, [tenantId, businessId, email, token, expiresAt]);

  const account = result.rows[0];

  return {
    success: true,
    message: 'Magic link generated',
    token,
    expiresAt,
  };
}

/**
 * Verify magic link token and return account if valid.
 */
export async function verifyMagicLink(token: string): Promise<{
  valid: boolean;
  accountId?: string;
  tenantId?: string;
  businessId?: string;
  email?: string;
  status?: string;
}> {
  const result = await pool.query(`
    SELECT id, tenant_id, business_id, email, status, magic_link_expires_at
    FROM owner_accounts
    WHERE magic_link_token = $1
  `, [token]);

  if (result.rows.length === 0) {
    return { valid: false };
  }

  const account = result.rows[0];

  // Check expiry
  if (new Date(account.magic_link_expires_at) < new Date()) {
    return { valid: false };
  }

  // Clear token after use
  await pool.query(`
    UPDATE owner_accounts SET magic_link_token = NULL, magic_link_expires_at = NULL
    WHERE id = $1
  `, [account.id]);

  return {
    valid: true,
    accountId: account.id,
    tenantId: account.tenant_id,
    businessId: account.business_id,
    email: account.email,
    status: account.status,
  };
}

/**
 * Get magic link URL for email.
 */
export function getMagicLinkUrl(token: string, baseUrl: string = 'https://siteforge.io'): string {
  return `${baseUrl}/claim/magic?token=${token}`;
}
