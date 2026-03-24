# Phase 02: AI Content Pipeline - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

AI selects highest-quality content and generates site copy from scraped data. Pipeline takes scraped data (Google Maps, Instagram, Facebook, Yelp, Google Reviews) and produces: (1) ranked content selection, (2) AI-generated copy, (3) template-ready data for Astro-based landing pages. This phase feeds into Phase 3 (Preview Landing Pages).
</domain>

<decisions>
## Implementation Decisions

### Content Selection

- **Engagement scoring**: Percentile rank within business's own content pool. Top 20% by engagement wins. Fair to both small and large businesses.
- **Quality filtering (aggressive)**: Reject party photos, excessive hashtags (#sale #coupon), posts >12 months old, low-res images, screenshots, videos-only posts.
- **Selection method**: Dynamic quality tier — include content only if engagement score passes threshold. If below threshold, exclude entirely.
- **Empty/bare fallback**: If business has no quality social content, Google Reviews are used as fallback for social proof section.

### Content Generation

- **Copy elements**: Hybrid approach — headline + tagline are template-driven (business name + category), about section is AI-generated prose.
- **Testimonial selection**: AI reads all Google Reviews and picks most authentic/descriptive ones (not generic "Great service!").
- **Generation method**: Business category templates — pre-written templates per category (restaurant, salon, general) that AI fills in with specifics.
- **Tone**: Confident but warm — professional but approachable, highlights quality without being salesy, sounds like a trusted neighbor recommending.

### Template System

- **Static site generator**: Astro for preview landing pages (fast builds, component model, S3-friendly output).
- **Data flow**: JSON at build time — scraped + AI data compiled to JSON, Astro reads at build time. Clean separation, cacheable.
- **Template variants**: Category-based — separate templates for Restaurant, Salon, General business types. Better fit per business type but more templates to maintain.

### Speed vs Quality

- **SLA handling**: Synchronous required — page waits for AI generation. If AI is slow (e.g., 15 min), SLA not met but quality is guaranteed.
- **AI provider**: MiniMax M2.7 with Anthropic endpoint — combined with company-specific skills and data.
- **Parallelization**: Parallel where possible — image selection + copy generation run in parallel for speed, even though costlier.
- **Failure handling**: Manual fallback — alert human operator, queue for manual generation. Page not published until content ready. Quality over speed for failures.

### Claude's Discretion

- Exact engagement threshold percentage for quality tier
- Specific category template designs (restaurant, salon, general)
- Retry timing and frequency if AI call fails transiently
- Image resolution minimum threshold for "low-res" rejection
- Hashtag count threshold for "excessive" rejection
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-specific
- `.planning/phases/01-scraping-infrastructure/01-VERIFICATION.md` — Source data formats from scraping phase (schemas, data shapes)
- `.planning/phases/01-scraping-infrastructure/01-04-PLAN.md` — Integration checkpoint showing how Phase 1 ends and Phase 2 begins

### Project-level
- `.planning/PROJECT.md` — Core value: "Every local business deserves a website that sells itself using what's already working — their own social posts and reviews"
- `.planning/REQUIREMENTS.md` — CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04 requirements

### Architecture decisions (from prior phases)
- `.planning/PROJECT.md` §Key Decisions — Two-tier architecture (preview vs production), Hugo for preview (though STATE notes Astro), Next.js + Payload for production
- `.planning/STATE.md` §Accumulated Context — Note that Astro was recommended for preview landing pages

[No external specs — requirements fully captured in decisions above]
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/scraping/validation/schemas.ts` — Zod schemas define data shapes that flow into AI pipeline
- `src/jobs/producers.ts` — startBusinessScrape() flow that will trigger AI pipeline after scrape completion
- `src/scraping/scrapers/instagram.ts` — engagement calculation (likes + comments + shares) already implemented

### Established Patterns
- BullMQ job queue handles async flows (from Phase 01)
- SSE streaming for status updates (from Phase 01)
- PostgreSQL + RLS for tenant isolation (from Phase 01)

### Integration Points
- AI pipeline triggered after scrape completion via BullMQ flow
- AI output (JSON) stored in PostgreSQL, read by Astro at build time
- Template system in `src/ai/` or similar new module
- Scraped data from `src/scraping/scrapers/` feeds into AI content selection
</code_context>

<specifics>
## Specific Ideas

- "MiniMax M2.7 with Anthropic endpoint" — use company's data and skills combined with AI generation
- Category-based templates allow per-business-type customization while maintaining manageability
- Google Reviews as fallback when social content is thin — always show compelling proof

</specifics>

<deferred>
## Deferred Ideas

- AI personalized outreach copy (per business owner name) — Phase 4+ territory
- A/B testing different template variants — Phase 3+ optimization
- Multi-language support for international businesses — out of scope for v1

</deferred>

---
*Phase: 02-ai-content-pipeline*
*Context gathered: 2026-03-23*
