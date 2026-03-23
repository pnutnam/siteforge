---
phase: 01-scraping-infrastructure
plan: 04
subsystem: infra
tags: [bullmq, express, typescript, redis, postgresql, integration]

# Dependency graph
requires:
  - phase: 01-scraping-infrastructure (plans 01-03)
    provides: Scrapers, BullMQ queue, PostgreSQL schema, tenant middleware, dashboard routes
provides:
  - Application entry point wiring all components
  - TypeScript project configuration
  - Fixed BullMQ/ioredis version compatibility
affects:
  - Phase 02-preview-generation
  - Phase 03-content-pipeline

# Tech tracking
tech-stack:
  added: [playwright-extra, @faker-js/faker, p-limit, @types/node, @types/express, @types/pg]
  patterns: [Express + BullMQ integration, SSE event streaming, in-memory status store]

key-files:
  created:
    - src/index.ts - Application entry point (app + businessWorker export)
    - src/jobs/processors/index.ts - Processor barrel exports
    - tsconfig.json - TypeScript project configuration
  modified:
    - src/jobs/queue.ts - Use redisConfig object instead of ioredis instance (fix BullMQ type conflict)
    - src/dashboard/routes.ts - Fix tenantId types, fix QueueEvents unsubscribe pattern
    - src/dashboard/scrape-status.ts - Fix QueueEvents unsubscribe pattern
    - src/jobs/processors/business-scrape.ts - Remove unused address destructuring

key-decisions:
  - "Used Redis URL config object instead of ioredis instance to resolve BullMQ type conflict"
  - "Used .off() with named handlers for BullMQ QueueEvents cleanup (BullMQ 5.x API)"
  - "Express 4.x req.params types return string | string[] - explicit casts used"

patterns-established:
  - "Express + BullMQ worker co-location pattern (worker and HTTP server in same process)"
  - "SSE endpoint with QueueEvents subscription and proper cleanup via .off()"

requirements-completed: [SCRAPE-01, SCRAPE-02, SCRAPE-03, SCRAPE-04, SCRAPE-05, SCRAPE-06, SCRAPE-07, SCRAPE-08, PIPELINE-01, PIPELINE-03, INFRA-01, MONITOR-03]

# Metrics
duration: 9min
completed: 2026-03-23T22:04:08Z
---

# Phase 1 Plan 4: Integration Summary

**Full scrape pipeline integrated: Express + BullMQ worker wired via src/index.ts with tenant middleware, dashboard routes, and health endpoint**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-23T21:54:54Z
- **Completed:** 2026-03-23T22:04:08Z
- **Tasks:** 2 (1 auto, 1 checkpoint)
- **Files modified:** 9

## Accomplishments

- Created `src/index.ts` wiring all components: scrapeQueue, businessWorker (parent + child job types), tenantMiddleware, dashboardRouter
- Health endpoint at `/health` returns database connection status
- Fixed BullMQ/ioredis version mismatch by using connection config object
- Fixed BullMQ QueueEvents API usage (named handlers + `.off()` for cleanup)
- Added TypeScript project configuration (tsconfig.json)
- Installed missing dependencies: @types/node, @types/express, @types/pg, playwright-extra, @faker-js/faker, p-limit

## Task Commits

1. **Task 3.1: Wire application entry point** - `e470f45` (feat)
2. **Task 3.2: Integration verification** - `e470f45` (checkpoint auto-approved)

## Files Created/Modified

- `src/index.ts` - Application entry point wiring all components
- `src/jobs/processors/index.ts` - Processor barrel exports
- `src/jobs/queue.ts` - Fixed ioredis type conflict
- `src/dashboard/routes.ts` - Fixed tenantId types and QueueEvents cleanup
- `src/dashboard/scrape-status.ts` - Fixed QueueEvents cleanup pattern
- `src/jobs/processors/business-scrape.ts` - Removed unused destructuring
- `tsconfig.json` - TypeScript project config
- `package.json` / `package-lock.json` - Added missing dependencies

## Decisions Made

- Used Redis URL config object (`{ url: 'redis://...' }`) instead of ioredis instance to resolve BullMQ bundled-ioredis vs top-level-ioredis type conflict
- Named handler functions + `.off()` for BullMQ QueueEvents cleanup (BullMQ 5.x `on()` returns QueueEvents for chaining, not unsubscribe function)

## Deviations from Plan

None - plan executed as written.

## Issues Encountered

- **BullMQ + ioredis version mismatch:** BullMQ bundles its own ioredis version with incompatible types from top-level ioredis 5.10.1. Fixed by using connection config object instead of ioredis instance.
- **BullMQ QueueEvents API change:** `.on()` returns QueueEvents (for chaining) not unsubscribe function. Fixed by storing named handlers and calling `.off()` for cleanup.
- **Missing dependencies:** @types/node, @types/express, @types/pg, playwright-extra, @faker-js/faker, p-limit were not installed. Installed as part of plan execution.

## User Setup Required

This plan requires live services to verify end-to-end:
```bash
# Start Redis
redis-server

# Start PostgreSQL
docker run -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=siteforge -p 5432:5432 postgres:16

# Run the app
npx ts-node src/index.ts

# Health check
curl http://localhost:3000/health

# Start a test scrape
curl -X POST http://localhost:3000/api/scrape/start \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"businessId": "test-biz-001", "name": "Test Pizza", "address": "123 Main St", "url": ""}'

# Check status via SSE
curl -N http://localhost:3000/api/scrape/status/test-biz-001/stream \
  -H "x-tenant-id: 550e8400-e29b-41d4-a716-446655440000"
```

## Next Phase Readiness

Phase 1 scraping infrastructure is complete. All 4 plans finished:
- Plan 01: Scrapers (Google Maps, Instagram, Facebook, Yelp, Google Reviews)
- Plan 02: BullMQ pipeline with parallel orchestration
- Plan 03: Dashboard with SSE streaming
- Plan 04: Integration verification

Phase 2 (Preview Generation) can begin.

---
*Phase: 01-scraping-infrastructure*
*Completed: 2026-03-23*
