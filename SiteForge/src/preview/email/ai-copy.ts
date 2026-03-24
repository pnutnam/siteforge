/**
 * AI-generated personalized email copy for preview outreach.
 * Uses the generated landing page copy as context for personalization.
 */

import { pool } from '../../database/pool';
import { withTenant } from '../../database/schema';
import Anthropic from '@anthropic-ai/sdk';

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

export interface GenerateEmailCopyOptions {
  tenantId: string;
  businessId: string;
  businessName: string;
  previewUrl: string;
  agentName: string;
}

/**
 * Generate personalized email copy for a business preview.
 * Subject and body are AI-generated based on the business's generated landing page content.
 */
export async function generateEmailCopy(options: GenerateEmailCopyOptions): Promise<{
  subject: string;
  body: string;
}> {
  const { tenantId, businessId, businessName, previewUrl, agentName } = options;

  // Fetch generated content for personalization context
  const content = await withTenant(tenantId, pool, async () => {
    const result = await pool.query(
      `SELECT headline, tagline, about FROM generated_content WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [businessId]
    );
    return result.rows[0] ?? null;
  });

  const client = getClient();

  const subjectPrompt = `Generate a compelling email subject line for sending a preview website to a business owner.

Business: ${businessName}
Preview Headline: ${content?.headline ?? businessName}
Tagline: ${content?.tagline ?? ''}

Requirements:
- Under 60 characters
- Personalized to this business
- Creates curiosity without being spammy
- Examples: "See what your customers see", "${businessName}'s new website preview"

Respond with ONLY the subject line, nothing else.`;

  const bodyPrompt = `Write a short, personalized email to send a business owner their new preview website.

Business Owner Context:
- Business: ${businessName}
- Their Preview Headline: ${content?.headline ?? businessName}
- Their Tagline: ${content?.tagline ?? ''}
- About snippet: ${(content?.about ?? '').slice(0, 200)}...

Agent sending: ${agentName}

Email requirements:
- Warm, personal tone (sounds like ${agentName} personally)
- Short (under 200 words)
- Include the preview link naturally
- Focus on showing them their own social proof (their photos and reviews)
- End with a simple CTA to click the link
- Don't be salesy - just excited to show them

Format:
Subject: [subject line]
---
[body]

Do not include any placeholders or [NAME] - write as if ${agentName} already knows the business name.`;

  const [subjectResponse, bodyResponse] = await Promise.all([
    client.messages.create({
      model: 'minimax-2.7',
      max_tokens: 50,
      messages: [{ role: 'user', content: subjectPrompt }],
    }),
    client.messages.create({
      model: 'minimax-2.7',
      max_tokens: 500,
      messages: [{ role: 'user', content: bodyPrompt }],
    }),
  ]);

  const subject = subjectResponse.content[0].text.trim();
  const body = bodyResponse.content[0].text.trim();

  return { subject, body };
}
