# Stack Research

**Domain:** AI-Powered Website Generation Platform
**Researched:** 2026-03-23
**Confidence:** MEDIUM

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 16.2.1 | Production app framework | Latest stable (released 2026). App Router, Server Components, and built-in image optimization are essential for multi-tenant SaaS. |
| **Payload CMS** | 3.80.0 | Headless CMS + Auth | All-in-one: auth, users, media, access control. Built-in TypeScript support. Works natively in Next.js. |
| **Astro** | 6.0.8 | Preview site generation | Sub-second builds, zero JS by default. Island architecture perfect for static landing pages. JS-first approach beats Hugo for modern scraping output. |
| **Playwright** | 1.58.2 | Headless scraping | Native Chromium CDP, built-in stealth mode, parallel execution. Better than Puppeteer for Google Maps/Instagram scraping. |
| **LangChain + OpenAI** | 1.2.36 / 6.32.0 | AI content generation | Structured output for SEO copy, chain-of-thought for content selection. OpenAI SDK v6 has streaming support. |
| **BullMQ** | 5.71.0 | Job queue for scraping pipeline | Redis-backed, handles 100s of concurrent scrape jobs. Supports delayed jobs, retries, priorities. |

### Database & Storage

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **PostgreSQL** | 16+ | Primary database | Payload CMS native. JSONB for flexible schema (business data varies). |
| **Redis** | 5.11.0 | Caching + rate limiting | BullMQ persistence, session store, rate limit counters for scraping. |
| **AWS S3** | 3.1014.0 | Static asset storage | Preview site hosting, media storage. SDK v3 is modular. |
| **Cloudflare R2** | N/A | S3-compatible CDN origin | Free tier: 10M req/month, 1TB storage. S3-compatible API via `@aws-sdk/client-s3`. |

### Authentication

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Payload Auth** | 3.80.0 | Built-in user auth | Email/password, OAuth, magic links, API keys. Ships with Payload CMS. |
| **otplib** | 13.4.0 | TOTP 2FA generation | RFC 6238 compliant. Works with Google Authenticator, Authy. Lighter than speakeasy. |
| **qrcode** | 1.5.4 | 2FA setup QR codes | Generate TOTP URI QR codes for authenticator app setup. |

### Image Processing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Sharp** | 0.34.5 | Image optimization | 10x faster than ImageMagick. Auto-WebP/AVIF. Required for responsive images at scale. |
| **imgproxy** | N/A | Image CDN proxy | Resize/optimize on-the-fly. Defer heavy processing from build time. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tiptap/react** | 3.20.4 | WYSIWYG editor | Production site editing. ProseMirror-based, extensible. |
| **@tiptap/starter-kit** | 3.20.4 | Basic editor features | Bold, italic, headings, lists for WYSIWYG |
| **@tiptap/extension-image** | 3.20.4 | Image upload | Inline images in WYSIWYG editor |
| **Zod** | 4.3.6 | Runtime validation | API request validation, scraper output validation |
| **Drizzle ORM** | 0.45.1 | Type-safe SQL | When raw SQL needed, Payload uses its own ORM |
| **p-limit** | 7.3.0 | Concurrency control | Limit parallel scrape requests to avoid rate limits |
| **nodemailer** | 8.0.3 | Email sending | Transactional emails (2FA codes, landing page links) |
| **@aws-sdk/client-cloudfront** | 3.1014.0 | CDN invalidation | Purge preview URLs after regeneration |
| **@upstash/ratelimit** | 1.37.0 | Rate limiting API | Protect scraping endpoints from abuse |
| **@upstash/redis** | 1.37.0 | Serverless Redis | Upstash for serverless rate limiting (if not self-hosting Redis) |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **TypeScript** | Type safety | 6.0.2. Strict mode required for scraping pipeline. |
| **ESLint** | Code linting | 10.1.0 with TypeScript support |
| **Tailwind CSS** | Styling | 4.2.2. CSS-first config, built-in dark mode. |
| **Prettier** | Code formatting | Coordinate with ESLint |
| **Docker** | Containerization | Isolate scraping workers, avoid anti-bot detection |
| **Playwright Test** | E2E testing | Official Playwright test runner |

## Installation

