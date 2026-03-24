import { GoogleReviewsSchema, YelpSchema } from '../../scraping/validation/schemas';
import { Testimonial, TestimonialSchema } from '../templates/variables';
import { z } from 'zod';

interface Review {
  author: string;
  text: string;
  rating: number;
  date: string;
  source?: 'google_reviews' | 'yelp';
}

/**
 * Select authentic testimonials from Google Reviews or Yelp.
 * Heuristic selection based on:
 * - Text length (>20 words = specific, not generic)
 * - Specific details (places, names, experiences mentioned)
 * - Rating correlation (most reviews are positive, focus on 4-5 stars)
 *
 * Fallback: If no social content qualifies, use top Google Reviews.
 */
export async function selectAuthenticTestimonials(
  reviews: Review[],
  count: number = 3
): Promise<Testimonial[]> {
  if (reviews.length === 0) {
    return [];
  }

  // Score each review by authenticity indicators
  const scoredReviews = reviews.map(review => {
    const text = review.text;
    const wordCount = text.split(/\s+/).length;

    // Authenticity indicators
    const hasSpecificDetails = /[A-Z][a-z]+ (?:said|mentioned|noted|experienced)/.test(text) ||
                               /\d+ (?:years?|times?|days?|hours?)/.test(text);
    const isNotGeneric = wordCount >= 20;
    const hasHighRating = review.rating >= 4;

    // Avoid reviews that are just star ratings without text
    const hasSubstantiveText = text.length > 50;

    const authenticityScore = (
      (isNotGeneric ? 2 : 0) +
      (hasSpecificDetails ? 3 : 0) +
      (hasHighRating ? 1 : 0) +
      (hasSubstantiveText ? 2 : 0)
    );

    return {
      ...review,
      authenticityScore,
      wordCount,
    };
  });

  // Sort by authenticity score descending, then by rating descending
  const sorted = scoredReviews.sort((a, b) => {
    if (b.authenticityScore !== a.authenticityScore) {
      return b.authenticityScore - a.authenticityScore;
    }
    return b.rating - a.rating;
  });

  // Take top N
  const selected = sorted.slice(0, count);

  return selected.map(r => ({
    author: r.author,
    text: r.text,
    rating: r.rating,
    source: r.source,
  }));
}

/**
 * Validate testimonials against schema.
 * Returns validated array or throws if invalid.
 */
export function validateTestimonials(testimonials: unknown[]): Testimonial[] {
  return TestimonialSchema.array().parse(testimonials);
}

/**
 * Fallback: Use Google Reviews when social content is thin.
 * Selects top 3 by rating + text length, excludes generic reviews.
 */
export function selectFallbackTestimonials(
  googleReviews: Array<{ author: string; text: string; rating: number; date: string }>,
  count: number = 3
): Testimonial[] {
  // Filter out generic short reviews
  const qualified = googleReviews.filter(r => {
    const wordCount = r.text.split(/\s+/).length;
    return wordCount >= 20;
  });

  // Sort by rating desc, then text length desc
  qualified.sort((a, b) => {
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.text.length - a.text.length;
  });

  return qualified.slice(0, count).map(r => ({
    author: r.author,
    text: r.text,
    rating: r.rating,
    source: 'google_reviews' as const,
  }));
}
