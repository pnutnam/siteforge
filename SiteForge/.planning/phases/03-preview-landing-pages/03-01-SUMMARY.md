---
phase: 03-preview-landing-pages
plan: "01"
subsystem: infra
tags: [aws-s3, cloudflare, preview-urls, tenant-isolation]

# Dependency graph
requires:
  - phase: 02-ai-content-pipeline
    provides: GeneratedContent, TemplateVariables for preview page rendering
provides:
  - S3 storage with per-tenant key prefix isolation (INFRA-02)
  - Cloudflare KV-based preview URL routing (biz-{hash}.preview.siteforge.io)
  - preview_links table for URL management and expiration tracking
  - PreviewLinkManager with create/lookup/view/claim operations
affects: [03-preview-landing-pages, 04-production-sites]

# Tech tracking
tech-stack:
  added: [@aws-sdk/client-s3, @aws-sdk/s3-request-presigner]
  patterns: [per-tenant key isolation, KV-based URL routing, preview link lifecycle]

key-files:
  created:
    - src/preview/storage/types.ts - S3 interface types
    - src/preview/storage/s3.ts - S3 operations with tenant isolation
    - src/preview/cdn/types.ts - Cloudflare interface types
    - src/preview/cdn/cloudflare.ts - KV lookup/registration
    - src/preview/cdn/router.ts - Preview URL routing logic
    - src/preview/links/types.ts - PreviewLink interface types
    - src/preview/links/manager.ts - PreviewLink CRUD operations
    - src/preview/links/manager.test.ts - 6 unit tests
  modified:
    - src/database/schema.ts - Added previewLinks pgTable

key-decisions:
  - "S3 keys use format {tenantId}/{businessId}/{contentHash}/index.html for per-tenant isolation"
  - "Cloudflare KV stores biz-{hash} -> {s3Key, tenantId, businessId, expiresAt} mapping"
  - "Preview links expire after 30 days by default"

patterns-established:
  - "Per-tenant key prefix isolation for S3 buckets (INFRA-02)"
  - "KV-based URL routing decouples preview URL from S3 key"

requirements-completed: [INFRA-02, PREVIEW-02, PREVIEW-03]

# Metrics
duration: 163s
completed: 2026-03-24
---

# Phase 03, Plan 01: Preview Infrastructure Summary

**S3 + Cloudflare preview infrastructure with per-tenant key isolation and biz-{hash}.preview.siteforge.io URL routing**

## Performance

- **Duration:** 163s (~2.7 min)
- **Started:** 2026-03-24T20:42:54Z
- **Completed:** 2026-03-24T20:45:37Z
- **Tasks:** 4
- **Files modified:** 9 (1 modified, 8 created)

## Accomplishments
- preview_links table with tenant isolation, url_hash unique index, expires_at tracking
- S3 storage module with per-tenant key prefix isolation ({tenantId}/{businessId}/...)
- Cloudflare CDN routing via KV lookup (biz-{hash} -> S3 key mapping)
- PreviewLinkManager with create, get, view tracking, claim, and stats operations
- 6 unit tests passing for manager module

## Task Commits

Each task was committed atomically:

1. **Task 1.1: Add preview_links table** - `8447eb2` (feat)
2. **Task 1.2: Create S3 storage module** - `68214a4` (feat)
3. **Task 1.3: Create Cloudflare CDN routing** - `f6fb265` (feat)
4. **Task 1.4: Create preview link manager** - `8727790` (feat)

**Plan metadata:** `8d3a1b5` (docs: complete 03-01 plan)

## Files Created/Modified

- `src/database/schema.ts` - Added previewLinks pgTable
- `src/preview/storage/types.ts` - S3Config, S3UploadOptions, PreviewFile interfaces
- `src/preview/storage/s3.ts` - uploadPreview, getPreview, deletePreview, listTenantPreviews, getCdnUrl
- `src/preview/cdn/types.ts` - CloudflareConfig, PreviewRouting interfaces
- `src/preview/cdn/cloudflare.ts` - lookupPreview, registerPreview, invalidateCache
- `src/preview/cdn/router.ts` - routePreview for preview URL resolution
- `src/preview/links/types.ts` - CreatePreviewLinkInput, PreviewLink, PreviewLinkStats
- `src/preview/links/manager.ts` - createPreviewLink, getPreviewLink, recordPreviewView, getPreviewLinkStats, claimPreviewLink
- `src/preview/links/manager.test.ts` - 6 unit tests

## Decisions Made

- S3 key format {tenantId}/{businessId}/{contentHash}/index.html enforces isolation
- KV lookup returns redirectUrl to CDN rather than serving directly from Worker
- 30-day default expiration for preview links

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] getPreviewLink returned link instead of null for expired links**
- **Found during:** Task 1.4 (preview link manager implementation)
- **Issue:** Plan spec said "Returns null if not found or expired" but implementation returned link with status='expired'
- **Fix:** Added early return of null when isExpired is true, before building the link object
- **Files modified:** src/preview/links/manager.ts
- **Verification:** Test "returns null for expired links" now passes
- **Committed in:** 8727790 (Task 1.4 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix ensures expired links are properly filtered - no scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- S3 storage and Cloudflare KV routing in place for Plan 02 (Astro preview page generation)
- preview_links table ready for link creation and tracking
- All 6 unit tests passing

---
*Phase: 03-preview-landing-pages*
*Completed: 2026-03-24*