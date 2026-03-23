# Phase 1: Scraping Infrastructure - Research

**Researched:** 2026-03-23
**Domain:** Headless browser scraping pipeline, job queues, runtime validation, multi-tenant PostgreSQL
**Confidence:** MEDIUM (WebSearch/WebFetch unavailable; npm versions verified, patterns from training knowledge)

## Summary

Phase 1 requires building a scraping infrastructure that pulls business data from Google Maps, Instagram, Facebook, Yelp, and Google Reviews. The core challenge is anti-bot detection, which is the highest-risk technical problem on the project (per STATE.md blockers). The established pattern for this type of pipeline is: Playwright headless browser with stealth plugins for rendering JavaScript-heavy sites, BullMQ for durable two-level job queuing, Zod for runtime validation, and PostgreSQL with RLS for tenant isolation.

Key risks: Google Maps and Instagram have aggressive bot detection that often requires residential proxies (v2, deferred). Facebook requires authenticated sessions. Yelp has moderate detection. All five sources require per-source tuning of viewport, timezone, locale, and timing parameters.

**Primary recommendation:** Build a thin scraper abstraction layer so each source (Google Maps, Instagram, Facebook, Yelp, Google Reviews) implements a common interface but has source-specific configuration. This allows per-source stealth tuning without affecting other sources.

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Anti-bot:** playwright-extra + stealth plugin + randomized viewport/timezone/language per request, 5-instance concurrency cap, exponential backoff from 3s, 3 retries
- **Schema:** Zod runtime validation, each scraper stores raw independently, master record composed by phone+address+name join
- **Tenant isolation:** tenant_id column + Postgres RLS policies + SET LOCAL in middleware
- **Job queue:** Two-level BullMQ (parent per business -> 5 children per source), 3s/6s/12s backoff, 3 retries max

### Claude's Discretion

- How to structure the scraper abstraction layer (per-source class vs. generic function with config)
- Whether to use playwright-extra's built-in plugins or compose custom evasion
- Database connection pooling strategy for concurrent workers
- Dashboard implementation approach

### Deferred Ideas (OUT OF SCOPE)

- pinchtab integration (anti-bot detection tool, deferred to implementation phase)
- Residential proxy rotation (SCRAPE-09, v2)
- CAPTCHA solving for Google Maps (SCRAPE-10, v2)

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SCRAPE-01 | Headless Playwright scrapes Google Maps (name, address, phone, hours, 160 results, reviews) | Playwright 1.58.2 with stealth plugin, viewport randomization, CDP interception |
| SCRAPE-02 | Scrape Instagram profile and top posts by engagement | Instagram-specific session handling, login state management |
| SCRAPE-03 | Scrape Google Reviews | Google Reviews extraction pattern, rating/review structure |
| SCRAPE-04 | Scrape Facebook page info and top posts | Facebook page scraping, requires page login or public fallback |
| SCRAPE-05 | Scrape Yelp business info and top reviews | Yelp extraction pattern, CAPTCHA handling |
| SCRAPE-06 | Parallel scraping per business (Promise.all) | p-limit 7.3.0 for concurrency control (5 cap) |
| SCRAPE-07 | Anti-bot detection handling | playwright-extra + stealth + per-source stealth tuning |
| SCRAPE-08 | Scraped data validation/normalization | Zod 4.3.6 schemas, partial store on failure |
| PIPELINE-01 | BullMQ orchestration | BullMQ 5.71.0 FlowProducer, parent-child job pattern |
| PIPELINE-03 | Job queue retry logic | Exponential backoff 3s/6s/12s, 3 retries |
| INFRA-01 | PostgreSQL tenant isolation | RLS policies + SET LOCAL middleware |
| MONITOR-03 | Scrape status dashboard | Real-time status per business/source |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| playwright | 1.58.2 | Headless browser automation | Native CDP, multi-context, built-in input emulation indistinguishable from real user |
| playwright-extra | 4.3.6 | Plugin framework for Playwright | Extends Playwright with plugin ecosystem (stealth, etc.) |
| stealth-plugin | (latest compatible) | Evasion of bot detection | Patches automation fingerprints (webdriver property, chrome runtime, etc.) |
| bullmq | 5.71.0 | Redis-backed job queue | Durable jobs, delayed retries, parent-child flows, priorities |
| ioredis | 5.10.1 | Redis client for BullMQ | Native Redis protocol, connection pooling |
| zod | 4.3.6 | Runtime TypeScript validation | Schema-first, type inference, composable validators |
| p-limit | 7.3.0 | Concurrency limiter | Enforce 5-instance browser cap |
| @faker-js/faker | 10.3.0 | Randomized data generation | Generate fake viewports, timezones, locales for stealth |
| pg | 8.13.1 | PostgreSQL client | Node-postgres with connection pool, SET LOCAL support |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| drizzle-orm | 0.45.1 | Type-safe SQL | When raw SQL needed for complex tenant queries |
| zod-pg | (compatible) | Zod + pg integration | Validate DB rows against Zod schemas |
| ioredis-retry | (built-in) | Redis reconnection | BullMQ handles automatically |
| @playwright/test | 2.0.8 | Playwright test runner | Verify scraper selectors work |

