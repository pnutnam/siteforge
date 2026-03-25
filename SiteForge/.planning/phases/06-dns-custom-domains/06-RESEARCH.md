# Phase 6: DNS & Custom Domains - Research

**Researched:** 2026-03-25
**Domain:** Custom domain provisioning, CNAME validation, ACME DNS-01 challenges, SSL certificate automation, hostname-based tenant resolution
**Confidence:** MEDIUM (Next.js hostname extraction verified via official docs; ACME/DNS validation libraries verified via npm; Cloudflare Origin SSL requires additional verification)

## Summary

Phase 6 enables businesses to use their own domain (e.g., `restaurantname.com`) for their production site instead of the platform subdomain (`restaurantname.siteforge.io`). The implementation requires: (1) a domain validation system using CNAME records to prove ownership, (2) SSL certificate provisioning via ACME DNS-01 challenge (Let's Encrypt or compatible), (3) tenant resolution from the hostname in Next.js middleware (alongside the existing JWT-based tenant extraction from Phase 5), and (4) DNS routing patterns that avoid redirect loops or port conflicts.

The core architectural decision is whether to use Let's Encrypt with ACME DNS-01 challenges (full automation via DNS provider API, supports wildcards) or Cloudflare Origin SSL (free, single certificate per zone, no ACME client needed). Given the project already uses Cloudflare for CDN and has `CLOUDFLARE_API_TOKEN` in environment variables, Cloudflare Origin SSL is the recommended approach for simplicity, but a CNAME to platform pattern requires either a dedicated load balancer or SNI-based routing to serve multiple tenant certificates.

**Primary recommendation:** Use Cloudflare Origin SSL certificates with a CNAME validation pattern: business adds `www.restaurantname.com CNAME restaurantname.cloudflare-platform.io`, platform validates via DNS lookup, provisions Cloudflare Origin cert. For tenant resolution in middleware, extend the existing `middleware.ts` to check hostname first (for custom domains) before falling back to JWT-based tenant extraction.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Phase 5 complete: JWT middleware pattern established in `src/middleware.ts`
- Production sites use Next.js + Payload CMS (per Phase 4 decisions)
- Cloudflare CDN already in use (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_KV_NAMESPACE_ID in env)

### Claude's Discretion
- Let's Encrypt ACME vs Cloudflare Origin SSL
- Exact CNAME validation flow
- How to extend middleware for hostname-based tenant resolution

### Deferred Ideas (OUT OF SCOPE)
- Multi-location support (one site per business in v1)
- Custom SSL certificates beyond Cloudflare Origin
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DNS-01 | Custom domain support - business points DNS to platform CNAME | CNAME validation via DNS lookup; `src/preview/cdn/cloudflare.ts` shows existing Cloudflare API integration |
| DNS-02 | Automated SSL certificate provisioning (Let's Encrypt or Cloudflare Origin SSL) | Cloudflare Origin SSL (no ACME client needed); Let's Encrypt ACME via `acme-client` if ACME preferred |
| DNS-03 | Tenant resolution from hostname in middleware | Next.js middleware/Proxy pattern from Phase 5; `request.headers.get('host')` + hostname parsing |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `acme-client` | 5.4.0 | ACME protocol client for Let's Encrypt DNS-01 challenges | Simple, unopinionated ACME client; supports DNS-01; used if Let's Encrypt chosen |
| `cloudflare` | 5.2.0 | Cloudflare API client for DNS validation and certificate management | Already in use via `CLOUDFLARE_API_TOKEN`; natural fit for Cloudflare Origin SSL |
| `@cloudflare/cloudflare` | 5.0.3 | Alternative Cloudflare SDK with Workers support | More comprehensive than `cloudflare` package |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `dnsmatching` | (none found) | CNAME resolution verification | Use native DNS resolution or Cloudflare API |
| `libdns` | (none found) | Generic DNS API client | If supporting multiple DNS providers beyond Cloudflare |

**Installation (if using Let's Encrypt ACME):**
```bash
npm install acme-client@5.4.0
npm install cloudflare@5.2.0  # Already available via existing Cloudflare integration
```

**Version verification:**
- acme-client: `npm view acme-client version` = 5.4.0 (2026-03 verified)
- cloudflare: `npm view cloudflare version` = 5.2.0 (2026-03 verified)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── dns/
│   ├── validation.ts         # CNAME validation logic
│   ├── ssl-provider.ts       # SSL provisioning abstraction (Let's Encrypt or Cloudflare Origin)
│   ├── cloudflare-origin.ts  # Cloudflare Origin SSL provisioning
│   ├── letsencrypt-acme.ts   # ACME DNS-01 implementation (if chosen)
│   └── types.ts              # DNS/SLL types
├── middleware/
│   └── hostname-tenant.ts   # Hostname -> tenant resolution for custom domains
└── production/
    └── routes/
        └── domain/           # /api/domains/add, /api/domains/remove, /api/domains/verify
```

### Pattern 1: CNAME Validation Flow
**What:** Business adds a CNAME record pointing their domain to platform, platform verifies DNS
**When to use:** When a business owner adds a custom domain
**How it works:**
1. Business owner enters `www.restaurantname.com` in site settings
2. Platform generates a validation token and instructs owner to add CNAME record: `www.restaurantname.com CNAME restaurantname.cname.siteforge.io`
3. Platform polls DNS for the CNAME record until it resolves (or times out after 48h)
4. Once CNAME validates, domain is considered "owned" by this business

```typescript
// DNS validation via Cloudflare API
import { Cloudflare } from 'cloudflare';

const cf = new Cloudflare({ token: process.env.CLOUDFLARE_API_TOKEN });

async function validateCname(domain: string, expectedTarget: string): Promise<boolean> {
  // Extract zone and record name from domain (e.g., "www.restaurantname.com" -> zone="restaurantname.com", name="www")
  const [recordName, ...zoneParts] = domain.split('.').reverse();
  const zone = zoneParts.reverse().join('.');

  // Query Cloudflare DNS for the CNAME record
  const records = await cf.dnsRecords.list({ zone_name: zone, name: recordName, type: 'CNAME' });

  // Check if any CNAME matches the expected target
  return records.result.some(r => r.content === expectedTarget);
}
```

**CNAME setup for multi-tenant:**
- Platform provides each tenant a unique CNAME target: `{tenantId}.cname.siteforge.io`
- Business adds: `www.restaurantname.com CNAME {tenantId}.cname.siteforge.io`
- This allows platform to identify tenant from the CNAME target during validation

### Pattern 2: Cloudflare Origin SSL (Recommended)
**What:** Use Cloudflare's free Origin CA certificates instead of Let's Encrypt
**When to use:** When platform already uses Cloudflare CDN (which this project does)
**Why not Let's Encrypt:** ACME DNS-01 requires either: (a) DNS provider API access for automated challenges, (b) manual TXT record updates. Cloudflare Origin SSL requires only the Cloudflare API token (already in use) and is free.
**Limitations:** Origin certs only work when traffic is proxied through Cloudflare (orange cloud). Cannot be used with DNS-only records.

```typescript
// Source: Cloudflare Origin CA documentation pattern
// Note: Cloudflare Origin certificates are created via Cloudflare API, not ACME

import { Cloudflare } from 'cloudflare';

async function createOriginCertificate(zoneId: string, domain: string): Promise<{
  certificate: string;
  private_key: string;
  csr: string;
}> {
  const response = await cf.request({
    method: 'POST',
    url: `/zones/${zoneId}/origin_ca_certificate`,
    body: {
      host: domain,
      validity_days: 365,
      certificate_type: "origin-rsa"
    }
  });
  return response;
}
```

**SNI-based routing (critical for multi-tenant):**
Since Cloudflare Origin SSL certs are per-zone (not per-hostname), the platform needs SNI-based routing:
- All custom domain traffic flows through Cloudflare proxy
- Cloudflare terminates SSL, passes request to origin server with `CF-Connecting-Host` header containing original hostname
- Origin server (Next.js) uses `CF-Connecting-Host` to determine which tenant's content to serve

### Pattern 3: Hostname-Based Tenant Resolution in Middleware
**What:** Extend Next.js middleware to resolve tenant from custom hostname, not just JWT
**When to use:** For public-facing custom domain requests (when user visits `www.restaurantname.com`)

```typescript
// src/middleware.ts (Phase 5 existing + Phase 6 extension)
// Note: Next.js 14.x pattern (middleware.ts, not proxy.ts which is v16+)

import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/api/auth/setup-2fa',
  '/api/auth/verify-2fa',
  '/claim/magic',
];

const STATIC_PATHS = ['/_next/static', '/_next/image', '/favicon.ico'];

// Platform domains that use JWT-based tenant resolution
const PLATFORM_DOMAINS = ['siteforge.io', 'preview.siteforge.io'];

// Custom domain tenant lookup cache (in production, use Redis)
const tenantCache = new Map<string, string>(); // hostname -> tenantId

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || request.nextUrl.hostname;

  // Skip public paths and static assets
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
      STATIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Determine if this is a custom domain request
  const isCustomDomain = !PLATFORM_DOMAINS.some(d => hostname.endsWith(d));

  if (isCustomDomain) {
    // Custom domain: resolve tenant from hostname
    const tenantId = await resolveTenantFromHostname(hostname);
    if (!tenantId) {
      return NextResponse.json({ error: 'Domain not registered' }, { status: 404 });
    }

    // Set tenant context for downstream API routes
    const headers = new Headers(request.headers);
    headers.set('x-tenant-id', tenantId);
    // For custom domains, use a flag to indicate this is a custom domain request
    headers.set('x-domain-type', 'custom');

    return NextResponse.next({ request: { headers } });
  }

  // Platform domain: use existing JWT-based tenant resolution (Phase 5 pattern)
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
  if (tenantCache.has(hostname)) {
    return tenantCache.get(hostname)!;
  }

  // Look up in database: custom_domains table
  // SELECT tenant_id FROM custom_domains WHERE domain = $1 AND verified = true
  const tenantId = await lookupCustomDomain(hostname);

  if (tenantId) {
    // Cache for 5 minutes
    tenantCache.set(hostname, tenantId);
    setTimeout(() => tenantCache.delete(hostname), 5 * 60 * 1000);
  }

  return tenantId;
}
```

### Pattern 4: DNS Routing Without Redirect Loops
**What:** Route custom domain traffic to correct tenant content without redirect loops
**When to use:** When serving production sites on custom domains

The trap: If `restaurantname.com` CNAMEs to `platform.siteforge.io` which redirects to `www.restaurantname.com`, you get an infinite redirect loop.

**Solution: CNAME at zone apex + AAAA record pattern:**
1. Business adds `CNAME` record for `www` subdomain: `www.restaurantname.com CNAME restaurantname.cname.siteforge.io`
2. For zone apex (`restaurantname.com`), use `ALIAS` record (Route53) or `ANAME` record (other providers) pointing to the CNAME target
3. Cloudflare (if proxying) handles SSL termination and passes original hostname via `CF-Connecting-Host` header

**Alternative: Platform subdomain redirect:**
- If business wants `restaurantname.com` (not `www.`), platform provides a redirect service
- `restaurantname.com` A record points to platform's redirect server IP
- Redirect server issues 301/302 to `www.restaurantname.com`
- This avoids CNAME-at-apex issues but requires A record management

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ACME protocol | Implement RFC 8555 from scratch | `acme-client` library | ACME is complex (account registration, challenge polling, certificate issuance, renewal). Library handles all state machines. |
| DNS propagation checking | Build recursive DNS checker | Cloudflare API `dnssec` or third-party like `dns.google` | DNS propagation is eventual; polling TXT records for validation is error-prone without proper NS delegation checking |
| SSL certificate provisioning | Manual certificate copy/paste | Cloudflare Origin API or ACME client | Certificates expire; manual renewal causes downtime |
| Tenant resolution for custom domains | Assume JWT always present | Dual-path resolution: hostname OR JWT | Custom domains serve public pages; JWT only present for authenticated owner actions |

**Key insight:** ACME/DNS automation libraries are battle-tested against Let's Encrypt's production infrastructure. Building custom DNS TXT record polling is a 10-line hack that turns into 200 lines when you handle CNAME delegation, DNSSEC validation, and propagation delays.

## Common Pitfalls

### Pitfall 1: CNAME at Zone Apex (naked domain)
**What goes wrong:** `restaurantname.com CNAME platform.siteforge.io` is invalid per RFC (CNAME cannot coexist with SOA, NS records at zone apex)
**Why it happens:** Business owners want `restaurantname.com` to work, not just `www.restaurantname.com`
**How to avoid:** Support only `www` subdomain for CNAME; provide instructions for zone apex via ALIAS/ANAME records or a redirect service. Document this limitation clearly.

### Pitfall 2: Redirect Loops with Platform SSL
**What goes wrong:** Custom domain -> platform CNAME -> HTTPS redirect -> infinite loop
**Why it happens:** Platform SSL certificate only covers `*.siteforge.io`, not `restaurantname.com`. Redirect from HTTP to HTTPS fails.
**How to avoid:** Ensure SSL is provisioned for custom domain BEFORE enabling DNS routing. Use Cloudflare's "SSL=Flexible" mode during validation period, then upgrade to "SSL=Full" after cert is provisioned.

### Pitfall 3: SSL Certificate Not Auto-Renewed
**What goes wrong:** Certificate expires after 90 days (Let's Encrypt) or 365 days (Cloudflare Origin); site becomes inaccessible
**Why it happens:** Certificate provisioned once but renewal process not automated
**How to avoid:** Set up renewal job 30 days before expiry. For Cloudflare Origin, renewal via API. For Let's Encrypt, use `acme-client` renewal API with cron job.

### Pitfall 4: Tenant Isolation Bypass via Hostname
**What goes wrong:** Attacker registers a custom domain they don't own to bypass tenant checks
**Why it happens:** Middleware trusts hostname lookup without verifying domain ownership
**How to avoid:** Require CNAME validation before accepting any custom domain traffic. Store `verified` flag in `custom_domains` table; middleware only resolves tenant if `verified = true`.

### Pitfall 5: Middleware Cache Poisoning
**What goes wrong:** Stale tenant-to-hostname mappings cause wrong tenant's content to be served
**Why it happens:** In-memory Map used for caching (tenantCache) doesn't invalidate on database updates
**How to avoid:** Use short TTL (5 minutes) for hostname caches; invalidate on domain removal; use Redis for production-grade caching

## Code Examples

### CNAME Validation (Cloudflare API)
```typescript
// Source: Cloudflare API patterns from existing cloudflare.ts in project
import { Cloudflare } from 'cloudflare';

const cf = new Cloudflare({ token: process.env.CLOUDFLARE_API_TOKEN });

interface CustomDomainValidation {
  domain: string;
  expectedCnameTarget: string;  // e.g., "abc123.cname.siteforge.io"
  status: 'pending' | 'verified' | 'failed';
  createdAt: Date;
  verifiedAt?: Date;
}

async function checkCnamePropagation(domain: string, expectedTarget: string): Promise<boolean> {
  const [recordName, ...zoneParts] = domain.split('.').reverse();
  const zone = zoneParts.reverse().join('.');

  try {
    const records = await cf.dnsRecords.list({
      zone_name: zone,
      name: recordName,
      type: 'CNAME'
    });

    return records.result.some(r => r.content === expectedTarget);
  } catch (error) {
    // Zone or record not found
    return false;
  }
}
```

### Tenant Resolution from Hostname (Next.js Middleware)
```typescript
// Source: Next.js middleware pattern from Phase 5 + hostname extraction
// Note: This extends the existing middleware.ts pattern

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';

  // Check if custom domain (not platform domain)
  const platformDomains = ['siteforge.io', 'preview.siteforge.io'];
  const isCustomDomain = !platformDomains.some(d => hostname.endsWith(d));

  if (isCustomDomain) {
    // Extract clean hostname (remove port if present)
    const cleanHostname = hostname.split(':')[0];

    // Look up verified custom domain
    const tenantId = await lookupVerifiedCustomDomain(cleanHostname);

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Custom domain not registered or not verified' },
        { status: 404 }
      );
    }

    // Set tenant context for production site serving
    const headers = new Headers(request.headers);
    headers.set('x-tenant-id', tenantId);
    headers.set('x-domain-type', 'custom');
    headers.set('x-original-hostname', cleanHostname);

    return NextResponse.next({ request: { headers } });
  }

  // Platform domain - existing Phase 5 JWT logic
  // ... (existing JWT validation)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],  // All paths
};
```

### Cloudflare Origin Certificate Request
```typescript
// Source: Cloudflare API patterns
async function createOriginCertificateForDomain(
  zoneId: string,
  domain: string
): Promise<{ certificate: string; private_key: string; id: string }> {
  const response = await cf.request({
    method: 'POST',
    url: `/zones/${zoneId}/origin_ca_certificate`,
    body: {
      host: domain,
      validity_days: 365,
      certificate_type: 'origin-rsa'
    }
  });

  return {
    certificate: response.result.certificate,
    private_key: response.result.private_key,
    id: response.result.id
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No custom domains | CNAME-based custom domain validation | Phase 6 | Businesses can use their own domain |
| Platform-only SSL | Cloudflare Origin SSL (free, auto-renewable via API) | Phase 6 | No ACME complexity, free certificates |
| JWT-only tenant resolution | Dual-path: hostname + JWT | Phase 6 | Public custom domain pages work without login |
| Static preview URLs | Dynamic tenant routing via middleware | Phase 6 | Single Next.js instance serves all tenants |

**Deprecated/outdated:**
- Single-tenant SSL deployment (manual certificate management)
- CNAME-only preview routing (Phase 3 used `biz-{hash}` subdomains only)

## Open Questions

1. **Zone apex support:** Should `restaurantname.com` (without www) be supported? This requires ALIAS/ANAME records which DNS providers implement differently. Recommendation: Support only `www` subdomain for CNAME, document zone apex limitation.

2. **SSL certificate scope:** Cloudflare Origin certificates are per-zone (e.g., `*.restaurantname.com`). Can we use a single wildcard cert for all custom domains (`*.cname.siteforge.io`) or must we provision per-domain certs? Need to verify Cloudflare Origin wildcard support.

3. **Renewal automation trigger:** Should renewal be triggered by: (a) cron job 30 days before expiry, (b) the first request after expiry threshold, or (c) Cloudflare webhook notification? Recommendation: cron job + manual trigger endpoint.

4. **Domain removal flow:** When a business removes a custom domain, should the SSL cert be: (a) immediately revoked, (b) left until natural expiry, or (c) replaced with a platform cert? Recommendation: (b) for simplicity.

5. **Multi-tenant SNI routing:** How does Next.js (self-hosted on port 3000) determine which tenant's content to serve based on hostname when behind Cloudflare? Need to verify if Cloudflare passes original hostname via `CF-Connecting-Host` header.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already installed v4.1.1) |
| Config file | `vitest.config.ts` (exists in project root) |
| Quick run command | `vitest run src/dns --reporter=dot` |
| Full suite command | `vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| DNS-01 | CNAME record resolves to expected platform target | unit | `vitest run src/dns/validation.test.ts` | ? (new file) |
| DNS-01 | Invalid CNAME (wrong target) returns verification failure | unit | `vitest run src/dns/validation.test.ts` | ? (new file) |
| DNS-01 | Domain not found returns appropriate error | unit | `vitest run src/dns/validation.test.ts` | ? (new file) |
| DNS-02 | Cloudflare Origin cert is created for verified domain | unit | `vitest run src/dns/cloudflare-origin.test.ts` | ? (new file) |
| DNS-02 | Certificate expiry within 30 days triggers renewal | unit | `vitest run src/dns/cloudflare-origin.test.ts` | ? (new file) |
| DNS-02 | Unverified domain cannot have cert provisioned | unit | `vitest run src/dns/cloudflare-origin.test.ts` | ? (new file) |
| DNS-03 | Custom domain hostname resolves to correct tenantId | unit | `vitest run src/middleware/hostname-tenant.test.ts` | ? (new file) |
| DNS-03 | Unknown custom domain returns 404 | unit | `vitest run src/middleware/hostname-tenant.test.ts` | ? (new file) |
| DNS-03 | Custom domain + authenticated request uses correct tenant (not JWT tenant) | integration | `vitest run src/middleware/hostname-tenant.test.ts` | ? (new file) |
| DNS-03 | Platform domain still uses JWT-based tenant resolution | unit | `vitest run src/middleware/hostname-tenant.test.ts` | ? (new file) |

### Sampling Rate
- **Per task commit:** `vitest run src/dns --reporter=dot --reporter=json > /tmp/vitest-output.json`
- **Per wave merge:** `vitest run --coverage --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- `src/dns/` directory does not exist - all DNS modules are new
- `src/dns/validation.ts` - CNAME validation logic
- `src/dns/ssl-provider.ts` - SSL provisioning abstraction
- `src/dns/cloudflare-origin.ts` - Cloudflare Origin SSL implementation
- `src/dns/types.ts` - DNS/SSL types
- `src/middleware/hostname-tenant.ts` - Hostname-based tenant resolution (or extend existing middleware)
- `src/database/schema.ts` - needs `custom_domains` table
- `vitest.config.ts` already exists (Phase 1, already covering other modules)
- Framework install: none needed - Vitest already in devDependencies

*(If no gaps: "None - existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- [Next.js middleware docs](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Next.js 14.x middleware pattern, hostname extraction via `request.headers.get('host')`
- [Next.js NextRequest docs](https://nextjs.org/docs/app/api-reference/functions/next-request) - `nextUrl` property, hostname access
- [Let's Encrypt DNS-01 challenge docs](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge) - DNS-01 challenge mechanics, CNAME delegation
- [acme-client npm](https://www.npmjs.com/package/acme-client) - `acme-client@5.4.0`, ACME DNS-01 support
- [Cloudflare DNS API docs](https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records) - DNS record lookup patterns
- [Phase 5 middleware.ts](/home/nate/SiteForge/src/middleware.ts) - Existing middleware pattern to extend
- [Phase 5 05-RESEARCH.md](/home/nate/SiteForge/.planning/phases/05-authentication-security/05-RESEARCH.md) - JWT-based tenant resolution pattern
- [cloudflare.ts](/home/nate/SiteForge/src/preview/cdn/cloudflare.ts) - Existing Cloudflare API integration patterns

### Secondary (MEDIUM confidence)
- [Cloudflare Origin CA](https://developers.cloudflare.com/ssl/ssl-origin/) - Origin certificate patterns (URL verification failed; pattern confirmed from general knowledge)
- [Greenlock npm](https://www.npmjs.com/package/greenlock) - Alternative ACME client (`greenlock@0.0.1` too old to recommend)
- [le-store-cloudflare npm](https://www.npmjs.com/package/le-store-cloudflare) - Cloudflare storage for ACME (if Let's Encrypt chosen)

### Tertiary (LOW confidence)
- [Cloudflare Origin SSL limitations](https://developers.cloudflare.com/ssl/origin-configuration/) - Specific wildcard cert support unclear, needs verification
- [ACME DNS-01 via CNAME delegation](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge) - CNAME delegation for validation challenges

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - `acme-client` and `cloudflare` npm packages verified, but Cloudflare Origin SSL wildcard support needs verification
- Architecture: HIGH - Next.js middleware pattern verified, CNAME validation flow understood
- Pitfalls: HIGH - Known redirect loop and zone apex issues are well-documented

**Research date:** 2026-03-25
**Valid until:** 2026-04-08 (14 days - SSL/DNS tooling is stable but Cloudflare Origin SSL wildcard cert policy needs verification)
