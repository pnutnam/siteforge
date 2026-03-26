# Roadmap: SiteForge

## Overview

SiteForge is an AI-powered local business website platform that scrapes business data from Google Maps, Instagram, Facebook, and Yelp, auto-generates landing pages from social proof, and converts businesses into $50/mo customers with a full WYSIWYG editor.

## Milestones

- **v1.2 Preview Landing Pages** — Phases 7-9 (current)
- ~~v1.1 Hardening~~ — Phase 4 verification + auth gap closure (shipped 2026-03-25)
- ~~v1.0 MVP~~ — Phases 1-6 (shipped 2026-03-25)

## Phase Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Scraping Infrastructure | v1.0 | 5/5 | Complete | 2026-03-23 |
| 2. AI Content Pipeline | v1.0 | 3/3 | Complete | 2026-03-24 |
| 3. Preview Landing Pages | v1.0 | 5/5 | Complete | 2026-03-25 |
| 4. Production Site | v1.0 | 4/4 | Complete | 2026-03-25 |
| 5. Authentication & Security | v1.0 | 4/4 | Complete | 2026-03-25 |
| 6. DNS & Custom Domains | v1.0 | 4/4 | Complete | 2026-03-25 |
| 7. Preview Generation | v1.2 | 0/3 | Not started | - |
| 8. Template System + Analytics | v1.2 | 0/4 | Not started | - |
| 9. Image Upload + Auth Hardening | v1.2 | 0/3 | Not started | - |

---

## Phase Details

### Phase 7: Preview Generation

**Goal:** Complete end-to-end preview landing page generation pipeline

**Depends on:** Phase 3 (Preview Landing Pages infrastructure)

**Requirements:** PREVIEW-01, PREVIEW-03, PREVIEW-04

**Success Criteria** (what must be TRUE):
1. When scraped data build threshold is met, system generates actual HTML landing page file (not just warning)
2. Preview assets (images, CSS) upload to S3 via presigned URLs and are retrievable via Cloudflare CDN
3. Preview URL is delivered to business owner via SendGrid email with unique working link
4. Dashboard confirms successful preview generation and email delivery

**Plans:** TBD

---

### Phase 8: Template System + Analytics

**Goal:** Template selection loads actual business content, analytics tracking functional

**Depends on:** Phase 7 (preview generation)

**Requirements:** TEMPL-01, TEMPL-02, PREVIEW-02, PREVIEW-05

**Success Criteria** (what must be TRUE):
1. Template picker displays available templates loaded from storage with name, description, and thumbnail
2. When user selects a template, editor populates with template structure and actual scraped business content mapped into sections
3. Preview landing page reflects user's template selection with their business data
4. Dashboard shows preview page views, click-through rate, and time-on-site analytics

**Plans:** TBD

---

### Phase 9: Image Upload + Auth Hardening

**Goal:** Editor image replace uses S3 presigned URLs, auth rate limiting fully enforced

**Depends on:** Phase 8

**Requirements:** IMG-01, AUTH-01, AUTH-02

**Success Criteria** (what must be TRUE):
1. Editor image replace flow: client requests presigned URL from API, uploads directly to S3, image appears in editor
2. TOTP 2FA verify endpoint enforces rate limiting (5 attempts per minute per account)
3. Session management API routes enforce rate limiting on all sensitive endpoints

**Plans:** TBD

---

## v1.2 Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| PREVIEW-01 | Phase 7 | Pending |
| PREVIEW-03 | Phase 7 | Pending |
| PREVIEW-04 | Phase 7 | Pending |
| TEMPL-01 | Phase 8 | Pending |
| TEMPL-02 | Phase 8 | Pending |
| PREVIEW-02 | Phase 8 | Pending |
| PREVIEW-05 | Phase 8 | Pending |
| IMG-01 | Phase 9 | Pending |
| AUTH-01 | Phase 9 | Pending |
| AUTH-02 | Phase 9 | Pending |

**Coverage:** 10/10 requirements mapped ✓

---

*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 for v1.2 milestone*
