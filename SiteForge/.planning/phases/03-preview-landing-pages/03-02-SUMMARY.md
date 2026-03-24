---
phase: 03-preview-landing-pages
plan: "02"
subsystem: ui
tags: [astro, s3, static-generation, preview-pages]

# Dependency graph
requires:
  - phase: 03-01
    provides: preview infrastructure (Cloudflare CDN routing, preview links manager, S3 storage)
provides:
  - Astro static site generator for preview landing pages
  - Build orchestration: compile AI data -> Astro build -> S3 upload -> create preview link
  - Category-based section ordering (restaurant/salon/general)
affects:
  - 03-03 (preview job trigger integration)
  - production landing pages (shares Astro templates)

# Tech tracking
tech-stack:
  added: [astro ^6.0.8]
  patterns:
    - Static site generation with Astro
    - Category-based component ordering
    - AI data compilation to JSON for static build
    - Tenant-isolated S3 key format

key-files:
  created:
    - src/preview/astro/src/pages/preview/[business].astro
    - src/preview/astro/src/components/Hero.astro
    - src/preview/astro/src/components/About.astro
    - src/preview/astro/src/components/Gallery.astro
    - src/preview/astro/src/components/Testimonials.astro
    - src/preview/astro/src/components/ContactCTA.astro
    - src/preview/astro/src/components/ExpirationBanner.astro
    - src/preview/astro/src/layouts/Layout.astro
    - src/preview/compiler.ts
    - src/preview/builder.ts
    - src/preview/jobs/generator.ts

key-decisions:
  - "Category inference from business name (restaurant/salon/general) rather than explicit category field"
  - "ExpirationBanner urgency levels: urgent (<=7 days), warning (<=14 days), normal"

patterns-established:
  - "Preview pages use category-based section ordering: Restaurant=gallery->testimonials->about->contact, Salon=gallery->about->testimonials->contact, General=about->testimonials->gallery->contact"

requirements-completed: [PREVIEW-01]

# Metrics
duration: ~5min
completed: 2026-03-24
---

# Phase 03 Plan 02: Astro Preview Landing Pages Summary

**Astro static site generator with category-based section ordering, build orchestration compiling AI data to static pages, and 30-day expiration banners**

## Performance

- **Duration:** ~5 min (file creation only, no runtime verification)
- **Tasks:** 3
- **Files created:** 16

## Accomplishments

- Created Astro project scaffold with package.json, config, and Layout component
- Built all 7 Astro components: Hero, About, Gallery, Testimonials, ContactCTA, ExpirationBanner
- Implemented category-based section ordering in [business].astro
- Created build orchestration: compiler.ts -> builder.ts -> jobs/generator.ts

## Task Commits

Each task was committed atomically:

1. **Task 2.1: Set up Astro project structure** - `129988e` (feat)
2. **Task 2.2: Create Astro page and components** - `2cb633f` (feat)
3. **Task 2.3: Create build orchestration** - `7b43e62` (feat)

## Files Created/Modified

- `src/preview/astro/package.json` - Astro project dependencies
- `src/preview/astro/astro.config.mjs` - Static output configuration
- `src/preview/astro/tsconfig.json` - TypeScript config with path aliases
- `src/preview/astro/src/layouts/Layout.astro` - Base layout with Inter font
- `src/preview/astro/src/pages/preview/[business].astro` - Dynamic business pages with category ordering
- `src/preview/astro/src/components/Hero.astro` - Hero with image overlay
- `src/preview/astro/src/components/About.astro` - About section with hours/phone/address
- `src/preview/astro/src/components/Gallery.astro` - 6-image grid with hover captions
- `src/preview/astro/src/components/Testimonials.astro` - Review cards with star ratings
- `src/preview/astro/src/components/ContactCTA.astro` - Claim page CTA button
- `src/preview/astro/src/components/ExpirationBanner.astro` - 30-day urgency indicator
- `src/preview/compiler.ts` - AI data to JSON compilation
- `src/preview/builder.ts` - Full build orchestration
- `src/preview/jobs/generator.ts` - BullMQ job processor

## Decisions Made

- Category inference from business name (restaurant/salon/general) rather than explicit category field
- ExpirationBanner urgency levels: urgent (<=7 days), warning (<=14 days), normal

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Astro project ready for build testing
- compiler.ts and builder.ts ready for integration with AI pipeline (03-03)
- ExpirationBanner component ready for 30-day countdown testing

---
*Phase: 03-preview-landing-pages*
*Completed: 2026-03-24*
