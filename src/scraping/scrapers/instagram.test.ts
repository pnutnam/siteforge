import { describe, it, expect } from 'vitest';
import { InstagramScraper } from './instagram';

describe('InstagramScraper', () => {
  it('should export InstagramScraper class', () => {
    expect(InstagramScraper).toBeDefined();
  });

  it('should have source = instagram', () => {
    const scraper = new InstagramScraper();
    expect(scraper.source).toBe('instagram');
  });
});
