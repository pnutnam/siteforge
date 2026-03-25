import { SSLProvider, OriginCertificate } from './types';
import { createCloudflareOriginProvider } from './cloudflare-origin';

// Provider factory - returns the configured SSL provider
// Currently uses Cloudflare Origin SSL per research recommendation
export function createSSLProvider(): SSLProvider {
  // Cloudflare Origin SSL is recommended over Let's Encrypt because:
  // 1. No ACME client complexity
  // 2. Uses existing CLOUDFLARE_API_TOKEN (already in env)
  // 3. Free certificates
  return createCloudflareOriginProvider();
}

// Re-export for convenience
export type { SSLProvider, OriginCertificate };
