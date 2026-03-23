# SiteForge — AI-Powered Local Business Website Engine

## What This Is

A platform that discovers local businesses without websites, auto-generates high-quality landing pages from their existing social proof, and converts them into $50/mo customers with a full WYSIWYG editor. The generated landing page IS the cold outreach — agentic sales reps send it directly, and the business sees their own photos and reviews selling for them before any human contact.

**Core Value:** Every local business deserves a website that sells itself using what's already working — their own social posts and reviews.

## Context

The product is really two systems in one:

1. **Preview/Landing System** — High-volume, cheap-to-serve landing pages used in cold outreach. Generated at 100s/week, most don't convert. S3 + Cloudflare, near-zero cost per site.

2. **Production System** — The $50/mo product. Real-time WYSIWYG editor, 2FA auth, per-business isolation, lightning-fast delivery via CDN.

The 100s/week volume means the scraping → generation pipeline must be highly automated and parallelizable.

## Requirements

### Active

- [ ] **SCRAPE-01**: Headless Playwright scrapes Google Maps listing (business name, address, phone, hours, 160 results per query, all reviews)
- [ ] **SCRAPE-02**: Scrape Instagram profile and top posts by engagement (likes + comments + shares)
- [ ] **SCRAPE-03**: Scrape Google Reviews (text, rating, date, author)
- [ ] **SCRAPE-04**: Scrape Facebook page info and top posts
- [ ] **SCRAPE-05**: Scrape Yelp business info and top reviews
- [ ] **CONTENT-01**: AI selects highest-engagement content (images/posts) to feature on generated site
- [ ] **CONTENT-02**: AI generates site copy using business info + social proof as source material
- [ ] **LANDING-01**: Generate static landing page (Hugo or raw HTML) from scraped + AI content
- [ ] **LANDING-02**: Serve landing pages from S3 + Cloudflare CDN (sub-50ms global delivery)
- [ ] **LANDING-03**: Generate unique preview URL for each landing page (e.g. `biz-{hash}.preview.siteforge.io`)
- [ ] **LANDING-04**: Email or SMS landing page link to business owner via sales agent
- [ ] **PROD-01**: Production site with real-time WYSIWYG editor (Tiptap or similar)
- [ ] **PROD-02**: Owner can edit any text, image, section from mobile phone
- [ ] **PROD-03**: 2FA required for owner account login
- [ ] **PROD-04**: Per-business site served from CDN (not shared infrastructure for production)
- [ ] **AUTH-01**: Owner authentication with TOTP-based 2FA (Authenticator app)
- [ ] **AUTH-02**: Session management with secure refresh tokens
- [ ] **DNS-01**: Custom domain support — business points DNS to platform CNAME/IP
- [ ] **DNS-02**: Automated SSL certificate provisioning (Let's Encrypt or Cloudflare)
- [ ] **PIPELINE-01**: Parallel scraping of all sources (Google Maps, IG, FB, Yelp, Google Reviews) per business
- [ ] **PIPELINE-02**: AI generation triggered automatically after scrape completion
- [ ] **PIPELINE-03**: Landing page live within 10 minutes of starting scrape
- [ ] **MONITOR-01**: Dashboard showing landing page views, CTR, time-on-site per preview link
- [ ] **MONITOR-02**: Conversion tracking (preview → paid subscription)

### Out of Scope

- **Payment processing** — Stripe integration deferred to v2 (manual invoicing for v1)
- **White-labeling** — Each business gets platform-hosted site, not branded reseller
- **Blog/CMS features beyond basic edits** — No posts, events, appointment booking in v1
- **Mobile native app** — Responsive web only, no native iOS/Android
- **Multi-location support** — One site per business in v1

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Two-tier architecture (preview vs production) | Preview sites: high-volume, cheap, static. Production sites: secure, real-time, isolated. Combining them adds complexity without benefit. | — Pending |
| Hugo for preview landing pages | Sub-second builds, zero runtime cost, nearly unhackable, S3-native | — Pending |
| Next.js + Payload CMS for production | Need real-time editing, auth, per-business isolation. Payload gives us auth/users/media CRUD, Next.js gives us SSR + editor rendering | — Pending |
| Headless Playwright for scraping | Google Maps has no public API. Playwright gives us the full 160-result page with reviews, tiles, contact info in one pass | — Pending |
| TOTP 2FA | $50/mo security requirement. TOTP (Authenticator app) is simpler than SMS, more secure, no phone number needed | — Pending |
| S3 + Cloudflare for preview CDN | $0 hosting for 100s of preview pages, global edge delivery, automatic compression | — Pending |

## Constraints

- **Budget**: Must economics work at 100s of preview sites/week. S3 + Cloudflare free tier covers most; minimal incremental cost per preview
- **Timeline**: v1 must ship with the core scraping → landing page pipeline working end-to-end
- **Security**: Production sites must be isolated per-customer. Owner 2FA non-negotiable.
- **Scraping**: Google Maps, Instagram, Facebook, Yelp — all may have anti-bot measures. Headless browser with proxy rotation may be needed.
- **Rate Limits**: AI generation costs money. Must batch scraping efficiently before triggering generation.

## Context

This is a new project. No existing codebase to build on.

---
*Last updated: 2026-03-23 after requirements gathering*
