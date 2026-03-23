import { describe, it, expect } from 'vitest';
import { GoogleMapsSchema, InstagramSchema, FacebookSchema, YelpSchema, GoogleReviewsSchema, validateOrPartial } from './schemas';
import { z } from 'zod';

describe('Schemas', () => {
  describe('validateOrPartial', () => {
    it('should return valid: true with data on success', () => {
      const schema = z.object({ name: z.string() });
      const result = validateOrPartial(schema, { name: 'Test' });
      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data).toEqual({ name: 'Test' });
      }
    });

    it('should return valid: false with errors on failure', () => {
      const schema = z.object({ name: z.string() });
      const result = validateOrPartial(schema, { name: 123 });
      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.errors).toBeDefined();
        expect(result.partial).toBeDefined();
      }
    });
  });

  it('should export all 5 source schemas', () => {
    expect(GoogleMapsSchema).toBeDefined();
    expect(InstagramSchema).toBeDefined();
    expect(FacebookSchema).toBeDefined();
    expect(YelpSchema).toBeDefined();
    expect(GoogleReviewsSchema).toBeDefined();
  });
});
