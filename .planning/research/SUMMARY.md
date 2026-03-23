# Project Research Summary

**Project:** SiteForge AI Website Generation System
**Domain:** AI-Powered Local Business Website Platform
**Researched:** 2026-03-23
**Confidence:** MEDIUM

## Executive Summary

SiteForge is an AI-powered platform that scrapes local business data from Google Maps, Instagram, Facebook, Yelp, and Google Reviews, then automatically generates preview landing pages for cold outreach by sales agents. The core value proposition is "auto-generation from scraped social proof" -- businesses see their own high-performing content selling for them within 10 minutes of the scrape starting. The two-tier architecture separates cheap preview sites (S3 + Cloudflare, ~$0 cost) from production sites (Next.js + Payload CMS, $50/mo tier), enabling high-volume preview generation without infrastructure cost explosions.

Experts build this using Next.js 16 for the production app, Payload CMS 3.x for headless CMS and auth, Playwright with stealth mode for headless scraping, Hugo for static preview generation, and BullMQ for job queuing. The scraping pipeline is the foundational dependency -- without reliable data extraction, nothing else matters. Anti-bot detection on Google Maps and Instagram is the highest-risk technical challenge; residential proxy rotation and stealth plugins are required, not optional.

Key risks include: scraping being blocked before data is extracted (IP bans, CAPTCHAs), AI content selection choosing embarrassing or off-brand posts, multi-tenant isolation failures causing data bleed between business sites, and sales agents using preview URLs as permanent production sites (breaking the business model). The roadmap must prioritize scraping reliability first, then build outward to generation, preview delivery, and finally production features.

## Key Findings

### Recommended Stack

The research recommends Next.js 16.2.1 as the production app framework (App Router, Server Components, built-in image optimization essential for multi-tenant SaaS), Payload CMS 3.80.0 as the headless CMS with built-in auth (TypeScript-native, works natively in Next.js), Astro 6.0.8 for preview site generation (sub-second builds, zero JS by default, island architecture), and Playwright 1.58.2 for headless scraping (native CDP, built-in stealth mode, parallel execution -- better than Puppeteer for Google Maps/Instagram).

**Core technologies:**
- **Next.js 16.2.1** -- Production app framework with App Router and Server Components
- **Payload CMS 3.80.0** -- Headless CMS + Auth, all-in-one, TypeScript-native
- **Astro 6.0.8** -- Preview site generation with sub-second builds (Hugo recommended if volume exceeds 1000 sites/week)
- **Playwright 1.58.2** -- Headless scraping with stealth mode for anti-bot sites
- **LangChain 1.2.36 + OpenAI 6.32.0** -- AI content selection and copy generation with structured output
- **BullMQ 5.71.0** -- Redis-backed job queue for parallel scraping pipeline
- **PostgreSQL 16+** -- Primary database with JSONB for flexible schema
- **Redis + BullMQ** -- Caching, rate limiting, and job queue persistence
- **AWS S3 + Cloudflare R2** -- Static asset storage and CDN (R2 has free tier: 10M req/month, 1TB storage)
- **otplib 13.4.0** -- TOTP 2FA implementation (RFC 6238 compliant)
- **Tiptap 3.20.4** -- WYSIWYG editor for production site editing
- **Tailwind CSS 4.2.2** -- CSS-first styling with built-in dark mode

### Expected Features

**Must have (table stakes):**
- Business info auto-fill from scrape data -- users expect the platform to already know their details
- Photo gallery display from scraped Instagram/Facebook photos -- visual content is expected
- Contact information display (phone, email, address, hours) -- standard sections from Google Maps
- Mobile-responsive design -- 60%+ of local business searches are mobile
- Basic WYSIWYG text editing -- users need to fix typos and update content
- SSL/HTTPS -- Chrome flags non-HTTPS as "not secure"
- Preview before publishing -- every modern CMS shows draft state
- Click-to-call/email links -- users expect direct contact
- Google Maps embed -- location display is expected for local businesses
- Star rating display -- review aggregate provides social proof

