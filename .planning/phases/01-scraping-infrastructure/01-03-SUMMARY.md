---
phase: 01-scraping-infrastructure
plan: "03"
subsystem: infra
tags: [bullmq, postgresql, sse, retry, tenant-isolation]

# Dependency graph
requires:
  - phase: 01-01
    provides: Schema models, RLS policies
  - phase: 01-02
    provides: Parallel scraper orchestrator, source scrapers
provides:
  - BullMQ parent->child job flow with atomic creation
  - Exponential backoff retry (3s->6s->12s) for source scrapes
  - PostgreSQL tenant middleware with SET LOCAL app.current_tenant
  - Dashboard SSE endpoint for real-time scrape status streaming
affects: [02-ai-content-pipeline, 03-preview-landing-pages]

# Tech tracking
tech-stack:
  added: [bullmq, ioredis, drizzle-orm, pg, vitest]
  patterns: [BullMQ FlowProducer for parent-child jobs, SSE for real-time updates, tenant middleware pattern]

key-files:
  created:
    - src/jobs/producers.ts - startBusinessScrape() creates parent->child flow
    - src/jobs/processors/business-scrape.ts - Parent job waits for all children
    - src/jobs/processors/source-scrape.ts - Child processor with retry and data storage
    - src/jobs/retry.ts - RETRY_CONFIG with calculateBackoffDelays()
    - src/database/pool.ts - PostgreSQL pool (max=20 connections)
    - src/database/tenant-middleware.ts - Express middleware for tenant context
    - src/dashboard/routes.ts - REST and SSE endpoints for status
  modified:
    - src/dashboard/scrape-status.ts - Fixed undefined status variable bug

key-decisions:
  - "BullMQ FlowProducer creates parent job atomically with children"
  - "Exponential backoff: delay * 2^(attempt-1), capped at 60000ms"
  - "Tenant middleware validates UUID format before accepting tenant ID"

patterns-established:
  - "BullMQ parent->child pattern: parent waits for children via interval checking"
  - "SSE streaming pattern: initial status + BullMQ event listeners + heartbeat"
  - "Tenant isolation: SET LOCAL app.current_tenant before each query"

requirements-completed: [PIPELINE-01, PIPELINE-03, INFRA-01, MONITOR-03]

# Metrics
duration: 7min
completed: 2026-03-23
---

# Phase 01-03: Pipeline Infrastructure Wiring Summary

**BullMQ parent->child job flow with exponential backoff retry, PostgreSQL tenant middleware with RLS enforcement, and dashboard SSE real-time streaming**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-23T21:33:18Z
- **Completed:** 2026-03-23T21:40:10Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments

- BullMQ FlowProducer parent->child job architecture implemented
- Exponential backoff retry (3s->6s->12s) with non-retryable error detection
- PostgreSQL connection pool with tenant isolation middleware
- Dashboard REST and SSE endpoints for real-time scrape status

## Task Commits

Each task was committed atomically:

1. **Task 2.1: BullMQ job producers and processors** - `5ac097f` (feat)
2. **Task 2.2: PostgreSQL tenant middleware** - `5ac097f` (part of same commit)
3. **Task 2.3: Dashboard SSE endpoint** - `5ac097f` (part of same commit)
4. **ROADMAP update** - `79cde11` (docs)

**Plan metadata:** `79cde11` (docs: update ROADMAP progress to 2/4 plans)

## Files Created/Modified

- `src/jobs/producers.ts` - Job producer creating parent->children flow
- `src/jobs/processors/business-scrape.ts` - Parent job processor waiting for children
- `src/jobs/processors/source-scrape.ts` - Child processor with retry and storage
- `src/jobs/retry.ts` - Retry configuration with exponential backoff
- `src/database/pool.ts` - PostgreSQL pool (max=20 connections)
- `src/database/tenant-middleware.ts` - Express tenant context middleware
- `src/dashboard/routes.ts` - REST and SSE endpoints for status
- `src/dashboard/scrape-status.ts` - Fixed undefined status bug in active event handler

## Decisions Made

- BullMQ FlowProducer creates parent job atomically with all children
- Exponential backoff: base 3s, multiplier 2^(attempt-1), cap at 60s
- Tenant middleware validates x-tenant-id header as UUID format
- SSE sends heartbeat every 30 seconds to keep connection alive

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed undefined status variable in scrape-status.ts**
- **Found during:** Task 2.1 (BullMQ implementation)
- **Issue:** subscribeToScrapeEvents active event handler referenced undefined `status` variable
- **Fix:** Added `getScrapeStatus(businessId, tenantId)` call to get current status before accessing it
- **Files modified:** src/dashboard/scrape-status.ts
- **Verification:** All 9 tests pass
- **Committed in:** `5ac097f` (Task 2.1 commit)

**2. [Rule 3 - Blocking] Installed missing dependencies]**
- **Found during:** Task 2.1 (running tests)
- **Issue:** bullmq, ioredis, drizzle-orm, pg, vitest not installed
- **Fix:** npm install for all required packages
- **Files modified:** package.json, package-lock.json
- **Verification:** Tests pass with 9/9 passing
- **Committed in:** `5ac097f` (Task 2.1 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both auto-fixes essential for correctness and test execution. No scope creep.

## Issues Encountered

None - plan executed smoothly with tests passing on first run after dependencies installed.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BullMQ job infrastructure ready for worker implementation
- Tenant isolation middleware ready for API routes
- SSE streaming ready for dashboard integration

---
*Phase: 01-scraping-infrastructure*
*Completed: 2026-03-23*
