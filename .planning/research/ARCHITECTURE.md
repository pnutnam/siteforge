# Architecture Research

**Domain:** AI-Powered Website Generation Systems
**Researched:** 2026-03-23
**Confidence:** MEDIUM-HIGH (training data + Next.js docs verified; some patterns based on industry knowledge)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PRESENTATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐     ┌─────────────────────────────────────────────┐  │
│  │ Preview Sites    │     │ Production Sites                             │  │
│  │ (Static Hugo/HTML)│     │ (Next.js + Payload CMS)                      │  │
│  │ Served via       │     │ Real-time WYSIWYG Editor                      │  │
│  │ Cloudflare CDN   │     │ Per-Business Isolation                        │  │
│  └────────┬─────────┘     └──────────────┬────────────────────────────────┘  │
│           │                                │                                   │
├───────────┴────────────────────────────────┴──────────────────────────────────┤
│                           SCRAPING PIPELINE LAYER                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │ Headless    │  │ Data        │  │ AI Content  │  │ Site Generator      │   │
│  │ Playwright  │→ │ Extractor   │→ │ Selector    │→ │ (Hugo/HTML or       │   │
│  │ Scraper     │  │ (JSON)      │  │ (GPT-4)     │  │ Next.js)            │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│                           DATA LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Scraper      │  │ AI           │  │ Site         │  │ Auth            │   │
│  │ Results DB   │  │ Generated    │  │ Configs      │  │ Sessions        │   │
│  │ (Postgres)   │  │ Content      │  │ (Postgres)   │  │ (Postgres)      │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Playwright Scraper** | Headless browser control, navigates to Google Maps/IG/FB/Yelp, extracts business data and social proof | Node.js + Playwright, runs in parallel workers |
| **Data Extractor** | Parses raw HTML/DOM into structured JSON (business info, reviews, posts, images) | Node.js modules, cheerio or similar |
| **AI Content Selector** | Analyzes scraped content, selects best images/posts based on engagement metrics | OpenAI GPT-4o API calls with scoring prompt |
| **Hugo Static Generator** | Takes AI-generated content + template, produces static HTML for previews | Go Hugo CLI, subprocess call from Node |
| **Next.js Preview Renderer** | Renders preview sites with SSR for dynamic previews | Next.js App Router with generateStaticParams |
| **Payload CMS** | Headless CMS for production sites, handles auth/users/media CRUD | Payload v3 + Postgres, deployed as separate service |
| **Production Site Renderer** | Per-business Next.js instance or dynamic routes with tenant isolation | Next.js middleware for tenant resolution |
| **Cloudflare CDN** | Edge caching, SSL termination, global delivery | Cloudflare Pages or Workers |
| **S3 Bucket** | Origin storage for preview static files | AWS S3 with proper bucket policies |
| **TOTP Auth Service** | Generates/validates TOTP tokens for 2FA | otplib or similar Node.js library |
| **DNS/SSL Provisioner** | Handles custom domain routing and Let's Encrypt certs | lego (Let's Encrypt client) or Cloudflare API |

## Recommended Project Structure

