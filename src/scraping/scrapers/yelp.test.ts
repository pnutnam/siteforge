import { describe, it, expect } from 'vitest';
import { YelpScraper } from './yelp';

describe('YelpScraper', () => {
  it('should export YelpScraper class', () => {
    expect(YelpScraper).toBeDefined();
  });

  it('should have source = yelp', () => {
    const scraper = new YelpScraper();
    expect(scraper.source).toBe('yelp');
  });
});
