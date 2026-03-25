---
phase: 04
status: gaps_found
created: 2026-03-25
verified: 2026-03-25
score: partial
---

# Phase 4 Verification

## Requirements Coverage

| Requirement | Plan | Status |
|-------------|------|--------|
| PROD-01: Production site with real-time WYSIWYG editor (Tiptap) | 02 | Wave 2 |
| PROD-02: Owner can edit any text, image, section from mobile phone | 02 | Wave 2 |
| PROD-03: Per-business site isolation (tenant middleware, row-level security) | 01, 04 | Wave 1, Wave 4 |
| PROD-04: Mobile-responsive editor rendering | 02 | Wave 2 |

## Wave Summary

### Wave 1: Foundation (Plan 01)
- Next.js project scaffold with App Router
- Payload CMS configuration and collections
- PostgreSQL schema extensions with tenant isolation
- Magic link authentication flow
- Session management with HMAC-SHA256 tokens

**Files Created:**
- `src/production/payload.config.ts`
- `src/production/collections/` (pages.ts, media.ts, settings.ts, users.ts, index.ts)
- `src/production/auth/magic-link.ts`
- `src/production/auth/session.ts`
- `src/production/routes/claim/signup/route.ts`
- `src/production/routes/claim/magic/route.ts`
- `src/database/schema.ts` (new tables)

**Files Modified:**
- `package.json` (new dependencies)
- `src/database/rls.ts` (new RLS policies)

### Wave 2: Editor (Plan 02)
- Tiptap WYSIWYG editor with desktop toolbar
- Mobile accordion editor
- Section drag handles with 44px touch targets
- Template picker with 3 import options
- Save button with conflict dialog
- Image replacer component

**Files Created:**
- `src/production/components/editor/tiptap-editor.tsx`
- `src/production/components/editor/tiptap-toolbar.tsx`
- `src/production/components/editor/mobile-accordion.tsx`
- `src/production/components/editor/section-drag-handle.tsx`
- `src/production/components/editor/template-picker.tsx`
- `src/production/components/editor/import-options-modal.tsx`
- `src/production/components/editor/save-button.tsx`
- `src/production/components/editor/conflict-dialog.tsx`
- `src/production/components/editor/image-replacer.tsx`
- `src/production/components/editor/pending-banner.tsx`
- `src/production/app/editor/page.tsx`

### Wave 3: Feedback (Plan 03)
- Annotation overlay on preview pages
- Pin placement with percentage coordinates
- Annotation panel with submit/cancel
- Feedback submission API
- Dev team feedback dashboard
- Annotation list with filters
- Annotation detail with resolve/contact actions

**Files Created:**
- `src/production/components/feedback/annotation-overlay.tsx`
- `src/production/components/feedback/annotation-pin.tsx`
- `src/production/components/feedback/annotation-panel.tsx`
- `src/production/components/dashboard/annotation-card.tsx`
- `src/production/components/dashboard/annotation-list.tsx`
- `src/production/components/dashboard/annotation-detail.tsx`
- `src/production/routes/preview/feedback/route.ts`
- `src/production/app/preview/[hash]/page.tsx`
- `src/production/app/dashboard/feedback/page.tsx`
- `src/production/routes/dashboard/feedback/route.ts`
- `src/production/routes/dashboard/feedback/[id]/resolve/route.ts`

### Wave 4: CDN + Integration (Plan 04)
- Payload CMS collections with hooks
- On-demand revalidation system
- ISR page serving via Next.js
- Production site [domain] routing
- Tiptap JSON to HTML renderer for SSR

**Files Created:**
- `src/production/collections/index.ts`
- `src/production/cdn/revalidator.ts`
- `src/production/app/api/revalidate/route.ts`
- `src/production/routes/api/payload/revalidate/route.ts`
- `src/production/app/[domain]/page.tsx`
- `src/production/app/api/production/pages/[id]/route.ts`
- `src/production/lib/payload-singleton.ts`

## Must-Haves (Goal Verification)

From Phase 4 success criteria:

1. **Business owner can claim a preview site and create account in under 10 minutes**
   - Magic link auth flow (Plan 01)
   - Claim signup at `/claim/${previewHash}/signup` (Plan 01)
   - Redirect to magic link email → immediate login (Plan 01)

