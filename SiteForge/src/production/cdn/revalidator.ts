/**
 * On-demand revalidation for production sites.
 * Uses Next.js ISR with webhook-based invalidation from Payload CMS.
 */

const CDN_API_TOKEN = process.env.CLOUDFLARECDN_API_TOKEN || '';
const CDN_ZONE_ID = process.env.CLOUDFLARECDN_ZONE_ID || '';
const CDN_BASE_URL = `https://api.cloudflare.com/client/v4/zones/${CDN_ZONE_ID}`;

export interface RevalidateResult {
  success: boolean;
  pagesRevalidated: string[];
  errors: string[];
}

/**
 * Revalidate a specific page path at CDN edge.
 * Called from Payload CMS afterChange hook when content is published.
 */
export async function revalidatePage(slug: string): Promise<RevalidateResult> {
  const pagesRevalidated: string[] = [];
  const errors: string[] = [];

  // Build page URLs to invalidate
  const urls = [
    `/${slug}`,
    `/${slug}/`,
  ];

  for (const url of urls) {
    try {
      // Call Next.js on-demand revalidation endpoint
      const nextResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: url,
          secret: process.env.REVALIDATION_SECRET,
        }),
      });

      if (!nextResponse.ok) {
        errors.push(`Failed to revalidate ${url}: ${nextResponse.statusText}`);
      } else {
        pagesRevalidated.push(url);
      }

      // Also purge from Cloudflare CDN directly
      if (CDN_API_TOKEN && CDN_ZONE_ID) {
        const cfResponse = await fetch(`${CDN_BASE_URL}/purge_cache`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CDN_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            files: [`${process.env.NEXT_PUBLIC_SITE_URL}${url}`],
          }),
        });

        if (!cfResponse.ok) {
          console.error(`Cloudflare purge failed for ${url}:`, await cfResponse.text());
          // Don't add to errors - Next.js revalidation is primary
        }
      }
    } catch (error) {
      console.error(`Revalidation error for ${url}:`, error);
      errors.push(`Exception revalidating ${url}: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    pagesRevalidated,
    errors,
  };
}

/**
 * Revalidate all pages for a business/tenant.
 */
export async function revalidateBusinessPages(businessId: string): Promise<RevalidateResult> {
  // In production impl, query Payload for all pages under this business
  // For now, trigger a broad revalidation
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        secret: process.env.REVALIDATION_SECRET,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        pagesRevalidated: [],
        errors: [`Bulk revalidation failed: ${response.statusText}`],
      };
    }

    const data = await response.json();
    return {
      success: true,
      pagesRevalidated: data.revalidated || [],
      errors: [],
    };
  } catch (error) {
    return {
      success: false,
      pagesRevalidated: [],
      errors: [`Bulk revalidation exception: ${error}`],
    };
  }
}
