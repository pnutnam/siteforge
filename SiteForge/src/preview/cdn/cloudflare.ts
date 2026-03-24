import { CloudflareConfig, PreviewRouting } from './types';

// Cloudflare Workers KV for routing lookup
// URL format: biz-{hash}.preview.siteforge.io
// KV key: biz-{hash}, value: JSON { s3Key, tenantId, businessId, expiresAt }

const config: CloudflareConfig = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? '',
  namespaceId: process.env.CLOUDFLARE_KV_NAMESPACE_ID ?? '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN ?? '',
};

// Note: KV operations require a Cloudflare Worker environment
// These functions are designed to be called from within a Cloudflare Worker
// using the cf package or via the Cloudflare API

export async function lookupPreview(hash: string): Promise<PreviewRouting | null> {
  // In a Cloudflare Worker, use: await PREVIEW_KV.get(`biz-${hash}`, 'json')
  // This is a stub that would be replaced by the actual Worker runtime
  const kvValue = await kvGet(`biz-${hash}`);
  if (!kvValue) return null;

  const routing: PreviewRouting = JSON.parse(kvValue);
  if (new Date(routing.expiresAt) < new Date()) {
    return null;  // Expired
  }

  return routing;
}

export async function registerPreview(routing: PreviewRouting): Promise<void> {
  // In a Cloudflare Worker, use: await PREVIEW_KV.put(`biz-${routing.hash}`, JSON.stringify(routing), { expiration: ... })
  await kvPut(`biz-${routing.hash}`, JSON.stringify(routing), {
    expiration: Math.floor(routing.expiresAt.getTime() / 1000),
  });
}

export async function invalidateCache(hash: string): Promise<void> {
  // Trigger Cloudflare cache purge for this preview
  // Uses Cloudflare API v4 purge endpoint
  const zoneId = process.env.CLOUDFLARE_ZONE_ID ?? '';
  const apiToken = process.env.CLOUDFLARE_API_TOKEN ?? '';
  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: [`https://biz-${hash}.preview.siteforge.io/*`] }),
  });
}

// Stub KV functions - in production these would use Cloudflare's KV runtime
async function kvGet(key: string): Promise<string | null> {
  // Placeholder - actual implementation uses Cloudflare KV
  return null;
}

async function kvPut(key: string, value: string, options?: { expiration?: number }): Promise<void> {
  // Placeholder - actual implementation uses Cloudflare KV
}

export { config };