**Should have (competitive differentiators):**
- Auto-generation from social proof -- "the site sells itself using what's already working" is the core value prop
- AI content selection -- don't make the user choose; show the best content automatically based on engagement scoring
- Social proof prioritization -- feature highest-liked posts, best reviews, top photos
- Preview landing page system -- high-volume cheap landing pages for cold outreach enables the sales model
- Cold outreach integration -- agent sends preview link; business sees their own content selling for them
- Two-tier architecture -- preview (S3+Cloudflare, ~$0) vs production (Next.js+CDN, $20/mo) enables 100s/week at low cost
- Headless Playwright scraping -- full 160-result pages with reviews in single pass
- 10-minute landing page delivery -- speed to value within PIPELINE-03 SLA

**Defer (v2+):**
- Real-time collaborative editing -- adds CRDT complexity; single-owner editing is fine for local businesses
- Full blog/CMS system -- scope creep; simple text edits only
- Appointment booking -- requires calendar integration, double-booking prevention, payment
- Native iOS/Android app -- responsive PWAs are sufficient for v1
- Multi-location support -- data model complexity; single-location per site in v1
- White-label/reseller -- identity management, billing complications
- Payment processing -- manual invoicing fine for early validation

### Architecture Approach

The architecture uses a two-tier system separating preview landing pages (static Hugo sites on S3 + Cloudflare CDN, ~$0 cost, high volume) from production sites (Next.js + Payload CMS with real-time WYSIWYG editing, $20/mo infrastructure). This is the core architectural decision enabling the business model. The scraping pipeline uses parallel Playwright workers (one per platform: Google Maps, Instagram, Facebook, Yelp, Google Reviews) orchestrated by BullMQ, with results aggregated and passed to the AI content selector (GPT-4o) before Hugo generates static HTML. Production sites use Next.js middleware for tenant isolation from subdomains, with Payload CMS as the headless backend and Tiptap for WYSIWYG editing.

**Major components:**
1. **Playwright Scraper Workers** -- Headless browser control, parallel execution per platform, extracts business data and social proof
2. **AI Content Selector** -- Analyzes scraped content, selects best images/posts based on engagement + quality scoring
3. **Hugo Static Generator** -- Produces static HTML for previews from AI-generated content + templates
4. **Payload CMS + Next.js** -- Headless CMS for production sites, handles auth/users/media, WYSIWYG editing
5. **BullMQ Job Queue** -- Orchestrates scraping, generation, deployment; Redis-backed with retries and priorities
6. **Cloudflare CDN + S3/R2** -- Edge caching for preview and production sites; preview is read-only static

### Critical Pitfalls

1. **Headless Browser Detection** -- Google Maps, Instagram, Facebook all block headless browsers. Mitigation: Playwright stealth plugin, residential proxy rotation (never datacenter IPs for Google Maps), human-like timing, or use SerpAPI for Google Maps to avoid the arms race entirely. This must be solved in Phase 1 -- the entire pipeline is useless without data.

2. **Hugo Build Bottlenecks at 100+ Sites/Week** -- Hugo builds start at 500ms but creep to 3-5s as volume grows. Mitigation: Use `--cacheDir` for shared cache, pre-bundle themes, consider pure string substitution HTML generator instead of Hugo for simple landing pages. Establish baseline build SLAs in Phase 1.

3. **AI Content Selection Choosing Off-Brand Posts** -- Engagement scoring doesn't account for brand appropriateness. A dental office featuring a birthday party photo embarrasses the business. Mitigation: Build quality classifier before engagement scoring (reject posts without business tag, excessive hashtags, user-tagged photos, posts >12 months old), add preview step before auto-publishing.

