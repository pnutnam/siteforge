---
phase: 5
slug: authentication-security
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already installed v4.1.1) |
| **Config file** | `vitest.config.ts` (exists in project root) |
| **Quick run command** | `vitest run src/auth --reporter=dot` |
| **Full suite command** | `vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run src/auth --reporter=dot`
- **After every plan wave:** Run `vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | AUTH-02 | unit | `vitest run src/auth/jwt.test.ts` | ? (new) | ⬜ pending |
| 05-01-02 | 01 | 1 | AUTH-02 | unit | `vitest run src/auth/jwt.test.ts` | ? (new) | ⬜ pending |
| 05-01-03 | 01 | 1 | AUTH-02 | unit | `vitest run src/auth/jwt.test.ts` | ? (new) | ⬜ pending |
| 05-01-04 | 01 | 1 | AUTH-02 | unit | `vitest run src/auth/types.test.ts` | ? (new) | ⬜ pending |
| 05-01-05 | 01 | 1 | AUTH-02 | integration | `vitest run src/auth/refresh.test.ts` | ? (new) | ⬜ pending |
| 05-01-06 | 01 | 1 | AUTH-02 | integration | `vitest run src/auth/refresh.test.ts` | ? (new) | ⬜ pending |
| 05-01-07 | 01 | 1 | AUTH-02 | unit | `vitest run src/auth/schema.test.ts` | ? (new) | ⬜ pending |
| 05-02-01 | 02 | 2 | AUTH-01 | unit | `vitest run src/auth/totp.test.ts` | ? (new) | ⬜ pending |
| 05-02-02 | 02 | 2 | AUTH-01 | unit | `vitest run src/auth/totp.test.ts` | ? (new) | ⬜ pending |
| 05-02-03 | 02 | 2 | AUTH-01 | unit | `vitest run src/auth/totp.test.ts` | ? (new) | ⬜ pending |
| 05-02-04 | 02 | 2 | AUTH-04 | unit | `vitest run src/middleware/auth.test.ts` | ? (new) | ⬜ pending |
| 05-02-05 | 02 | 2 | AUTH-01 | unit | `vitest run src/auth/2fa-status.test.ts` | ? (new) | ⬜ pending |
| 05-03-01 | 03 | 2 | AUTH-03 | unit | `vitest run src/auth/rate-limiter.test.ts` | ? (new) | ⬜ pending |
| 05-03-02 | 03 | 2 | AUTH-03 | unit | `vitest run src/auth/rate-limiter.test.ts` | ? (new) | ⬜ pending |
| 05-03-03 | 03 | 2 | AUTH-03 | unit | `vitest run src/auth/rate-limiter.test.ts` | ? (new) | ⬜ pending |
| 05-03-04 | 03 | 2 | AUTH-02 | integration | `vitest run src/auth/refresh.test.ts` | ? (new) | ⬜ pending |
| 05-03-05 | 03 | 2 | AUTH-04 | unit | `vitest run src/auth/tenant-isolation.test.ts` | ? (new) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/auth/jwt.ts` + `src/auth/jwt.test.ts` — JWT signing/verification tests
- [ ] `src/auth/types.ts` + `src/auth/types.test.ts` — Auth type tests
- [ ] `src/auth/totp.ts` + `src/auth/totp.test.ts` — TOTP generation/verification tests
- [ ] `src/auth/rate-limiter.ts` + `src/auth/rate-limiter.test.ts` — Rate limit logic tests
- [ ] `src/auth/refresh.ts` + `src/auth/refresh.test.ts` — Refresh token flow tests
- [ ] `src/auth/schema.ts` + `src/auth/schema.test.ts` — Auth schema extension tests
- [ ] `src/auth/2fa-status.ts` + `src/auth/2fa-status.test.ts` — 2FA status endpoint tests
- [ ] `src/middleware/auth.ts` + `src/middleware/auth.test.ts` — Middleware tests
- [ ] `src/auth/tenant-isolation.ts` + `src/auth/tenant-isolation.test.ts` — Cross-tenant rejection tests
- [ ] `vitest.config.ts` already exists (Phase 1) — no install needed

*All auth modules are new — Wave 0 creates stubs that become green as implementation progresses.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| QR code scans and registers with authenticator app | AUTH-01 | Requires real authenticator app | 1. Generate QR code via `/api/2fa/setup`<br>2. Scan with Google Authenticator<br>3. Verify 6-digit code accepted |
| 24-hour grace period banner displays | AUTH-01 | UI behavior | 1. Create account, don't set up 2FA<br>2. Attempt to save edits<br>3. Verify warning banner appears |

*All other behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
