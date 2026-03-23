import { describe, it, expect } from 'vitest';
import { GoogleReviewsScraper } from './google-reviews';

describe('GoogleReviewsScraper', () => {
  it('should export GoogleReviewsScraper class', () => {
    expect(GoogleReviewsScraper).toBeDefined();
  });

  it('should have source = google_reviews', () => {
    const scraper = new GoogleReviewsScraper();
    expect(scraper.source).toBe('google_reviews');
  });
});
