---
phase: 04-production-site
plan: "04-01"
subsystem: auth,database,ui
tags: [next.js, payload-cms, magic-link, postgresql, tiptap, rls]

# Dependency graph
requires:
  - phase: 03-preview-landing-pages
    provides: preview links with url_hash for claim flow
provides:
  - Next.js 14 project with Payload CMS integration
  - PostgreSQL schema with 5 new tables (payloadPages, payloadMedia, payloadSiteSettings, ownerAccounts, feedbackAnnotations)
  - Magic link authentication (createMagicLink, verifyMagicLink, getMagicLinkUrl)
  - HMAC-SHA256 signed session tokens with 30-day expiry
  - /claim/signup POST endpoint for magic link generation
  - /claim/magic GET endpoint for token verification
  - /claim/pending GET endpoint for pending account status
affects:
  - phase: 04-production-site (plans 02-04)
  - authentication system

# Tech tracking
tech-stack:
  added: [next@14, payload@3.12.2, @tiptap/react, @tiptap/starter-kit, @tiptap/extension-image, @tiptap/extension-link]
  patterns: [magic-link auth, HMAC-SHA256 session tokens, tenant-isolated RLS policies, Payload CMS collections]

key-files:
  created:
    - src/production/payload.config.ts - Payload CMS configuration
    - src/production/collections/pages.ts - Pages collection
    - src/production/collections/media.ts - Media collection
    - src/production/collections/settings.ts - Settings collection
    - src/production/collections/users.ts - Users/auth collection
    - src/production/auth/magic-link.ts - Magic link generation and verification
    - src/production/auth/session.ts - Session token creation and verification
    - src/production/routes/claim/signup/route.ts - Signup endpoint
    - src/production/routes/claim/magic/route.ts - Magic link verification endpoint
    - src/production/routes/claim/pending/route.ts - Pending status endpoint
  modified:
    - package.json - Added Next.js, Payload CMS, Tiptap dependencies
    - src/database/schema.ts - Added 5 new tables with tenant isolation
    - src/database/rls.ts - Added RLS policies for 5 new tables

key-decisions:
  - Magic link tokens use crypto.randomBytes(32) for 64-char hex tokens
  - Session tokens use HMAC-SHA256 signing (interim solution before Phase 5 JWT)
  - Owner accounts status: pending | active | disabled
  - Session cookie: sf_session with httpOnly, secure, sameSite:lax

patterns-established:
  - "Pattern: Magic link auth flow - generate token -> email link -> verify -> set session cookie"
  - "Pattern: Tenant isolation via RLS policies using current_setting('app.current_tenant')"
  - "Pattern: Payload CMS collections with tenantId and businessId foreign keys"

requirements-completed: [PROD-01, PROD-02, PROD-03, PROD-04]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 04 Plan 01: Foundation Summary

**Next.js 14 + Payload CMS with magic link authentication — 5 PostgreSQL tables with tenant-isolated RLS policies**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T00:41:08Z
- **Completed:** 2026-03-25T00:45:28Z
- **Tasks:** 3
- **Files modified:** 8 created, 3 modified

## Accomplishments

- Initialized Next.js 14 project structure with Payload CMS integration
- Added 5 new database tables (payloadPages, payloadMedia, payloadSiteSettings, ownerAccounts, feedbackAnnotations) with tenant isolation via RLS
- Implemented magic link authentication flow with HMAC-SHA256 signed session tokens
- Created /claim/signup, /claim/magic, and /claim/pending API routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Initialize Next.js + Payload CMS Project** - `7a193b4` (feat)
2. **Task 2: Add Payload CMS Database Tables to Schema** - `fe5b9b7` (feat)
3. **Task 3: Implement Magic Link Authentication** - `fa97da4` (feat)

**Plan metadata:** `fa97da4` (docs: complete plan)

## Files Created/Modified

- `next.config.js` - Next.js configuration with image domains and serverActions
- `src/production/payload.config.ts` - Payload CMS config with pages, media, settings, users collections
- `src/production/collections/pages.ts` - Pages collection with title, slug, content (Tiptap JSON), status
- `src/production/collections/media.ts` - Media collection with filename, mimeType, s3Key, dimensions
- `src/production/collections/settings.ts` - Site settings collection with contact info and social links
- `src/production/collections/users.ts` - Users collection with auth and role field
- `src/production/auth/magic-link.ts` - Magic link create/verify functions using crypto.randomBytes
- `src/production/auth/session.ts` - HMAC-SHA256 signed session tokens with cookie options
- `src/production/routes/claim/signup/route.ts` - POST handler for magic link signup
- `src/production/routes/claim/magic/route.ts` - GET handler for magic link verification
- `src/production/routes/claim/pending/route.ts` - GET handler for pending account status
- `src/database/schema.ts` - Added 5 new tables with tenant isolation and foreign keys
- `src/database/rls.ts` - Added RLS ENABLE and tenant isolation policies for 5 tables
- `package.json` - Added next@14, payload@3.12.2, @tiptap/* dependencies

## Decisions Made

- Magic link tokens: 64-char hex (crypto.randomBytes(32)) with 1-hour expiry
- Session tokens: HMAC-SHA256 signed base64url encoding, 30-day default expiry
- Session cookie: httpOnly, secure (production), sameSite:lax, path:/
- Account status workflow: pending -> active (after dev team approval) -> disabled
- Owner accounts email unique constraint ensures one account per email

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness

- Payload CMS admin at /admin is a stretch goal - owner editing goes through /editor (custom)
- SendGrid email integration not yet implemented - magic link URL logged to console in development
- TOTP 2FA (AUTH-01) deferred to Phase 5

---
*Phase: 04-production-site 04-01*
*Completed: 2026-03-25*
