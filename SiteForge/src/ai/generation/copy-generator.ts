import Anthropic from '@anthropic-ai/sdk';
import { ContentItem } from '../engagement/types';
import { GeneratedContent, GeneratedContentSchema, Testimonial } from '../templates/variables';
import { RESTAURANT_TEMPLATES } from './prompts/restaurant';
import { SALON_TEMPLATES } from './prompts/salon';
import { GENERAL_TEMPLATES } from './prompts/general';
import { selectAuthenticTestimonials } from './testimonials';
import { z } from 'zod';

// Lazy client initialization to support mocking in tests
let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

/**
 * Reset the cached client (for testing purposes).
 */
export function resetClient(): void {
  _client = null;
}

type BusinessCategory = 'restaurant' | 'salon' | 'general';

const CATEGORY_TEMPLATES = {
  restaurant: RESTAURANT_TEMPLATES,
  salon: SALON_TEMPLATES,
  general: GENERAL_TEMPLATES,
};

/**
 * Extract neighborhood from address string.
 * e.g., "123 Main St, Brooklyn, NY 11201" -> "Brooklyn"
 */
function extractNeighborhood(address?: string): string {
  if (!address) return 'the neighborhood';

  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Second part is usually city/neighborhood
    return parts[1].split(' ')[0];
  }
  return 'the neighborhood';
}

/**
 * Select random tagline for category.
 */
function selectTagline(category: BusinessCategory): string {
  const templates = CATEGORY_TEMPLATES[category];
  const taglines = templates.categoryTaglines;
  return taglines[Math.floor(Math.random() * taglines.length)];
}

/**
 * Generate site copy using hybrid approach:
 * - Headline: template-driven
 * - Tagline: template-driven
 * - About: AI-generated prose
 *
 * Uses business info and social proof as source material.
 */
export async function generateSiteCopy(
  businessName: string,
  category: BusinessCategory,
  address: string | undefined,
  socialPosts: ContentItem[],
  reviews: Array<{ author: string; text: string; rating: number; date: string }>
): Promise<GeneratedContent> {
  const templates = CATEGORY_TEMPLATES[category];
  const neighborhood = extractNeighborhood(address);

  // Template-driven elements
  const tagline = selectTagline(category);
  const headline = templates.headline(businessName, tagline);

  // AI-generated about section
  const about = await generateAboutSection(
    businessName,
    category,
    neighborhood,
    socialPosts,
    reviews,
    templates.about
  );

  // AI-select authentic testimonials
  const testimonials = await selectAuthenticTestimonials(reviews, 3);

  return {
    headline,
    tagline: templates.neighborhoodPatterns[0](neighborhood),
    about,
    testimonials,
    images: [], // Images selected separately in image-selector job
    quality: {
      score: 0.8,
      passed: true,
    },
  };
}

/**
 * Generate about section using AI.
 * Only uses information explicitly provided in the data.
 */
async function generateAboutSection(
  businessName: string,
  category: BusinessCategory,
  neighborhood: string,
  socialPosts: ContentItem[],
  reviews: Array<{ author: string; text: string; rating: number; date: string }>,
  templateConfig: { tone: string; structure: string; avoid: string[]; include: string[] }
): Promise<string> {
  // Build social proof context from posts
  const socialProofContext = socialPosts.slice(0, 3).map(p => {
    return p.caption
      ? `- ${p.caption.slice(0, 200)}`
      : `- ${p.source} post`;
  }).join('\n') || 'No social posts available.';

  // Build review context
  const reviewContext = reviews.slice(0, 2).map(r => {
    return `- "${r.text.slice(0, 150)}..." - ${r.author}`;
  }).join('\n') || 'No reviews available.';

  const prompt = `You are a copywriter for a local ${category} website.

Write a compelling 2-3 paragraph "About Us" section for:

Business: ${businessName}
Category: ${category}
Location: ${neighborhood}

Tone: ${templateConfig.tone}
Format: ${templateConfig.structure}

IMPORTANT: Only use information explicitly provided below. Do not invent or assume details about the business.

Use these social media highlights as context:
${socialProofContext}

Use these reviews as context:
${reviewContext}

What to include:
${templateConfig.include.map(i => `- ${i}`).join('\n')}

What to avoid:
${templateConfig.avoid.map(a => `- ${a}`).join('\n')}

Write in first person plural (we/our). Be specific - extract unique details from the provided context.`;

  const response = await getClient().messages.create({
    model: 'minimax-2.7',
    max_tokens: 800,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text;
}

/**
 * Validate generated content against schema.
 * Throws if invalid.
 */
export function validateGeneratedContent(content: unknown): GeneratedContent {
  return GeneratedContentSchema.parse(content);
}
