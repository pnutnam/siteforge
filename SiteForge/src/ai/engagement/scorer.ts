import { ContentItem, ScoredContent } from './types';

export interface ScoredContent extends ContentItem {
  percentileRank: number;
}

/**
 * Select top content by engagement percentile within a business's content pool.
 * Uses percentile rank - fair to both small and large businesses.
 *
 * @param content - Array of content items with engagement scores
 * @param percentile - Cutoff percentile (default 80 = top 20%)
 * @returns Content items at or above the engagement threshold
 */
export function selectTopEngagement(
  content: ContentItem[],
  percentile: number = 80
): ContentItem[] {
  if (content.length === 0) return [];

  // Sort by engagement descending
  const sorted = [...content].sort((a, b) => b.engagement - a.engagement);

  // Find threshold at given percentile
  // e.g., 80th percentile means top 20%
  const thresholdIndex = Math.ceil((percentile / 100) * sorted.length);
  const threshold = sorted[Math.max(0, thresholdIndex - 1)]?.engagement ?? 0;

  // Return items at or above threshold
  return sorted.filter(item => item.engagement >= threshold);
}

/**
 * Calculate percentile rank for each content item within the pool.
 * Returns array with percentileRank (0-100) added to each item.
 */
export function calculatePercentileRanks(content: ContentItem[]): ScoredContent[] {
  if (content.length === 0) return [];

  const sorted = [...content].sort((a, b) => b.engagement - a.engagement);
  const maxEngagement = sorted[0].engagement;

  return sorted.map((item, index) => ({
    ...item,
    percentileRank: maxEngagement > 0
      ? Math.round((item.engagement / maxEngagement) * 100)
      : 0,
  }));
}