**Installation:**
```bash
npm install playwright@1.58.2 playwright-extra@4.3.6
npm install bullmq@5.71.0 ioredis@5.10.1
npm install zod@4.3.6 p-limit@7.3.0 @faker-js/faker@10.3.0
npm install pg@8.13.1 drizzle-orm@0.45.1
npm install -D @playwright/test@2.0.8
```

**Version verification:** All versions above verified against npm registry 2026-03-23.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── scraping/
│   ├── scrapers/
│   │   ├── base.ts           # Scraper abstract base class
│   │   ├── google-maps.ts   # Google Maps scraper
│   │   ├── instagram.ts      # Instagram scraper
│   │   ├── facebook.ts       # Facebook scraper
│   │   ├── yelp.ts           # Yelp scraper
│   │   └── google-reviews.ts # Google Reviews scraper
│   ├── stealth/
│   │   ├── context-builder.ts # Per-request viewport/timezone/locale randomization
│   │   ├── session-manager.ts # Browser context reuse and cleanup
│   │   └── detection-handler.ts # Intercepts detection signals
│   └── validation/
│       └── schemas.ts         # Zod schemas per source
├── jobs/
│   ├── queue.ts               # BullMQ Queue/Worker setup
│   ├── producers.ts           # Parent job creation (business-level)
│   ├── processors/
│   │   ├── business-scrape.ts # Parent job processor
│   │   └── source-scrape.ts   # Child job processor (per-source)
│   └── flows.ts               # FlowProducer for parent->child relationships
├── database/
│   ├── schema.ts              # Drizzle/Pg schema definitions
│   ├── rls.ts                 # RLS policy definitions
│   └── tenant-middleware.ts   # SET LOCAL app.current_tenant
├── dashboard/
│   └── scrape-status.ts       # Real-time status tracking
└── types/
    └── index.ts               # Shared TypeScript types
```

### Pattern 1: Stealth Browser Context Builder

**What:** Builds a Playwright browser context with randomized fingerprints per request.

**When to use:** Every scraper invocation. Randomized viewport, timezone, locale, and user agent reduce fingerprinting.

**Example:**
```typescript
// Source: Established pattern from playwright-extra stealth ecosystem
import { faker } from '@faker-js/faker';
import { chromium } from 'playwright-extra';

async function buildStealthContext(browser: Browser) {
  const viewport = {
    width: faker.number.int({ min: 1024, max: 1920 }),
    height: faker.number.int({ min: 768, max: 1080 }),
  };
  const timezone = faker.location.timeZone();
  const locale = faker.location.locale();

  const context = await browser.newContext({
    viewport,
    locale,
    timezoneId: timezone,
    userAgent: faker.internet.userAgent(),
    // Additional stealth: skip images/css for speed
    serviceWorkers: 'block',
  });

  return context;
}
```

**Note:** The actual stealth plugin patches go deeper (automation property, Chrome runtime object, permissions API). Using `playwright-extra` with the stealth plugin is simpler than manual patches.

### Pattern 2: Two-Level BullMQ Flow (Parent -> Children)

**What:** Parent job per business fans out 5 child jobs (one per source). Children run in parallel. Parent waits for all children before completing.

**When to use:** PIPELINE-01 and PIPELINE-03. This is the standard pattern for fan-out/fan-in job queues.

**Example:**
```typescript
// Source: BullMQ FlowProducer documentation pattern
import { Queue, Worker, FlowProducer } from 'bullmq';

const scrapeQueue = new Queue('scrape');
const flowProducer = new FlowProducer();

