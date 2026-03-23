import { z } from 'zod';

// Google Maps Schema (SCRAPE-01)
export const GoogleMapsSchema = z.object({
  businessName: z.string().min(1, 'Business name required'),
  address: z.string().min(1, 'Address required'),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  hours: z.record(z.string(), z.string()).optional(),
  reviews: z.array(z.object({
    author: z.string(),
    rating: z.number().min(1).max(5),
    text: z.string(),
    date: z.string(),
    response: z.string().optional(),
  })).optional(),
  rating: z.number().min(0).max(5).optional(),
  resultsCount: z.number().optional(),
});

// Instagram Schema (SCRAPE-02)
export const InstagramSchema = z.object({
  profileName: z.string().min(1),
  bio: z.string().optional(),
  followers: z.number().optional(),
  following: z.number().optional(),
  posts: z.array(z.object({
    id: z.string(),
    imageUrl: z.string().url().optional(),
    caption: z.string().optional(),
    likes: z.number(),
    comments: z.number(),
    shares: z.number().optional(),
    engagement: z.number(), // likes + comments + shares (required for sorting)
    postedAt: z.string().optional(),
  })).optional(),
});

// Facebook Schema (SCRAPE-04)
export const FacebookSchema = z.object({
  pageName: z.string().min(1),
  about: z.string().optional(),
  likes: z.number().optional(),
  posts: z.array(z.object({
    id: z.string(),
    content: z.string(),
    likes: z.number().optional(),
    comments: z.number().optional(),
    shares: z.number().optional(),
    postedAt: z.string().optional(),
  })).optional(),
});

// Yelp Schema (SCRAPE-05)
export const YelpSchema = z.object({
  businessName: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.array(z.object({
    id: z.string(),
    author: z.string(),
    rating: z.number().min(1).max(5),
    text: z.string(),
    date: z.string(),
    helpful: z.number().optional(),
  })).optional(),
  categories: z.array(z.string()).optional(),
});

// Google Reviews Schema (SCRAPE-03)
export const GoogleReviewsSchema = z.object({
  businessName: z.string().min(1),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.array(z.object({
    author: z.string(),
    rating: z.number().min(1).max(5),
    text: z.string(),
    date: z.string(),
    response: z.string().optional(),
  })).optional(),
  totalReviews: z.number().optional(),
});

// Helper for partial store on validation failure
export function validateOrPartial<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { valid: true; data: T } | { valid: false; partial: Record<string, unknown>; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  const partial: Record<string, unknown> = {};
  return { valid: false, partial, errors: result.error };
}
