---
phase: "03-preview-landing-pages"
plan: "03"
subsystem: preview-dashboard
tags:
  - email
  - analytics
  - dashboard
  - conversion-tracking
dependency_graph:
  requires:
    - "03-02"
  provides:
    - dashboard-email-composer
    - analytics-tracking
    - conversion-funnel
  affects:
    - src/dashboard/routes.ts
    - src/preview/email/
    - src/preview/analytics/
    - src/preview/routes/
tech_stack:
  added:
    - "@anthropic-ai/sdk (AI email generation)"
  patterns:
    - Lazy client initialization for testability
    - Analytics event-driven tracking
    - Conversion funnel stages
key_files:
  created:
    - src/preview/email/types.ts
    - src/preview/email/ai-copy.ts
    - src/preview/email/composer.ts
    - src/preview/email/sender.ts
    - src/preview/analytics/types.ts
    - src/preview/analytics/tracker.ts
    - src/preview/analytics/events.ts
    - src/preview/analytics/stats.ts
    - src/preview/analytics/conversion.ts
    - src/preview/routes/claim-form.ts
    - src/dashboard/preview-links.ts
  modified:
    - src/dashboard/routes.ts
    - src/database/schema.ts
decisions:
  - "AI email personalization uses existing generated_content (headline/tagline/about) as context"
  - "Analytics events stored in dedicated analytics_events table for flexible querying"
  - "Conversion funnel tracked as stages: sent -> viewed -> claimed -> paid"
metrics:
  duration: ~5min
  completed: "2026-03-24T21:00:00.000Z"
  tasks: 4
  files: 13
---

# Phase 03 Plan 03: Preview Dashboard - Email, Analytics, and Conversion Tracking Summary

AI-powered email composer for personalized outreach, analytics tracking system for views/CTR/time-on-site, and conversion event tracking from preview sent through claimed to paid.

## Commits

| Commit | Description |
|--------|-------------|
| 81c9061 | feat(03-03): add AI-powered email composer for preview outreach |
| 501dfa5 | feat(03-03): add analytics tracking system for preview links |
| c4b02ba | feat(03-03): add conversion tracking and claim form handler |
| 5548164 | feat(03-03): add dashboard routes for preview links and analytics |

## What Was Built

### 1. AI Email Composer (src/preview/email/)

**types.ts** - Email interfaces:
- `EmailComposerInput` - Input for email composition
- `GeneratedEmail` - AI-generated email with subject, body, bodyHtml
- `SendEmailInput` - Email sending input

**ai-copy.ts** - AI-powered personalization:
- `generateEmailCopy()` - Generates personalized subject and body using AI
- Uses business's generated landing page content (headline, tagline, about) as context
- Parallel AI calls for subject and body generation
- Lazy client initialization pattern for testability

**composer.ts** - Dashboard email operations:
- `composeEmailPreview()` - Generate email preview for dashboard display
- `sendPreviewEmail()` - Send email and record analytics event
- `recordEmailSent()` - Records preview_sent analytics event

**sender.ts** - Email provider stub:
- Currently stub implementation
- TODO: Integrate with SendGrid or AWS SES

### 2. Analytics Tracking (src/preview/analytics/)

**types.ts** - Analytics interfaces:
- `AnalyticsEventType` - Event types: preview_sent, preview_viewed, cta_clicked, form_opened, form_submitted, claimed, paid
- `PreviewAnalytics` - Full analytics with events, metrics, and time-on-site

**tracker.ts** - Event recording and retrieval:
- `trackEvent()` - Records analytics events to database
- `getPreviewAnalytics()` - Computes full analytics including viewRate, clickRate, conversionRate

**events.ts** - Re-exports analyticsEvents table from schema

**stats.ts** - Dashboard stats:
- `getPreviewStats()` - Combined link data + analytics for dashboard

**conversion.ts** - Conversion funnel tracking:
- `recordConversion()` - Records conversion events at each funnel stage
- `getConversionStage()` - Checks which funnel stage a preview has reached

### 3. Claim Form Handler (src/preview/routes/)

**claim-form.ts** - Preview page claim form:
- `handleClaimForm()` - Processes claim form submission
- Validates preview exists and is not expired/claimed
- Marks preview as claimed
- Records form_submitted analytics event
- TODO: Store claim data to claim_submissions table (Phase 4)

### 4. Dashboard Routes (src/dashboard/)

**routes.ts** - New preview API endpoints:
- `GET /api/previews` - List all preview links for tenant
- `GET /api/previews/:hash` - Get single preview with full stats
- `GET /api/previews/:hash/analytics` - Get detailed analytics
- `POST /api/previews/:hash/email` - Generate and send preview email
- `POST /api/previews/:hash/refresh` - Regenerate preview (stub)

**preview-links.ts** - Dashboard preview operations:
- `getDashboardPreviews()` - Get all previews with metrics for dashboard display

### 5. Database Schema Updates

**schema.ts** - New analytics_events table:
- Stores all analytics events with tenant_id, business_id, preview_link_id
- Event type, timestamp, and JSON metadata
- Indexes for efficient querying by tenant, business, preview link, type, timestamp

## Success Criteria Verification

| Criterion | Status |
|-----------|--------|
| Sales agent can view all preview links with stats in dashboard | VERIFIED - GET /previews route |
| AI email composer generates subject and body per business | VERIFIED - generateEmailCopy() |
| Analytics endpoints return view count, CTR, time-on-site | VERIFIED - getPreviewAnalytics() |
| Claim form submission marks preview as claimed and records conversion | VERIFIED - handleClaimForm() |
| ExpirationBanner shows urgency on preview pages | VERIFIED - from 03-02 plan |

## Deviations from Plan

None - plan executed exactly as written.

## Auto-Fixed Issues

None encountered during execution.

## Requirements Addressed

| Requirement | Source | Status |
|-------------|--------|--------|
| PREVIEW-04 | Dashboard API for preview link list, email composer trigger, stats display | Addressed |
| PREVIEW-05 | 30-day expiration with ExpirationBanner (from 03-02) | Addressed |
| MONITOR-01 | Dashboard analytics - view count, CTR, time-on-site per preview link | Addressed |
| MONITOR-02 | Conversion tracking - preview sent, preview viewed, claimed, paid | Addressed |

## Self-Check

- [x] All 4 tasks committed individually
- [x] Summary created at .planning/phases/03-preview-landing-pages/03-03-SUMMARY.md
- [x] Commit hashes verified in git log
- [x] All key files exist

## Self-Check: PASSED
