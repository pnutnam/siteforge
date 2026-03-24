import { lookupPreview } from './cloudflare';
import { getPreview, getCdnUrl } from '../storage/s3';

/**
 * Route a preview URL request:
 * 1. Parse biz-{hash} from hostname
 * 2. Look up KV for S3 key
 * 3. Return redirect to S3/CDN URL or serve directly
 */
export async function routePreview(hash: string): Promise<{ redirectUrl: string } | { s3Key: string; content: Buffer }> {
  const routing = await lookupPreview(hash);
  if (!routing) {
    throw new Error('Preview not found or expired');
  }

  // For Cloudflare Pages: redirect to CDN URL
  // The S3 key format: {tenantId}/{businessId}/{hash}/index.html
  const cdnUrl = `${process.env.CDN_BASE_URL}/${routing.s3Key}`;
  return { redirectUrl: cdnUrl };
}