import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/auth/jwt';

const PUBLIC_PATHS = [
  '/api/auth/setup-2fa',
  '/api/auth/verify-2fa',
  '/api/auth/2fa-status',
  '/claim/magic',
];

const STATIC_PATHS = ['/_next/static', '/_next/image', '/favicon.ico'];

// Platform domains that use JWT-based tenant resolution
const PLATFORM_DOMAINS = ['siteforge.io', 'preview.siteforge.io'];

// In-memory cache for custom domain -> tenant resolution
// In production, use Redis with short TTL
const tenantCache = new Map<string, { tenantId: string; cachedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Skip public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static assets
  if (STATIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Determine if this is a custom domain request
  const isCustomDomain = !PLATFORM_DOMAINS.some(d => hostname.endsWith(d));

  if (isCustomDomain) {
    // Custom domain: resolve tenant from hostname
    // Extract clean hostname (remove port if present)
    const cleanHostname = hostname.split(':')[0];

    const tenantId = await resolveTenantFromHostname(cleanHostname);
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Custom domain not registered or not verified' },
        { status: 404 }
      );
    }

    // Set tenant context for downstream API routes
    const headers = new Headers(request.headers);
    headers.set('x-tenant-id', tenantId);
    headers.set('x-domain-type', 'custom');
    headers.set('x-original-hostname', cleanHostname);

    return NextResponse.next({ request: { headers } });
  }

  // Platform domain: use existing JWT-based tenant resolution
  const token = request.cookies.get('sf_session')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const headers = new Headers(request.headers);
  headers.set('x-tenant-id', payload.tenantId);
  headers.set('x-account-id', payload.accountId);
  headers.set('x-domain-type', 'platform');

  return NextResponse.next({ request: { headers } });
}

async function resolveTenantFromHostname(hostname: string): Promise<string | null> {
  // Check cache first
  const cached = tenantCache.get(hostname);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.tenantId;
  }

  // Look up in database: custom_domains table
  // Only verified domains can resolve
  // Note: In production, use the actual database pool
  // This is a placeholder that would use:
  //   SELECT tenant_id FROM custom_domains WHERE domain = $1 AND verification_status = 'verified'
  const tenantId = await lookupVerifiedCustomDomain(hostname);

  if (tenantId) {
    tenantCache.set(hostname, { tenantId, cachedAt: Date.now() });
  }

  return tenantId;
}

// Placeholder for database lookup - implement with actual Drizzle ORM query
async function lookupVerifiedCustomDomain(hostname: string): Promise<string | null> {
  // TODO: Implement with actual database query:
  // const result = await db
  //   .select({ tenantId: customDomains.tenantId })
  //   .from(customDomains)
  //   .where(
  //     and(
  //       eq(customDomains.domain, hostname),
  //       eq(customDomains.verificationStatus, 'verified')
  //     )
  //   )
  //   .limit(1);
  // return result[0]?.tenantId ?? null;

  // For now, return null (will be implemented with real DB in Plan 06-04)
  return null;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).)*'],
};
