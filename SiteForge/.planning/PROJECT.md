# SiteForge — AI-Powered Local Business Website Engine

## What This Is

A platform that discovers local businesses without websites, auto-generates high-quality landing pages from their existing social proof, and converts them into $50/mo customers with a full WYSIWYG editor. The generated landing page IS the cold outreach — agentic sales reps send it directly, and the business sees their own photos and reviews selling for them before any human contact.

**Core Value:** Every local business deserves a website that sells itself using what's already working — their own social posts and reviews.

## Current State

**Milestone:** v1.0 MVP — shipped 2026-03-25

**What was built:**
- Scraping infrastructure: 5 parallel scrapers (Google Maps, Instagram, Facebook, Yelp, Google Reviews) with BullMQ job queue and PostgreSQL tenant isolation
- AI content pipeline: engagement scoring, quality filtering, hybrid copy generation with testimonial selection
- Preview landing pages: S3 + Cloudflare CDN hosting, unique `biz-{hash}.preview.siteforge.io` URLs, SendGrid email delivery, conversion analytics
- Production site: Next.js + Payload CMS with Tiptap WYSIWYG editor, mobile editing, ISR + on-demand revalidation
- Authentication: JWT + TOTP 2FA, rate limiting, Redis-backed refresh tokens, tenant isolation middleware
- DNS custom domains: CNAME validation via Cloudflare API, Cloudflare Origin SSL provisioning, hostname-based tenant resolution

**Known tech debt (from v1.0 audit):**
- Phase 4 (Production Site) never formally verified — PROD-01/02/03/04 unverified
- AUTH-03: verify-2fa endpoint not wired to rate-limiter.ts
- AUTH-04: ownership.ts helper not enforced in API routes
- Phase 3: stale TODO comments in composer.ts (anti-pattern)

## Requirements

### Validated (v1.0)

- [x] SCRAPE-01 through SCRAPE-08 (scraping infrastructure)
- [x] CONTENT-01 through CONTENT-04 (AI content pipeline)
- [x] PREVIEW-02, PREVIEW-03, PREVIEW-04, PREVIEW-05 (preview landing pages)
- [x] DNS-01, DNS-02, DNS-03 (DNS & custom domains)
- [x] PIPELINE-01, PIPELINE-02, PIPELINE-03 (pipeline orchestration)
- [x] INFRA-01, INFRA-02 (infrastructure)
- [x] MONITOR-01, MONITOR-02, MONITOR-03 (monitoring)

### Active (v1.1)

- [ ] **PREVIEW-01**: Generate static landing page — partial: build threshold warns only
- [ ] **PROD-01**: Production site WYSIWYG editor — ✅ ISR serving + content lookup fixed (getBusinessByDomain + getProductionContent implemented)
- [ ] **PROD-02**: Mobile editing — mostly fixed: section update/reorder wired; image replace deferred (S3)
- [ ] **PROD-03**: Per-business isolation — ✅ satisfied: schema + RLS complete
- [ ] **PROD-04**: Mobile-responsive editor — ✅ satisfied: ISR + CDN infrastructure complete
- [ ] **AUTH-01**: TOTP 2FA — partial: setup works, verify endpoint needs rate limiting
- [ ] **AUTH-02**: Session management — partial: refresh tokens work, rate limiting gap
- [ ] **AUTH-03**: Rate limiting on TOTP — ✅ satisfied: already integrated (false positive in audit)
- [ ] **AUTH-04**: Multi-tenant ownership validation — ✅ satisfied: requireOwnership wired in dashboard feedback routes

### Out of Scope

- **Payment processing** — Stripe integration deferred to v2
- **White-labeling** — Each business gets platform-hosted site
- **Blog/CMS features beyond basic edits** — No posts, events, booking in v1
- **Mobile native app** — Responsive web only
- **Multi-location support** — One site per business in v1

## Next Milestone: v1.1 Hardening

**Goal:** Close v1.0 tech debt, verify Phase 4, complete auth integration

**Priority work:**
1. ~~Verify Phase 4 (Production Site)~~ — DONE: gaps found, PROD-01/02 fixes committed
2. ~~Fix AUTH-03: wire rate limiting into verify-2fa endpoint~~ — FALSE POSITIVE: already integrated
3. ~~Fix AUTH-04: enforce ownership validation in sensitive API routes~~ — DONE: requireOwnership wired in dashboard feedback routes (commit 62ecc45)
4. ~~Implement Phase 4 content lookup~~ — DONE: `getProductionContent()` + `getBusinessByDomain()` implemented in `[domain]/page.tsx`
5. ~~Wire mobile accordion mutation callbacks in editor/page.tsx~~ — DONE: handleSectionUpdate/Reorder wired; image replace deferred (S3)

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Astro for preview (not Hugo) | Better DX, component reuse | Validated v1.0 |
| Next.js + Payload CMS for production | Real-time editing, auth, per-business isolation | Validated v1.0 |
| Cloudflare Origin SSL (not Let's Encrypt) | Free, no ACME complexity | Validated v1.0 |
| Top 20% by engagement for content selection | Filters low-quality, highlights winners | Validated v1.0 |
| Opaque token for refresh tokens | Random 64-char hex, SHA256 hash in Redis | Validated v1.0 |

## Context

**v1.0 shipped:** 2026-03-25
**Tech stack:** Next.js, Payload CMS, PostgreSQL, BullMQ, Redis, Cloudflare, S3, Playwright, Drizzle ORM
**Codebase:** TypeScript, ~300+ files across 6 phases

---

*Last updated: 2026-03-25 after v1.0 milestone*
