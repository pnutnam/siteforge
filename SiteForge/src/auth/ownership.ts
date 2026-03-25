/**
 * Ownership validation helper for sensitive operations.
 *
 * Per user decisions:
 * - Sensitive operations explicitly validate resource ownership
 * - Sensitive resources: payment/subscription, user account management,
 *   billing settings, API key management
 *
 * This implements the layered isolation approach:
 * - API explicitly validates resource ownership
 * - Middleware validates tenant_id from JWT on every request
 */

import { pool } from '@/database/pool';

/**
 * Verify that the account belongs to the specified tenant.
 *
 * @param accountId - The account ID to verify
 * @param tenantId - The expected tenant ID
 * @returns true if account belongs to tenant, false otherwise
 */
export async function checkAccountOwnership(accountId: string, tenantId: string): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT tenant_id FROM owner_accounts WHERE id = $1',
      [accountId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].tenant_id === tenantId;
  } catch {
    return false;
  } finally {
    client.release();
  }
}

/**
 * Simple synchronous check that resource's tenantId matches JWT's tenantId.
 * Use when you already have the resource's tenantId.
 *
 * @param tenantId - The tenant ID from the JWT
 * @param resourceTenantId - The tenant ID of the resource
 * @returns true if tenant IDs match, false otherwise
 */
export function checkResourceOwnership(tenantId: string, resourceTenantId: string): boolean {
  return tenantId === resourceTenantId;
}

/**
 * Require ownership check - throws Error if ownership validation fails.
 * Use before performing sensitive operations.
 *
 * @param tenantId - The tenant ID from the JWT
 * @param resourceTenantId - The tenant ID of the resource
 * @throws Error with 'Forbidden' message if ownership check fails
 */
export function requireOwnership(tenantId: string, resourceTenantId: string): void {
  if (!checkResourceOwnership(tenantId, resourceTenantId)) {
    throw new Error('Forbidden');
  }
}

/**
 * Require ownership check with async account lookup.
 * Use when you need to verify the account belongs to the tenant.
 *
 * @param accountId - The account ID to verify
 * @param tenantId - The tenant ID from the JWT
 * @throws Error with 'Forbidden' message if ownership check fails
 */
export async function requireAccountOwnership(accountId: string, tenantId: string): Promise<void> {
  const isOwner = await checkAccountOwnership(accountId, tenantId);
  if (!isOwner) {
    throw new Error('Forbidden');
  }
}
