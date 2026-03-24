import { describe, it, expect } from 'vitest';
import {
  GeneratedContentSchema,
  TemplateVariablesSchema,
  FeaturedImageSchema,
  TestimonialSchema,
  BusinessInfoSchema,
  QualityScoreSchema,
} from './variables';

describe('template variables schemas', () => {
  describe('FeaturedImageSchema', () => {
    it('validates a valid featured image', () => {
      const result = FeaturedImageSchema.safeParse({
        url: 'https://example.com/img.jpg',
        source: 'instagram',
        engagement: 100,
        caption: 'Great food',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid url', () => {
      const result = FeaturedImageSchema.safeParse({
        url: 'not-a-url',
        source: 'instagram',
        engagement: 100,
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid source', () => {
      const result = FeaturedImageSchema.safeParse({
        url: 'https://example.com/img.jpg',
        source: 'twitter',
        engagement: 100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TestimonialSchema', () => {
    it('validates a valid testimonial', () => {
      const result = TestimonialSchema.safeParse({
        author: 'John D.',
        text: 'Absolutely fantastic service! Will definitely come back.',
        rating: 5,
        source: 'google_reviews',
      });
      expect(result.success).toBe(true);
    });

    it('rejects text shorter than 10 chars', () => {
      const result = TestimonialSchema.safeParse({
        author: 'John D.',
        text: 'Great!',
        rating: 5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects text longer than 500 chars', () => {
      const result = TestimonialSchema.safeParse({
        author: 'John D.',
        text: 'a'.repeat(501),
        rating: 5,
      });
      expect(result.success).toBe(false);
    });

    it('rejects rating outside 1-5', () => {
      const result = TestimonialSchema.safeParse({
        author: 'John D.',
        text: 'Great service!',
        rating: 6,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('QualityScoreSchema', () => {
    it('validates a valid quality score', () => {
      const result = QualityScoreSchema.safeParse({
        score: 0.85,
        passed: true,
        rejectionReasons: [],
      });
      expect(result.success).toBe(true);
    });

    it('rejects score greater than 1', () => {
      const result = QualityScoreSchema.safeParse({
        score: 1.5,
        passed: true,
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative score', () => {
      const result = QualityScoreSchema.safeParse({
        score: -0.1,
        passed: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GeneratedContentSchema', () => {
    it('validates a valid generated content object', () => {
      const result = GeneratedContentSchema.safeParse({
        headline: 'Best Pizza in Town',
        tagline: 'Authentic Italian cuisine served with love',
        about: 'We have been serving the community for over 20 years with authentic Italian pizza made from family recipes passed down through generations.',
        testimonials: [
          { author: 'John D.', text: 'Amazing pizza!', rating: 5 },
        ],
        images: [
          { url: 'https://example.com/pizza.jpg', source: 'instagram', engagement: 150 },
        ],
        quality: { score: 0.9, passed: true },
      });
      expect(result.success).toBe(true);
    });

    it('rejects headline longer than 100 chars', () => {
      const result = GeneratedContentSchema.safeParse({
        headline: 'a'.repeat(101),
        tagline: 'Valid tagline',
        about: 'a'.repeat(100),
        testimonials: [
          { author: 'John', text: 'Great service with authentic Italian recipes!', rating: 5 },
        ],
        images: [
          { url: 'https://example.com/img.jpg', source: 'instagram', engagement: 100 },
        ],
        quality: { score: 0.8, passed: true },
      });
      expect(result.success).toBe(false);
    });

    it('rejects about section shorter than 100 chars', () => {
      const result = GeneratedContentSchema.safeParse({
        headline: 'Valid headline',
        tagline: 'Valid tagline',
        about: 'Too short',
        testimonials: [
          { author: 'John', text: 'Great service with authentic Italian recipes!', rating: 5 },
        ],
        images: [
          { url: 'https://example.com/img.jpg', source: 'instagram', engagement: 100 },
        ],
        quality: { score: 0.8, passed: true },
      });
      expect(result.success).toBe(false);
    });

    it('rejects empty testimonials array', () => {
      const result = GeneratedContentSchema.safeParse({
        headline: 'Valid headline',
        tagline: 'Valid tagline',
        about: 'a'.repeat(100),
        testimonials: [],
        images: [
          { url: 'https://example.com/img.jpg', source: 'instagram', engagement: 100 },
        ],
        quality: { score: 0.8, passed: true },
      });
      expect(result.success).toBe(false);
    });

    it('rejects more than 5 testimonials', () => {
      const result = GeneratedContentSchema.safeParse({
        headline: 'Valid headline',
        tagline: 'Valid tagline',
        about: 'a'.repeat(100),
        testimonials: Array(6).fill({ author: 'John', text: 'Great service with authentic Italian recipes!', rating: 5 }),
        images: [
          { url: 'https://example.com/img.jpg', source: 'instagram', engagement: 100 },
        ],
        quality: { score: 0.8, passed: true },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('BusinessInfoSchema', () => {
    it('validates a valid business info', () => {
      const result = BusinessInfoSchema.safeParse({
        name: 'Mario\'s Pizzeria',
        category: 'restaurant',
        address: '123 Main St',
        phone: '555-0123',
        website: 'https://mariospizzeria.com',
        neighborhood: 'Downtown',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid category', () => {
      const result = BusinessInfoSchema.safeParse({
        name: 'Test Business',
        category: 'retail',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid website url', () => {
      const result = BusinessInfoSchema.safeParse({
        name: 'Test Business',
        category: 'restaurant',
        website: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('TemplateVariablesSchema', () => {
    it('validates a complete template variables object', () => {
      const result = TemplateVariablesSchema.safeParse({
        business: {
          name: 'Mario\'s Pizzeria',
          category: 'restaurant',
          address: '123 Main St',
        },
        content: {
          headline: 'Best Pizza in Town',
          tagline: 'Authentic Italian cuisine',
          about: 'We have been serving the community for over 20 years with authentic Italian pizza made from family recipes passed down through generations.',
          testimonials: [
            { author: 'John D.', text: 'Amazing pizza!', rating: 5 },
          ],
          images: [
            { url: 'https://example.com/pizza.jpg', source: 'instagram', engagement: 150 },
          ],
          quality: { score: 0.9, passed: true },
        },
        meta: {
          generatedAt: '2024-01-15T10:30:00.000Z',
          businessId: 'biz-123',
          tenantId: 'tenant-456',
        },
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing required business field', () => {
      const result = TemplateVariablesSchema.safeParse({
        business: {
          category: 'restaurant',
        },
        content: {
          headline: 'Test',
          tagline: 'Test',
          about: 'a'.repeat(100),
          testimonials: [{ author: 'John', text: 'Great service with authentic Italian recipes!', rating: 5 }],
          images: [{ url: 'https://example.com/img.jpg', source: 'instagram', engagement: 100 }],
          quality: { score: 0.8, passed: true },
        },
        meta: {
          generatedAt: '2024-01-15T10:30:00.000Z',
          businessId: 'biz-123',
          tenantId: 'tenant-456',
        },
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid datetime in meta', () => {
      const result = TemplateVariablesSchema.safeParse({
        business: { name: 'Test', category: 'general' },
        content: {
          headline: 'Test',
          tagline: 'Test',
          about: 'a'.repeat(100),
          testimonials: [{ author: 'John', text: 'Great service with authentic Italian recipes!', rating: 5 }],
          images: [{ url: 'https://example.com/img.jpg', source: 'instagram', engagement: 100 }],
          quality: { score: 0.8, passed: true },
        },
        meta: {
          generatedAt: 'not-a-datetime',
          businessId: 'biz-123',
          tenantId: 'tenant-456',
        },
      });
      expect(result.success).toBe(false);
    });
  });
});