// Create parent job which fans out to children
await flowProducer.add({
  name: 'scrape-business',
  queueName: 'scrape',
  data: { businessId: 'biz-123', name: 'Joe\'s Pizza', address: '123 Main St' },
  children: [
    { name: 'google-maps', queueName: 'scrape', data: { businessId: 'biz-123', source: 'google_maps' } },
    { name: 'instagram',   queueName: 'scrape', data: { businessId: 'biz-123', source: 'instagram' } },
    { name: 'facebook',    queueName: 'scrape', data: { businessId: 'biz-123', source: 'facebook' } },
    { name: 'yelp',        queueName: 'scrape', data: { businessId: 'biz-123', source: 'yelp' } },
    { name: 'google-reviews', queueName: 'scrape', data: { businessId: 'biz-123', source: 'google_reviews' } },
  ],
});

// Worker processes child jobs with retry backoff
const worker = new Worker('scrape', async (job) => {
  if (job.name === 'scrape-business') {
    // Parent job: only dispatches, waits for children
    return { status: 'waiting-for-children' };
  }
  // Child job: actual scraping
  const scraper = getScraper(job.data.source);
  return scraper.run(job.data);
}, {
  connection: redisConnection,
  limiter: { max: 5, duration: 1000 }, // Global 5-instance cap
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
```

### Pattern 3: PostgreSQL RLS with SET LOCAL

**What:** Every query runs within a Postgres session where `app.current_tenant` is set via `SET LOCAL`. RLS policies enforce tenant isolation at the engine level.

**When to use:** Every database query in the scraping pipeline. Required for INFRA-01.

**Example:**
```sql
-- Enable RLS on all scraping tables
ALTER TABLE google_maps_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_raw   ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_raw    ENABLE ROW LEVEL SECURITY;
ALTER TABLE yelp_raw        ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_reviews_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses      ENABLE ROW LEVEL SECURITY;

-- RLS policy: always filter by tenant
CREATE POLICY tenant_isolation_policy ON businesses
  USING (tenant_id = current_setting('app.current_tenant', true));
-- Same for all raw tables...

-- Same for all other raw tables
```

```typescript
// Source: Standard Node.js + pg SET LOCAL pattern
import { Pool } from 'pg';

const pool = new Pool({ max: 20 }); // Connection pool for concurrent workers

async function withTenant<T>(
  tenantId: string,
  fn: () => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    // SET LOCAL is transaction-scoped
    await client.query(`SET LOCAL app.current_tenant = $1`, [tenantId]);
    return await fn();
  } finally {
    client.release();
  }
}

// Express middleware pattern
app.use(async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] as string;
  if (!tenantId) return res.status(400).json({ error: 'Missing tenant' });

  const client = await pool.connect();
  try {
    await client.query(`SET LOCAL app.current_tenant = $1`, [tenantId]);
    req.tenantClient = client; // Attach to request
    next();
  } catch (err) {
    client.release();
    next(err);
  }
});
```

### Pattern 4: Zod Runtime Validation with Partial Store

**What:** Each scraper validates output against a Zod schema. On validation failure, store what was scraped and flag the record as partial/incomplete.

**When to use:** SCRAPE-08. Every scraper output passes through Zod validation before storage.

**Example:**
```typescript
// Source: Zod 4.x standard pattern
import { z } from 'zod';

const GoogleMapsSchema = z.object({
  businessName: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().optional(),
  hours: z.record(z.string(), z.string()).optional(),
  reviews: z.array(z.object({
    author: z.string(),
    rating: z.number().min(1).max(5),
    text: z.string(),
    date: z.string(),
  })).optional(),
  resultsCount: z.number().optional(),
});

const InstagramSchema = z.object({
  profileName: z.string(),
  bio: z.string().optional(),
  followers: z.number().optional(),
  posts: z.array(z.object({
    id: z.string(),
    likes: z.number(),
    comments: z.number(),
    shares: z.number().optional(),
    caption: z.string().optional(),
  })).optional(),
});

type GoogleMapsData = z.infer<typeof GoogleMapsSchema>;