4. **Multi-Tenant Isolation Failures** -- Shared CDN cache or database without RLS allows cross-tenant data access. Mitigation: Per-business S3 bucket policies, Next.js middleware validating tenant ID from JWT matches requested resource, strict cache keys including tenant ID. Isolation must be architected in, not retrofitted.

5. **Preview URL System Becoming Production** -- Sales agents share preview URLs (designed for temporary cold outreach) as permanent links because production onboarding takes days. Mitigation: Preview URLs expire after 30 days, watermark as "temporary," make production onboarding faster (<10 min target), track preview traffic spikes as indicator of workarounds.

## Implications for Roadmap

Based on research, the following phase structure is recommended:

### Phase 1: Scraping Infrastructure
**Rationale:** All downstream features depend on scraped data. The pipeline is worthless if scraping is blocked or returns empty data. This phase must solve anti-bot detection before any generation can happen.

**Delivers:** Playwright scraper framework, Google Maps scraper (with SerpAPI or residential proxy strategy), Google Reviews scraper, parallel orchestrator, data validation gates (minimum data thresholds before proceeding).

**Addresses:** SCRAPE-01 (Google Maps), SCRAPE-03 (Google Reviews) -- both P1 features.

**Avoids:** Headless browser detection (Pitfall 1), scraping returning stale/empty data (Pitfall 8), preview URL as production (Pitfall 10).

### Phase 2: AI Generation Pipeline
**Rationale:** After scraping is reliable, build AI content selection and copy generation. Must include content quality filtering, not just engagement scoring.

**Delivers:** AI content selector with quality classifier, copy generator with brand-appropriate prompts, Hugo template development, Hugo build automation, S3 upload, Cloudflare cache invalidation.

**Addresses:** CONTENT-01 (AI selects content), CONTENT-02 (AI generates copy), LANDING-01 (landing page generation).

**Avoids:** AI choosing off-brand content (Pitfall 3), AI data leakage to LLM provider (Pitfall 9).

### Phase 3: Preview Delivery System
**Rationale:** Preview URLs are the sales team's cold outreach tool. Must be fast, reliable, and clearly temporary.

**Delivers:** Preview URL generation, email/SMS delivery integration, agent dashboard for preview link management, conversion tracking, preview traffic monitoring.

**Addresses:** LANDING-03 (unique preview URL), LANDING-04 (send preview to owner), MONITOR-01 (track views).

**Avoids:** Preview URL as production (Pitfall 10) -- enforce expiration and make production conversion attractive.

### Phase 4: Production Infrastructure
**Rationale:** Production site infrastructure (Next.js + Payload) can be developed in parallel with preview pipeline but deployed after validation. Shared auth components useful for both systems.

**Delivers:** Payload CMS setup, Next.js app scaffold, tenant isolation middleware, TOTP 2FA implementation, session management, production site deployment pipeline.

**Addresses:** AUTH-01 (2FA), PROD-03 (owner account), PROD-04 (per-business CDN).

**Avoids:** Multi-tenant isolation failures (Pitfall 4), TOTP bypass vectors (Pitfall 4).

### Phase 5: WYSIWYG Editor Integration
**Rationale:** Editor requires CMS and auth infrastructure ready. Must test round-trip with static generation output.

**Delivers:** Tiptap editor setup, editor components (text, image, section reordering), mobile-responsive editing, save/revert functionality, pre-save HTML validation (DOMPurify + Goldmark-compatible output).

**Addresses:** PROD-01 (WYSIWYG editor), PROD-02 (mobile editing).

**Avoids:** WYSIWYG producing invalid HTML that breaks when saved (Pitfall 7).

### Phase 6: Custom Domain and SSL
**Rationale:** Custom domains require stable production site structure first. DNS/SSL provisioning has many failure modes that need real-world testing.

**Delivers:** DNS provisioning service, Let's Encrypt integration (ALPN challenge, not HTTP01), SSL certificate management, custom domain routing, Cloudflare for SaaS for simplified SSL.

