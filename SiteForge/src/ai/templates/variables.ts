import { z } from 'zod';

/**
 * Template variable schemas for Astro landing pages.
 * CONTENT-04: AI maps scraped data to template variables without data loss.
 */

// Schema for selected/featured images on the landing page
export const FeaturedImageSchema = z.object({
  url: z.string().url(),
  source: z.enum(['instagram', 'facebook', 'yelp']),
  engagement: z.number(),
  caption: z.string().optional(),
  altText: z.string().optional(), // AI-generated alt text for accessibility
});

// Schema for testimonials selected by AI
export const TestimonialSchema = z.object({
  author: z.string().min(1),
  text: z.string().min(10).max(500),  // Authentic reviews are 10-500 chars
  rating: z.number().min(1).max(5),
  source: z.enum(['google_reviews', 'yelp']).optional(),
});

// Quality scoring for generated content
export const QualityScoreSchema = z.object({
  score: z.number().min(0).max(1),  // 0.0 to 1.0
  passed: z.boolean(),
  rejectionReasons: z.array(z.string()).optional(),
});

// Generated content (AI output for copy + selections)
export const GeneratedContentSchema = z.object({
  headline: z.string().min(1).max(100),
  tagline: z.string().min(1).max(150),
  about: z.string().min(100).max(2000),  // 2-3 paragraphs
  testimonials: z.array(TestimonialSchema).min(1).max(5),
  images: z.array(FeaturedImageSchema).min(1).max(10),
  quality: QualityScoreSchema,
});

// Business info from scraped data (maps to template)
export const BusinessInfoSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['restaurant', 'salon', 'general']),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  hours: z.record(z.string(), z.string()).optional(),
  neighborhood: z.string().optional(),  // Extracted from address for tagline
});

// Full template variables for Astro build
export const TemplateVariablesSchema = z.object({
  business: BusinessInfoSchema,
  content: GeneratedContentSchema,
  meta: z.object({
    generatedAt: z.string().datetime(),
    businessId: z.string(),
    tenantId: z.string(),
    contentHash: z.string().optional(),  // For cache busting
  }),
});

// Type exports
export type GeneratedContent = z.infer<typeof GeneratedContentSchema>;
export type TemplateVariables = z.infer<typeof TemplateVariablesSchema>;
export type FeaturedImage = z.infer<typeof FeaturedImageSchema>;
export type Testimonial = z.infer<typeof TestimonialSchema>;
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;
export type QualityScore = z.infer<typeof QualityScoreSchema>;
