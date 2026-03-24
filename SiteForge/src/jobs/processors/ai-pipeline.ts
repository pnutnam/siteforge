import { Job } from 'bullmq';
import { AIPipelineJob, ImageSelectJob, CopyWriteJob } from '../../ai/pipeline/types';
import { processImageSelect } from '../../ai/pipeline/image-selector';
import { processCopyWrite } from '../../ai/pipeline/copy-writer';
import { pool } from '../../database/pool';
import { withTenant } from '../../database/schema';
import { redisConfig, QUEUE_NAMES } from '../queue';

/**
 * Process AI pipeline parent job.
 * Coordinates image selection and copy generation (runs in parallel).
 */
export async function processAIPipeline(job: Job<AIPipelineJob>) {
  const { businessId, tenantId } = job.data;

  // Wait for children to complete
  const children: Record<string, any> = await job.getChildrenValues();

  const imageResult = children.find((c: any) => c.name === 'image-select');
  const copyResult = children.find((c: any) => c.name === 'copy-write');

  const selectedImages = imageResult ?? [];
  const generatedCopy = copyResult ?? null;

  // Store generated content in database
  await storeGeneratedContent(businessId, tenantId, selectedImages, generatedCopy);

  return {
    businessId,
    content: {
      images: selectedImages,
      copy: generatedCopy,
    },
    quality: {
      totalImages: selectedImages.length,
      selectedImages: selectedImages.length,
      qualityPassed: selectedImages.length > 0,
      copyGenerated: generatedCopy !== null,
    },
  };
}

/**
 * Store generated content in PostgreSQL.
 */
async function storeGeneratedContent(
  businessId: string,
  tenantId: string,
  images: Array<{ id: string; url: string; source: string; engagement: number; caption?: string; qualityScore: number }>,
  copy: { headline: string; tagline: string; about: string; testimonials: Array<{ author: string; text: string; rating: number }> } | null
) {
  await withTenant(tenantId, pool, async () => {
    // Insert images
    for (const image of images) {
      await pool.query(`
        INSERT INTO generated_images (business_id, source_post_id, url, source, engagement, caption, quality_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [businessId, image.id, image.url, image.source, image.engagement, image.caption, image.qualityScore]);
    }

    // Insert copy
    if (copy) {
      await pool.query(`
        INSERT INTO generated_content (business_id, headline, tagline, about)
        VALUES ($1, $2, $3, $4)
      `, [businessId, copy.headline, copy.tagline, copy.about]);

      // Insert testimonials
      for (const testimonial of copy.testimonials) {
        await pool.query(`
          INSERT INTO generated_testimonials (business_id, author, text, rating)
          VALUES ($1, $2, $3, $4)
        `, [businessId, testimonial.author, testimonial.text, testimonial.rating]);
      }
    }
  });
}

/**
 * Create BullMQ worker for AI pipeline jobs.
 * Processes parent (ai-pipeline) and children (image-select, copy-write).
 */
export function createAIPipelineWorker() {
  const { Worker } = require('bullmq');

  const worker = new Worker(
    QUEUE_NAMES.GENERATION,
    async (job: Job) => {
      if (job.name === 'ai-pipeline') {
        return processAIPipeline(job as Job<AIPipelineJob>);
      } else if (job.name === 'image-select') {
        return processImageSelect(job as Job<ImageSelectJob>);
      } else if (job.name === 'copy-write') {
        return processCopyWrite(job as Job<CopyWriteJob>);
      }
    },
    {
      connection: redisConfig,
      concurrency: 10, // AI calls can run in parallel
    }
  );

  return worker;
}

// Re-export for convenience
export { processImageSelect } from '../../ai/pipeline/image-selector';
export { processCopyWrite } from '../../ai/pipeline/copy-writer';