**Addresses:** DNS-01 (custom domain), DNS-02 (SSL cert).

**Avoids:** DNS/SSL blocking on port 80 (Pitfall 6).

### Phase 7: Enhanced Scraping and Social Sources
**Rationale:** After core pipeline works, add Instagram, Facebook, Yelp scrapers for full social proof. These are P2 features.

**Delivers:** Instagram scraper (requires session-based access tokens), Facebook scraper, Yelp scraper, enhanced AI content selection using all platforms.

**Addresses:** SCRAPE-02 (Instagram), SCRAPE-04 (Facebook), SCRAPE-05 (Yelp).

### Phase Ordering Rationale

- Scraping must be first because everything depends on data
- AI generation requires real scraped data to develop prompts; can mock if scraping delayed
- Preview delivery can start after Phase 2 (needs AI content to generate sites)
- Production infrastructure is parallel to preview but launch after validation
- Editor requires production infra ready
- Custom domains need stable production structure
- Enhanced scraping sources come last as P2 enhancements

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Scraping):** Anti-bot detection is rapidly evolving; may need fresh research on current Google Maps/Instagram countermeasures before implementation
- **Phase 4 (Production Auth):** TOTP security audit needed before launch; 2FA bypass is critical
- **Phase 6 (DNS/SSL):** Real-world testing with actual domain registrars required; documentation gaps on Cloudflare for SaaS

Phases with standard patterns (skip research-phase):
- **Phase 2 (AI Generation):** LangChain + OpenAI structured output is well-documented
- **Phase 5 (WYSIWYG):** Tiptap has solid documentation and established patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | npm registry versions verified (2026-03-23); some libraries (Payload CMS, Tiptap) based on training data; alternatives considered |
| Features | MEDIUM | Training data only for competitor analysis; web search unavailable during research; competitor feature gaps may be stale |
| Architecture | MEDIUM-HIGH | Next.js docs verified via WebFetch; Hugo, Payload, Playwright based on training data; multi-tenant patterns are industry standard |
| Pitfalls | LOW | All findings based on training data; no Context7 verification or web search available; all require validation before use |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Competitor feature analysis:** Training data only (6-18 months stale); Wix/Squarespace/GoDaddy/Durable may have updated features. Direct competitor research needed before finalizing differentiators.
- **Anti-bot detection current state:** Headless browser detection patterns change rapidly; SerpAPI vs raw scraping decision may need fresh research
- **Payload CMS v3.80.0 details:** Based on training data; documentation may have gaps; beta features should be verified
- **Pricing for Cloudflare for SaaS:** Not researched; may affect custom domain strategy
- **Instagram/Facebook API changes:** Graph API deprecation cadence means Facebook scraper approach may need validation

## Sources

### Primary (HIGH confidence)
- Next.js Documentation (WebFetch verified) -- App Router, multi-tenant applications, static site generation
- npm registry -- version checks (2026-03-23)
- Playwright documentation -- 1.58.2 release notes, stealth mode

### Secondary (MEDIUM confidence)
- Payload CMS documentation -- training data; Next.js integration, auth
- Astro documentation -- 6.0.8, static generation
- LangChain documentation -- 1.2.36, OpenAI integration
- Hugo documentation -- static site generator performance characteristics
- otplib GitHub -- RFC 6238 TOTP implementation
- Architecture patterns for multi-tenant SaaS (Stripe guides) -- training data

### Tertiary (LOW confidence)
- Competitor feature analysis (Wix, Squarespace, GoDaddy, Durable) -- training data only, 6-18 months stale
- Anti-bot detection patterns -- general web scraping community knowledge, unverified for 2026
- TOTP security best practices -- OWASP cheatsheet, not verified against current attack vectors
- All pitfalls research -- training data, requires validation

---
*Research completed: 2026-03-23*
*Ready for roadmap: yes*
