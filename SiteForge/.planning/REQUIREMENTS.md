# Requirements: SiteForge

**Defined:** 2026-03-25
**Core Value:** Every local business deserves a website that sells itself using what's already working — their own social posts and reviews.

## v1.2 Requirements

Requirements for preview landing page completion. Each maps to roadmap phases.

### Preview Landing Pages

- [ ] **PREVIEW-01**: System generates a static landing page HTML from scraped business data when build threshold is met
- [ ] **PREVIEW-02**: When user selects a template, the page populates with actual scraped business content (photos, reviews, copy)
- [ ] **PREVIEW-03**: Preview assets (images, CSS) upload to S3 via presigned URLs and are served via Cloudflare CDN
- [ ] **PREVIEW-04**: Preview URL is delivered to business owner via SendGrid email with the unique link
- [ ] **PREVIEW-05**: Dashboard shows preview page views, click-through rate, and time-on-site analytics

### Template System

- [ ] **TEMPL-01**: Templates are loaded from storage (file system or S3) with name, description, thumbnail, and content schema
- [ ] **TEMPL-02**: Template onSelect handler populates the editor with the selected template's structure and scraped content mapped into sections

### Image Upload

- [ ] **IMG-01**: Editor image replace flow uses S3 presigned URLs — client requests URL from API, uploads directly to S3, returns final URL

### Authentication & Security (carry-over gaps)

- [ ] **AUTH-01**: TOTP 2FA verify endpoint enforces rate limiting (5 attempts per minute per account)
- [ ] **AUTH-02**: Session management API routes enforce rate limiting on all sensitive endpoints

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Payments

- **PAY-01**: Owner can subscribe to a $50/mo plan via Stripe
- **PAY-02**: Owner can manage billing (update card, cancel subscription)
- **PAY-03**: Access to production site requires active subscription

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| White-labeling | Each business gets platform-hosted site |
| Blog/CMS features beyond basic edits | No posts, events, booking in v1 |
| Mobile native app | Responsive web only |
| Multi-location support | One site per business in v1 |
| Real-time collaborative editing | Single-owner editing is fine for local businesses |
| Automated social posting | One-way read only, no posting back to platforms |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

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

**Coverage:**
- v1.2 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 for v1.2 milestone*
