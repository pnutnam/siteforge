/**
 * Business info for template compilation.
 */

export interface BusinessInfo {
  name: string;
  category: 'restaurant' | 'salon' | 'general';
  address?: string;
  phone?: string;
  website?: string;
  hours?: Record<string, string>;
  neighborhood?: string;
}

export interface ContentInfo {
  headline: string;
  tagline: string;
  about: string;
  images: Array<{
    url: string;
    source: 'instagram' | 'facebook' | 'yelp';
    engagement: number;
    caption?: string;
    altText?: string;
  }>;
  testimonials: Array<{
    author: string;
    text: string;
    rating: number;
  }>;
  quality: { score: number; passed: boolean };
}

export interface MetaInfo {
  generatedAt: string;
  businessId: string;
  tenantId: string;
}

export interface TemplateVariables {
  business: BusinessInfo;
  content: ContentInfo;
  meta: MetaInfo;
}
