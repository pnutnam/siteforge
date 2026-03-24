import { Job } from 'bullmq';
import { ImageSelectJob, SelectedImage } from './types';
import { selectTopEngagement } from '../engagement/scorer';
import { filterContentBatch } from '../quality/filters';
import { batchClassifyContent } from '../quality/classifier';
import { pool } from '../../database/pool';
import { withTenant } from '../../database/schema';
import { ENGAGEMENT_PERCENTILE } from '../engagement/thresholds';
import { ContentItem } from '../engagement/types';

/**
 * Process image selection job.
 *
 * Pipeline:
 * 1. Load scraped posts from PostgreSQL (Instagram, Facebook, Yelp)
 * 2. Calculate engagement and select top 20% by percentile
 * 3. Apply rule-based quality filters
 * 4. AI classify remaining content
 * 5. Return top 5 images that pass quality check
 */
export async function processImageSelect(job: Job<ImageSelectJob>): Promise<SelectedImage[]> {
  const { businessId, tenantId } = job.data;

  // Load scraped posts from database
  const posts = await loadScrapedPosts(businessId, tenantId);

  if (posts.length === 0) {
    return [];
  }

  // Step 1: Engagement scoring - select top 20%
  const topContent = selectTopEngagement(posts, ENGAGEMENT_PERCENTILE);

  // Step 2: Rule-based quality filters
  const { passed: rulePassed } = filterContentBatch(topContent);

  if (rulePassed.length === 0) {
    return [];
  }

  // Step 3: AI quality classification (in parallel batches)
  const businessInfo = await loadBusinessInfo(businessId, tenantId);
  const classified = await batchClassifyContent(
    rulePassed,
    businessInfo.name,
    businessInfo.category
  );

  // Step 4: Select images that pass AI quality check
  const selectedImages: SelectedImage[] = [];

  for (const item of classified) {
    const { classification } = item;

    // Include if HIGH or MEDIUM quality AND on-brand
    if (classification.quality !== 'low' && classification.onBrand) {
      selectedImages.push({
        id: item.id,
        url: item.imageUrl ?? '',
        source: item.source,
        engagement: item.engagement,
        caption: item.caption,
        qualityScore: classification.quality === 'high' ? 1.0 : 0.6,
      });
    }
  }

  // Return top 5 by quality score then engagement
  selectedImages.sort((a, b) => {
    if (b.qualityScore !== a.qualityScore) {
      return b.qualityScore - a.qualityScore;
    }
    return b.engagement - a.engagement;
  });

  return selectedImages.slice(0, 5);
}

/**
 * Load scraped posts from database for a business.
 * Combines Instagram, Facebook, and Yelp posts from their respective raw tables.
 */
async function loadScrapedPosts(businessId: string, tenantId: string): Promise<ContentItem[]> {
  const posts: ContentItem[] = [];

  // Query each source table and extract validated post data
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

    // Extract posts from validated data
    for (const row of rows) {
      const validated = row.validated;
      if (!validated) continue;

      // Each source has different post structure - extract common fields
      const posts_data = validated.posts ?? validated.data ?? [];
      for (const post of posts_data) {
        if (!post.imageUrl && !post.image_url) continue; // Skip posts without images

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
 * Load business info for AI classification prompts.
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
