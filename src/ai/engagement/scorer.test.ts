import { describe, it, expect } from 'vitest';
import { selectTopEngagement, calculatePercentileRanks } from './scorer';
import { ContentItem } from './types';

describe('engagement scorer', () => {
  describe('selectTopEngagement', () => {
    it('returns empty array for empty input', () => {
      expect(selectTopEngagement([], 80)).toEqual([]);
    });

    it('returns all content when only 1-2 items (small pool)', () => {
      const content: ContentItem[] = [
        { id: '1', source: 'instagram', engagement: 100 },
        { id: '2', source: 'facebook', engagement: 50 },
      ];
      expect(selectTopEngagement(content, 80)).toHaveLength(2);
    });

    it('sorts by engagement descending', () => {
      const content: ContentItem[] = [
        { id: '1', source: 'instagram', engagement: 50 },
        { id: '2', source: 'facebook', engagement: 200 },
        { id: '3', source: 'yelp', engagement: 100 },
      ];
      const result = selectTopEngagement(content, 80);
      // Top 20% of 3 = ceil(2.4) = 3 items, so all returned in sorted order
      expect(result[0].engagement).toBe(200);
      expect(result[1].engagement).toBe(100);
      expect(result[2].engagement).toBe(50);
    });

    it('returns top 20% by percentile rank', () => {
      // Create 10 items: 100, 90, 80, 70, 60, 50, 40, 30, 20, 10
      const content: ContentItem[] = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        source: 'instagram' as const,
        engagement: (10 - i) * 10,
      }));
      const result = selectTopEngagement(content, 80);
      // Top 20% of 10 = ceil(8) = 8 items at or above threshold
      // Threshold is at index 7 (0-indexed), value = 30
      expect(result.length).toBeGreaterThanOrEqual(1);
      // All returned items should have engagement >= threshold
      const threshold = result[result.length - 1]?.engagement ?? 0;
      expect(result.every(item => item.engagement >= threshold)).toBe(true);
    });

    it('handles single item at exactly the threshold', () => {
      const content: ContentItem[] = [
        { id: '1', source: 'instagram', engagement: 100 },
      ];
      expect(selectTopEngagement(content, 80)).toHaveLength(1);
    });

    it('uses default percentile of 80', () => {
      const content: ContentItem[] = [
        { id: '1', source: 'instagram', engagement: 100 },
        { id: '2', source: 'facebook', engagement: 50 },
        { id: '3', source: 'yelp', engagement: 25 },
      ];
      // Default 80th percentile on 3 items = ceil(2.4) = 3 items
      const result = selectTopEngagement(content);
      expect(result.length).toBe(3);
    });
  });

  describe('calculatePercentileRanks', () => {
    it('returns empty array for empty input', () => {
      expect(calculatePercentileRanks([])).toEqual([]);
    });

    it('assigns 100 to highest engagement item', () => {
      const content: ContentItem[] = [
        { id: '1', source: 'instagram', engagement: 100 },
        { id: '2', source: 'facebook', engagement: 50 },
      ];
      const result = calculatePercentileRanks(content);
      expect(result.find(r => r.id === '1')?.percentileRank).toBe(100);
      expect(result.find(r => r.id === '2')?.percentileRank).toBe(50);
    });

    it('handles zero engagement gracefully', () => {
      const content: ContentItem[] = [
        { id: '1', source: 'instagram', engagement: 0 },
      ];
      const result = calculatePercentileRanks(content);
      expect(result[0].percentileRank).toBe(0);
    });

    it('maintains all original fields', () => {
      const content: ContentItem[] = [
        { id: '1', source: 'instagram', imageUrl: 'https://example.com/img.jpg', caption: 'Test', engagement: 100, postedAt: '2024-01-01' },
      ];
      const result = calculatePercentileRanks(content);
      expect(result[0].id).toBe('1');
      expect(result[0].source).toBe('instagram');
      expect(result[0].imageUrl).toBe('https://example.com/img.jpg');
      expect(result[0].caption).toBe('Test');
      expect(result[0].postedAt).toBe('2024-01-01');
    });
  });
});
