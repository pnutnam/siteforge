---
phase: 04-production-site
plan: 04
subsystem: cdn
tags: [payload-cms, isr, cloudflare, nextjs, revalidation, tiptap]

# Dependency graph
requires:
  - phase: 04-01
    provides: Production site foundation, payload.config.ts
  - phase: 04-02
    provides: Editor page with Tiptap integration
  - phase: 04-03
    provides: Feedback system and tenant isolation
provides:
  - Payload CMS collections with tenant isolation (hidden fields)
  - On-demand ISR revalidation via webhooks
  - Cloudflare CDN cache purging integration
  - Production page serving with Tiptap JSON rendering
  - Version conflict detection for concurrent edits
affects:
  - Phase 04 (full production site integration)
  - Phase 06 (custom domain routing)

# Tech tracking
tech-stack:
  added: [payload, next-revalidate, tiptap]
  patterns:
    - ISR (Incremental Static Regeneration) with 60s revalidation
    - On-demand revalidation via webhook triggers
    - Tiptap JSON to HTML conversion for SSR
    - Tenant isolation via hidden fields in Payload CMS

key-files:
  created:
    - src/production/collections/index.ts
    - src/production/cdn/revalidator.ts
    - src/production/app/api/revalidate/route.ts
    - src/production/routes/api/payload/revalidate/route.ts
    - src/production/app/[domain]/page.tsx
    - src/production/app/api/production/pages/[id]/route.ts
    - src/production/lib/payload-singleton.ts
  modified:
    - src/production/payload.config.ts

key-decisions:
  - "Updated payload.config.ts to import from collections/index.ts as per verification criteria"
  - "Used dynamic import for revalidator in afterChange hook to avoid circular dependencies"
  - "ISR revalidation set to 60 seconds as fallback when webhook fails"

patterns-established:
  - "ISR with on-demand revalidation: pages revalidate via webhook after Payload publish"
  - "Tiptap JSON to HTML: basic node conversion for SSR rendering"
  - "Version conflict detection: 409 response includes current server version"

requirements-completed: [PROD-01, PROD-03]

# Metrics
duration: 5min
completed: 2026-03-25
---

# Phase 04: Production Site Summary

**ISR + on-demand revalidation for Payload CMS with Cloudflare CDN purging, tenant isolation via hidden fields, and Tiptap JSON rendering**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-25T00:58:22Z
- **Completed:** 2026-03-25T01:03:45Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Payload CMS collections with tenant isolation (hidden tenantId, businessId fields)
- PagesCollection afterChange hook triggers revalidation on publish
- On-demand revalidation system with Cloudflare CDN support
- Production site page with ISR (60s fallback) and Tiptap JSON rendering
- Version conflict detection (HTTP 409) for concurrent edit handling

## Task Commits

All tasks committed atomically in a single commit:

1. **Task 1: Payload CMS Collections Configuration** - `920544b` (feat)
2. **Task 2: On-Demand Revalidation System** - `920544b` (feat)
3. **Task 3: Production Site Page Serving** - `920544b` (feat)

**Plan metadata:** `920544b` (docs: complete plan)

## Files Created/Modified

- `src/production/collections/index.ts` - Payload CMS collections with tenant isolation fields
- `src/production/cdn/revalidator.ts` - On-demand revalidation with Cloudflare CDN purging
- `src/production/app/api/revalidate/route.ts` - Next.js revalidation webhook endpoint
- `src/production/routes/api/payload/revalidate/route.ts` - Payload CMS webhook for revalidation
- `src/production/app/[domain]/page.tsx` - Production site page with ISR and TiptapRenderer
- `src/production/app/api/production/pages/[id]/route.ts` - Page API with GET/PUT and version conflict detection
- `src/production/lib/payload-singleton.ts` - Payload singleton for server components
- `src/production/payload.config.ts` - Updated to import from collections/index.ts

## Decisions Made

- Updated payload.config.ts to import from collections/index.ts as per verification criteria
- Used dynamic import for revalidator in afterChange hook to avoid circular dependencies
- ISR revalidation set to 60 seconds as fallback when webhook fails

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Payload CMS collections ready for admin UI integration
- On-demand revalidation webhook endpoints functional
- Production page serving with ISR ready for custom domain routing (Phase 6)

---
*Phase: 04-04*
*Completed: 2026-03-25*