2. **Production site uses Tiptap WYSIWYG editor with real-time updates**
   - TiptapEditor component (Plan 02)
   - Toolbar with full formatting options (Plan 02)
   - Content stored as Tiptap JSON in payload_pages table (Plan 01, 04)

3. **Owner can edit any text, replace images, and reorder sections from mobile phone**
   - MobileAccordion component (Plan 02)
   - SectionDragHandle with 44px touch target (Plan 02)
   - ImageReplacer with tap-to-replace (Plan 02)

4. **Editor renders properly on all mobile screen sizes**
   - MobileAccordion with responsive breakpoints (Plan 02)
   - isMobile detection with window.innerWidth < 768 (Plan 02)

5. **Each business site is isolated via tenant middleware and row-level security**
   - New tables have tenantId with RLS policies (Plan 01)
   - Session includes tenantId from owner_accounts (Plan 01)
   - All API routes check tenant isolation (Plan 04)

6. **Production sites are served from CDN (not shared infrastructure)**
   - ISR with revalidate: 60 (Plan 04)
   - On-demand revalidation webhook (Plan 04)
   - Cloudflare CDN purge on publish (Plan 04)

## Copywriting Contract Verification

From 04-UI-SPEC.md:

| Element | Status |
|---------|--------|
| "Edit Page" CTA | Plan 02, 03 |
| "Send Feedback" CTA | Plan 03 |
| "Save" button | Plan 02 |
| "Nothing here yet" + "Start by adding a section" | TODO - empty state |
| "Something went wrong. Please try again." | TODO - error state |
| "Page was edited elsewhere" heading | Plan 02 - ConflictDialog |
| "This page was edited somewhere else. Reload to see changes?" | Plan 02 - ConflictDialog |
| "Reload" / "Cancel" CTAs | Plan 02 - ConflictDialog |
| "Your account is pending" heading | Plan 02 - PendingBanner |
| "The dev team is reviewing your feedback..." | Plan 02 - PendingBanner |
| "Import from Preview" / options | Plan 02 - ImportOptionsModal |
| "Selective import" / "Import all as draft" / "Fresh template" | Plan 02 - ImportOptionsModal |

## Deferred Items (Phase 5+)

- TOTP 2FA for owner accounts (AUTH-01)
- Session management with refresh tokens (AUTH-02)
- Dev team authentication for dashboard (AUTH-04)
- Custom domain support (DNS-01)
- SSL certificate provisioning (DNS-02)
- Email sending via SendGrid (placeholder in Plan 01)
- Screenshot capture for annotations (placeholder in Plan 03)
- Template thumbnails and descriptions (placeholder in Plan 02)
- S3 presigned URLs for image uploads (placeholder in Plan 04)

## Quality Gate Checklist

- [x] PLAN.md files created in phase directory (4 plans)
- [x] Each plan has valid frontmatter (phase, slug, wave, depends_on, requirements, files_modified, autonomous)
- [x] Tasks are specific and actionable
- [x] Every task has `<read_first>` with at least the file being modified
- [x] Every task has `<acceptance_criteria>` with grep-verifiable conditions
- [x] Every `<action>` contains concrete values (no "align X with Y")
- [x] Dependencies correctly identified (wave 2-4 depend on wave 1)
- [x] Waves assigned for parallel execution (waves 1-4 are sequential but plans in each wave are parallelizable)
- [x] must_haves derived from phase goal

---

## Verification Findings

**Status: gaps_found** — 2026-03-25

### Codebase Verification

Verified actual implementation against plan acceptance criteria:

#### ✅ Satisfied

