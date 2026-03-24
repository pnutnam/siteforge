import { ContentItem } from '../engagement/types';
import Anthropic from '@anthropic-ai/sdk';
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
 * Allows tests to get a fresh client with the latest mock.
 */
export function resetClient(): void {
  _client = null;
}

// AI quality classification response schema
const QualityClassificationResponseSchema = z.object({
  quality: z.enum(['high', 'medium', 'low']),
  onBrand: z.boolean(),
  reasons: z.array(z.string()),
  brandConcerns: z.array(z.string()).optional(),
});

export interface QualityClassification {
  quality: 'high' | 'medium' | 'low';
  onBrand: boolean;
  reasons: string[];
  brandConcerns?: string[];
}

/**
 * Classify content quality using AI.
 * Evaluates beyond rule-based filters to understand context and brand fit.
 *
 * Quality indicators:
 * - HIGH: Shows products/services professionally, features team/workspace/happy customers
 * - MEDIUM: Acceptable but not featured
 * - LOW: Party photos, generic promo, screenshots, could embarrass business
 *
 * On-brand check:
 * - Rejects content that doesn't fit the business category
 * - Flags content that could embarrass or look unprofessional
 */
export async function classifyContentQuality(
  item: ContentItem,
  businessName: string,
  businessCategory: 'restaurant' | 'salon' | 'general'
): Promise<QualityClassification> {
  const prompt = `You are a content quality classifier for a local business website.

Business: ${businessName}
Category: ${businessCategory}

Evaluate this social media post for use on the business's website:

${item.caption ? `Caption: "${item.caption}"` : 'No caption'}
${item.imageUrl ? `Image: ${item.imageUrl}` : 'No image'}
Source: ${item.source}

IMPORTANT: Only use information explicitly provided above. Do not invent or assume details about the business.

Classify as HIGH quality (show prominently on website), MEDIUM (acceptable but not featured), or LOW (don't show).

HIGH quality indicators:
- Shows the business's products/services in a professional or authentic way
- Features the team, workspace, or happy customers
- Highlights quality, craftsmanship, or unique aspects of the business
- Looks professional and well-composed
- Appropriate for all audiences

LOW quality indicators:
- Party photos, celebrations, or alcohol-focused content
- Generic promotional posts (#sale #coupon)
- Screenshots or low-quality images
- Content that could embarrass the business or look unprofessional
- Off-brand for ${businessCategory} businesses

Respond with JSON only (no markdown):
{
  "quality": "high|medium|low",
  "onBrand": true|false,
  "reasons": ["reason1", "reason2"],
  "brandConcerns": ["concern"] // only if onBrand is false
}`;

  try {
    const response = await getClient().messages.create({
      model: 'minimax-2.7', // MiniMax M2.7 via Anthropic endpoint
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].text;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = QualityClassificationResponseSchema.safeParse(JSON.parse(jsonMatch[0]));
      if (parsed.success) {
        return parsed.data;
      }
    }

    // Parse failure - default to LOW (safer than MEDIUM)
    console.error('AI quality classification parse failure:', content);
    return {
      quality: 'low',
      onBrand: false,
      reasons: ['Could not parse AI classification response'],
    };
  } catch (error) {
    console.error('AI quality classification error:', error);
    return {
      quality: 'low',
      onBrand: false,
      reasons: [`AI classification error: ${error instanceof Error ? error.message : 'Unknown'}`],
    };
  }
}

/**
 * Batch classify multiple content items in parallel.
 * Uses Promise.all for parallel AI calls.
 */
export async function batchClassifyContent(
  items: ContentItem[],
  businessName: string,
  businessCategory: 'restaurant' | 'salon' | 'general',
  concurrency: number = 5
): Promise<Array<ContentItem & { classification: QualityClassification }>> {
  // Process in batches to avoid overwhelming the AI API
  const results: Array<ContentItem & { classification: QualityClassification }> = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (item) => ({
        ...item,
        classification: await classifyContentQuality(item, businessName, businessCategory),
      }))
    );
    results.push(...batchResults);
  }

  return results;
}
