/**
 * Conversion tracking for preview -> paid subscription funnel.
 * Tracks: preview_sent -> preview_viewed -> claimed -> paid
 */

import { trackEvent } from './tracker';
import { pool } from '../../database/pool';

export type ConversionStage = 'sent' | 'viewed' | 'claimed' | 'paid';

/**
 * Record a conversion event for a preview link.
 */
export async function recordConversion(
  previewLinkId: string,
  tenantId: string,
  businessId: string,
  stage: ConversionStage
): Promise<void> {
  const eventType = {
    sent: 'preview_sent',
    viewed: 'preview_viewed',
    claimed: 'claimed',
    paid: 'paid',
  }[stage];

  await trackEvent({
    tenantId,
    businessId,
    previewLinkId,
    eventType: eventType as 'preview_sent' | 'preview_viewed' | 'claimed' | 'paid',
  });
}

/**
 * Check if a preview has converted to any stage.
 */
export async function getConversionStage(
  previewLinkId: string
): Promise<{ stage: ConversionStage; timestamp: Date } | null> {
  // Check each stage in order of funnel progression
  const stages: ConversionStage[] = ['paid', 'claimed', 'viewed', 'sent'];

  for (const stage of stages) {
    const eventType = {
      sent: 'preview_sent',
      viewed: 'preview_viewed',
      claimed: 'claimed',
      paid: 'paid',
    }[stage];

    const result = await pool.query(
      `SELECT timestamp FROM analytics_events
       WHERE preview_link_id = $1 AND event_type = $2
       ORDER BY timestamp DESC LIMIT 1`,
      [previewLinkId, eventType]
    );

    if (result.rows.length > 0) {
      return {
        stage,
        timestamp: new Date(result.rows[0].timestamp),
      };
    }
  }

  return null;
}