```
siteforge/
├── apps/
│   ├── api/                        # Core API (scraping, generation, auth)
│   │   ├── src/
│   │   │   ├── scrapers/           # Playwright scraper implementations
│   │   │   │   ├── google-maps.ts
│   │   │   │   ├── instagram.ts
│   │   │   │   ├── facebook.ts
│   │   │   │   ├── yelp.ts
│   │   │   │   └── index.ts        # Parallel orchestrator
│   │   │   ├── ai/                 # AI content selection
│   │   │   │   ├── content-selector.ts
│   │   │   │   └── copy-generator.ts
│   │   │   ├── generators/         # Site generators
│   │   │   │   ├── hugo.ts         # Preview site generator
│   │   │   │   └── payload-export.ts
│   │   │   ├── auth/               # Authentication
│   │   │   │   ├── totp.ts
│   │   │   │   ├── sessions.ts
│   │   │   │   └── middleware.ts
│   │   │   ├── dns/                # DNS/SSL provisioning
│   │   │   │   └── cert-manager.ts
│   │   │   ├── routes/             # Express/Fastify routes
│   │   │   ├── services/           # Business logic
│   │   │   └── lib/                # Shared utilities
│   │   └── package.json
│   │
│   ├── preview-sites/              # Preview site serving (S3 + Cloudflare)
│   │   ├── templates/              # Hugo site templates
│   │   └── deploy/                # S3 upload scripts
│   │
│   └── production/                 # Production site (Next.js + Payload)
│       ├── src/
│       │   ├── app/               # Next.js App Router
│       │   │   ├── (editor)/      # WYSIWYG editor routes
│       │   │   ├── (preview)/     # Preview mode routes
│       │   │   └── api/           # Internal API
│       │   ├── components/
│       │   │   └── editor/        # Tiptap editor components
│       │   ├── lib/
│       │   │   └── payload/       # Payload CMS config
│       │   └── payload.config.ts
│       └── package.json
│
├── packages/
│   ├── shared/                     # Shared types, utilities
│   ├── scraper-core/               # Shared scraping utilities
│   └── ai-prompts/                 # AI prompt templates
│
├── infra/
│   ├── terraform/                  # AWS/GCP infrastructure
│   ├── cloudflare/                 # Cloudflare config
│   └── scripts/                   # Deployment scripts
│
└── docker-compose.yml              # Local development
```

### Structure Rationale

- **apps/api:** Monolithic API handles scraping pipeline, generation triggers, and auth. Single deployment unit for v1. Can split later if needed.
- **apps/preview-sites:** Separate from production to isolate blast radius. Preview sites are purely static.
- **apps/production:** Next.js + Payload deployed together. Payload provides CMS, auth, media; Next.js provides SSR and editor UI.
- **packages/shared:** Prevents duplicating types between scraper, API, and frontend.
- **infra/terraform:** IaC for reproducible AWS infrastructure (S3, RDS, EC2/ECS).

## Architectural Patterns

### Pattern 1: Two-Tier Architecture (Preview vs Production)

**What:** Separate systems for high-volume preview landing pages and production sites.

**When to use:** When preview sites (100s/week, mostly non-converting) have fundamentally different requirements than production sites (secure, real-time editing, per-customer isolation).

**Trade-offs:**
- Pros: Independent scaling, cost optimization (preview = ~$0, production = $50/mo infrastructure), different security postures
- Cons: Code sharing complexity, two deployment pipelines, potential feature parity drift

**Build order implication:** Build preview pipeline first (SCRAPE-01 through LANDING-04). Production comes after as a separate system that "upgrades" a converted customer.

### Pattern 2: Parallel Scraping Pipeline

**What:** Launch multiple Playwright instances simultaneously for Google Maps, Instagram, Facebook, Yelp, Google Reviews per business.

**When to use:** When scraping multiple sources for the same business and total time must stay under 10 minutes.

**Example:**
```typescript
// Parallel scrape orchestrator
async function scrapeBusiness(urls: BusinessSources): Promise<ScrapedData> {
  const [maps, instagram, facebook, yelp, reviews] = await Promise.all([
    scrapeGoogleMaps(urls.maps),
    scrapeInstagram(urls.instagram),
    scrapeFacebook(urls.facebook),
    scrapeYelp(urls.yelp),
    scrapeGoogleReviews(urls.reviews),
  ]);

  return { maps, instagram, facebook, yelp, reviews };
}
```

**Trade-offs:**
- Pros: ~5x faster than sequential, maximizes AI content selection quality
- Cons: More complex error handling (partial failures), higher memory usage, potential rate limiting

### Pattern 3: Tenant Isolation via Middleware

**What:** Next.js middleware resolves tenant from subdomain/path, validates session, injects tenant context.

