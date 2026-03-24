/**
 * Quality tier thresholds for content selection.
 * User decision: Top 20% by engagement percentile wins.
 */

export const ENGAGEMENT_PERCENTILE = 80; // Top 20%

export interface QualityTierConfig {
  /** Reject posts older than this many days */
  maxAgeDays: number;
  /** Reject images narrower than this many pixels */
  minResolution: number;
  /** Reject captions with more than this many hashtags */
  maxHashtags: number;
  /** Reject these hashtags (off-brand promotional) */
  bannedHashtags: string[];
  /** Reject captions containing these keywords (party photos, etc.) */
  bannedKeywords: string[];
}

export const DEFAULT_QUALITY_TIER: QualityTierConfig = {
  maxAgeDays: 365,           // 12 months (user decision)
  minResolution: 800,       // Reject low-res images (Claude's discretion)
  maxHashtags: 3,           // Excessive = more than 3 (Claude's discretion)
  bannedHashtags: ['sale', 'coupon', 'ad', 'sponsored', 'discount', 'offer'],
  bannedKeywords: ['party', 'drunk', 'night out', 'birthday special', 'celebration'],
};
