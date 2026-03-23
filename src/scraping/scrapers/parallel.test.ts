import { describe, it, expect } from 'vitest';
import { scrapeBusinessParallel, scrapers } from './parallel';

describe('ParallelScraper', () => {
  it('should export scrapers object with all 5 sources', () => {
    expect(scrapers).toBeDefined();
    expect(scrapers.google_maps).toBeDefined();
    expect(scrapers.instagram).toBeDefined();
    expect(scrapers.facebook).toBeDefined();
    expect(scrapers.yelp).toBeDefined();
    expect(scrapers.google_reviews).toBeDefined();
  });

  it('should export scrapeBusinessParallel function', () => {
    expect(scrapeBusinessParallel).toBeDefined();
    expect(typeof scrapeBusinessParallel).toBe('function');
  });
});
