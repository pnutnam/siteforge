# Phase 3: Preview Landing Pages - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Sales agents can generate and send preview links to business owners for cold outreach. Astro generates static landing pages from scraped + AI content. Pages deploy to S3 + Cloudflare CDN. Each preview has a unique URL (biz-{hash}.preview.siteforge.io). Dashboard shows analytics per link. Preview links expire after 30 days with visible urgency indicator. This phase consumes AI pipeline output (Phase 2) and feeds into Phase 4 (Production Site).

</domain>

<decisions>
## Implementation Decisions

### Landing Page Layout

- **Hero section**: Full-width hero image from the best social post, with business name overlaid as text. Visual impact first — shows "us in action"
- **Sections included** (all 4, below hero):
  1. Top Reviews — 3-5 most compelling Google/Yelp reviews with attribution
  2. About + Services — AI-generated about section + services offered
  3. Photo Gallery — Grid of top engagement photos from social posts
  4. Contact/CTA — Phone, address, hours, and "Claim this page" CTA
- **Category-specific section order**:
  - Restaurant: Menu/photos first, then reviews, about, contact
  - Salon: Services + gallery first, then reviews, about, contact
  - General: About first, then reviews, gallery, contact

### Preview Link Delivery

- **Delivery methods**: Both email and copy link — sales agent can use either
  - **Email**: Built-in composer in dashboard with AI-generated personalized copy. Agent can edit before sending.
  - **Copy link**: Dashboard shows the preview URL with a "Copy" button. Agent sends via their own channel (LinkedIn, SMS, external email)
- **Email template**: AI generates a short personalized email per business. Agent reviews, edits, sends.

### Analytics & Conversion

- **Tracked metrics per preview link**:
  - Page views + timestamps (sent, first viewed)
  - Time-on-site (average engagement)
  - CTA clicks ("Claim this page" button clicks)
- **Conversion event**: Form submission on preview page
- **Claim form fields**: Full contact + business info:
  - Name
  - Email
  - Phone
  - Current website (if any)
  - Description of needs / what they're looking for

### Claude's Discretion

- Link expiration urgency display (30-day expiration — how is urgency shown on the page? Banner, countdown?)
- Photo gallery grid layout (2-column, 3-column, masonry?)
- About section length and formatting (paragraph style, bullet points?)
- Review display format (card style, compact list?)
- Exact CDN/deployment pipeline (Astro build → S3 → Cloudflare cache invalidation flow)
- Email subject line generation (AI or template-based?)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-specific
- `.planning/phases/02-ai-content-pipeline/02-CONTEXT.md` — Phase 2 decisions (Astro SSG, JSON data flow, category templates, AI copy generation)
- `.planning/phases/02-ai-content-pipeline/02-RESEARCH.md` — Phase 2 research (Astro vs Hugo, static site patterns)
- `.planning/phases/02-ai-content-pipeline/02-04-SUMMARY.md` — Gap closure: generated_* tables for AI pipeline output

### Project-level
- `.planning/PROJECT.md` — Core value, two-tier architecture (preview vs production), S3 + Cloudflare CDN
- `.planning/REQUIREMENTS.md` — PREVIEW-01 through PREVIEW-05, MONITOR-01, MONITOR-02, INFRA-02

### Prior phase context
- `.planning/phases/01-scraping-infrastructure/01-CONTEXT.md` — PostgreSQL + RLS patterns (for INFRA-02 S3 key isolation)

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/ai/pipeline/` — AI pipeline output (JSON with generated copy, selected images, template data) — input to Astro build
- `src/database/schema.ts` — PostgreSQL schema with tenant isolation — S3 key prefix isolation follows same tenant_id pattern
- `src/jobs/producers.ts` — startBusinessScrape() flow — AI pipeline triggered after scrape completes

### Established Patterns
- BullMQ job queue for async flows (Phase 1)
- SSE streaming for status updates (Phase 1)
- PostgreSQL + RLS for tenant isolation (Phase 1)
- JSON data at build time for Astro (Phase 2)

### Integration Points
- AI pipeline output → Astro build trigger (new BullMQ job or filesystem watcher)
- Astro build output → S3 upload (new module)
- S3 + Cloudflare CDN → preview URL routing (Cloudflare Pages or Workers)
- Dashboard → analytics query (views, CTR, time-on-site from S3 access logs or Cloudflare Analytics)
- Claim form submission → CRM/outreach pipeline (Phase 4 territory)

</code_context>

<specifics>
## Specific Ideas

- Full-width hero image with business name overlaid — visual impact over text density
- AI-generated personalized email copy — saves agent time while feeling personal
- Full funnel analytics (views + CTR + time) — sales agents need to know if outreach is working
- Category-specific section order — Restaurant=photos, Salon=services, General=about

</specifics>

<deferred>
## Deferred Ideas

- SMS delivery option — Twilio integration for text message outreach (Phase 4+ territory)
- A/B testing different template variants — optimization for later
- Real-time chat on preview page — owner can ask questions before claiming (Phase 4+)
- Multi-language support — international businesses (Phase 4+)

</deferred>

---

*Phase: 03-preview-landing-pages*
*Context gathered: 2026-03-24*