| Criterion | Evidence |
|-----------|----------|
| Schema tables (payloadPages, payloadMedia, etc.) | All 5 tables defined in schema.ts with proper tenantId + foreign keys |
| RLS policies for all Payload tables | All 5 RLS policies in rls.ts using tenant isolation pattern |
| Magic link auth (createMagicLink, verifyMagicLink) | src/production/auth/magic-link.ts with crypto.randomBytes(32) token |
| Session management (createSessionToken, verifySessionToken) | src/production/auth/session.ts with HMAC-SHA256 signed tokens |
| Tiptap editor with toolbar | src/production/components/editor/tiptap-editor.tsx + tiptap-toolbar.tsx |
| Mobile accordion (one section at a time) | src/production/components/editor/mobile-accordion.tsx with expand/collapse |
| SectionDragHandle 44px touch target | min-width/min-height: 44px in section-drag-handle.tsx |
| SaveButton states (idle/saving/saved/error) | src/production/components/editor/save-button.tsx |
| ConflictDialog exact copy | "Page was edited elsewhere" / "This page was edited somewhere else. Reload to see changes?" |
| TemplatePicker + ImportOptionsModal | src/production/components/editor/template-picker.tsx + import-options-modal.tsx |
| EmptyState/ErrorState/PendingBanner | All three exist with correct copy |
| ISR revalidate: 60 | src/production/app/[domain]/page.tsx line 5 |
| On-demand revalidation webhook | src/production/app/api/revalidate/route.ts + routes/api/payload/revalidate/route.ts |
| Payload CMS collections with hooks | src/production/collections/index.ts with afterChange hook triggering revalidation |
| Tenant fields hidden in Payload | PagesCollection: tenantId/businessId marked `hidden: true` |
| Annotation overlay + pins | src/production/components/feedback/annotation-overlay.tsx + annotation-pin.tsx |
| Annotation panel with submit/cancel | src/production/components/feedback/annotation-panel.tsx |
| Dev dashboard (AnnotationCard, AnnotationList, AnnotationDetail) | All 3 dashboard components exist |
| Feedback API routes | src/production/routes/preview/feedback/route.ts + dashboard feedback routes |

#### ❌ Gaps Found

| Gap | Severity | Evidence |
|-----|----------|----------|
| **PROD-01: CDN ISR page content lookup implemented** | FIXED | `src/production/app/[domain]/page.tsx` — getBusinessByDomain() queries customDomains + businesses; getProductionContent() queries published page + settings. ISR page can now serve actual business content. |
| **Editor page `onSectionUpdate` no-op** | FIXED | `src/production/app/editor/page.tsx` — handleSectionUpdate now rebuilds full doc from sections and calls handleSave on every section mutation. |
| **Editor page `onSectionReorder` no-op** | FIXED | `src/production/app/editor/page.tsx` — handleSectionReorder splices array, rebuilds full doc, calls handleSave with new order. |
| **Editor page `onImageReplace` no-op** | DEFERRED | `src/production/app/editor/page.tsx` — placeholder with console.warn; S3 presigned URL flow is separate feature (PROD-04 deferred). |
| **Template `onSelect` no-op** | MEDIUM | `src/production/app/editor/page.tsx:115-117` — creates empty page, doesn't actually use selected template ID. |
| **Template thumbnails/descriptions** | MEDIUM | `TemplatePicker` receives `templates={[]}` — no actual template data loaded. |

### Root Cause

The `src/production/app/[domain]/page.tsx` file has two placeholder functions that were never implemented:

```typescript
async function getBusinessByDomain(domain: string) {
  // TODO: Implement domain lookup
  return null;
}

async function getProductionContent(domain: string) {
  // TODO: Implement content lookup
  return null;
}
```

This is the same pattern noted in the Phase 4 plan 04 notes: "Full Payload CMS admin UI at `/admin` requires separate implementation" and "Custom domain routing via `[domain]` param needs DNS configuration (Phase 6)".

### Impact by Requirement

- **PROD-01**: ✅ FIXED — getBusinessByDomain() + getProductionContent() implemented, ISR page serves actual business content
- **PROD-02**: ✅ MOSTLY FIXED — onSectionUpdate + onSectionReorder wired; onImageReplace deferred (S3 presigned URLs)
- **PROD-03**: Tenant isolation fully implemented in schema + RLS → ✅ SATISFIED
- **PROD-04**: ISR + CDN revalidation infrastructure exists → ✅ SATISFIED (serving, not editing)

### Remaining Gap (v1.1)

1. **Image replace with S3**: `handleImageReplace` is a placeholder — needs S3 presigned URL flow (PROD-04 deferred item)
2. **Template picker**: `onSelect` creates empty page, doesn't use selected template ID; `templates={[]}` — no template data loaded

### Deferred to v1.1 Hardening

- All deferred items listed above remain deferred
- Phase 4 verification gap closure should be included in v1.1 scope