**When to use:** Production sites where each business must be fully isolated but share the same Next.js deployment.

**Example:**
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];

  // Extract tenant ID from subdomain (e.g., "acme-co.siteforge.io")
  // Or from path for custom domains
  const tenantId = getTenantIdFromHostname(hostname);

  // Validate session and tenant access
  const session = getSessionFromCookie(request);
  if (!session || session.tenantId !== tenantId) {
    return NextResponse.redirect('/login');
  }

  // Inject tenant context for downstream handlers
  const response = NextResponse.next();
  response.headers.set('x-tenant-id', tenantId);
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/editor/:path*', '/api/:path*'],
};
```

**Trade-offs:**
- Pros: Single deployment, no per-tenant infrastructure, centralized auth
- Cons: Shared resources (potential noisy neighbor), careful cache isolation required

### Pattern 4: Hugo Static Site Generation for Previews

**What:** Generate complete static HTML site from scraped + AI content using Hugo.

**When to use:** Preview landing pages that are read-only, high-volume, cost-sensitive.

**Trade-offs:**
- Pros: Sub-second builds, zero runtime cost, unhackable (no server-side code), S3-native
- Cons: No real-time updates, must regenerate to change content, template flexibility limited

### Pattern 5: TOTP 2FA Authentication

**What:** Time-based one-time passwords via authenticator apps for production site owners.

**When to use:** When security requirements mandate 2FA but SMS/phone is undesirable.

**Trade-offs:**
- Pros: No phone number needed, more secure than SMS, simple implementation
- Cons: User friction (must download app), recovery codes required as backup

## Data Flow

### Request Flow: Preview Site Generation

```
[Sales Agent] ──triggers──→ [API] ──enqueues──→ [Job Queue (BullMQ)]
                                                       │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
                    ▼                                 ▼                                 ▼
           [Playwright Worker 1]              [Playwright Worker 2]              [Playwright Worker N]
           Google Maps + Reviews              Instagram + Facebook                Yelp
                    │                                 │                                 │
                    └───────────────┬─────────────────┘                                 │
                                    ▼                                                   │
                           [Data Aggregator]                                             │
                                    │                                                   │
                                    ▼                                                   │
                           [AI Content Selector] ──GPT-4o API──→ [Selected Images/Copy] │
                                    │                                                   │
                                    ▼                                                   │
                           [Hugo Generator]                                             │
                                    │                                                   │
                                    ▼                                                   │
                           [S3 Bucket Upload]                                             │
                                    │                                                   │
                                    ▼                                                   │
                           [Cloudflare CDN Invalidation]                                 │
                                    │                                                   │
                                    ▼                                                   │
                           [Preview URL Generated] ──sent to──→ [Sales Agent Dashboard]
```

### Request Flow: Production Site Editing

```
[Business Owner] ──accesses──→ [Next.js App] ──validates──→ [Payload CMS Auth]
                                                          │
                                                          ▼
                                                  [TOTP Verification]
                                                          │
                                                          ▼
                                                  [WYSIWYG Editor Load]
                                                          │
                    ┌─────────────────────────────────────┼─────────────────────────────────────┐
                    │                                     │                                     │
                    ▼                                     ▼                                     ▼
            [Text Edits]                          [Image Changes]                    [Section Reorder]
                    │                                     │                                     │
                    └─────────────────────────────────────┼─────────────────────────────────────┘
                                                          ▼
                                                 [Payload CMS Save]
                                                          │
                                                          ▼
                                                 [ISR On-Demand Revalidation]
                                                          │
                                                          ▼
                                                 [Cloudflare Cache Purge]
                                                          │
                                                          ▼
                                                 [Production Site Updated]
```

### State Management

```
[Browser]
    │ useEditor() hook (Tiptap state)
    ▼
[Tiptap Editor State] ←───actions─── [Toolbar Components]
    │
    │ onChange
    ▼
[Debounced Save] (500ms)
    │
    ▼
