import { describe, it, expect } from 'vitest';
import { SOURCE_STEALTH_CONFIG, DETECTION_SIGNALS } from './context-builder';

describe('ContextBuilder', () => {
  it('should export SOURCE_STEALTH_CONFIG for all 5 sources', () => {
    expect(SOURCE_STEALTH_CONFIG.google_maps).toBeDefined();
    expect(SOURCE_STEALTH_CONFIG.instagram).toBeDefined();
    expect(SOURCE_STEALTH_CONFIG.facebook).toBeDefined();
    expect(SOURCE_STEALTH_CONFIG.yelp).toBeDefined();
    expect(SOURCE_STEALTH_CONFIG.google_reviews).toBeDefined();
  });

  it('should export DETECTION_SIGNALS', () => {
    expect(DETECTION_SIGNALS).toBeDefined();
    expect(typeof DETECTION_SIGNALS.isNon200Response).toBe('function');
    expect(typeof DETECTION_SIGNALS.isCaptchaPage).toBe('function');
  });
});
