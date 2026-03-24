/**
 * Unified content item interface across all social sources.
 */

export interface ContentItem {
  id: string;
  source: 'instagram' | 'facebook' | 'yelp';
  imageUrl?: string;
  caption?: string;    // Instagram caption or Facebook post content
  engagement: number;  // likes + comments + shares
  postedAt?: string;
}

export interface ScoredContent extends ContentItem {
  percentileRank: number;
}

export interface SelectedContent extends ScoredContent {
  qualityPassed: boolean;
  rejectionReasons?: string[];
}
