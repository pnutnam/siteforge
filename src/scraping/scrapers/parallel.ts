import pLimit from 'p-limit';
import { RawScrapeData, ValidationResult, BaseScraper } from './base';
import { validateOrPartial } from '../validation/schemas';
import { googleMapsScraper } from './google-maps';
import { instagramScraper } from './instagram';
import { facebookScraper } from './facebook';
import { yelpScraper } from './yelp';
import { googleReviewsScraper } from './google-reviews';
import { SourceType, GLOBAL_CONCURRENCY } from '../../jobs/queue';

export type ScraperInstance =
  | typeof googleMapsScraper
  | typeof instagramScraper
  | typeof facebookScraper
  | typeof yelpScraper
  | typeof googleReviewsScraper;

export const scrapers: Record<SourceType, ScraperInstance> = {
  google_maps: googleMapsScraper,
  instagram: instagramScraper,
  facebook: facebookScraper,
  yelp: yelpScraper,
  google_reviews: googleReviewsScraper,
};

export interface ParallelScrapeResult {
  source: SourceType;
  success: boolean;
  data?: RawScrapeData;
  validation?: ValidationResult;
  error?: string;
}

export interface BusinessScrapeInput {
  businessId: string;
  tenantId: string;
  url: string;
  sources: SourceType[];
}

/**
 * Scrape multiple sources in parallel with p-limit concurrency control (SCRAPE-06)
 * Per user decision: 5 browser instances maximum globally, Promise.all for parallelism
 */
export async function scrapeBusinessParallel(
  input: BusinessScrapeInput
): Promise<Record<SourceType, ParallelScrapeResult>> {
  const limit = pLimit(GLOBAL_CONCURRENCY);

  const scrapePromises = input.sources.map(source =>
    limit(async () => {
      const scraper = scrapers[source];
      try {
        const rawData = await scraper.scrape(input.businessId, input.url);
        const validation = scraper.validate(rawData);

        return {
          source,
          success: validation.valid || validation.partial !== undefined,
          data: rawData,
          validation,
          error: undefined,
        } satisfies ParallelScrapeResult;
      } catch (error) {
        return {
          source,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })
  );

  const results = await Promise.all(scrapePromises);

  return results.reduce((acc, result) => {
    acc[result.source] = result;
    return acc;
  }, {} as Record<SourceType, ParallelScrapeResult>);
}

/**
 * Scrape all 5 sources in parallel (convenience function)
 */
export async function scrapeAllSources(
  businessId: string,
  tenantId: string,
  url: string
): Promise<Record<SourceType, ParallelScrapeResult>> {
  return scrapeBusinessParallel({
    businessId,
    tenantId,
    url,
    sources: ['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'],
  });
}
