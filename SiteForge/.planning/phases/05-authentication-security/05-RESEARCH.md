# Phase 5: Authentication & Security - Research

**Researched:** 2026-03-25
**Domain:** TOTP 2FA, JWT session management, rate limiting, multi-tenant middleware
**Confidence:** HIGH (Context7 verified, official docs reviewed, existing codebase confirmed)

## Summary

Phase 5 replaces the Phase 4 HMAC-SHA256 session tokens with proper JWT access tokens + refresh tokens, adds TOTP 2FA via `otplib`, implements rate limiting on verification endpoints using Redis (already in use via ioredis for BullMQ), and ports the Express-based tenant middleware to Next.js middleware. The architecture follows a layered approach: Next.js middleware extracts and validates JWT, sets tenant context, and passes it via request headers; sensitive operations get explicit ownership checks; routine data relies on JWT trust + RLS at the database layer.

**Primary recommendation:** Use HS256 (symmetric) signing for simplicity since the entire stack is self-hosted (Next.js API routes + PostgreSQL), no cross-service JWT validation needed. Use Redis (via existing ioredis client) for rate limit counters. Use standard TOTP settings: 6 digits, 30s period, issuer = "SiteForge".

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- TOTP via `otplib` library (not speakeasy or other)
- JWT access tokens (15 min lifetime) replacing HMAC-SHA256 tokens
- Refresh token in httpOnly cookie (`sf_refresh`), 30 days, no rotation
- 3 failed TOTP attempts per 5-minute window per account
- Lockout after exhaustion: no time-based lockout, recovery email resets
- Rate limit headers: `Retry-After` and `X-RateLimit-*` on 429 responses
- Layered tenant isolation: sensitive ops get explicit ownership checks; routine data trusts JWT claim + RLS
- Sensitive resources: billing, settings, user management, owner accounts
- Magic link continues to be used for recovery (not backup codes)

### Claude's Discretion
- JWT signing: RS256 vs HS256
- TOTP settings: issuer string, digits (6 vs 8), period (30s vs 60s)
- Rate limit counter storage: in-memory vs Redis vs PostgreSQL
- Exact middleware implementation for extracting tenant from JWT

### Deferred Ideas (OUT OF SCOPE)
- Backup codes (email recovery sufficient)
- Token rotation on refresh (reuse allowed 30 days)
- Escalating lockout durations
- Per-IP rate limiting alongside per-account
</user_constraints>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Owner authentication with TOTP-based 2FA (Authenticator app via otplib) | otplib v13.4.0 supports RFC 6238 TOTP; `generateSecret()`, `generate()`, `verify()`, `generateURI()` APIs; QR code URI format standard |
| AUTH-02 | Session management with secure refresh tokens | JWT via `jose` v6.2.2; httpOnly cookie strategy; 15-min access / 30-day refresh; `SignJWT`, `jwtVerify`, `decodeJwt` APIs |
| AUTH-03 | Rate limiting on TOTP verification endpoints | Redis already available via ioredis; sliding window counter pattern; express-rate-limit compatible design |
| AUTH-04 | Multi-tenant isolation middleware (tenant_id from JWT, validated on every request) | Next.js middleware pattern; existing `SET LOCAL app.current_tenant` RLS pattern from Phase 1; layered validation strategy |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `jose` | 6.2.2 | JWT signing/verification (RS256, HS256) | Edge-compatible, used in Next.js Edge Runtime, `jwtVerify` + `SignJWT` are the modern standard |
| `otplib` | 13.4.0 | TOTP generation and verification | RFC 6238 compliant, lighter than speakeasy, recommended in STACK.md |
| `qrcode` | 1.5.4 | Generate QR code for authenticator app setup | Used to render TOTP provisioning URI as QR code image |
| `ioredis` | (already installed) | Redis client for rate limit counters | Already in use for BullMQ; natural fit for sliding-window rate limiting |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `express-rate-limit` | 8.3.1 | Rate limiting middleware patterns | Reference for building custom Next.js rate limiter |
| `@types/qrcode` | (via @types) | TypeScript types for qrcode | Only if @types/qrcode exists |

