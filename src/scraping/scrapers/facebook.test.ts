import { describe, it, expect } from 'vitest';
import { FacebookScraper } from './facebook';

describe('FacebookScraper', () => {
  it('should export FacebookScraper class', () => {
    expect(FacebookScraper).toBeDefined();
  });

  it('should have source = facebook', () => {
    const scraper = new FacebookScraper();
    expect(scraper.source).toBe('facebook');
  });
});