```bash
# Core dependencies
npm install next@16.2.1 payload@3.80.0
npm install @payloadcms/next@3.80.0 @payloadcms/db-postgres@3.80.0
npm install @tiptap/react@3.20.4 @tiptap/starter-kit@3.20.4 @tiptap/extension-image@3.20.4
npm install playwright@1.58.2 sharp@0.34.5
npm install langchain@1.2.36 langchain-openai@0.3.8 openai@6.32.0
npm install bullmq@5.71.0 ioredis@5.10.1
npm install @aws-sdk/client-s3@3.1014.0 @aws-sdk/client-cloudfront@3.1014.0
npm install otplib@13.4.0 qrcode@1.5.4
npm install zod@4.3.6 nodemailer@8.0.3
npm install p-limit@7.3.0

# Auth (Payload built-in, but Auth.js for custom auth flows)
npm install @auth/core@0.34.3

# Dev dependencies
npm install -D typescript@6.0.2 eslint@10.1.0 tailwindcss@4.2.2 prettier@3.4.2
npm install -D @playwright/test@2.0.8
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Astro for preview sites | Hugo | Hugo is Go binary, faster but less flexible. Use Hugo if build speed is critical and no JS needed. Hugo requires learning Go template syntax. |
| Astro for preview sites | 11ty | 11ty slower for 100s of sites/week. Astro's parallel build is better. |
| Payload CMS | Strapi | Strapi v5 has auth issues. Payload has better TypeScript, built-in auth. |
| Payload CMS | Sanity | Sanity charges per-seat. Payload self-hosted, unlimited users. |
| Playwright | Puppeteer | Puppeteer 24.x lacks native stealth. Playwright's CDP access is superior for anti-bot sites. |
| Playwright | Cheerio | Can't handle JavaScript-rendered content. Google Maps requires Playwright. |
| BullMQ | AWS SQS | SQS lacks retry priorities, delayed jobs, rate limiting. BullMQ is better for scraping pipelines. |
| otplib | speakeasy | speakeasy 2.0+ is heavier, more dependencies. otplib is RFC-minimal. |
| S3 + Cloudflare | Vercel | Vercel pricing kills at 100s of preview sites/week. S3+Cloudflare is nearly free. |
| pg + Redis | PlanetScale | PlanetScale prohibitively expensive at scale. Self-hosted pg is cheaper. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Hugo** | Not an npm package, Go runtime required, template syntax unfamiliar to JS devs | Astro (npm package, JSX-like syntax, faster builds for JS-heavy output) |
| **Strapi v5** | Auth bugs, slower performance, less TypeScript native | Payload CMS 3.x |
| **Cheerio** | Static HTML only, no JS rendering | Playwright headless |
| **Puppeteer** | No native stealth, manual proxy rotation needed | Playwright with stealth mode |
| **next-auth (Auth.js v4)** | Auth.js v1 (0.x) is a complete rewrite | Payload Auth or @auth/core |
| **mongoose** | Single-threaded, memory issues at scale | Drizzle ORM for raw SQL, or Payload's built-in ORM |
| **CouchDB/MongoDB** | No ACID transactions, eventual consistency issues | PostgreSQL with JSONB |
| **AWS Lambda for scraping** | Cold start latency, 15-min max execution, anti-bot detection bypass hard | Docker containers on EC2/ECS |
| **Redis Cloud/ElastiCache** | Expensive at high concurrency | Self-hosted Redis on Railway/Render or Upstash |
| **SendGrid/Mailgun** | Expensive for high volume | Brevo (Sendinblue) free tier or AWS SES |

## Stack Patterns by Variant

**If preview site volume exceeds 1,000/week:**
- Consider Hugo instead of Astro (pure Go = faster parallel builds)
- Add build farm with parallel workers
- Use Cloudflare R2 instead of S3 for cost savings

**If production sites require real-time collaboration:**
- Add Yjs for CRDT-based collaborative editing
- Use Liveblocks or PartyKit for presence

**If scraping anti-bot measures intensify:**
- Add ProxyMesh or BrightData residential proxies
- Use Cloudflare Workers as proxy layer
- Implement browser fingerprint randomization

**If AI generation costs become prohibitive:**
- Batch scraping into weekly cohorts
- Cache AI responses per business
- Use gpt-4o-mini instead of gpt-4o

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Payload CMS 3.80.0 | Next.js 16.x | App Router support via @payloadcms/next |
| Payload CMS 3.80.0 | PostgreSQL 16+ | JSONB support required |
| Playwright 1.58.2 | Node.js 20+ | Requires Node.js 20 for full features |
| BullMQ 5.71.0 | Redis 6.2+ | Redis 7.x recommended |
| Tiptap 3.20.4 | React 18+ | Requires React 18 for Server Components |
| LangChain 1.2.36 | OpenAI 6.x | Uses OpenAI SDK v6 streaming |
| @tiptap/extension-image 3.20.4 | @tiptap/starter-kit 3.20.4 | Same major version |
| Tailwind CSS 4.2.2 | Next.js 16.x | CSS-first config requires Tailwind v4 |

## Sources

- npm registry — version checks (2026-03-23)
- Playwright documentation — 1.58.2 release notes, stealth mode
- Payload CMS documentation — 3.80.0, Next.js integration, auth
- Next.js documentation — 16.x App Router
- Astro documentation — 6.0.8, static generation
- otplib GitHub — RFC 6238 TOTP implementation
- LangChain documentation — 1.2.36, OpenAI integration

---
*Stack research for: AI-Powered Website Generation Platform*
*Researched: 2026-03-23*
