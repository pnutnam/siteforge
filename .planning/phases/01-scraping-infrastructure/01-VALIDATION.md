---
phase: 01
slug: scraping-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.x + Playwright Test 2.0.8 |
| **Config file** | `vitest.config.ts` + `playwright.config.ts` (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=dot src/scraping/` |
| **Full suite command** | `npx vitest run && npx playwright test` |
| **Estimated runtime** | ~120 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot src/scraping/`
- **After every plan wave:** Run `npx vitest run && npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | SCRAPE-01 | Unit | `npx vitest run src/scraping/scrapers/google-maps.test.ts` | W0 | pending |
| 01-01-02 | 01 | 1 | SCRAPE-02 | Unit | `npx vitest run src/scraping/scrapers/instagram.test.ts` | W0 | pending |
| 01-01-03 | 01 | 1 | SCRAPE-03 | Unit | `npx vitest run src/scraping/scrapers/google-reviews.test.ts` | W0 | pending |
| 01-01-04 | 01 | 1 | SCRAPE-04 | Unit | `npx vitest run src/scraping/scrapers/facebook.test.ts` | W0 | pending |
| 01-01-05 | 01 | 1 | SCRAPE-05 | Unit | `npx vitest run src/scraping/scrapers/yelp.test.ts` | W0 | pending |
| 01-01-06 | 01 | 1 | SCRAPE-06 | Unit | `npx vitest run src/scraping/scrapers/parallel.test.ts` | W0 | pending |
| 01-01-07 | 01 | 1 | SCRAPE-07 | Unit | `npx vitest run src/scraping/stealth/context-builder.test.ts` | W0 | pending |
| 01-01-08 | 01 | 1 | SCRAPE-08 | Unit | `npx vitest run src/scraping/validation/schemas.test.ts` | W0 | pending |
| 01-02-01 | 02 | 2 | PIPELINE-01 | Unit | `npx vitest run src/jobs/flows.test.ts` | W0 | pending |
| 01-02-02 | 02 | 2 | PIPELINE-03 | Unit | `npx vitest run src/jobs/retry.test.ts` | W0 | pending |
| 01-02-03 | 02 | 2 | INFRA-01 | Integration | `npx vitest run src/database/tenant-middleware.test.ts` | W0 | pending |
| 01-02-04 | 02 | 2 | MONITOR-03 | Integration | `npx vitest run src/dashboard/scrape-status.test.ts` | W0 | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [ ] `src/scraping/scrapers/base.ts` — abstract scraper class (shared by all scrapers)
- [ ] `src/scraping/scrapers/google-maps.test.ts` — SCRAPE-01 tests
- [ ] `src/scraping/scrapers/instagram.test.ts` — SCRAPE-02 tests
- [ ] `src/scraping/scrapers/google-reviews.test.ts` — SCRAPE-03 tests
- [ ] `src/scraping/scrapers/facebook.test.ts` — SCRAPE-04 tests
- [ ] `src/scraping/scrapers/yelp.test.ts` — SCRAPE-05 tests
- [ ] `src/scraping/scrapers/parallel.test.ts` — SCRAPE-06 tests (p-limit concurrency)
- [ ] `src/scraping/stealth/context-builder.test.ts` — SCRAPE-07 tests (fingerprint randomization)
- [ ] `src/scraping/validation/schemas.test.ts` — SCRAPE-08 tests (Zod partial-store)
- [ ] `src/jobs/flows.test.ts` — PIPELINE-01 tests (BullMQ FlowProducer)
- [ ] `src/jobs/retry.test.ts` — PIPELINE-03 tests (exponential backoff)
- [ ] `src/database/tenant-middleware.test.ts` — INFRA-01 tests (RLS + SET LOCAL)
- [ ] `src/dashboard/scrape-status.test.ts` — MONITOR-03 tests (BullMQ events)
- [ ] `vitest.config.ts` — Vitest configuration
- [ ] `playwright.config.ts` — Playwright configuration

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Selector stability against live Google Maps DOM | SCRAPE-01 | DOM structure changes without notice; requires daily selector health check | Manual: Run scraper against live Google Maps, verify all fields extracted |
| Instagram session login flow | SCRAPE-02 | Requires real credentials; automate with test account | Manual: Verify login flow works with test credentials |
| Facebook public page access | SCRAPE-04 | Facebook blocks public scraping without login | Manual: Verify public page access succeeds without auth |
| Selector stability against live Yelp DOM | SCRAPE-05 | DOM changes frequently | Manual: Run scraper against live Yelp, verify extraction |

*All other behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
