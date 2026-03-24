/**
 * Analytics tracker for preview links.
 * Records events and computes metrics.
 */

import { pool } from '../../database/pool';
import { AnalyticsEventType, PreviewAnalytics } from './types';

export interface TrackEventOptions {
  tenantId: string;
  businessId: string;
  previewLinkId: string;
  eventType: AnalyticsEventType;
  metadata?: Record<string, unknown>;
}

/**
 * Record an analytics event for a preview link.
 */
export async function trackEvent(options: TrackEventOptions): Promise<void> {
  const { tenantId, businessId, previewLinkId, eventType, metadata } = options;

  await pool.query(
    `INSERT INTO analytics_events (tenant_id, business_id, preview_link_id, event_type, metadata, timestamp)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [tenantId, businessId, previewLinkId, eventType, metadata ? JSON.stringify(metadata) : null]
  );

  // Update preview_links view count if this is a view event
  if (eventType === 'preview_viewed') {
    await pool.query(
      `UPDATE preview_links SET view_count = view_count + 1, viewed_at = COALESCE(viewed_at, NOW()) WHERE id = $1`,
      [previewLinkId]
    );
  }
}

/**
 * Get full analytics for a preview link.
 */
export async function getPreviewAnalytics(previewLinkId: string, tenantId: string): Promise<PreviewAnalytics | null> {
  // Fetch preview link basic info
  const linkResult = await pool.query(
    `SELECT * FROM preview_links WHERE id = $1 AND tenant_id = $2`,
    [previewLinkId, tenantId]
  );

  if (linkResult.rows.length === 0) return null;

  const link = linkResult.rows[0];
  const daysUntilExpiration = Math.ceil((new Date(link.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

  // Fetch event counts by type
  const eventsResult = await pool.query(
    `SELECT event_type, COUNT(*) as count
     FROM analytics_events
     WHERE preview_link_id = $1
     GROUP BY event_type`,
    [previewLinkId]
  );

  const eventCounts: Record<string, number> = {};
  for (const row of eventsResult.rows) {
    eventCounts[row.event_type] = parseInt(row.count, 10);
  }

  // Fetch time on site data for viewed events
  const timeOnSiteResult = await pool.query(
    `SELECT metadata->>'timeOnSite' as time_on_site
     FROM analytics_events
     WHERE preview_link_id = $1 AND event_type = 'preview_viewed' AND metadata->>'timeOnSite' IS NOT NULL`,
    [previewLinkId]
  );

  let timeOnSite;
  if (timeOnSiteResult.rows.length > 0) {
    const times = timeOnSiteResult.rows.map(r => parseFloat(r.time_on_site)).filter(t => !isNaN(t));
    if (times.length > 0) {
      const sorted = [...times].sort((a, b) => a - b);
      timeOnSite = {
        average: times.reduce((a, b) => a + b, 0) / times.length,
        median: sorted[Math.floor(sorted.length / 2)],
      };
    }
  }

  // Calculate rates
  const sent = eventCounts['preview_sent'] ?? 0;
  const viewed = eventCounts['preview_viewed'] ?? 0;
  const ctaClicked = eventCounts['cta_clicked'] ?? 0;
  const formOpened = eventCounts['form_opened'] ?? 0;
  const formSubmitted = eventCounts['form_submitted'] ?? 0;
  const claimed = eventCounts['claimed'] ?? 0;
  const paid = eventCounts['paid'] ?? 0;

  return {
    previewLinkId,
    previewUrl: `https://biz-${link.url_hash}.preview.siteforge.io`,
    status: link.status,
    daysUntilExpiration,
    events: { sent, viewed, ctaClicked, formOpened, formSubmitted, claimed, paid },
    metrics: {
      viewRate: sent > 0 ? viewed / sent : 0,
      clickRate: viewed > 0 ? ctaClicked / viewed : 0,
      formOpenRate: viewed > 0 ? formOpened / viewed : 0,
      conversionRate: sent > 0 ? formSubmitted / sent : 0,
    },
    timeOnSite,
    firstViewedAt: link.viewed_at ? new Date(link.viewed_at) : undefined,
  };
}
