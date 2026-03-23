import { z } from 'zod';

export interface RawScrapeData {
  source: string;
  businessId: string;
  url: string;
  raw: Record<string, unknown>;
  scrapedAt: Date;
}

export interface ValidationResult {
  valid: boolean;
  data?: Record<string, unknown>;
  errors?: z.ZodError;
  partial?: boolean;
}

export abstract class BaseScraper {
  abstract readonly source: 'google_maps' | 'instagram' | 'facebook' | 'yelp' | 'google_reviews';

  abstract scrape(businessId: string, url: string): Promise<RawScrapeData>;

  protected abstract parseHtml(html: string, metadata: Record<string, unknown>): Promise<RawScrapeData>;

  protected abstract getValidationSchema(): z.ZodSchema;

  validate(data: RawScrapeData): ValidationResult {
    const schema = this.getValidationSchema();
    const result = schema.safeParse(data.raw);
    if (result.success) {
      return { valid: true, data: result.data };
    }
    // Partial store: keep what validated
    const partialData: Record<string, unknown> = {};
    return {
      valid: false,
      errors: result.error,
      partial: Object.keys(partialData).length > 0,
    };
  }

  protected createRawScrapeData(
    businessId: string,
    url: string,
    raw: Record<string, unknown>
  ): RawScrapeData {
    return {
      source: this.source,
      businessId,
      url,
      raw,
      scrapedAt: new Date(),
    };
  }
}
