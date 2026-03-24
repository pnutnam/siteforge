/**
 * Compiles AI pipeline output into TemplateVariables JSON for Astro build.
 */

import { pool } from '../database/pool';
import { withTenant } from '../database/schema';
import { TemplateVariables } from '../ai/templates/variables';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface CompileOptions {
  businessId: string;
  tenantId: string;
  outputDir: string;
}

/**
 * Fetch AI-generated content for a business from PostgreSQL,
 * compile into TemplateVariables format, write to JSON file.
 */
export async function compileBusinessData(options: CompileOptions): Promise<string> {
  const { businessId, tenantId, outputDir } = options;

  const templateVars = await withTenant(tenantId, pool, async () => {
    // Fetch business info
    const businessResult = await pool.query(
      `SELECT name, phone, address FROM businesses WHERE id = $1`,
      [businessId]
    );
    if (businessResult.rows.length === 0) {
      throw new Error(`Business not found: ${businessId}`);
    }
    const business = businessResult.rows[0];

    // Fetch generated content
    const contentResult = await pool.query(
      `SELECT headline, tagline, about FROM generated_content WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [businessId]
    );
    const content = contentResult.rows[0] ?? { headline: business.name, tagline: '', about: '' };

    // Fetch selected images
    const imagesResult = await pool.query(
      `SELECT url, source, engagement, caption FROM generated_images WHERE business_id = $1 ORDER BY engagement DESC LIMIT 10`,
      [businessId]
    );
    const images = imagesResult.rows.map(row => ({
      url: row.url,
      source: row.source as 'instagram' | 'facebook' | 'yelp',
      engagement: parseInt(row.engagement, 10),
      caption: row.caption ?? undefined,
    }));

    // Fetch testimonials
    const testimonialsResult = await pool.query(
      `SELECT author, text, rating FROM generated_testimonials WHERE business_id = $1`,
      [businessId]
    );
    const testimonials = testimonialsResult.rows.map(row => ({
      author: row.author,
      text: row.text,
      rating: parseInt(row.rating, 10),
    }));

    // Infer category from business name or default to general
    const category = inferCategory(business.name);

    return {
      business: {
        name: business.name,
        category,
        address: business.address ?? undefined,
        phone: business.phone ?? undefined,
      },
      content: {
        headline: content.headline,
        tagline: content.tagline,
        about: content.about,
        images,
        testimonials,
        quality: { score: 0.8, passed: true },
      },
      meta: {
        generatedAt: new Date().toISOString(),
        businessId,
        tenantId,
      },
    } satisfies TemplateVariables;
  });

  // Write JSON to output directory
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, `${businessId}.json`);
  writeFileSync(outputPath, JSON.stringify(templateVars, null, 2));

  return outputPath;
}

function inferCategory(businessName: string): 'restaurant' | 'salon' | 'general' {
  const lower = businessName.toLowerCase();
  if (lower.includes('restaurant') || lower.includes('cafe') || lower.includes('pizza') || lower.includes('sushi') || lower.includes('grill')) {
    return 'restaurant';
  }
  if (lower.includes('salon') || lower.includes('spa') || lower.includes('hair') || lower.includes('beauty') || lower.includes('nail')) {
    return 'salon';
  }
  return 'general';
}