async function scrapeGoogleMaps(businessId: string): Promise<void> {
  const rawData = await googleMapsScraper.scrape(businessId);

  const result = GoogleMapsSchema.safeParse(rawData);
  if (!result.success) {
    // Store partial data + flag as incomplete
    await db.insert(googleMapsRaw).values({
      businessId,
      raw: rawData,  // Store everything scraped
      validated: false,
      validationErrors: JSON.stringify(result.error.flatten()),
      tenantId: getCurrentTenant(),
    });
    logger.warn('Partial Google Maps data', { businessId, errors: result.error.flatten() });
  } else {
    await db.insert(googleMapsRaw).values({
      businessId,
      raw: rawData,
      validated: true,
      data: result.data,
      tenantId: getCurrentTenant(),
    });
  }
}
```

### Pattern 5: Completion Signal (Parent Job Waiting)

**What:** Parent job registers a callback per child. When all children report (success or partial), parent fires the next-phase trigger.

**Example:**
```typescript
// Source: BullMQ job events pattern
const parentJob = await queue.add('scrape-business', { businessId, sources: [...] });

// In parent job processor:
parentJob.addEventListener('completed', () => childCount++);
parentJob.addEventListener('failed', () => handleChildFailure());

// Wait for all children via BullMQ's built-in waiting
// OR use a counter approach:
let completedChildren = 0;
const totalChildren = 5;

await Promise.all(
  children.map(child =>
    waitForJobCompletion(child.id).then(() => completedChildren++)
  )
);

// All children done - trigger next phase
await nextPhaseQueue.add('generate-preview', { businessId });
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Job persistence across restarts | Custom Redis-based queue | BullMQ | BullMQ handles job states, retries, priorities, and distributed locking out of the box |
| Bot fingerprint evasion | Custom automation property patches | playwright-extra + stealth-plugin | Complex to maintain; stealth plugin tracks Chrome release changes |
| Exponential backoff | Manual setTimeout chains | BullMQ `backoff: { type: 'exponential', delay: 3000 }` | Built-in, survives worker crashes, supports all 3 retry parameters |
| Tenant isolation | Application-level WHERE clauses | Postgres RLS + SET LOCAL | SQL injection cannot bypass RLS; enforced at engine level |
| Concurrency control | Manual Promise.all with counters | p-limit | Handles queuing, error propagation, and race conditions correctly |
| Runtime data validation | Manual if-checks or ajv | Zod | TypeScript inference, composable schemas, widely adopted |
| Browser context cleanup | Manual page.close() tracking | Browser context-per-job with automatic cleanup | Prevents memory leaks in long-running workers |

**Key insight:** The scraping domain has well-established libraries (Playwright ecosystem, BullMQ). Anti-bot evasion in particular is a cat-and-mouse game where community-maintained plugins track browser and detection changes faster than any custom implementation can.

## Common Pitfalls

### Pitfall 1: Stealth Plugin False Sense of Security

**What goes wrong:** After deploying playwright-extra + stealth plugin, scraping works for days or weeks then suddenly fails across all sources simultaneously.

**Why it happens:** Google Maps, Instagram, Facebook update their bot detection continuously. The stealth plugin releases lag behind. When detection patterns change (new fingerprint vectors, ML-based detection), all users of common stealth plugins get blocked at once.

**How to avoid:**
- Monitor for detection signals (failed requests, CAPTCHAs, unexpected redirects) per source
- Implement source-specific fallback behaviors (reduce concurrency, increase delays, switch to different user agent rotation)
- Do NOT rely solely on stealth plugin; add manual fingerprint randomization (viewport, timezone, locale) per request
- Have a plan for when stealth plugins fail (this is why SCRAPE-09 and SCRAPE-10 are in v2)

**Warning signs:** 100% failure rate on a single source across all tenants; CAPTCHA rate suddenly increasing

### Pitfall 2: BullMQ Parent Job Deadlock

**What goes wrong:** Parent job waits indefinitely for children that failed silently.

**Why it happens:** If child jobs fail and are not set to `removeOnFail`, they remain in the queue. Parent job's completion listener may not fire if child was removed incorrectly.

**How to avoid:**
- Always set `removeOnComplete` and `removeOnFail` with reasonable counts
- Use `waitForChildren` pattern or explicit completion counting
- Set `failedReason` so parent can detect and handle child failures
- Log job state transitions for debugging

**Warning signs:** Parent jobs accumulating in "active" state with no children visible in queue

### Pitfall 3: Redis Connection Exhaustion

**What goes wrong:** Workers hang, jobs stop processing, no errors logged.

**Why it happens:** Each BullMQ worker maintains its own Redis connection. With 5 browser instances + workers + producers, it's easy to exceed Redis connection limits. Default Redis `maxclients` is 10,000 but connection pool misconfigurations accumulate.

