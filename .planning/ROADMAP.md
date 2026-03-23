# Roadmap: SiteForge

## Overview

SiteForge is an AI-powered local business website platform that scrapes business data from Google Maps, Instagram, Facebook, and Yelp, auto-generates landing pages from social proof, and converts businesses into $50/mo customers with a full WYSIWYG editor. The journey goes from scraping infrastructure (data foundation) through AI content generation, preview landing pages for sales outreach, production sites with auth and editing, and finally custom domains.

## Phases

- [ ] **Phase 1: Scraping Infrastructure** - Reliable data extraction from all sources
- [ ] **Phase 2: AI Content Pipeline** - AI selects and generates site content
- [ ] **Phase 3: Preview Landing Pages** - Sales-ready preview links for cold outreach
- [ ] **Phase 4: Production Site** - Live sites with WYSIWYG editing for customers
- [ ] **Phase 5: Authentication & Security** - TOTP 2FA and tenant isolation
- [ ] **Phase 6: DNS & Custom Domains** - Custom domain support with auto-SSL

## Phase Details

### Phase 1: Scraping Infrastructure
**Goal**: Automated scraping pipeline reliably extracts business data from all sources
**Depends on**: Nothing (first phase)
**Requirements**: SCRAPE-01, SCRAPE-02, SCRAPE-03, SCRAPE-04, SCRAPE-05, SCRAPE-06, SCRAPE-07, SCRAPE-08, PIPELINE-01, PIPELINE-03, INFRA-01, MONITOR-03
**Success Criteria** (what must be TRUE):
  1. User can initiate scrape for a business and all 5 sources (Google Maps, Instagram, Facebook, Yelp, Google Reviews) run in parallel
  2. Google Maps returns business name, address, phone, hours, and all reviews within the listing
  3. Instagram returns profile info and top posts sorted by engagement (likes + comments + shares)
  4. Facebook returns page info and top posts
  5. Yelp returns business info and top reviews with ratings and dates
  6. Anti-bot detection triggers automatic retry with exponential backoff and rate limiting
  7. Scraped data is validated and normalized into consistent format before passing to AI
  8. Job queue persists retries and failures across server restarts
  9. Dashboard shows real-time scrape status per business (pending, running, success, failed)
  10. PostgreSQL schema supports tenant-isolated data storage from day one
**Plans**: TBD

### Phase 2: AI Content Pipeline
**Goal**: AI selects highest-quality content and generates site copy from scraped data
**Depends on**: Phase 1
**Requirements**: CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, PIPELINE-02
**Success Criteria** (what must be TRUE):
  1. AI selects top 5 images/posts based on engagement scoring (filters low-quality automatically)
  2. AI content quality classifier rejects off-brand photos (party shots, excessive hashtags, posts over 12 months old)
  3. AI generates site copy using business info and social proof as source material
  4. AI maps all scraped data to template variables without data loss
  5. Landing page is generated and live within 10 minutes of scrape completion
**Plans**: TBD

### Phase 3: Preview Landing Pages
**Goal**: Sales agents can generate and send preview links to business owners for cold outreach
**Depends on**: Phase 2
**Requirements**: PREVIEW-01, PREVIEW-02, PREVIEW-03, PREVIEW-04, PREVIEW-05, INFRA-02, MONITOR-01, MONITOR-02
**Success Criteria** (what must be TRUE):
  1. Preview site generates from Astro and deploys to CDN within 5 minutes of AI completion
  2. Preview pages serve from S3 + Cloudflare CDN with sub-50ms global delivery
  3. Each preview has unique URL following `biz-{hash}.preview.siteforge.io` format
  4. Sales agent can email or SMS preview link directly to business owner from dashboard
  5. Preview links expire after 30 days with visible urgency indicator
  6. Dashboard shows landing page views, CTR, and time-on-site per preview link
  7. Conversion events (preview link sent, preview viewed, conversion to paid) are tracked
  8. S3 bucket uses per-tenant key prefix isolation for security
**Plans**: TBD

### Phase 4: Production Site
**Goal**: Business owners can claim preview and set up their production site with WYSIWYG editing
**Depends on**: Phase 3
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):
  1. Business owner can claim a preview site and create account in under 10 minutes
  2. Production site uses Tiptap WYSIWYG editor with real-time updates
  3. Owner can edit any text, replace images, and reorder sections from mobile phone
  4. Editor renders properly on all mobile screen sizes
  5. Each business site is isolated via tenant middleware and row-level security
  6. Production sites are served from CDN (not shared infrastructure)
**Plans**: TBD

### Phase 5: Authentication & Security
**Goal**: Secure owner authentication with TOTP 2FA and multi-tenant isolation
**Depends on**: Phase 4
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. Owner can set up TOTP 2FA using any authenticator app during account creation
  2. Sessions persist securely with refresh tokens across browser sessions
  3. Rate limiting prevents brute-force attacks on TOTP verification endpoints
  4. Multi-tenant isolation middleware validates tenant_id from JWT matches requested resource on every request
**Plans**: TBD

### Phase 6: DNS & Custom Domains
**Goal**: Businesses can use their own domain for their production site with auto-provisioned SSL
**Depends on**: Phase 5
**Requirements**: DNS-01, DNS-02, DNS-03
**Success Criteria** (what must be TRUE):
  1. Business owner can add custom domain in site settings with CNAME validation
  2. SSL certificate provisions automatically within 10 minutes of DNS change (via Let's Encrypt or Cloudflare Origin SSL)
  3. Tenant resolution correctly identifies business from custom hostname in middleware
  4. Custom domain routes to platform CNAME without port conflicts or redirect loops
**Plans**: TBD

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scraping Infrastructure | 0/TBD | Not started | - |
| 2. AI Content Pipeline | 0/TBD | Not started | - |
| 3. Preview Landing Pages | 0/TBD | Not started | - |
| 4. Production Site | 0/TBD | Not started | - |
| 5. Authentication & Security | 0/TBD | Not started | - |
| 6. DNS & Custom Domains | 0/TBD | Not started | - |

## Coverage

**v1 Requirements:** 36 total

| Phase | Requirements |
|-------|--------------|
| 1. Scraping Infrastructure | SCRAPE-01, SCRAPE-02, SCRAPE-03, SCRAPE-04, SCRAPE-05, SCRAPE-06, SCRAPE-07, SCRAPE-08, PIPELINE-01, PIPELINE-03, INFRA-01, MONITOR-03 (12) |
| 2. AI Content Pipeline | CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, PIPELINE-02 (5) |
| 3. Preview Landing Pages | PREVIEW-01, PREVIEW-02, PREVIEW-03, PREVIEW-04, PREVIEW-05, INFRA-02, MONITOR-01, MONITOR-02 (8) |
| 4. Production Site | PROD-01, PROD-02, PROD-03, PROD-04 (4) |
| 5. Authentication & Security | AUTH-01, AUTH-02, AUTH-03, AUTH-04 (4) |
| 6. DNS & Custom Domains | DNS-01, DNS-02, DNS-03 (3) |

**Mapped:** 36/36 requirements (100%)
