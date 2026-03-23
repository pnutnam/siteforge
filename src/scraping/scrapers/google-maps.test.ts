import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleMapsScraper } from './google-maps';

describe('GoogleMapsScraper', () => {
  it('should export GoogleMapsScraper class', () => {
    expect(GoogleMapsScraper).toBeDefined();
  });

  it('should have source = google_maps', () => {
    const scraper = new GoogleMapsScraper();
    expect(scraper.source).toBe('google_maps');
  });
});
