import { describe, it, expect } from 'vitest';
import { createBusinessScrapeFlow, GLOBAL_CONCURRENCY } from './queue';

describe('BullMQ Flows', () => {
  it('should export GLOBAL_CONCURRENCY = 5', () => {
    expect(GLOBAL_CONCURRENCY).toBe(5);
  });

  it('should export createBusinessScrapeFlow function', () => {
    expect(createBusinessScrapeFlow).toBeDefined();
    expect(typeof createBusinessScrapeFlow).toBe('function');
  });
});
