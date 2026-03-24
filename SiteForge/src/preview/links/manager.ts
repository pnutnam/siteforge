import { pool } from '../../database/pool';
import { registerPreview } from '../cdn/cloudflare';
import { CreatePreviewLinkInput, PreviewLink, PreviewLinkStats } from './types';

const EXPIRATION_DAYS = 30;

/**
 * Create a new preview link for a business.
 * Generates unique hash, stores in DB, registers with Cloudflare KV.
 * Returns the full preview URL: https://biz-{hash}.preview.siteforge.io
 */
export async function createPreviewLink(input: CreatePreviewLinkInput): Promise<{ url: string; link: PreviewLink }> {
  const urlHash = generateUrlHash(input.businessId, input.tenantId);
  const expiresAt = new Date(Date.now() + (input.expiresInDays ?? EXPIRATION_DAYS) * 24 * 60 * 60 * 1000);

  const result = await pool.query(
    `INSERT INTO preview_links (tenant_id, business_id, url_hash, s3_key, status, expires_at, view_count)
     VALUES ($1, $2, $3, $4, 'active', $5, '0')
     RETURNING id`,
    [input.tenantId, input.businessId, urlHash, input.s3Key, expiresAt]
  );
  const id = result.rows[0].id;

  // Register with Cloudflare KV for routing
  await registerPreview({
    hash: urlHash,
    s3Key: input.s3Key,
    tenantId: input.tenantId,
    businessId: input.businessId,
    expiresAt,
  });

  const link: PreviewLink = {
    id,
    tenantId: input.tenantId,
    businessId: input.businessId,
    urlHash,
    s3Key: input.s3Key,
    status: 'active',
    expiresAt,
    createdAt: new Date(),
    viewCount: 0,
  };

  return {
    url: `https://biz-${urlHash}.preview.siteforge.io`,
    link,
  };
}

/**
 * Get preview link by hash.
 * Returns null if not found or expired.
 */
export async function getPreviewLink(hash: string): Promise<PreviewLink | null> {
  const result = await pool.query(
    `SELECT * FROM preview_links WHERE url_hash = $1`,
    [hash]
  );

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  const isExpired = new Date(row.expires_at) < new Date();

  if (isExpired) return null;

  return {
    id: row.id,
    tenantId: row.tenant_id,
    businessId: row.business_id,
    urlHash: row.url_hash,
    s3Key: row.s3_key,
    status: row.status,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    viewedAt: row.viewed_at ? new Date(row.viewed_at) : undefined,
    viewCount: parseInt(row.view_count, 10),
    claimedAt: row.claimed_at ? new Date(row.claimed_at) : undefined,
  };
}

/**
 * Record a view for a preview link.
 * Called when the preview page is loaded.
 */
export async function recordPreviewView(hash: string): Promise<void> {
  await pool.query(
    `UPDATE preview_links
     SET view_count = view_count + 1,
         viewed_at = COALESCE(viewed_at, NOW())
     WHERE url_hash = $1`,
    [hash]
  );
}

/**
 * Get stats for a preview link.
 */
export async function getPreviewLinkStats(hash: string): Promise<PreviewLinkStats | null> {
  const link = await getPreviewLink(hash);
  if (!link) return null;

  const daysUntilExpiration = Math.ceil((link.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  return {
    views: link.viewCount,
    firstViewedAt: link.viewedAt,
    isExpired: link.status === 'expired',
    daysUntilExpiration,
  };
}

/**
 * Mark a preview as claimed (business owner clicked the claim form).
 */
export async function claimPreviewLink(hash: string): Promise<void> {
  await pool.query(
    `UPDATE preview_links SET status = 'claimed', claimed_at = NOW() WHERE url_hash = $1`,
    [hash]
  );
}

function generateUrlHash(businessId: string, tenantId: string): string {
  // Deterministic hash based on businessId + timestamp for uniqueness
  const data = `${businessId}-${tenantId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  // Simple hash - in production use crypto.subtle.digest
  let hash = 0;
  for (let i = 0; i < buffer.length; i++) {
    hash = ((hash << 5) - hash) + buffer[i];
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).slice(0, 8);
}