**How to avoid:**
- Use a single shared Redis connection for all producers in the same process
- Configure `maxRetriesPerRequest` in ioredis options
- Set `enableReadyCheck` and `connectTimeout` properly
- Monitor Redis CLIENT LIST for connection leaks

**Warning signs:** `MaxRetriesPerRequest` errors, connection timeouts under load

### Pitfall 4: PostgreSQL SET LOCAL in Connection Pool

**What goes wrong:** Tenant A's data appears for Tenant B, or "current_setting" returns null.

**Why it happens:** `SET LOCAL` only lasts for the current transaction. If a pooled connection is returned to the pool between transactions, the setting is lost. Or if the application uses autocommit mode, SET LOCAL never takes effect.

**How to avoid:**
- Always wrap tenant operations in explicit transactions
- Use `SET LOCAL` immediately after acquiring a connection from the pool
- Ensure the pg driver is NOT in autocommit mode
- Verify with `SHOW app.current_tenant` after each SET LOCAL in tests

**Warning signs:** Cross-tenant data leakage, `null` tenant_id errors, inconsistent filtering

### Pitfall 5: Selector Fragility in Scrapers

**What goes wrong:** Scraper worked in testing but fails in production; selectors break silently.

**Why it happens:** Google Maps, Instagram, Facebook frequently update DOM structure. CSS selectors and XPath expressions break without warning. Selectors can also fail differently across page states (logged in vs. logged out).

**How to avoid:**
- Use semantic selectors (aria-label, data-testid) when available, not CSS classes
- Implement selector validation in CI (run scrapers against real pages daily)
- Wrap selector operations in retry logic with fallbacks
- Log HTML snapshots on failure for debugging

**Warning signs:** Scraper failures correlate across tenants on same day; single selector consistently failing

## Code Examples

### Source-Specific Stealth Configuration

```typescript
// Source: Established scraping patterns ecosystem
import { faker } from '@faker-js/faker';

const SOURCE_STEALTH_CONFIG = {
  google_maps: {
    viewport: { width: 1280, height: 720 }, // Desktop
    timezone: 'America/New_York',
    locale: 'en-US',
    userAgentPattern: 'Chrome/Win', // Windows Chrome more common for Google
    delayMultiplier: 1.5, // Google is more sensitive
  },
  instagram: {
    viewport: { width: 390, height: 844 }, // iPhone mobile
    timezone: 'America/Los_Angeles',
    locale: 'en-US',
    userAgentPattern: 'Chrome/Mac', // Instagram sees Mac traffic
    delayMultiplier: 1.0,
  },
  facebook: {
    viewport: { width: 1366, height: 768 }, // Windows laptop
    timezone: 'America/Chicago',
    locale: 'en-US',
    userAgentPattern: 'Chrome/Win',
    delayMultiplier: 1.2,
  },
  yelp: {
    viewport: { width: 1440, height: 900 }, // MacBook Pro
    timezone: 'America/New_York',
    locale: 'en-US',
    userAgentPattern: 'Safari/Mac', // Yelp sees Safari traffic
    delayMultiplier: 1.0,
  },
  google_reviews: {
    viewport: { width: 1280, height: 720 },
    timezone: 'America/New_York',
    locale: 'en-US',
    userAgentPattern: 'Chrome/Win',
    delayMultiplier: 1.3,
  },
};
```

### BullMQ Retry and Backoff Configuration

```typescript
// Source: BullMQ documentation patterns
const SCRAPE_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 3000,    // 3s -> 6s -> 12s (doubles each retry)
    maxInterval: 60000, // 60s cap
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

// Per-source retry limits (some sources are more flaky)
const SOURCE_RETRY_CONFIG = {
  google_maps: { attempts: 3, delay: 3000 },
  instagram:   { attempts: 2, delay: 5000 }, // Instagram is flakier
  facebook:    { attempts: 3, delay: 3000 },
  yelp:        { attempts: 3, delay: 3000 },
  google_reviews: { attempts: 3, delay: 3000 },
};
```

### Dashboard Status Tracking

