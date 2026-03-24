# Requirements: SiteForge

**Defined:** 2026-03-23
**Core Value:** Every local business deserves a website that sells itself using what's already working — their own social posts and reviews.

## v1 Requirements

### Scraping

- [x] **SCRAPE-01**: Headless Playwright scrapes Google Maps listing (business name, address, phone, hours, 160 results per query, all reviews)
- [x] **SCRAPE-02**: Scrape Instagram profile and top posts by engagement (likes + comments + shares)
- [x] **SCRAPE-03**: Scrape Google Reviews (text, rating, date, author)
- [x] **SCRAPE-04**: Scrape Facebook page info and top posts
- [x] **SCRAPE-05**: Scrape Yelp business info and top reviews
- [x] **SCRAPE-06**: Parallel scraping of all sources per business (Promise.all with individual retry logic)
- [x] **SCRAPE-07**: Anti-bot detection handling (stealth mode, proxy rotation, rate limiting)
- [x] **SCRAPE-08**: Scraped data validation and normalization before AI processing

### Content Intelligence

- [x] **CONTENT-01**: AI selects highest-engagement content (images/posts) to feature on generated site
- [x] **CONTENT-02**: AI content quality classification (filters off-brand, party photos, low-quality)
- [x] **CONTENT-03**: AI generates site copy using business info + social proof as source material
- [x] **CONTENT-04**: AI maps scraped data to Hugo/Astro template variables

### Preview Landing Pages

- [ ] **PREVIEW-01**: Generate static landing page (Astro) from scraped + AI content
- [x] **PREVIEW-02**: Serve landing pages from S3 + Cloudflare CDN (sub-50ms global delivery)
- [x] **PREVIEW-03**: Generate unique preview URL for each landing page (e.g. `biz-{hash}.preview.siteforge.io`)
- [ ] **PREVIEW-04**: Email or SMS landing page link to business owner via sales agent
- [ ] **PREVIEW-05**: Preview link expiration mechanism (conversion urgency)

### Production Sites

- [ ] **PROD-01**: Production site with real-time WYSIWYG editor (Tiptap)
- [ ] **PROD-02**: Owner can edit any text, image, section from mobile phone
- [ ] **PROD-03**: Per-business site isolation (tenant middleware, row-level security)
- [ ] **PROD-04**: Mobile-responsive editor rendering

### Authentication & Security

- [ ] **AUTH-01**: Owner authentication with TOTP-based 2FA (Authenticator app via otplib)
- [ ] **AUTH-02**: Session management with secure refresh tokens
- [ ] **AUTH-03**: Rate limiting on TOTP verification endpoints
- [ ] **AUTH-04**: Multi-tenant isolation middleware (tenant_id from hostname, validated in every request)

### DNS & Domains

- [ ] **DNS-01**: Custom domain support — business points DNS to platform CNAME
- [ ] **DNS-02**: Automated SSL certificate provisioning (Let's Encrypt or Cloudflare Origin SSL)
- [ ] **DNS-03**: Tenant resolution from hostname in middleware

### Pipeline & Infrastructure

- [x] **PIPELINE-01**: Scraping → AI selection → Hugo build pipeline orchestration (BullMQ)
- [x] **PIPELINE-02**: Landing page live within 10 minutes of starting scrape
- [x] **PIPELINE-03**: Job queue with retry logic and failure recovery
- [x] **INFRA-01**: PostgreSQL database with tenant-isolated schema
- [x] **INFRA-02**: S3 bucket with per-tenant key prefix isolation

### Monitoring & Analytics

- [ ] **MONITOR-01**: Dashboard showing landing page views, CTR, time-on-site per preview link
- [ ] **MONITOR-02**: Conversion tracking (preview → paid subscription)
- [x] **MONITOR-03**: Scraping pipeline success/failure monitoring

## v2 Requirements

### Enhanced Scraping
- **SCRAPE-09**: Residential proxy rotation for anti-bot evasion
- **SCRAPE-10**: CAPTCHA solving integration for Google Maps

### Payments
- **PAY-01**: Stripe integration for $50/mo subscription billing
- **PAY-02**: Usage-based billing for overages (scraping quota)

### Outreach Integration
- **OUTREACH-01**: Agentic sales rep integration (API for preview link delivery)
- **OUTREACH-02**: SMS outreach via Twilio
- **OUTREACH-03**: Email outreach with open/click tracking

### Advanced Features
- **PROD-05**: Blog/announcements section
- **PROD-06**: Photo gallery management
- **PROD-07**: Contact form with email notification
- **PROD-08**: Google Maps embed integration

## Out of Scope

| Feature | Reason |
|---------|--------|
| Native iOS/Android app | Responsive web sufficient for v1 |
| Multi-location support | One site per business in v1 |
| Appointment booking | Not core to the "auto-generated site" value |
| Blog/CMS beyond basic edits | Keep v1 focused on the editor |
| White-label/reseller | Platform-branded only for v1 |
| Payment processing beyond Stripe | Manual invoicing acceptable for v1 launch |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCRAPE-01 | Phase 1 | Complete |
| SCRAPE-02 | Phase 1 | Complete |
| SCRAPE-03 | Phase 1 | Complete |
| SCRAPE-04 | Phase 1 | Complete |
| SCRAPE-05 | Phase 1 | Complete |
| SCRAPE-06 | Phase 1 | Complete |
| SCRAPE-07 | Phase 1 | Complete |
| SCRAPE-08 | Phase 1 | Complete |
| CONTENT-01 | Phase 2 | Complete |
| CONTENT-02 | Phase 2 | Complete |
| CONTENT-03 | Phase 2 | Complete |
| CONTENT-04 | Phase 2 | Complete |
| PREVIEW-01 | Phase 3 | Pending |
| PREVIEW-02 | Phase 3 | Complete |
| PREVIEW-03 | Phase 3 | Complete |
| PREVIEW-04 | Phase 3 | Pending |
| PREVIEW-05 | Phase 3 | Pending |
| PROD-01 | Phase 4 | Pending |
| PROD-02 | Phase 4 | Pending |
| PROD-03 | Phase 4 | Pending |
| PROD-04 | Phase 4 | Pending |
| AUTH-01 | Phase 5 | Pending |
| AUTH-02 | Phase 5 | Pending |
| AUTH-03 | Phase 5 | Pending |
| AUTH-04 | Phase 5 | Pending |
| DNS-01 | Phase 6 | Pending |
| DNS-02 | Phase 6 | Pending |
| DNS-03 | Phase 6 | Pending |
| PIPELINE-01 | Phase 1 | Complete |
| PIPELINE-02 | Phase 2 | Complete |
| PIPELINE-03 | Phase 1 | Complete |
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 3 | Complete |
| MONITOR-01 | Phase 3 | Pending |
| MONITOR-02 | Phase 3 | Pending |
| MONITOR-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after roadmap creation*
