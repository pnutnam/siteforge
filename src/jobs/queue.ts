/**
 * Job Queue Configuration
 *
 * Two-level BullMQ architecture:
 * - Parent job per business fans out to 5 child jobs (one per source)
 * - Global concurrency cap of 5 browser instances
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type SourceType = 'google_maps' | 'instagram' | 'facebook' | 'yelp' | 'google_reviews';

// ---------------------------------------------------------------------------
// Concurrency settings
// ---------------------------------------------------------------------------
/** Global browser instance cap across all workers (per user decision) */
export const GLOBAL_CONCURRENCY = 5;

/** Per-source retry configuration */
export const SOURCE_RETRY_CONFIG: Record<SourceType, { attempts: number; delay: number }> = {
  google_maps: { attempts: 3, delay: 3000 },
  instagram: { attempts: 2, delay: 5000 }, // Instagram is flakier
  facebook: { attempts: 3, delay: 3000 },
  yelp: { attempts: 3, delay: 3000 },
  google_reviews: { attempts: 3, delay: 3000 },
};

// ---------------------------------------------------------------------------
// Queue names
// ---------------------------------------------------------------------------
export const QUEUE_NAMES = {
  SCRAPE: 'scrape',
  PREVIEW: 'preview',
  GENERATION: 'generation',
} as const;

// ---------------------------------------------------------------------------
// Job data types
// ---------------------------------------------------------------------------
export interface BusinessScrapeJob {
  businessId: string;
  tenantId: string;
  name: string;
  url: string;
  sources: SourceType[];
}

export interface SourceScrapeJob {
  businessId: string;
  tenantId: string;
  source: SourceType;
  url: string;
}

// ---------------------------------------------------------------------------
// Default job options (exponential backoff: 3s -> 6s -> 12s, max 3 retries)
// ---------------------------------------------------------------------------
export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 3000,
    maxInterval: 60000,
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

// ---------------------------------------------------------------------------
// Redis connection
// ---------------------------------------------------------------------------
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  connectTimeout: 10000,
});

export { redisConnection };

// ---------------------------------------------------------------------------
// BullMQ instances
// ---------------------------------------------------------------------------
import { Queue, FlowProducer, QueueEvents } from 'bullmq';

export const scrapeQueue = new Queue('scrape', {
  connection: redisConnection,
  defaultJobOptions: DEFAULT_JOB_OPTIONS,
});

export const flowProducer = new FlowProducer({
  connection: redisConnection,
});

export const scrapeQueueEvents = new QueueEvents('scrape', {
  connection: redisConnection,
});

// ---------------------------------------------------------------------------
// Create business scrape flow (parent -> children)
// ---------------------------------------------------------------------------
export async function createBusinessScrapeFlow(jobData: BusinessScrapeJob) {
  return flowProducer.add({
    name: 'scrape-business',
    queueName: 'scrape',
    data: {
      businessId: jobData.businessId,
      tenantId: jobData.tenantId,
      name: jobData.name,
      url: jobData.url,
    },
    children: jobData.sources.map(source => ({
      name: source,
      queueName: 'scrape',
      data: {
        businessId: jobData.businessId,
        tenantId: jobData.tenantId,
        source,
      } satisfies SourceScrapeJob,
    })),
  });
}