```typescript
// Source: BullMQ events pattern for real-time dashboard
interface ScrapeStatus {
  businessId: string;
  tenantId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
  sources: {
    [source: string]: {
      status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
      attempts: number;
      lastError?: string;
      updatedAt: Date;
    };
  };
  startedAt: Date;
  completedAt?: Date;
}

// Subscribe to BullMQ events for real-time updates
const scrapeStatus = new Map<string, ScrapeStatus>();

queue.on('waiting', ({ jobId }) => {
  // Job is waiting to be processed
  updateStatus(jobId, 'in_progress');
});

queue.on('completed', ({ jobId, returnvalue }) => {
  // Job completed successfully
  updateStatus(jobId, 'completed', returnvalue);
});

queue.on('failed', ({ jobId, failedReason }) => {
  // Job failed
  updateStatus(jobId, 'failed', undefined, failedReason);
});

// Expose via WebSocket or SSE for dashboard
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Puppeteer for scraping | Playwright (native CDP, multi-browser) | 2020+ | Playwright's CDP access is superior for stealth |
| Custom retry with setTimeout | BullMQ built-in exponential backoff | 2019+ | BullMQ became the standard Node.js job queue |
| Application-level tenant filtering | Postgres RLS + SET LOCAL | 2016+ (Postgres 9.5+) | Engine-level enforcement, SQL injection cannot bypass |
| Class-validator / ajv for validation | Zod (type inference + composable) | 2020+ | Zod's schema-first approach became standard |
| Cheerio (static HTML) | Playwright (JavaScript-rendered) | 2019+ | Modern sites require JS rendering |
| Nightmare.js | Playwright | 2018+ | Nightmare abandoned, Playwright won |
| node-cron for scheduling | BullMQ delayed jobs | 2019+ | BullMQ is more reliable across restarts |

**Deprecated/outdated:**
- **puppeteer-extra + stealth-plugin** (moved to playwright-extra ecosystem): Playwright's API is superior
- **aggressive-sleep delays**: Modern anti-bot detects timing patterns; randomized delays + concurrency limits work better
- **Separate database schema per tenant**: Migrate 100s of tenants becomes untenable; RLS scales better
- **AWS Lambda for scraping**: 15-min max execution, cold starts, anti-bot detection still an issue; Docker containers on EC2/ECS work better

## Open Questions

1. **Instagram session handling**
   - What we know: Instagram requires authentication for profile + posts; public scraping is limited
   - What's unclear: Should we use Instagram's public API (rate limited), or maintain authenticated sessions per tenant?
   - Recommendation: Build session management that can handle both authenticated (full data) and unauthenticated (limited) modes

2. **Facebook page access without login**
   - What we know: Facebook has heavily restricted public page access since 2019
   - What's unclear: Is there still reliable public page scraping without login, or do we need authenticated sessions?
   - Recommendation: Start with unauthenticated scraping, measure success rate, add login sessions if needed

3. **CAPTCHA handling strategy**
   - What we know: Google Maps and Yelp present CAPTCHAs when bot detection triggers
   - What's unclear: Is pinchtab (mentioned by user) the right approach, or should we use 2Captcha/Anti-Captcha services?
   - Recommendation: Defer to implementation phase; measure CAPTCHA rate first before choosing solution

4. **Dashboard real-time architecture**
   - What we know: BullMQ events can drive status updates
   - What's unclear: WebSocket vs. SSE vs. polling for dashboard updates
   - Recommendation: Use SSE (simpler, works through proxies) with BullMQ event subscriptions

5. **Browser instance lifecycle per worker**
   - What we know: 5-instance concurrency cap globally, not per worker
   - What's unclear: Should each worker maintain its own browser pool, or share across workers?
   - Recommendation: Each worker creates own browser (simpler), global p-limit enforces cap across all workers

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Playwright Test + Vitest |
| Config file | `playwright.config.ts` + `vitest.config.ts` |
| Quick run command | `npx vitest run --reporter=dot src/scraping/` |
| Full suite command | `npx vitest run && npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SCRAPE-01 | Google Maps scraper extracts correct fields | Unit + Integration | `npx vitest run src/scraping/scrapers/google-maps.test.ts` | Wave 0 |
| SCRAPE-02 | Instagram scraper extracts posts | Unit + Integration | `npx vitest run src/scraping/scrapers/instagram.test.ts` | Wave 0 |
| SCRAPE-03 | Google Reviews scraper extracts reviews | Unit | `npx vitest run src/scraping/scrapers/google-reviews.test.ts` | Wave 0 |
| SCRAPE-04 | Facebook scraper extracts page info | Unit | `npx vitest run src/scraping/scrapers/facebook.test.ts` | Wave 0 |
| SCRAPE-05 | Yelp scraper extracts business info | Unit | `npx vitest run src/scraping/scrapers/yelp.test.ts` | Wave 0 |
| SCRAPE-06 | Parallel scraping completes with 5 cap | Unit | `npx vitest run src/scraping/scrapers/parallel.test.ts` | Wave 0 |
| SCRAPE-07 | Stealth context has randomized fingerprints | Unit | `npx vitest run src/scraping/stealth/context-builder.test.ts` | Wave 0 |
| SCRAPE-08 | Zod validation stores partial on failure | Unit | `npx vitest run src/scraping/validation/schemas.test.ts` | Wave 0 |
| PIPELINE-01 | BullMQ flow creates parent and 5 children | Unit | `npx vitest run src/jobs/flows.test.ts` | Wave 0 |
| PIPELINE-03 | Retry backoff follows 3s/6s/12s | Unit | `npx vitest run src/jobs/retry.test.ts` | Wave 0 |
| INFRA-01 | RLS filters tenant data correctly | Integration | `npx vitest run src/database/tenant-middleware.test.ts` | Wave 0 |
| MONITOR-03 | Dashboard shows real-time status | Integration | `npx vitest run src/dashboard/scrape-status.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=dot src/scraping/` (subset)
- **Per wave merge:** `npx vitest run && npx playwright test` (full)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/scraping/scrapers/base.ts` — abstract scraper class
- [ ] `src/scraping/scrapers/google-maps.test.ts` — SCRAPE-01 tests
- [ ] `src/scraping/scrapers/instagram.test.ts` — SCRAPE-02 tests
- [ ] `src/scraping/scrapers/facebook.test.ts` — SCRAPE-04 tests
- [ ] `src/scraping/scrapers/yelp.test.ts` — SCRAPE-05 tests
- [ ] `src/scraping/scrapers/google-reviews.test.ts` — SCRAPE-03 tests
- [ ] `src/scraping/stealth/context-builder.ts` — stealth config per source
- [ ] `src/scraping/stealth/context-builder.test.ts` — SCRAPE-07 tests
- [ ] `src/scraping/validation/schemas.ts` — Zod schemas per source
- [ ] `src/scraping/validation/schemas.test.ts` — SCRAPE-08 tests
- [ ] `src/jobs/queue.ts` — BullMQ setup
- [ ] `src/jobs/flows.test.ts` — PIPELINE-01 tests
- [ ] `src/jobs/retry.test.ts` — PIPELINE-03 tests
- [ ] `src/database/schema.ts` — Drizzle schema with RLS
- [ ] `src/database/tenant-middleware.test.ts` — INFRA-01 tests
- [ ] `src/dashboard/scrape-status.ts` — status tracking
- [ ] `src/dashboard/scrape-status.test.ts` — MONITOR-03 tests
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `playwright.config.ts` — Playwright configuration

## Sources

### Primary (HIGH confidence)
- npm registry — version checks for playwright 1.58.2, bullmq 5.71.0, zod 4.3.6, p-limit 7.3.0, ioredis 5.10.1
- STACK.md (`.planning/research/STACK.md`) — verified stack decisions
- CONTEXT.md (`.planning/phases/01-scraping-infrastructure/01-CONTEXT.md`) — locked decisions

### Secondary (MEDIUM confidence)
- BullMQ documentation patterns (FlowProducer, parent-child jobs, exponential backoff) — from training knowledge, patterns verified via npm package structure
- Playwright CDP documentation — from training knowledge
- PostgreSQL RLS + SET LOCAL patterns — established database pattern

### Tertiary (LOW confidence — marked for validation)
- Stealth plugin effectiveness for Google Maps/Instagram — requires real-world testing; stealth plugins have known lag behind detection updates
- Instagram/Facebook scraping success rates — requires validation against current site versions
- CAPTCHA handling approach (pinchtab) — deferred to implementation phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — npm versions verified, locked decisions from CONTEXT.md
- Architecture: MEDIUM — patterns from training knowledge, no external verification possible
- Pitfalls: MEDIUM — established patterns documented, open questions flagged

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (30 days for stable patterns; anti-bot detection patterns may change faster)
**WebSearch/WebFetch unavailable:** Research based on npm registry verification + training knowledge; recommend re-verifying anti-bot effectiveness claims before implementation
