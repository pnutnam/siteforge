import { describe, it, expect } from 'vitest';
import { applyQualityFilters, filterContentBatch } from './filters';
import { ContentItem } from '../engagement/types';

describe('quality filters', () => {
  describe('applyQualityFilters', () => {
    it('passes content with no issues', () => {
      const item: ContentItem = {
        id: '1',
        source: 'instagram',
        imageUrl: 'https://example.com/img.jpg',
        caption: 'Great service! #local',
        engagement: 100,
        postedAt: new Date().toISOString(),
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(true);
      expect(result.reasons).toHaveLength(0);
    });

    it('rejects posts older than 365 days', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 400);
      const item: ContentItem = {
        id: '1',
        source: 'instagram',
        imageUrl: 'https://example.com/img.jpg',
        engagement: 100,
        postedAt: oldDate.toISOString(),
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(false);
      expect(result.reasons[0]).toContain('days old');
    });

    it('rejects captions with banned hashtags', () => {
      const item: ContentItem = {
        id: '1',
        source: 'instagram',
        imageUrl: 'https://example.com/img.jpg',
        caption: 'Check out our #sale today!',
        engagement: 100,
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(false);
      expect(result.reasons[0]).toContain('Banned hashtags');
    });

    it('rejects captions with excessive hashtags', () => {
      const item: ContentItem = {
        id: '1',
        source: 'instagram',
        imageUrl: 'https://example.com/img.jpg',
        caption: '#one #two #three #four #five',
        engagement: 100,
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(false);
      expect(result.reasons.some(r => r.includes('Too many hashtags'))).toBe(true);
    });

    it('rejects captions with banned keywords', () => {
      const item: ContentItem = {
        id: '1',
        source: 'instagram',
        imageUrl: 'https://example.com/img.jpg',
        caption: 'Great party photos!',
        engagement: 100,
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(false);
      expect(result.reasons.some(r => r.includes('Banned keywords'))).toBe(true);
    });

    it('rejects video-only posts (no image)', () => {
      const item: ContentItem = {
        id: '1',
        source: 'instagram',
        caption: 'Check out our video!',
        engagement: 100,
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(false);
      expect(result.reasons[0]).toContain('No image attached');
    });

    it('accepts posts within age limit', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      const item: ContentItem = {
        id: '1',
        source: 'instagram',
        imageUrl: 'https://example.com/img.jpg',
        caption: 'Regular post',
        engagement: 100,
        postedAt: recentDate.toISOString(),
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(true);
    });

    it('handles items without postedAt (passes age check)', () => {
      const item: ContentItem = {
        id: '1',
        source: 'facebook',
        imageUrl: 'https://example.com/img.jpg',
        caption: 'No date provided',
        engagement: 50,
      };
      const result = applyQualityFilters(item);
      expect(result.passed).toBe(true);
    });
  });

  describe('filterContentBatch', () => {
    it('separates passed and failed items', () => {
      const items: ContentItem[] = [
        { id: '1', source: 'instagram', imageUrl: 'https://example.com/img.jpg', caption: 'Good post #local', engagement: 100 },
        { id: '2', source: 'instagram', caption: 'No image video', engagement: 80 },
        { id: '3', source: 'facebook', imageUrl: 'https://example.com/img2.jpg', caption: 'Another good one', engagement: 60 },
      ];
      const result = filterContentBatch(items);
      expect(result.passed).toHaveLength(2);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].id).toBe('2');
    });
  });
});
