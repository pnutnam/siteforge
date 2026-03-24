import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database pool
vi.mock('../../database/pool', () => ({
  pool: {
    query: vi.fn(),
  },
}));

// Mock the cloudflare module
vi.mock('../cdn/cloudflare', () => ({
  registerPreview: vi.fn(),
}));

import { pool } from '../../database/pool';
import { registerPreview } from '../cdn/cloudflare';
import {
  createPreviewLink,
  getPreviewLink,
  recordPreviewView,
  getPreviewLinkStats,
  claimPreviewLink,
} from './manager';

describe('preview/links/manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPreviewLink', () => {
    it('generates unique URL with biz-{hash} format', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{ id: 'test-uuid' }],
      });
      (registerPreview as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

      const result = await createPreviewLink({
        tenantId: 'tenant-123',
        businessId: 'business-456',
        s3Key: 'tenant-123/business-456/abc123/index.html',
      });

      expect(result.url).toMatch(/^https:\/\/biz-[a-z0-9]+\.preview\.siteforge\.io$/);
      expect(result.link.status).toBe('active');
      expect(result.link.viewCount).toBe(0);
    });
  });

  describe('getPreviewLink', () => {
    it('returns null for expired links', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 31); // 31 days ago
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: 'test-uuid',
          tenant_id: 'tenant-123',
          business_id: 'business-456',
          url_hash: 'abc12345',
          s3_key: 'tenant-123/business-456/abc123/index.html',
          status: 'active',
          expires_at: pastDate.toISOString(),
          created_at: pastDate.toISOString(),
          view_count: '0',
        }],
      });

      const result = await getPreviewLink('abc12345');
      expect(result).toBeNull();
    });

    it('returns link data for active links', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days from now
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: 'test-uuid',
          tenant_id: 'tenant-123',
          business_id: 'business-456',
          url_hash: 'abc12345',
          s3_key: 'tenant-123/business-456/abc123/index.html',
          status: 'active',
          expires_at: futureDate.toISOString(),
          created_at: new Date().toISOString(),
          view_count: '5',
        }],
      });

      const result = await getPreviewLink('abc12345');
      expect(result).not.toBeNull();
      expect(result!.status).toBe('active');
      expect(result!.viewCount).toBe(5);
    });
  });

  describe('recordPreviewView', () => {
    it('increments view count', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

      await recordPreviewView('abc12345');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE preview_links'),
        ['abc12345']
      );
    });
  });

  describe('getPreviewLinkStats', () => {
    it('returns correct expiration days', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 15); // 15 days from now
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        rows: [{
          id: 'test-uuid',
          tenant_id: 'tenant-123',
          business_id: 'business-456',
          url_hash: 'abc12345',
          s3_key: 'tenant-123/business-456/abc123/index.html',
          status: 'active',
          expires_at: futureDate.toISOString(),
          created_at: new Date().toISOString(),
          view_count: '10',
        }],
      });

      const stats = await getPreviewLinkStats('abc12345');
      expect(stats).not.toBeNull();
      expect(stats!.views).toBe(10);
      expect(stats!.isExpired).toBe(false);
      expect(stats!.daysUntilExpiration).toBeGreaterThanOrEqual(14);
      expect(stats!.daysUntilExpiration).toBeLessThanOrEqual(16);
    });
  });

  describe('claimPreviewLink', () => {
    it('updates status to claimed', async () => {
      (pool.query as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ rows: [] });

      await claimPreviewLink('abc12345');

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'claimed'"),
        ['abc12345']
      );
    });
  });
});