**Installation:**
```bash
npm install jose@6.2.2 otplib@13.4.0 qrcode@1.5.4
npm install -D @types/qrcode  # if available
```

**Version verification:**
- jose: `npm view jose version` = 6.2.2 (2026-03 verified)
- otplib: `npm view otplib version` = 13.4.0 (2026-03 verified)
- qrcode: `npm view qrcode version` = 1.5.4 (from STACK.md)
- express-rate-limit: `npm view express-rate-limit version` = 8.3.1

## Architecture Patterns

### Recommended Project Structure
```
src/
├── auth/
│   ├── jwt.ts              # JWT signing/verification (HS256)
│   ├── totp.ts             # TOTP setup/verify (otplib)
│   ├── refresh.ts          # Refresh token handling
│   ├── rate-limiter.ts     # Redis-based sliding window
│   └── types.ts            # Auth types (SessionData, etc.)
├── middleware/
│   └── auth.ts             # Next.js middleware: JWT extract + tenant set
├── database/
│   ├── schema.ts           # Extend with totp_secrets, failed_attempts tables
│   └── rls.ts              # Extend RLS policies to new tables
└── production/
    └── routes/
        └── auth/           # /api/auth/verify-2fa, /api/auth/setup-2fa, /api/auth/refresh
```

### Pattern 1: JWT Session Architecture (HS256)
**What:** Access token (JWT, 15 min) + Refresh token (httpOnly cookie, 30 days)
**When to use:** All authenticated requests
**JWT Claims:**
```typescript
interface AccessTokenPayload {
  accountId: string;
  tenantId: string;
  businessId: string;
  email: string;
  status: 'pending' | 'active' | 'disabled';
  iat: number;
  exp: number;  // 15 minutes
}
```
**Source:** `jose` library -- `SignJWT` for creation, `jwtVerify` for verification

```typescript
// Source: jose library API (panva/jose GitHub)
import { SignJWT, jwtVerify, decodeJwt } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Sign
const token = await new SignJWT({ accountId, tenantId, businessId, email, status })
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('15m')
  .sign(secret);

// Verify
const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });

// Decode (no verification)
const claims = decodeJwt(token);
```

**HS256 vs RS256 decision:** Use HS256 because:
- Self-hosted stack (Next.js + PostgreSQL, no microservices)
- No cross-service JWT validation requirement
- Simpler key management (single secret vs key pair)
- RS256 adds ~200 lines of key rotation logic for no benefit

### Pattern 2: TOTP 2FA Setup Flow
**What:** Generate secret -> Show QR code URI -> Verify first code -> Store secret
**When to use:** Owner sets up 2FA during onboarding

```typescript
// Source: otplib documentation (yeojz/otplib GitHub + otplib.yeojz.dev)
import { generateSecret, generate, verify, generateURI } from 'otplib';

// Generate secret for user
const secret = generateSecret();  // e.g., "JBSWY3DPEHPK3PXP"

// Generate provisioning URI for QR code
const uri = generateURI({
  issuer: 'SiteForge',
  label: userEmail,
  secret: secret,
});
// uri = "otpauth://totp/SiteForge:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SiteForge"

// Verify during setup (user scans QR and enters code)
const result = await verify({ secret, token: userEnteredCode });
if (result.valid) {
  // Store encrypted secret in database
}
```

