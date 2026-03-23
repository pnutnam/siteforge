import { Job } from 'bullmq';
import { SourceScrapeJob, SOURCE_RETRY_CONFIG } from '../queue';
import { scrapeBusinessParallel } from '../../scraping/scrapers/parallel';
import { updateSourceStatus } from '../../dashboard/scrape-status';
import { pool } from '../../database/pool';
import { withTenant } from '../../database/schema';
import { SourceType } from '../queue';

export async function processSourceScrape(job: Job<SourceScrapeJob>) {
  const { businessId, tenantId, source } = job.data;
  const retryConfig = SOURCE_RETRY_CONFIG[source];

  let lastError: string | undefined;

  for (let attempt = 1; attempt <= retryConfig.attempts; attempt++) {
    try {
      updateSourceStatus(businessId, tenantId, source, {
        status: 'in_progress',
        attempts: attempt,
      });

      const results = await scrapeBusinessParallel({
        businessId,
        tenantId,
        url: '',
        sources: [source],
      });

      const result = results[source];

      if (!result.success) {
        throw new Error(result.error ?? 'Scraping failed');
      }

      await withTenant(tenantId, pool, async () => {
        await storeScrapeData(tenantId, businessId, source, result);
      });

      updateSourceStatus(businessId, tenantId, source, { status: 'completed' });
      return { success: true, source };

    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);

      if (attempt < retryConfig.attempts) {
        const delay = Math.min(
          retryConfig.delay * Math.pow(2, attempt - 1),
          60000
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  updateSourceStatus(businessId, tenantId, source, {
    status: 'failed',
    lastError,
  });

  throw new Error(`Source ${source} failed after ${retryConfig.attempts} attempts: ${lastError}`);
}

async function storeScrapeData(
  tenantId: string,
  businessId: string,
  source: SourceType,
  result: any
) {
  const tableMap: Record<SourceType, string> = {
    google_maps: 'google_maps_raw',
    instagram: 'instagram_raw',
    facebook: 'facebook_raw',
    yelp: 'yelp_raw',
    google_reviews: 'google_reviews_raw',
  };

  const table = tableMap[source];
  const raw = result.data?.raw ?? {};
  const validated = result.validation?.valid ? result.validation.data : null;
  const validationErrors = result.validation?.errors
    ? JSON.stringify(result.validation.errors.flatten())
    : null;

  await pool.query(
    `INSERT INTO ${table} (id, tenant_id, business_id, url, raw, validated, validation_errors)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
    [tenantId, businessId, result.data?.url ?? '', raw, validated, validationErrors]
  );
}
