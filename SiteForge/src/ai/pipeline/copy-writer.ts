import { Job } from 'bullmq';
import { CopyWriteJob, GeneratedCopy } from './types';
import { generateSiteCopy } from '../generation/copy-generator';
import { pool } from '../../database/pool';
import { withTenant } from '../../database/schema';
import { ContentItem } from '../engagement/types';

/**
 * Process copy generation job.
 *
 * Pipeline:
 * 1. Load business info and social posts from PostgreSQL
 * 2. Generate copy using hybrid approach (template + AI)
 * 3. Return generated copy
 */
export async function processCopyWrite(job: Job<CopyWriteJob>): Promise<GeneratedCopy | null> {
  const { businessId, tenantId } = job.data;

  try {
    // Load business info
    const businessInfo = await loadBusinessInfo(businessId, tenantId);

    // Load social posts for social proof context
    const socialPosts = await loadSocialPosts(businessId, tenantId);

    // Load reviews for testimonials
    const reviews = await loadReviews(businessId, tenantId);

    // Generate copy
    const copy = await generateSiteCopy(
      businessInfo.name,
      businessInfo.category,
      businessInfo.address,
      socialPosts,
      reviews
    );

    return {
      headline: copy.headline,
      tagline: copy.tagline,
      about: copy.about,
      testimonials: copy.testimonials.map(t => ({
        author: t.author,
        text: t.text,
        rating: t.rating,
      })),
    };
  } catch (error) {
    console.error('Copy generation error:', error);
    // Return null on failure (allows partial pipeline success)
    return null;
  }
}

/**
 * Load business info from database.
 */
async function loadBusinessInfo(businessId: string, tenantId: string) {
  const result = await withTenant(tenantId, pool, async () => {
    const query = await pool.query(`
      SELECT name, category, address
      FROM businesses
      WHERE id = $1
    `, [businessId]);

    return query.rows[0];
  });

  return {
    name: result?.name ?? 'Local Business',
    category: (result?.category ?? 'general') as 'restaurant' | 'salon' | 'general',
    address: result?.address,
  };
}

/**
 * Load social posts from database.
 * Queries Instagram, Facebook, and Yelp raw tables.
 */
async function loadSocialPosts(businessId: string, tenantId: string): Promise<ContentItem[]> {
  const posts: ContentItem[] = [];

  const sources = [
    { table: 'instagram_raw', source: 'instagram' as const },
    { table: 'facebook_raw', source: 'facebook' as const },
    { table: 'yelp_raw', source: 'yelp' as const },
  ];

  for (const { table, source } of sources) {
    const rows = await withTenant(tenantId, pool, async () => {
      const result = await pool.query(`
        SELECT validated
        FROM ${table}
        WHERE business_id = $1
      `, [businessId]);

      return result.rows;
    });

    for (const row of rows) {
      const validated = row.validated;
      if (!validated) continue;

      const posts_data = validated.posts ?? validated.data ?? [];
      for (const post of posts_data) {
        posts.push({
          id: post.id ?? post.post_id ?? `gen-${Math.random().toString(36).slice(2)}`,
          source,
          imageUrl: post.imageUrl ?? post.image_url,
          caption: post.caption ?? post.text ?? post.content ?? '',
          engagement: post.engagement ?? post.likes ?? 0,
          postedAt: post.postedAt ?? post.posted_at ?? post.date ?? undefined,
        });
      }
    }
  }

  return posts;
}

/**
 * Load reviews for testimonial selection.
 * Falls back to Google Reviews if no social content.
 */
async function loadReviews(businessId: string, tenantId: string) {
  const rows = await withTenant(tenantId, pool, async () => {
    // Try Google Reviews first
    const query = await pool.query(`
      SELECT author, text, rating, date, 'google_reviews' as source
      FROM google_reviews_raw
      WHERE business_id = $1
      ORDER BY rating DESC, LENGTH(text) DESC
      LIMIT 10
    `, [businessId]);

    return query.rows;
  });

  return rows;
}
