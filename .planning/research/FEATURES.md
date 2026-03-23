# Feature Research

**Domain:** AI-Powered Local Business Website Platform
**Researched:** 2026-03-23
**Confidence:** MEDIUM

**Research Limitation:** Web search tools unavailable during research session. Findings based on training data (6-18 months stale) and project requirements. Competitor feature analysis would benefit from direct research later.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Business info auto-fill** | Users expect the platform to already know their name, address, phone from the scrape | LOW | LANDING-01 handles this via scraped data |
| **Photo gallery display** | Every local business site needs photos; users expect their own imagery | LOW | Display scraped Instagram/Facebook photos |
| **Contact information display** | Phone, email, address, hours are expected | LOW | Standard sections from Google Maps scrape |
| **Mobile-responsive design** | 60%+ of local business searches are mobile | LOW | CSS responsive is baseline, not a differentiator |
| **Basic WYSIWYG text editing** | Users need to fix typos, change hours, update prices | MEDIUM | Tiptap provides this - required for PROD-01 |
| **SSL/HTTPS** | Chrome flags non-HTTPS sites as "not secure" | LOW | DNS-02 automated SSL via Let's Encrypt or Cloudflare |
| **Preview before publishing** | Every modern CMS shows draft state | LOW | LANDING-03 unique preview URLs already specified |
| **Email/phone click-to-call links** | Users expect to tap and call directly from site | LOW | Standard HTML tel: and mailto: links |
| **Google Maps embed** | Local businesses expect to show their location | LOW | Iframe embed from coordinates in scrape data |
| **Star rating display** | Review aggregate score is expected social proof | LOW | Display average from Google Reviews scrape |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable for $50/mo pricing.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Auto-generation from social proof** | "The site sells itself using what's already working" - Core value prop | HIGH | CONTENT-01/02 + LANDING-01 pipeline. Key differentiator. |
| **AI content selection** | Don't make the user choose; show the best content automatically | MEDIUM | Engagement scoring from IG, FB post metrics |
| **Social proof prioritization** | Feature highest-liked posts, best reviews, top photos | MEDIUM | Requires engagement data from each platform |
| **Preview landing page system** | High-volume cheap landing pages for cold outreach | MEDIUM | ARCHITECTURE: Two-tier system enables 100s/week at low cost |
| **Cold outreach integration** | Agent sends preview link; business sees own content selling for them | MEDIUM | LANDING-04: Email/SMS of preview link |
| **Two-tier architecture** | Preview (S3+Cloudflare) vs Production (Next.js+CDN) | MEDIUM | Already specified in PROJECT.md; key cost optimization |
| **Headless Playwright scraping** | Full 160-result pages with reviews in single pass | HIGH | SCRAPE-01 to SCRAPE-05: Most technically risky component |
| **Anti-bot countermeasures** | Without this, scraping fails and pipeline breaks | HIGH | Proxy rotation, browser fingerprinting, rate limiting |
| **10-minute landing page delivery** | Speed to value: business sees site within 10 min of scrape start | MEDIUM | PIPELINE-01/02/03: Requires parallel scraping + async AI |
| **Per-business CDN isolation** | Production sites served from isolated CDN, not shared | MEDIUM | PROD-04: Security/performance requirement |
| **2FA authentication** | $50/mo security expectation | LOW | TOTP via Authenticator app (AUTH-01, PROD-03) |
| **Dashboard analytics** | Preview link tracking shows which businesses are engaging | MEDIUM | MONITOR-01/02: Views, CTR, time-on-site, conversions |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-time collaborative editing** | "Multiple people should edit simultaneously" | Adds massive complexity (OT/CRDT), conflicts with simple editing use case | Single-owner editing is fine for local businesses |
| **Full blog/CMS system** | "We should be able to post updates" | v1 scope creep; adds editorial workflow, drafts, categories | Simple text edits only; blog deferred to v2 |
| **Appointment booking** | "Customers should book online" | Requires calendar integration, notifications, payment (deferred), double-booking prevention | Defer to v2 when payment processing exists |
| **Native iOS/Android app** | "Users want a mobile app" | Massive scope increase; React Native or Flutter required | Responsive PWAs are sufficient for v1 |
| **Multi-location support** | "We have multiple stores" | Data model complexity, geographic routing, separate analytics per location | Single-location per site in v1 |
| **White-label/reseller** | "Agencies want to brand it" | Identity management, subdomain handling, billing complications | Platform-hosted sites only in v1 |
| **Payment processing v1** | "Stripe should handle billing" | Scope creep; manual invoicing is fine for early validation | Defer to v2 per PROJECT.md |
| **Automated posting back to social** | "Post my updates to Instagram/Facebook" | Auth complexity, API rate limits, platform ToS violations | No social posting - one-way read only |
| **Real-time notifications** | "Alert me when someone views my site" | Infrastructure cost, notification fatigue, privacy concerns | Simple dashboard analytics instead |
| **AI chatbot/lead capture** | "Site should chat with visitors" | Quality concerns, hallucination risk, requires human handoff | Simple contact form only in v1 |

