# Phase 4: Production Site - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Business owners claim their preview site and get a real, editable production site with Tiptap WYSIWYG editing. Owner accesses via magic link, chooses a production template (with option to import preview content), and the dev team enables their account after reviewing feedback. Production sites use Next.js + Payload CMS, served from CDN with ISR + on-demand revalidation. This phase depends on Phase 3 (preview landing pages) and feeds into Phase 5 (authentication/security).

</domain>

<decisions>
## Implementation Decisions

### Claim Flow + Onboarding

- **Magic link email**: Owner enters email → receives magic link → clicks → immediately logged in, account created behind the scenes. No password to remember.
- **First view**: Read-only preview page, with two prominent CTAs: "Edit Page" and "Send Feedback"
- **Send Feedback**: Visual annotation tool — owner clicks directly on the preview page to annotate areas (like Figma comments), types feedback, submits to dev team queue. Precise, visual feedback.
- **Edit Page**: Owner chooses from a set of production-ready templates. Preview content can be imported as a starting point but owner picks the design.
- **Account enablement**: Dev team enables the account after reviewing feedback. Owner gets a "pending" state until dev team approves and activates their production site.
- **Account scope**: Gated startup — magic link creates pending account, full access after dev team review.

### Editor Architecture + Real-time Sync

- **Save model**: Manual save button. Owner clicks "Save" to commit changes. No auto-save.
- **Conflict handling**: Prompt to reload if a newer version exists. Owner sees: "This page was edited elsewhere. Reload to see changes?" Clear, no silent data loss.
- **Serving model**: ISR + on-demand revalidation. Pages cached at CDN edge, revalidated via webhook from Payload CMS when content is saved. Fast CDN delivery + fresh content.
- **Preview mode**: Preview on save — separate step after clicking Save. Not live preview while typing.

### Content Model + Data Storage

- **Storage architecture**: Same PostgreSQL database as scraped data, but separate Payload CMS tables. Same tenant isolation (`tenant_id` + RLS) applies to all tables.
- **Content import choice**: When owner clicks "Import from Preview", they see all options with caveats:
  - Selective import: owner picks which sections to bring over (most control)
  - Import all as draft: all preview content imports as Payload content, owner edits from there
  - Fresh template: production starts from template only, preview content is reference material
- **Feedback pipeline**: Visual annotations from preview page flow to an internal dev team dashboard. Dashboard shows annotations, screenshots, owner info. Dev marks resolved or contacts owner.
- **Media storage**: S3 + Cloudflare CDN for uploaded images. Same infrastructure as preview system. Consistent, cost-effective.

### Mobile Editing UX

- **Editor approach**: Simplified mobile editor — section-by-section editing, not full-page WYSIWYG. Fewer formatting options on mobile. Desktop editor has full capabilities.
- **Mobile navigation**: Vertical accordion list. Scrollable list of sections, tap to expand and edit one section at a time. Familiar, predictable.
- **Section reordering**: Drag handles with haptic feedback. Long-press to grab, drag to reorder. Standard drag-and-drop pattern.
- **Image replacement**: Tap image → prompt to take photo (camera) or choose from gallery. Most direct mobile experience.

### Claude's Discretion

- Exact Tiptap toolbar layout on desktop (which formatting options appear)
- How the template picker UI works (grid of previews? list with descriptions?)
- Payload CMS collection schema design (pages, media, settings collections)
- How the dev team dashboard displays feedback (list view, detail view, filtering)
- Exact accordion animation/interaction details on mobile
- S3 key structure for production site assets

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase-specific
- `.planning/phases/03-preview-landing-pages/03-CONTEXT.md` — Preview system (Astro, S3 + Cloudflare CDN, preview link flow)
- `.planning/phases/02-ai-content-pipeline/02-CONTEXT.md` — AI pipeline output (JSON data structure, content selection)
- `.planning/phases/01-scraping-infrastructure/01-CONTEXT.md` — Tenant isolation (tenant_id + RLS, PostgreSQL patterns)

### Project-level
- `.planning/PROJECT.md` — Core value, two-tier architecture, Next.js + Payload CMS for production, Tiptap editor
- `.planning/REQUIREMENTS.md` — PROD-01, PROD-02, PROD-03, PROD-04 requirements
- `.planning/ROADMAP.md` §Phase 4 — Phase 4 goal, success criteria, requirements

[No external specs — requirements fully captured in decisions above]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/preview/astro/` — Astro preview site structure (templates, data flow)
- `src/database/schema.ts` — PostgreSQL schema with tenant isolation (RLS patterns extend to Payload tables)
- `src/dashboard/` — Dashboard routes (can extend for dev team feedback dashboard)
- `src/preview/cdn/` — Existing CDN/serving infrastructure for preview

### Established Patterns
- Tenant isolation via `tenant_id` + RLS (Phase 1) — applies to all new tables
- S3 key prefix isolation: `{tenantId}/{businessId}/` pattern (Phase 3)
- BullMQ job queue for async flows (Phase 1)
- PostgreSQL + JSON for structured data

### Integration Points
- Preview content (Astro JSON) → Payload CMS import (new import module)
- Payload CMS → Next.js SSR → Cloudflare CDN (new production serving stack)
- Visual feedback annotations → dev team dashboard (extends existing dashboard)
- Magic link auth → Payload CMS user accounts (new auth integration)
- S3 + Cloudflare CDN (existing from Phase 3) — shared media storage

</code_context>

<specifics>
## Specific Ideas

- Visual annotation feedback like Figma comments — click to annotate, type feedback, submit
- Section-by-section mobile editing — tap to expand accordion, edit one section at a time
- Template picker with preview content as import option — owner sees caveats per choice
- Dev team feedback dashboard — annotations, screenshots, owner info in one place

</specifics>

<deferred>
## Deferred Ideas

- TOTP 2FA for owner accounts — Phase 5 (Authentication & Security)
- Custom domain + SSL — Phase 6 (DNS & Custom Domains)
- Stripe billing integration ($50/mo) — out of scope, manual invoicing for now
- Multi-location support — one site per business in v1
- Blog/announcements section — Phase 4+ optimization
- Google Maps embed on production site — Phase 4+ enhancement

</deferred>

---

*Phase: 04-production-site*
*Context gathered: 2026-03-24*
