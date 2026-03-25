# Milestones

## 1.1 Hardening (Shipped: 2026-03-25)

**Phases completed:** 6 phases, 26 plans, 7 tasks

**Key accomplishments:**

- Fixed PROD-01: implemented `getBusinessByDomain()` and `getProductionContent()` in ISR page — ISR serving now functional
- Fixed PROD-02: wired `handleSectionUpdate` and `handleSectionReorder` in editor/page.tsx — mobile editing persists changes
- Corrected AUTH-03 false positive: rate limiting WAS integrated in verify-2fa endpoint (05-VERIFICATION.md updated)
- Fixed AUTH-04: wired `requireOwnership` in dashboard feedback routes — GET filters by tenant_id, POST enforces ownership

---

## 1.0 MVP (Shipped: 2026-03-25)

**Phases completed:** 6 phases, 26 plans
**Requirements:** 28/36 satisfied (78%)
**Known gaps:** Phase 4 unverified, AUTH-03/04 integration gaps

**Key accomplishments:**

- Built 5-source scraping pipeline (Google Maps, Instagram, Facebook, Yelp, Google Reviews) with parallel execution and BullMQ job flows
- Implemented AI content selection using engagement scoring (top 20% by percentile) with quality filtering
- Created hybrid copy generation combining templates with AI for testimonial selection and headline/tagline generation
- Deployed preview landing pages via Astro to S3 + Cloudflare CDN with unique `biz-{hash}.preview.siteforge.io` URLs
- Built production site with Next.js + Payload CMS and Tiptap WYSIWYG editor with mobile accordion editing
- Implemented ISR + on-demand revalidation for production site CDN serving
- Created complete auth system: JWT + TOTP 2FA with Redis-backed refresh tokens
- Built DNS custom domain system: CNAME validation via Cloudflare API, Cloudflare Origin SSL provisioning, hostname-based tenant resolution
- Established PostgreSQL tenant isolation with RLS policies and per-tenant S3 key prefix isolation

**Tech debt carried forward:**

- Phase 4 (PROD-01 through PROD-04) never formally verified
- AUTH-03: verify-2fa not wired to rate-limiter.ts
- AUTH-04: ownership.ts helper not enforced in API routes
- Phase 3: Stale TODO comments in composer.ts

---