## Feature Dependencies

```
SCRAPE-01 (Google Maps)
    └──required by──> LANDING-01 (Generate landing page)
                           └──required by──> LANDING-03 (Preview URL)
                                                   └──required by──> LANDING-04 (Send to owner)
                                                           └──enables──> MONITOR-01 (Track views)

SCRAPE-02 (Instagram)
    └──required by──> CONTENT-01 (Select highest-engagement)
                           └──required by──> LANDING-01 (Generate site)

SCRAPE-03 (Google Reviews)
    └──required by──> CONTENT-01 (Social proof selection)
                           └──required by──> LANDING-01

SCRAPE-04 (Facebook) ──required by──> CONTENT-01
SCRAPE-05 (Yelp) ──────required by──> CONTENT-01

CONTENT-01 (AI selects content) ──required by──> CONTENT-02 (AI generates copy)

PIPELINE-01 (Parallel scraping) ──required by──> PIPELINE-03 (10-min delivery)

PROD-01 (WYSIWYG editor) ──requires──> AUTH-01 (2FA auth)
                                        └──required by──> PROD-03 (Owner account)

PROD-04 (Per-business CDN) ──requires──> DNS-01 (Custom domain)
                                           └──requires──> DNS-02 (SSL cert)
```

### Dependency Notes

- **Scraping is foundational:** All LANDING features depend on SCRAPE-01 through SCRAPE-05 completing. Without scraped data, there's no auto-generation.
- **CONTENT-01 requires all scrapers:** Social proof selection needs engagement metrics from every platform.
- **Production requires auth first:** PROD-01 (WYSIWYG) cannot launch without AUTH-01 (2FA) being ready.
- **DNS enables production sites:** PROD-04 (per-business CDN) depends on DNS-01/02 because custom domains require SSL.
- **Monitoring depends on preview system:** MONITOR-01/02 only makes sense after LANDING-03 (preview URLs) exist.

## MVP Definition

### Launch With (v1)

Minimum viable product - what's needed to validate the concept.

