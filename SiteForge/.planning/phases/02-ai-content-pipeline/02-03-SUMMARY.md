---
phase: 02-ai-content-pipeline
plan: 03
subsystem: pipeline
tags: [bullmq, ai-pipeline, image-selection, copy-generation, integration]

# Dependency graph
requires:
  - phase: 01-scraping-infrastructure
    provides: Scraper infrastructure, PostgreSQL schema, BullMQ queue setup
  - phase: 02-ai-content-pipeline
    provides: 02-01 engagement scoring, 02-02 AI classifier and copy generator
provides:
  - BullMQ AI pipeline with parent-child flow (parallel image selection + copy generation)
  - Child jobs: image-select and copy-write run concurrently
  - Generated content stored in PostgreSQL (generated_content, generated_images, generated_testimonials tables)
  - triggerAIPipeline() integrates with Phase 1 scrape completion
affects: [03-preview-generation, 04-production-sites]

# Tech tracking
tech-stack:
  added: [bullmq FlowProducer, FlowJob patterns]
  patterns: [Parent-child job fan-out, parallel child processing, tenant-isolated database queries]

key-files:
  created:
    - src/ai/pipeline/types.ts - Job types and result interfaces
    - src/ai/pipeline/orchestrator.ts - BullMQ flow creation (parent->children)
    - src/ai/pipeline/image-selector.ts - Image selection child job processor
    - src/ai/pipeline/copy-writer.ts - Copy generation child job processor
    - src/ai/pipeline/integration.ts - triggerAIPipeline helper
    - src/ai/pipeline/integration.test.ts - Flow structure verification test
    - src/jobs/processors/ai-pipeline.ts - BullMQ processor and worker factory
  modified: []

key-decisions:
  - "Parallel children (image-select + copy-write) per user decision for speed"
  - "Query Instagram/Facebook/Yelp raw tables (not scraped_posts) per actual schema"
  - "Return null on copy generation failure for partial pipeline success"
  - "Use redisConfig (not redisConnection) for BullMQ worker connection"

patterns-established:
  - "Parent job waits for children via getChildrenValues() before storing results"
  - "withTenant wrapper for all database queries maintaining RLS isolation"
  - "Hybrid copy generation: template headline/tagline + AI about section"

requirements-completed: [CONTENT-01, CONTENT-02, CONTENT-03, CONTENT-04, PIPELINE-02]

# Metrics
duration: 4min
completed: 2026-03-24
---

# Phase 02 Plan 03: AI Pipeline Orchestrator Summary

**BullMQ AI pipeline with parallel child jobs for image selection and copy generation, integrated with Phase 1 scrape completion**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-24T18:10:23Z
- **Completed:** 2026-03-24T18:13:56Z
- **Tasks:** 4 completed + 1 checkpoint auto-approved
- **Files modified:** 7 created

## Accomplishments

- BullMQ FlowProducer creates parent ai-pipeline job that fans out to parallel children
- Image selection job: engagement scoring -> rule filters -> AI classification -> top 5
- Copy generation job: hybrid template+AI approach with testimonial selection
- PostgreSQL storage for generated_content, generated_images, generated_testimonials
- triggerAIPipeline() integrates with Phase 1 scrape completion flow
- Integration test verifies correct flow structure

## Task Commits

Each task was committed atomically:

1. **Task 3.1: BullMQ AI pipeline orchestrator** - `bb7be43` (feat)
2. **Task 3.2: Image selector child job** - `2ee937a` (feat)
3. **Task 3.3: Copy writer child job** - `7c12e32` (feat)
4. **Task 3.4: BullMQ AI pipeline processor** - `87521b5` (feat)
5. **Task 3.5: Integration verification (checkpoint)** - auto-approved (auto_advance=true)

**Plan metadata:** `87521b5` (docs: complete plan)

## Files Created/Modified

- `src/ai/pipeline/types.ts` - AIPipelineJob, ImageSelectJob, CopyWriteJob, SelectedImage, GeneratedCopy interfaces
- `src/ai/pipeline/orchestrator.ts` - createAIPipelineFlow() using FlowProducer pattern
- `src/ai/pipeline/image-selector.ts` - processImageSelect() with engagement scoring pipeline
- `src/ai/pipeline/copy-writer.ts` - processCopyWrite() with hybrid copy generation
- `src/ai/pipeline/integration.ts` - triggerAIPipeline() helper for scrape completion integration
- `src/ai/pipeline/integration.test.ts` - Vitest test verifying FlowProducer structure
- `src/jobs/processors/ai-pipeline.ts` - processAIPipeline() parent handler and createAIPipelineWorker()

## Decisions Made

- Parallel children (image-select + copy-write) per user decision for speed
- Query Instagram/Facebook/Yelp raw tables (not scraped_posts) per actual schema
- Return null on copy generation failure for partial pipeline success
- Use redisConfig (not redisConnection) for BullMQ worker connection

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all automated tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AI pipeline complete and ready for Phase 3 (Preview Generation with Astro)
- triggerAIPipeline() can be called from scrape completion handler
- BullMQ worker created via createAIPipelineWorker() for production use

---
*Phase: 02-ai-content-pipeline*
*Completed: 2026-03-24*
