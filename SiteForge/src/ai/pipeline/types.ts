/**
 * AI Pipeline job types.
 */

import { GeneratedContent } from '../templates/variables';
import { ContentItem } from '../engagement/types';

export interface AIPipelineJob {
  businessId: string;
  tenantId: string;
  // Scraped data references (loaded from DB in processors)
  instagramPostIds?: string[];
  facebookPostIds?: string[];
  yelpPostIds?: string[];
}

export interface ImageSelectJob {
  businessId: string;
  tenantId: string;
}

export interface CopyWriteJob {
  businessId: string;
  tenantId: string;
}

export interface AIPipelineResult {
  businessId: string;
  content: {
    images: SelectedImage[];
    copy: GeneratedCopy | null;
  };
  quality: {
    totalImages: number;
    selectedImages: number;
    qualityPassed: boolean;
    copyGenerated: boolean;
  };
}

export interface SelectedImage {
  id: string;
  url: string;
  source: 'instagram' | 'facebook' | 'yelp';
  engagement: number;
  caption?: string;
  qualityScore: number;
}

export interface GeneratedCopy {
  headline: string;
  tagline: string;
  about: string;
  testimonials: Array<{
    author: string;
    text: string;
    rating: number;
  }>;
}

// Re-export for convenience
export type { ContentItem, GeneratedContent };