**TOTP settings (Claude's recommendation):**
- Algorithm: SHA1 (default, most compatible with authenticator apps)
- Digits: 6 (default, most common -- Google Authenticator, Authy)
- Period: 30 seconds (default, standard)
- Issuer: "SiteForge" (customizable, shown in authenticator app)

### Pattern 3: Rate Limiting with Redis Sliding Window
**What:** Per-account counter with 5-minute window, 3 max attempts
**When to use:** TOTP verification endpoint
**Why Redis:** Already in use via ioredis for BullMQ; sliding window counters are O(1); survives server restarts; works across multiple instances

```typescript
// Redis sliding window counter pattern
// Key: `ratelimit:totp:${accountId}`
// Window: 5 minutes (300 seconds)
// Max: 3 attempts

async function checkRateLimit(accountId: string): Promise<{
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}> {
  const key = `ratelimit:totp:${accountId}`;
  const now = Date.now();
  const windowStart = now - 5 * 60 * 1000;

  const multi = redis.multi();
  // Remove old entries outside the window
  multi.zremrangebyscore(key, 0, windowStart);
  // Count current attempts in window
  multi.zcard(key);
  // Add this attempt
  multi.zadd(key, now, `${now}-${Math.random()}`);
  // Set expiry
  multi.expire(key, 300);

  const results = await multi.exec();
  const count = results![1][1] as number;

  if (count >= 3) {
    const oldestAttempt = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const retryAfter = Math.ceil((Number(oldestAttempt[1]) + 300000 - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  return { allowed: true, remaining: 3 - count - 1 };
}
```

**Rate limit headers on 429:**
```typescript
response.headers.set('Retry-After', String(retryAfter));
response.headers.set('X-RateLimit-Limit', '3');
response.headers.set('X-RateLimit-Remaining', '0');
response.headers.set('X-RateLimit-Reset', String(Date.now() + retryAfter * 1000));
```

### Pattern 4: Next.js Middleware for JWT + Tenant Extraction
**What:** `middleware.ts` at project root validates JWT, extracts tenantId, sets request header
**When to use:** Every authenticated request
**Note:** Next.js 14.2.21 uses `middleware.ts` (not `proxy.ts` which is v16+)

```typescript
// src/middleware.ts (Next.js 14.x pattern)
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, decodeJwt } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export function middleware(request: NextRequest) {
  // Skip for public routes
  const publicPaths = ['/api/auth/setup-2fa', '/api/auth/verify-2fa', '/claim'];
  if (publicPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sf_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const tenantId = payload.tenantId as string;

    // Pass tenant context via request headers to API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-tenant-id', tenantId);
    requestHeaders.set('x-account-id', payload.accountId as string);

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

### Pattern 5: Layered Tenant Isolation
**What:** Trust JWT's tenantId + RLS for routine data; explicit ownership checks for sensitive ops
**When to use:** API route handlers
**Why layered:** Defense-in-depth; RLS catches any SQL-level escapes; explicit checks catch logic errors

```typescript
// Routine data: trust JWT + RLS
async function getPages(tenantId: string, businessId: string) {
  // RLS enforces tenant_id = current_setting('app.current_tenant')
  const result = await db.query(
    'SELECT * FROM payload_pages WHERE tenant_id = $1 AND business_id = $2',
    [tenantId, businessId]
  );
  return result.rows;
}

// Sensitive operation: explicit ownership check
async function updateBilling(tenantId: string, accountId: string, billingData: object) {
  // 1. Verify account owns this tenant
  const account = await db.query(
    'SELECT tenant_id FROM owner_accounts WHERE id = $1',
    [accountId]
  );
  if (account.rows[0]?.tenant_id !== tenantId) {
    throw new Error('Forbidden: account does not own this tenant');
  }
  // 2. Proceed with billing update
}
```

### Pattern 6: Refresh Token Flow
**What:** httpOnly cookie, 30-day reuse, logout clears client-side only
**When to use:** Token refresh endpoint

```typescript
// Refresh endpoint
async function refreshToken(request: Request) {
  const refreshCookie = request.cookies.get('sf_refresh');
  if (!refreshCookie) {
    return new Response('No refresh token', { status: 401 });
  }

  // Verify refresh token (stored as opaque token or JWT)
  const refreshData = verifyRefreshToken(refreshCookie.value);
  if (!refreshData) {
    return new Response('Invalid refresh token', { status: 401 });
  }

  // Issue new access token (15 min)
  const accessToken = await new SignJWT({ ...refreshData })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(JWT_SECRET);

  return Response.json({ token: accessToken });
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JWT signing | Build custom HMAC signing | `jose` `SignJWT` + `jwtVerify` | Correct algorithm selection, expiry handling, claim validation |
| TOTP generation | Implement RFC 6238 from scratch | `otplib` `generateSecret` + `generate` | Correct time-based algorithm, window tolerance |
| TOTP QR code | Build otpauth:// URI manually | `otplib` `generateURI` | Correct URI format, encoding, parameter ordering |
| Rate limiting | In-memory Map/Set | Redis sliding window | Works across instances, survives restarts, O(1) operations |
| JWT in Next.js | Pass tokens via custom headers only | Next.js middleware + httpOnly cookies | Middleware runs before routes, can short-circuit unauthorized requests |

**Key insight:** JWT and TOTP libraries are RFC-compliant implementations. Custom HMAC-HOTP "good enough" approaches have timing attack vulnerabilities and interoperability issues with authenticator apps. The 50 lines saved by hand-rolling cost 500 lines of security review.

## Common Pitfalls

### Pitfall 1: TOTP Secret Stored in Plain Text
**What goes wrong:** Database breach exposes all 2FA secrets; attackers generate valid codes
**Why it happens:** Developers store raw base32 secret
**How to avoid:** Encrypt secret at rest using AES-256-GCM; decrypt only during verification
**Warning signs:** `totp_secret` column is `text` not `encrypted_secret`

### Pitfall 2: Rate Limit Counter Not Atomic
**What goes wrong:** Race conditions allow more than 3 attempts
**Why it happens:** Read-then-write (check count, then insert) is not atomic
**How to avoid:** Use Redis `ZREMRANGEBYSCORE` + `ZCARD` + `ZADD` in a `MULTI/EXEC` transaction

### Pitfall 3: JWT Secret Too Short or Default
**What goes wrong:** Brute-force JWT signature forgery
**Why it happens:** `process.env.JWT_SECRET || 'secret'` in production
**How to avoid:** `crypto.randomBytes(64)` at first startup; store in env; require `JWT_SECRET` >= 32 bytes

### Pitfall 4: Refresh Token Reuse Not Detected
**What goes wrong:** Stolen refresh token can be used until expiry (30 days)
**Why it happens:** No rotation + no revocation list
**How to avoid:** Store refresh token version/id in Redis; check on use; invalidate on logout

### Pitfall 5: Next.js Middleware Running for Static Assets
**What goes wrong:** JWT validation on every `_next/static` request is wasted compute
**Why it happens:** Default matcher catches everything
**How to avoid:** Exclude `/_next/static/|/_next/image|favicon.ico` from matcher

### Pitfall 6: RLS Not Enabled on New Auth Tables
**What goes wrong:** Cross-tenant data leak on `totp_secrets` or `failed_attempts` tables
**Why it happens:** Forget to add RLS policy when creating new auth tables
**How to avoid:** Add `RLS_MIGRATIONS` entry for each new table; run in same migration as schema

## Code Examples

### otplib TOTP Setup (verified from otplib docs)
```typescript
import { generateSecret, generate, verify, generateURI } from 'otplib';

// Setup: generate secret and provisioning URI
const secret = generateSecret();
const uri = generateURI({
  issuer: 'SiteForge',
  label: 'owner@example.com',
  secret: secret,
});
// uri = "otpauth://totp/SiteForge:owner@example.com?secret=JBSWY3DPEHPK3PXP&issuer=SiteForge"

// Verify first code (user scans QR, enters 6-digit code)
const result = await verify({ secret, token: '123456' });
// result = { valid: true } or { valid: false }

// Later verification during login
const verifyResult = await verify({ secret, token: userCode });
if (!verifyResult.valid) {
  throw new Error('Invalid TOTP code');
}
```

### jose JWT Create + Verify (verified from panva/jose GitHub)
```typescript
import { SignJWT, jwtVerify, decodeJwt } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Create access token
const token = await new SignJWT({
  accountId: 'uuid',
  tenantId: 'uuid',
  businessId: 'uuid',
  email: 'owner@example.com',
  status: 'active',
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('15m')
  .sign(secret);

// Verify access token
const { payload } = await jwtVerify(token, secret, {
  algorithms: ['HS256'],
});
// payload.accountId, payload.tenantId, etc.

// Decode without verification (for logging)
const claims = decodeJwt(token);
```

### Redis Rate Limit (sliding window, atomic)
```typescript
import { redis } from '@/jobs/queue'; // ioredis instance

async function checkTotpRateLimit(accountId: string, windowMs = 5 * 60 * 1000, maxAttempts = 3) {
  const key = `ratelimit:totp:${accountId}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const [removedCount, currentCount] = await redis
    .multi()
    .zremrangebyscore(key, 0, windowStart)  // Remove old entries
    .zcard(key)                              // Count in-window entries
    .exec();

  if ((currentCount as number) >= maxAttempts) {
    const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const retryAfterMs = Number(oldest[1]) + windowMs - now;
    return {
      allowed: false as const,
      retryAfter: Math.ceil(retryAfterMs / 1000),
      remaining: 0,
    };
  }

  await redis
    .multi()
    .zadd(key, now, `${now}:${Math.random()}`)
    .expire(key, Math.ceil(windowMs / 1000))
    .exec();

  return {
    allowed: true as const,
    remaining: maxAttempts - (currentCount as number) - 1,
  };
}
```

### Next.js Middleware (Next.js 14.x)
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const PUBLIC_PATHS = ['/api/auth/setup-2fa', '/api/auth/verify-2fa', '/claim/magic', '/_next', '/favicon'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('sf_session')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });

    // Forward tenant context to API routes
    const headers = new Headers(request.headers);
    headers.set('x-tenant-id', payload.tenantId as string);
    headers.set('x-account-id', payload.accountId as string);

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| HMAC-SHA256 session tokens (Phase 4) | JWT access tokens + refresh tokens | Phase 5 | Standard claims, expiry, cross-platform compatible |
| Session stored server-side | Stateless JWT + refresh token rotation | Phase 5 | No server-side session storage needed |
| Magic link only (Phase 4) | Magic link + TOTP 2FA | Phase 5 | 2FA protects against email takeover |
| `x-tenant-id` header | JWT claim + middleware extraction | Phase 5 | No header spoofing possible |
| Express middleware (Phase 1) | Next.js middleware | Phase 5 | Request-level auth at edge |

**Deprecated/outdated:**
- `createSessionToken` from Phase 4 (`src/production/auth/session.ts`) — to be replaced with JWT
- `verifySessionToken` — to be replaced with `jwtVerify`
- HMAC-SHA256 signing — replaced by HS256 JWT

## Open Questions

1. **Refresh token format:** Store refresh token as opaque random string in Redis (key = token hash, value = accountId + expiry) OR store as signed JWT? Decision: opaque Redis token is simpler for revocation, but adds Redis dependency for every refresh. Both approaches work; recommend opaque Redis token since Redis is already in use.

2. **Where to store TOTP secret encrypted?** Options: (a) `owner_accounts` table add `totp_secret_encrypted` column, (b) separate `totp_secrets` table. Recommendation: separate table allows RLS policy isolation from main accounts table.

3. **2FA setup trigger timing:** The CONTEXT says "required when owner first tries to save edits" with 24-hour grace period. Is this a server-side enforcement (block save endpoint until 2FA set) or client-side UI gate (show banner but allow save)?

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already installed v4.1.1) |
| Config file | `vitest.config.ts` (exists in project root) |
| Quick run command | `vitest run src/auth --reporter=dot` |
| Full suite command | `vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| AUTH-01 | TOTP secret generation produces valid base32 secret | unit | `vitest run src/auth/totp.test.ts` | ? (new file) |
| AUTH-01 | QR code URI matches `otpauth://totp/{issuer}:{label}?secret={secret}&issuer={issuer}` format | unit | `vitest run src/auth/totp.test.ts` | ? (new file) |
| AUTH-01 | TOTP verify accepts valid code within 30s window | unit | `vitest run src/auth/totp.test.ts` | ? (new file) |
| AUTH-02 | JWT signing with HS256 produces valid JWT | unit | `vitest run src/auth/jwt.test.ts` | ? (new file) |
| AUTH-02 | JWT verification extracts correct claims | unit | `vitest run src/auth/jwt.test.ts` | ? (new file) |
| AUTH-02 | Expired JWT is rejected | unit | `vitest run src/auth/jwt.test.ts` | ? (new file) |
| AUTH-02 | Refresh token in httpOnly cookie | integration | `vitest run src/auth/refresh.test.ts` | ? (new file) |
| AUTH-03 | Rate limit allows 3 attempts in 5-minute window | unit | `vitest run src/auth/rate-limiter.test.ts` | ? (new file) |
| AUTH-03 | 4th attempt within window returns 429 | unit | `vitest run src/auth/rate-limiter.test.ts` | ? (new file) |
| AUTH-03 | Rate limit headers present on 429 | unit | `vitest run src/auth/rate-limiter.test.ts` | ? (new file) |
| AUTH-04 | Middleware extracts tenantId from valid JWT | unit | `vitest run src/middleware/auth.test.ts` | ? (new file) |
| AUTH-04 | Middleware returns 401 for missing JWT | unit | `vitest run src/middleware/auth.test.ts` | ? (new file) |
| AUTH-04 | Middleware returns 401 for expired JWT | unit | `vitest run src/middleware/auth.test.ts` | ? (new file) |
| AUTH-04 | Sensitive operations reject cross-tenant access | unit | `vitest run src/auth/tenant-isolation.test.ts` | ? (new file) |

### Sampling Rate
- **Per task commit:** `vitest run src/auth --reporter=dot --reporter=json > /tmp/vitest-output.json`
- **Per wave merge:** `vitest run --coverage --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- `src/auth/` directory does not exist — all auth modules are new
- `src/middleware/auth.ts` — new Next.js middleware
- `src/auth/jwt.ts` — new JWT signing module
- `src/auth/totp.ts` — new TOTP module
- `src/auth/rate-limiter.ts` — new Redis rate limiter
- `src/auth/refresh.ts` — new refresh token handler
- `src/auth/types.ts` — new auth types
- `vitest.config.ts` already exists (Phase 1, already covering other modules)
- Framework install: none needed — Vitest already in devDependencies

*(If no gaps: "None — existing test infrastructure covers all phase requirements")*

## Sources

### Primary (HIGH confidence)
- [otplib GitHub](https://github.com/yeojz/otplib) — TOTP API, `generateSecret`, `generate`, `verify`, `generateURI`
- [otplib docs - getting started](https://otplib.yeojz.dev/guide/getting-started) — TOTP settings (algorithm, digits, period), QR code URI format
- [panva/jose GitHub](https://github.com/panva/jose) — `SignJWT`, `jwtVerify`, `decodeJwt`, RS256/HS256 signing
- [Next.js middleware docs](https://nextjs.org/docs/app/building-your-application/routing/middleware) — Next.js 14.x middleware pattern, matcher config, cookie handling (v16 renamed to proxy)
- [Drizzle schema.ts](/home/nate/SiteForge/src/database/schema.ts) — existing tenant isolation patterns, `withTenant` helper
- [Drizzle RLS migrations](/home/nate/SiteForge/src/database/rls.ts) — existing RLS policies
- [Phase 1 tenant middleware](/home/nate/SiteForge/src/database/tenant-middleware.ts) — existing Express tenant middleware

### Secondary (MEDIUM confidence)
- [express-rate-limit npm](https://www.npmjs.com/package/express-rate-limit) — rate limiting patterns, header conventions
- [Phase 4 session.ts](/home/nate/SiteForge/src/production/auth/session.ts) — existing HMAC session to be replaced
- [Phase 4 magic-link.ts](/home/nate/SiteForge/src/production/auth/magic-link.ts) — existing recovery flow
- [STACK.md](/home/nate/SiteForge/.planning/research/STACK.md) — `otplib` and `jose` as recommended libraries

### Tertiary (LOW confidence)
- [otplib API reference](https://otplib.yeojz.dev/api) — specific option types for `TOTPGenerateOptions`, `TOTPVerifyOptions` (partial docs available)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Context7 verified (otplib 13.4.0, jose 6.2.2), official docs reviewed
- Architecture: HIGH — Patterns from verified Next.js docs + existing codebase integration
- Pitfalls: HIGH — Known security pitfalls with JWT/TOTP implementations

**Research date:** 2026-03-25
**Valid until:** 2026-04-25 (30 days — JWT/TOTP libraries are stable RFC implementations)
