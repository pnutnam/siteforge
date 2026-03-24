/**
 * Dashboard-specific preview link operations.
 */

import { pool } from '../database/pool';
import { getPreviewLink } from '../preview/links/manager';
import { getPreviewStats } from '../preview/analytics/stats';

export interface DashboardPreviewLink {
  id: string;
  businessId: string;
  businessName: string;
  previewUrl: string;
  status: 'active' | 'expired' | 'claimed';
  views: number;
  firstViewedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  daysUntilExpiration: number;
  metrics: {
    viewRate: number;
    clickRate: number;
    conversionRate: number;
  };
}

/**
 * Get all preview links for dashboard display.
 */
export async function getDashboardPreviews(tenantId: string): Promise<DashboardPreviewLink[]> {
  const result = await pool.query(
    `SELECT pl.*, b.name as business_name
     FROM preview_links pl
     JOIN businesses b ON b.id = pl.business_id
     WHERE pl.tenant_id = $1
     ORDER BY pl.created_at DESC`,
    [tenantId]
  );

  const previews: DashboardPreviewLink[] = [];

  for (const row of result.rows) {
    const stats = await getPreviewStats(row.url_hash, tenantId);
    const daysUntilExpiration = Math.ceil((new Date(row.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    previews.push({
      id: row.id,
      businessId: row.business_id,
      businessName: row.business_name,
      previewUrl: `https://biz-${row.url_hash}.preview.siteforge.io`,
      status: row.status === 'expired' ? 'expired' : row.status === 'claimed' ? 'claimed' : 'active',
      views: parseInt(row.view_count, 10),
      firstViewedAt: row.viewed_at ? new Date(row.viewed_at) : undefined,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
      daysUntilExpiration,
      metrics: {
        viewRate: stats?.analytics.viewRate ?? 0,
        clickRate: stats?.analytics.clickRate ?? 0,
        conversionRate: stats?.analytics.conversionRate ?? 0,
      },
    });
  }

  return previews;
}
