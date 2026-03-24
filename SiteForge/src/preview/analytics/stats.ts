/**
 * Analytics stats endpoints for dashboard.
 */

import { getPreviewAnalytics } from './tracker';
import { getPreviewLinkStats } from '../links/manager';

export interface PreviewStats {
  previewUrl: string;
  views: number;
  firstViewedAt?: Date;
  isExpired: boolean;
  daysUntilExpiration: number;
  analytics: {
    ctaClicks: number;
    formOpens: number;
    formSubmissions: number;
    viewRate: number;
    clickRate: number;
    conversionRate: number;
    averageTimeOnSite?: number;
  };
}

/**
 * Get combined stats for a preview link (link data + analytics).
 */
export async function getPreviewStats(hash: string, tenantId: string): Promise<PreviewStats | null> {
  // Get basic link stats
  const linkStats = await getPreviewLinkStats(hash);
  if (!linkStats) return null;

  // Get detailed analytics
  const analytics = await getPreviewAnalytics(hash, tenantId);

  return {
    previewUrl: `https://biz-${hash}.preview.siteforge.io`,
    views: linkStats.views,
    firstViewedAt: linkStats.firstViewedAt,
    isExpired: linkStats.isExpired,
    daysUntilExpiration: linkStats.daysUntilExpiration,
    analytics: {
      ctaClicks: analytics?.events.ctaClicked ?? 0,
      formOpens: analytics?.events.formOpened ?? 0,
      formSubmissions: analytics?.events.formSubmitted ?? 0,
      viewRate: analytics?.metrics.viewRate ?? 0,
      clickRate: analytics?.metrics.clickRate ?? 0,
      conversionRate: analytics?.metrics.conversionRate ?? 0,
      averageTimeOnSite: analytics?.timeOnSite?.average,
    },
  };
}
