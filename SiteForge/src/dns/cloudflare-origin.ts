import { SSLProvider, OriginCertificate } from './types';

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

/**
 * Cloudflare Origin SSL certificate provider.
 * Uses Cloudflare's free Origin CA certificates.
 *
 * Benefits over Let's Encrypt:
 * - No ACME client complexity
 * - Uses existing CLOUDFLARE_API_TOKEN
 * - Free certificates
 *
 * Limitations:
 * - Only works with Cloudflare proxy (orange cloud)
 * - Cannot be used with DNS-only records
 */
export function createCloudflareOriginProvider(): SSLProvider {
  return {
    async provisionCertificate(domain: string, zoneId: string): Promise<OriginCertificate> {
      // Create Origin CA certificate via Cloudflare API
      const response = await fetch(
        `${CLOUDFLARE_API_URL}/zones/${zoneId}/origin_ca_certificate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host: domain,
            validity_days: 365,
            certificate_type: 'origin-rsa',
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to provision certificate: ${error}`);
      }

      const data = await response.json() as {
        result: {
          id: string;
          certificate: string;
          private_key: string;
          expires_on: string;
        };
      };

      return {
        id: data.result.id,
        certificate: data.result.certificate,
        private_key: data.result.private_key,
        expiresAt: new Date(data.result.expires_on),
      };
    },

    async revokeCertificate(certificateId: string, zoneId: string): Promise<void> {
      // Cloudflare Origin certificates cannot be programmatically revoked
      // They remain valid until natural expiry
      // This is a no-op per Cloudflare's API limitations
      console.log(`Certificate ${certificateId} cannot be revoked via API (Cloudflare limitation)`);
    },

    isRenewalDue(expiresAt: Date, thresholdDays: number = 30): boolean {
      const now = new Date();
      const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
      return expiresAt.getTime() - now.getTime() < thresholdMs;
    },
  };
}