- [x] **SCRAPE-01** (Google Maps) - Foundational; without this, no business data
- [x] **SCRAPE-03** (Google Reviews) - Core social proof source
- [x] **LANDING-01** - Static landing page generation from scraped data
- [x] **LANDING-03** - Unique preview URL per landing page
- [x] **LANDING-04** - Email preview link to business owner (manual or automated)
- [x] **CONTENT-02** - AI copy generation from business info
- [ ] **CONTENT-01** - AI selecting highest-engagement content (can defer to v1.1 if AI generation already works)
- [ ] **SCRAPE-02** (Instagram) - Valuable but can use placeholder images initially
- [ ] **SCRAPE-04/05** (Facebook/Yelp) - Lower priority if Google data is sufficient

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **SCRAPE-02** (Instagram) - Adds visual appeal with high-engagement images
- [ ] **SCRAPE-04** (Facebook) - Additional social proof source
- [ ] **SCRAPE-05** (Yelp) - Yelp reviews often have detailed testimonials
- [ ] **CONTENT-01** - AI content selection (replaces random/chronological selection)
- [ ] **MONITOR-01** - Dashboard showing preview link analytics
- [ ] **Anti-bot countermeasures** - Add proxy rotation if scraping starts failing

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **PROD-01** - Full WYSIWYG editor (requires Next.js + Payload CMS)
- [ ] **PROD-02** - Mobile editing from phone
- [ ] **PROD-03** - 2FA for owner accounts
- [ ] **PROD-04** - Per-business CDN isolation
- [ ] **AUTH-01/02** - Full authentication system
- [ ] **DNS-01/02** - Custom domain + SSL for production sites
- [ ] **MONITOR-02** - Conversion tracking (preview -> paid)
- [ ] **Payment processing** - Stripe integration
- [ ] **Multi-location support** - For businesses with multiple branches
- [ ] **Blog/CMS features** - Article posting

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Google Maps scraping | HIGH | MEDIUM | P1 |
| Google Reviews scraping | HIGH | MEDIUM | P1 |
| Landing page generation | HIGH | MEDIUM | P1 |
| Preview URL system | HIGH | LOW | P1 |
| Email/SMS preview link | HIGH | LOW | P1 |
| AI copy generation | HIGH | HIGH | P1 |
| Instagram scraping | MEDIUM | HIGH | P2 |
| Facebook scraping | MEDIUM | HIGH | P2 |
| Yelp scraping | MEDIUM | HIGH | P2 |
| AI content selection | MEDIUM | MEDIUM | P2 |
| Anti-bot countermeasures | HIGH | HIGH | P2 |
| 10-min delivery pipeline | MEDIUM | MEDIUM | P2 |
| Preview analytics dashboard | MEDIUM | MEDIUM | P2 |
| WYSIWYG editor (production) | HIGH | HIGH | P3 |
| 2FA authentication | HIGH | MEDIUM | P3 |
| Custom domain support | MEDIUM | MEDIUM | P3 |
| Per-business CDN | MEDIUM | HIGH | P3 |
| Mobile editing | MEDIUM | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch (core value prop)
- P2: Should have, add when possible (enhances conversion)
- P3: Nice to have, future consideration (production features)

## Competitor Feature Analysis

| Feature | Wix | Squarespace | GoDaddy | Durable | Our Approach |
|---------|-----|-------------|---------|---------|--------------|
| **AI auto-generation from data** | Partial (Wix ADI asks questions) | Partial | Basic | YES (key feature) | Full automation from scrape pipeline |
| **Social media import** | Limited (requires manual) | Limited | None | None | Automatic scraping of IG, FB, Yelp, Google |
| **Social proof selection** | Manual | Manual | None | None | AI selects highest-engagement content |
| **Preview landing page** | No (direct publishing) | No | No | No | **Differentiator**: Preview URLs for cold outreach |
| **Cold outreach integration** | No | No | No | No | **Differentiator**: Agent sends preview link |
| **Headless scraping** | No | No | No | No | Playwright-based, handles 160 results/page |
| **Anti-bot countermeasures** | N/A | N/A | N/A | N/A | Proxy rotation + fingerprint management |
| **Two-tier architecture** | No | No | No | No | **Differentiator**: Cheap preview vs production |
| **10-min delivery** | No | No | No | No | **Differentiator**: Pipeline target |
| **Mobile WYSIWYG** | Yes | Yes | Basic | Basic | Tiptap-based, mobile-optimized |
| **2FA security** | Yes | Yes | No | No | Required for $50/mo tier |

**Competitive positioning:**
- Wix/Squarespace/GoDaddy: User builds site manually, no AI automation
- Durable: AI generation exists but no social proof scraping pipeline
- Our differentiators: Auto-generation from scraped social data + cold outreach preview system + two-tier architecture

## Sources

- **Training data only** - Web search unavailable during research session
- **Project requirements:** PROJECT.md specifications for SCRAPE, LANDING, PROD, AUTH, DNS, PIPELINE, MONITOR requirements
- **Competitor analysis:** Based on training data (6-18 months stale) for Wix, Squarespace, GoDaddy, Durable

**Gap:** Direct competitor feature research needed when web tools available. Current analysis may miss recent product updates.

---
*Feature research for: SiteForge AI Website Engine*
*Researched: 2026-03-23*