[Payload CMS API] ──writes──→ [Postgres]
    │
    │ (on save)
    ▼
[Webhook Trigger]
    │
    ▼
[ISR Revalidation] ──clears──→ [Cloudflare Cache]
```

### Key Data Flows

1. **Scraping → AI Selection → Hugo → CDN:** Business ID flows through entire pipeline; final output is static HTML in S3, cached at Cloudflare edge.

2. **Auth Session Flow:** TOTP token → validated server-side → JWT refresh token stored httpOnly cookie → access token in memory → Payload session created.

3. **Custom Domain Flow:** Business adds CNAME → DNS propagates → SSL provisioned via Let's Encrypt/Cloudflare → Next.js middleware resolves tenant from hostname.

4. **Preview → Production Upgrade:** Business accepts preview → legacy conversion record created → production Payload instance provisioned → data migrated from Hugo format to Payload collections.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 preview sites/week | Single server for scrapers, no queue needed |
| 100-1k preview sites/week | Job queue (BullMQ + Redis), multiple scraper workers |
| 1k-10k preview sites/week | Distributed scraper workers (Kubernetes), Hugo builds parallelized |
| 10k+ preview sites/week | Consider Hugo build cluster, S3 prefix sharding |

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-50 production sites | Single Payload + Next.js instance, shared Postgres |
| 50-500 production sites | Payload vertical scaling, connection pooling |
| 500-5k production sites | Payload horizontal scaling (read replicas), CDN edge workers |
| 5k+ production sites | Per-tenant database or database sharding |

### Scaling Priorities

1. **First bottleneck: Scraper reliability.** Anti-bot measures on Google Maps/Instagram cause intermittent failures. Mitigation: Proxy rotation, retry logic with exponential backoff, session fingerprinting.

2. **Second bottleneck: AI generation cost.** GPT-4o calls add up at 100s/week. Mitigation: Batch content selection, cache AI decisions per business, use cheaper model for content scoring.

3. **Third bottleneck: Payload CMS at scale.** Large media uploads strain Postgres. Mitigation: Offload media to S3 directly, use imgproxy for transformations.

## Anti-Patterns

### Anti-Pattern 1: Combining Preview and Production Infrastructure

**What people do:** Try to serve preview sites from the same Next.js/Payload deployment as production sites.

**Why it's wrong:** Preview sites are high-volume, read-only, cost-sensitive. Production sites need real-time editing, auth, isolation. Combining them either overpays for previews or under-serves production.

**Do this instead:** Completely separate deployments. Preview = Hugo + S3 + Cloudflare (~$0). Production = Next.js + Payload + Cloudflare Pages (~$20/mo).

### Anti-Pattern 2: Synchronous Scraping

**What people do:** Scrape Google Maps, wait, scrape Instagram, wait, scrape Facebook, wait...

**Why it's wrong:** Sequential scraping for one business takes 5-10 minutes. At 100s/week, this creates massive backlog and slow preview delivery.

**Do this instead:** Always parallelize scraping. Use Promise.all with individual retry logic. Aggregate results when all complete.

### Anti-Pattern 3: Storing Business Data in Hugo Templates

**What people do:** Embed business data directly in Hugo template logic.

**Why it's wrong:** Hugo templates are for presentation, not data storage. Business data should live in Hugo data files (JSON/YAML) or front matter.

**Do this instead:** Separate data (JSON files in /data) from presentation (Hugo templates in /layouts). Data is written by the scraper pipeline; templates only render.

### Anti-Pattern 4: Per-Tenant Database Tables

**What people do:** Create separate Postgres tables or databases per business.

**Why it's wrong:** Operational nightmare at scale. Migrations, backups, monitoring all become 100x harder.

**Do this instead:** Use tenant_id column with row-level security (RLS) in Postgres. Or use Payload's built-in access control with tenant field.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Playwright** | Node.js library, runs headless Chromium | Proxy rotation critical for Google Maps scraping |
| **OpenAI API** | REST API calls with retry logic | Use function calling for structured output from GPT-4o |
| **Hugo** | CLI subprocess from Node.js | Use hugo --quiet for non-verbose output |
| **AWS S3** | AWS SDK v3, presigned URLs for uploads | Bucket policy: public read for preview, auth-required for production assets |
| **Cloudflare** | REST API for cache invalidation, Pages API for deployment | Use Workers for request routing if needed |
| **Let's Encrypt** | lego ACME client for cert provisioning | Or use Cloudflare Origin CA for *.cdnedge.io domains |
| **TOTP** | otplib library for token generation/validation | QR code generation via qrcode library |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Scraper workers → API | Job queue (BullMQ) | Workers poll queue, post results to API |
| API → Hugo Generator | Direct exec (same server) or RPC | Pass content JSON, receive public directory path |
| Hugo output → S3 | AWS SDK upload | Sync entire public/ directory |
| Next.js → Payload | REST API or local Payload SDK | If co-deployed, use local API to avoid network |
| Next.js → Cloudflare | API calls for cache purge | On ISR revalidation, purge CDN cache |

## Build Order Implications

Based on the architecture, here is the recommended build sequence:

### Phase 1: Core Scraping Pipeline
**Depends on:** Nothing
- Playwright scraper framework
- Individual scrapers (Google Maps, Instagram, Facebook, Yelp, Google Reviews)
- Parallel orchestrator
- Data extractor (HTML → JSON)

**Why first:** All downstream depends on scraped data. Must be reliable before AI selection.

### Phase 2: AI Content Selection
**Depends on:** Phase 1
- Content scoring prompt
- Image selection logic
- Copy generation
- Integration with OpenAI API

**Why second:** Needs real scraped data to work. Can mock if Phase 1 delayed.

### Phase 3: Preview Site Generation & Deployment
**Depends on:** Phase 2
- Hugo template development
- Hugo build automation
- S3 upload script
- Cloudflare cache invalidation
- Preview URL generation

**Why third:** Needs AI-selected content to generate sites.

### Phase 4: Production Infrastructure Foundation
**Depends on:** Phase 3
- Payload CMS setup
- Next.js app scaffold
- Tenant isolation middleware
- TOTP 2FA implementation
- Session management

**Why fourth:** Production can be developed in parallel with preview pipeline. Shared auth components useful for both.

### Phase 5: WYSIWYG Editor Integration
**Depends on:** Phase 4
- Tiptap editor setup
- Editor components (text, image, section)
- Mobile-responsive editing
- Save/revert functionality

**Why fifth:** Editor needs CMS and auth infrastructure ready.

### Phase 6: Custom Domain & SSL
**Depends on:** Phase 5
- DNS provisioning service
- Let's Encrypt integration
- SSL certificate management
- Custom domain routing

**Why sixth:** Needs production site structure stable before adding domain routing.

### Phase 7: Sales Workflow Integration
**Depends on:** Phase 3 (preview URLs)
- Preview link generation
- Agent dashboard
- Email/SMS delivery integration
- Conversion tracking

**Why seventh:** Can start sending preview links after Phase 3. Dashboard can be iterative.

## Sources

- [Next.js Documentation - Multi-Tenant Applications](https://nextjs.org/docs/app/guides/multi-tenant) (Verified via WebFetch)
- [Next.js Documentation - Static Site Generation](https://nextjs.org/docs/pages/building-your-application/rendering/static-site-generation) (Verified via WebFetch)
- [Payload CMS Documentation](https://payloadcms.com/docs) (Training data)
- [Hugo Documentation](https://gohugo.io/documentation/) (Training data)
- [Playwright Documentation](https://playwright.dev/docs/intro) (Training data)
- [Architecture patterns for multi-tenant SaaS applications](https://stripe.com/guides/multiple-environments) (Training data)

---
*Architecture research for: SiteForge AI Website Generation System*
*Researched: 2026-03-23*
