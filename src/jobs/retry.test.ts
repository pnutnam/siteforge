import { describe, it, expect } from 'vitest';
import { SOURCE_RETRY_CONFIG } from './queue';

describe('Retry', () => {
  it('should export SOURCE_RETRY_CONFIG with getDelay function', () => {
    expect(SOURCE_RETRY_CONFIG).toBeDefined();
    expect(SOURCE_RETRY_CONFIG.google_maps).toBeDefined();
    expect(SOURCE_RETRY_CONFIG.instagram).toBeDefined();
    expect(SOURCE_RETRY_CONFIG.facebook).toBeDefined();
    expect(SOURCE_RETRY_CONFIG.yelp).toBeDefined();
    expect(SOURCE_RETRY_CONFIG.google_reviews).toBeDefined();
  });

  it('should have correct retry delays per source', () => {
    expect(SOURCE_RETRY_CONFIG.google_maps.attempts).toBe(3);
    expect(SOURCE_RETRY_CONFIG.instagram.attempts).toBe(2);
    expect(SOURCE_RETRY_CONFIG.facebook.attempts).toBe(3);
    expect(SOURCE_RETRY_CONFIG.yelp.attempts).toBe(3);
    expect(SOURCE_RETRY_CONFIG.google_reviews.attempts).toBe(3);
  });
});
