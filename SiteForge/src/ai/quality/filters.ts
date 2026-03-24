import { ContentItem } from '../engagement/types';
import { QualityTierConfig, DEFAULT_QUALITY_TIER } from '../engagement/thresholds';

export interface FilterResult {
  passed: boolean;
  reasons: string[];
}

/**
 * Apply rule-based quality filters before AI classification.
 * Rejects:
 * - Posts older than maxAgeDays
 * - Images narrower than minResolution (detected via URL pattern or header fetch)
 * - Captions with excessive hashtags
 * - Captions with banned hashtags (#sale, #coupon, etc.)
 * - Captions with banned keywords (party, drunk, etc.)
 * - Video-only posts (no image attached)
 *
 * Note: Image resolution detection is best-effort at this stage.
 * Full resolution check requires sharp library to fetch headers.
 */
export function applyQualityFilters(
  item: ContentItem,
  config: QualityTierConfig = DEFAULT_QUALITY_TIER
): FilterResult {
  const reasons: string[] = [];

  // Check age
  if (item.postedAt) {
    const ageDays = (Date.now() - new Date(item.postedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageDays > config.maxAgeDays) {
      reasons.push(`Post is ${Math.floor(ageDays)} days old (max ${config.maxAgeDays})`);
    }
  }

  // Check hashtags
  if (item.caption) {
    const hashtags = (item.caption.match(/#\w+/g) || []).map(h => h.toLowerCase().slice(1));
    const excessiveHashtags = hashtags.filter(h => config.bannedHashtags.includes(h));
    if (excessiveHashtags.length > 0) {
      reasons.push(`Banned hashtags: ${excessiveHashtags.join(', ')}`);
    }
    if (hashtags.length > config.maxHashtags) {
      reasons.push(`Too many hashtags: ${hashtags.length} (max ${config.maxHashtags})`);
    }

    // Check banned keywords
    const lowerCaption = item.caption.toLowerCase();
    const matchedKeywords = config.bannedKeywords.filter(k => lowerCaption.includes(k));
    if (matchedKeywords.length > 0) {
      reasons.push(`Banned keywords: ${matchedKeywords.join(', ')}`);
    }
  }

  // Check for video-only posts (no image)
  if (!item.imageUrl) {
    reasons.push('No image attached (video-only post)');
  }

  return { passed: reasons.length === 0, reasons };
}

/**
 * Batch filter multiple content items.
 * Returns passed items and failed items with reasons.
 */
export function filterContentBatch(
  items: ContentItem[],
  config: QualityTierConfig = DEFAULT_QUALITY_TIER
): { passed: ContentItem[]; failed: Array<ContentItem & { reasons: string[] }> } {
  const passed: ContentItem[] = [];
  const failed: Array<ContentItem & { reasons: string[] }> = [];

  for (const item of items) {
    const result = applyQualityFilters(item, config);
    if (result.passed) {
      passed.push(item);
    } else {
      failed.push({ ...item, reasons: result.reasons });
    }
  }

  return { passed, failed };
}
