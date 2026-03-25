import { CnameValidation, PLATFORM_CNAME_DOMAIN } from './types';

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

/**
 * Check if a domain's CNAME record matches the expected platform target.
 *
 * @param domain - Full domain to check (e.g., "www.restaurantname.com")
 * @param expectedTarget - Expected CNAME target (e.g., "abc123.cname.siteforge.io")
 * @returns CnameValidation with isValid true if CNAME matches
 */
export async function checkCnameValidation(
  domain: string,
  expectedTarget: string
): Promise<CnameValidation> {
  const checkedAt = new Date();

  try {
    // Parse domain into zone and record name
    // "www.restaurantname.com" -> zone="restaurantname.com", name="www"
    const parts = domain.split('.');
    if (parts.length < 2) {
      return { isValid: false, expectedTarget, checkedAt };
    }

    const recordName = parts[0];
    const zone = parts.slice(1).join('.');

    // Query Cloudflare DNS for CNAME record
    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zone}/dns_records?name=${encodeURIComponent(domain)}&type=CNAME`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return { isValid: false, expectedTarget, checkedAt };
    }

    const data = await response.json() as {
      result: Array<{ name: string; content: string; type: string }>;
    };

    const cnameRecord = data.result.find(r => r.type === 'CNAME');

    if (!cnameRecord) {
      return { isValid: false, expectedTarget, checkedAt };
    }

    const resolvedTarget = cnameRecord.content;
    const isValid = resolvedTarget === expectedTarget;

    return { isValid, resolvedTarget, expectedTarget, checkedAt };
  } catch (error) {
    // Zone not found or API error
    return { isValid: false, expectedTarget, checkedAt };
  }
}

/**
 * Generate a unique CNAME target for a new custom domain.
 * Format: {tenantId-short}.cname.siteforge.io
 */
export function generateCnameTarget(tenantId: string): string {
  // Use first 8 characters of tenant ID for brevity
  const shortId = tenantId.replace(/-/g, '').substring(0, 8);
  return `${shortId}.${PLATFORM_CNAME_DOMAIN}`;
}

/**
 * Get the zone ID for a domain from Cloudflare.
 * Required for subsequent SSL certificate operations.
 */
export async function getZoneId(domain: string): Promise<string | null> {
  try {
    const parts = domain.split('.');
    if (parts.length < 2) return null;
    const zone = parts.slice(1).join('.');

    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones?name=${encodeURIComponent(zone)}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as {
      result: Array<{ id: string; name: string }>;
    };

    return data.result[0]?.id ?? null;
  } catch {
    return null;
  }
}
