# Lead Gen Company for Small Designers & Creatives

**Date:** 2026-04-01
**Status:** Approved Design

## Summary

A lead generation company that finds companies actively signaling a need for designers/creatives — funding events, rebrands, product launches, job postings — and delivers tiered lead output (basic contacts → enriched intelligence) via API-first integration.

---

## 1. Concept & Vision

A composable, API-first lead intelligence pipeline that discovers businesses with active design/creative project signals and delivers scored, tiered leads to freelancers and small creative studios. The core value: **finding companies that are already in motion, not cold targets.**

The system acts like a continuously-running intelligence analyst — watching for signals, scoring companies, and surfacing the best 10-20 leads per search. Built on a hybrid crawl model (background scraping + live fallback) with weighted composite signal scoring.

---

## 2. What We Deliver (Tiered Output)

### Tier 1 — Basic Contact Records
- Company name, domain, industry, size, location
- Primary contact name/email/phone (when available)
- Source of contact data

### Tier 2 — Enriched Company Profile
- All Tier 1 fields
- Funding history and stage
- Recent hires (design/marketing roles)
- Tech stack indicators
- Social presence and audience size
- Project signals with evidence links

### Tier 3 — Full Project Intelligence
- All Tier 2 fields
- Specific project context (what they're building, launching, redesigning)
- Key stakeholders and decision-makers
- Urgency indicators
- Recommended outreach angle
- Competitive context (who else is targeting them)

---

## 3. Target Audience Input

Users specify targets via flexible filter combinations:

- **Industry/niche:** SaaS, e-commerce, fintech, healthcare, restaurants, real estate, agencies
- **Company attributes:** size (1-10, 11-50, 51-200), location/region, funding stage
- **Signal filters:** companies that recently raised funding, posted design jobs, launched on Product Hunt, completed a redesign, moved offices, posted on social media about a new brand
- **Intent signals:** composite score from weighted signal combination

---

## 4. Signal Types & Scoring

### Signal Sources (all weighted, composable)
- **Funding events** — seed, Series A/B/C raised; weighted by recency + amount
- **Job postings** — design, branding, marketing, UX roles posted
- **Product launches** — Product Hunt, App Store, new website launched
- **Visual redesign signals** — new brand visuals, social media rebrand, website overhaul
- **News/press** — recent press coverage, expansion announcements

### Composite Score
```
score = (w1 × funding_score) + (w2 × job_score) + (w3 × launch_score) + (w4 × redesign_score) + (w5 × press_score)
```
Weights are configurable per niche and tunable over time based on conversion feedback.

---

## 5. Architecture

```
Search Request (API)
       ↓
  API Gateway  ←→  Lead Cache (PostgreSQL + Redis)
       ↓                  ↑
  Worker Pool  (background scrapers — continuous)
       ↓
  Source Scrapers  (composable per signal type)
  - Job board scraper (Indeed, LinkedIn, Glassdoor)
  - Product launch scraper (Product Hunt, App Store)
  - Funding scraper (Crunchbase, PitchBook, news feeds)
  - Social scraper (Twitter/X, Instagram, LinkedIn)
  - Website scraper (company sites for visual signals)
       ↓
  Signal Extractor → Composite Score Calculator
       ↓
  Contact Resolver → Tiered Output Builder
       ↓
  Returns top 10-20 leads sorted by composite score
```

### Components

**API Gateway**
- REST/GraphQL endpoint receiving search requests
- Validates filters, queries cache, triggers live fallback
- Returns tiered JSON output
- Auth via API key

**Lead Cache (PostgreSQL + Redis)**
- PostgreSQL: company profiles, signal history, scoring data
- Redis: hot leads (fresh <24h), scored result sets, rate limit counters
- Freshness thresholds: hot leads <24h, warm <7d, cold >7d (refresh on demand)

**Worker Pool**
- Background job queue (BullMQ / Celery)
- Continuous scrapers run on schedules:
  - Job boards: every 1h
  - Product Hunt: every 2h
  - Funding feeds: every 6h
  - Social signals: every 30min
- Scrapers are composable — each is a pluggable module
- Dead-letter queue for failed scrapes with retry logic

**Signal Extractor**
- Parses raw scraped data into structured signal events
- Assigns per-signal scores
- Calculates composite weighted score
- Runs on each new scraper result

**Contact Resolver**
- Resolves company → individual contacts
- Tier 1: Name/email from Hunter.io, LinkedIn Sales Navigator, Apollo
- Tier 2/3: Additional enrichment from Clearbit, company websites
- Respects rate limits and fallback chains

---

## 6. Data Sources

**Primary: Web Scraping**
- Job boards (Indeed, LinkedIn Jobs, Glassdoor, remote.co)
- Product launch feeds (Product Hunt, BetaList, AppSumo)
- Funding news (Crunchbase, PitchBook, TechCrunch, news APIs)
- Social media (Twitter/X search, LinkedIn company pages)
- Company websites (homepage, blog, careers page for visual/staff signals)

**Secondary: APIs**
- Hunter.io — email finding
- Clearbit — company enrichment
- Apollo.io — contact + company data
- LinkedIn — (via scraping with stealth headers)
- Crunchbase / PitchBook — funding data

**AI Inference Layer**
- LLM reads scraped company content (website, job listings, social posts)
- Infers: design need severity, budget indicators, timeline, decision-maker identity
- Used for Tier 3 enrichment and signal interpretation

---

## 7. Hybrid Crawl Strategy

- **Hot leads (fresh <24h):** served directly from Redis cache, very fast
- **Warm leads (24h-7d):** served from PostgreSQL cache, refreshed async
- **Stale leads (>7d) or cold search:** live scrape triggered, added to cache
- **Continuous background crawl:** worker pool keeps top-signal sources hot at all times
- **User-supplied lists:** skip crawl, go straight to enrichment pipeline

---

## 8. API Design

### Core Endpoint

```
POST /api/v1/search
Authorization: Bearer <api_key>

{
  "filters": {
    "industry": ["saas", "e-commerce"],
    "size": ["11-50", "51-200"],
    "funding_stage": ["seed", "series-a"],
    "signals": ["funding", "job-posting", "product-launch"],
    "location": ["US", "UK"],
    "signal_weights": {
      "funding": 0.4,
      "job-posting": 0.3,
      "product-launch": 0.3
    }
  },
  "tier": 2,
  "limit": 15
}
```

### Response

```json
{
  "leads": [
    {
      "company": {
        "name": "Acme Corp",
        "domain": "acme.com",
        "industry": "saas",
        "size": "51-200",
        "location": "US"
      },
      "signals": [
        { "type": "funding", "detail": "Raised $12M Series A on 2026-03-15", "score": 0.85 }
      ],
      "contacts": [...],
      "composite_score": 0.78,
      "tier": 2
    }
  ],
  "meta": {
    "cached": true,
    "freshness": "hot",
    "count": 15,
    "scraped_at": "2026-04-01T10:00:00Z"
  }
}
```

### Other Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/search` | POST | Core search endpoint |
| `/api/v1/enrich` | POST | Enrich a user-supplied company list |
| `/api/v1/leads/:id` | GET | Get single lead detail |
| `/api/v1/sources` | GET | List available signal sources and their status |
| `/api/v1/scores/:company` | GET | Get raw signal scores for a company |

---

## 9. Scraping Infrastructure

### Stealth & Reliability
- Rotating user agents and IP proxies (Bright Data, ScraperAPI)
- Exponential backoff on 429/rate limit responses
- Distributed crawler with worker pool (not single-threaded)
- Session-aware context to avoid detection patterns

### Source-Specific Scrapers (pluggable)

Each scraper is an isolated module with:
- `scrape()` — fetch raw data
- `parse(raw)` — extract structured signal events
- `score(events)` — assign signal scores
- `contact()` — resolve contacts from company

**Scraper priority order:** cached > API > scrape

### Error Handling
- Per-source retry budgets (3 attempts, exponential backoff)
- Dead letter queue for permanently failed scrapes
- Source health monitoring dashboard
- Circuit breaker per source (pauses source after 50% failure rate)

---

## 10. Tech Stack

| Layer | Technology |
|---|---|
| API | FastAPI (Python) or Next.js API routes |
| Queue | BullMQ (Redis) or Celery (RabbitMQ) |
| Cache (hot) | Redis |
| Cache (persistent) | PostgreSQL |
| Scrapers | Playwright, Cheerio, Puppeteer |
| Contact APIs | Hunter.io, Apollo.io, Clearbit |
| Funding APIs | Crunchbase, PitchBook |
| AI Scoring | Claude API / GPT-4 via OpenRouter |
| Deployment | Docker, Railway / Render / Fly.io |

---

## 11. What's NOT in Scope (Phase 1)

- Outreach automation (email sending, LinkedIn DM)
- CRM integration
- Lead scoring feedback loop (converting → mark as won/lost)
- Billing / payments (flat subscription model assumed)
- Multi-tenant isolation (single API key per user initially)

---

## 12. Success Criteria

- Search returns 10-20 highly targeted leads within 5 seconds (cache hit)
- Live scrape fallback completes within 60 seconds
- Signal scoring accuracy: leads with high composite scores (0.7+) correlate with actual design needs (verified via user feedback)
- Scrapers maintain >90% uptime across all sources
- Contact resolution rate >60% at Tier 2, >40% at Tier 3
