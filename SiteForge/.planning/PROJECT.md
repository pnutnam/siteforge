# SiteForge — AI-Powered Local Business Website Engine

## What This Is

A platform that discovers local businesses without websites, auto-generates high-quality landing pages from their existing social proof, and converts them into $50/mo customers with a full WYSIWYG editor. The generated landing page IS the cold outreach — agentic sales reps send it directly, and the business sees their own photos and reviews selling for them before any human contact.

**Core Value:** Every local business deserves a website that sells itself using what's already working — their own social posts and reviews.

## Current State

**Milestone:** v1.2 Preview Landing Pages — in progress

**What was built (v1.0 + v1.1):**
- Scraping infrastructure: 5 parallel scrapers (Google Maps, Instagram, Facebook, Yelp, Google Reviews) with BullMQ job queue and PostgreSQL tenant isolation
- AI content pipeline: engagement scoring, quality filtering, hybrid copy generation with testimonial selection
- Preview landing pages: S3 + Cloudflare CDN hosting, unique `biz-{hash}.preview.siteforge.io` URLs, SendGrid email delivery, conversion analytics
- Production site: Next.js + Payload CMS with Tiptap WYSIWYG editor, mobile accordion editing, ISR + on-demand revalidation
- Authentication: JWT + TOTP 2FA, rate limiting, Redis-backed refresh tokens, tenant isolation middleware
- DNS custom domains: CNAME validation via Cloudflare API, Cloudflare Origin SSL provisioning, hostname-based tenant resolution
- Hardening: ISR content lookup fixed, mobile accordion wired, ownership validation enforced

**Known remaining tech debt:**
- PREVIEW-01: build threshold warns only (landing page generation)
- Image replace: S3 presigned URL flow not yet implemented (PROD-04 deferred)
- Template picker: `onSelect` creates empty page, no template data loaded

## Current Milestone: v1.2 Preview Landing Pages

**Goal:** Complete preview landing page generation from scraped data, wire template system, close remaining auth gaps

**Target features:**
- PREVIEW-01: Complete static landing page generation from scraped data
- PREVIEW-02/03/04/05: Wired template selection, S3 upload, preview URL delivery, SendGrid email
- Template system: Load templates, wire onSelect to actual content
- Image upload: S3 presigned URLs for editor image replace

## Requirements

### Validated (v1.0 + v1.1)

- [x] SCRAPE-01 through SCRAPE-08 (scraping infrastructure)
- [x] CONTENT-01 through CONTENT-04 (AI content pipeline)
- [x] PREVIEW-02, PREVIEW-03, PREVIEW-04, PREVIEW-05 (preview landing pages)
- [x] DNS-01, DNS-02, DNS-03 (DNS & custom domains)
- [x] PIPELINE-01, PIPELINE-02, PIPELINE-03 (pipeline orchestration)
- [x] INFRA-01, INFRA-02 (infrastructure)
- [x] MONITOR-01, MONITOR-02, MONITOR-03 (monitoring)
- [x] PROD-01 (ISR serving + content lookup) — v1.1
- [x] PROD-02 (mobile editing, partial) — v1.1
- [x] PROD-03 (per-business isolation) — v1.0
- [x] PROD-04 (ISR + CDN) — v1.0
- [x] AUTH-03 (rate limiting) — v1.1 corrected
- [x] AUTH-04 (ownership validation) — v1.1

### Active (v1.2)

- [ ] **PREVIEW-01**: Complete static landing page generation from scraped data — partial: build threshold warns only
- [ ] **PREVIEW-02**: Template selection with actual content loading — partial: onSelect creates empty page
- [ ] **PREVIEW-03**: S3 presigned URL upload for preview assets — not started
- [ ] **PREVIEW-04**: Preview URL delivery via SendGrid email — partial: delivery exists
- [ ] **PREVIEW-05**: Conversion analytics tracking — partial: basic analytics
- [ ] **Image-01**: S3 presigned URLs for editor image replace — deferred from v1.1

### Out of Scope (v2.0)

- **Stripe payment integration** — First paying customers
- **White-labeling** — Each business gets platform-hosted site
- **Blog/CMS features beyond basic edits** — No posts, events, booking in v1
- **Mobile native app** — Responsive web only
- **Multi-location support** — One site per business in v1

## Next Milestone: v2.0 Launch

**Goal:** First paying customers, Stripe billing, real data

**Priority work:**
1. Stripe payment integration ($50/mo subscription)
2. AUTH-01/02: wire rate limiting into verify-2fa + enforce in API routes
3. Real scraping data end-to-end

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Astro for preview (not Hugo) | Better DX, component reuse | Validated v1.0 |
| Next.js + Payload CMS for production | Real-time editing, auth, per-business isolation | Validated v1.0 |
| Cloudflare Origin SSL (not Let's Encrypt) | Free, no ACME complexity | Validated v1.0 |
| Top 20% by engagement for content selection | Filters low-quality, highlights winners | Validated v1.0 |
| Opaque token for refresh tokens | Random 64-char hex, SHA256 hash in Redis | Validated v1.0 |
| ISR for production site | 60s revalidation + on-demand CDN purge | Validated v1.1 |

## Context

**v1.1 shipped:** 2026-03-25
**Tech stack:** Next.js, Payload CMS, PostgreSQL, BullMQ, Redis, Cloudflare, S3, Playwright, Drizzle ORM
**Codebase:** TypeScript, ~300+ files across 6 phases
**GitHub:** https://github.com/pnutnam/siteforge

---

*Last updated: 2026-03-25 after v1.2 milestone started*
