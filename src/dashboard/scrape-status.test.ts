import { describe, it, expect } from 'vitest';
import { initScrapeStatus, updateSourceStatus, subscribeToScrapeEvents, getScrapeStatus } from './scrape-status';

describe('ScrapeStatus', () => {
  it('should export initScrapeStatus function', () => {
    expect(initScrapeStatus).toBeDefined();
    expect(typeof initScrapeStatus).toBe('function');
  });

  it('should export updateSourceStatus function', () => {
    expect(updateSourceStatus).toBeDefined();
    expect(typeof updateSourceStatus).toBe('function');
  });

  it('should export subscribeToScrapeEvents function', () => {
    expect(subscribeToScrapeEvents).toBeDefined();
    expect(typeof subscribeToScrapeEvents).toBe('function');
  });

  it('should export getScrapeStatus function', () => {
    expect(getScrapeStatus).toBeDefined();
    expect(typeof getScrapeStatus).toBe('function');
  });
});
