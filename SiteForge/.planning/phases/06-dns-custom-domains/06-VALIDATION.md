---
phase: 6
slug: dns-custom-domains
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (already installed v4.1.1) |
| **Config file** | `vitest.config.ts` (exists in project root) |
| **Quick run command** | `vitest run src/dns --reporter=dot` |
| **Full suite command** | `vitest run --reporter=verbose` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run src/dns --reporter=dot`
- **After every plan wave:** Run `vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | DNS-01 | unit | `vitest run src/dns/types.test.ts` | ? (new) | ⬜ pending |
| 06-01-02 | 01 | 1 | DNS-01 | unit | `vitest run src/dns/validation.test.ts` | ? (new) | ⬜ pending |
| 06-01-03 | 01 | 1 | DNS-02 | unit | `vitest run src/dns/ssl-provider.test.ts` | ? (new) | ⬜ pending |
| 06-01-04 | 01 | 1 | DNS-01 | unit | `vitest run src/database/schema.test.ts` | ? (new) | ⬜ pending |
| 06-02-01 | 02 | 2 | DNS-01 | unit | `vitest run src/dns/validation.test.ts` | ? (new) | ⬜ pending |
| 06-02-02 | 02 | 2 | DNS-02 | unit | `vitest run src/dns/cloudflare-origin.test.ts` | ? (new) | ⬜ pending |
| 06-03-01 | 03 | 3 | DNS-03 | unit | `vitest run src/middleware/hostname-tenant.test.ts` | ? (new) | ⬜ pending |
| 06-03-02 | 03 | 3 | DNS-03 | integration | `vitest run src/middleware/hostname-tenant.test.ts` | ? (new) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/dns/types.ts` + `src/dns/types.test.ts` — DNS/SSL type definitions
- [ ] `src/dns/validation.ts` + `src/dns/validation.test.ts` — CNAME validation logic
- [ ] `src/dns/ssl-provider.ts` + `src/dns/ssl-provider.test.ts` — SSL provider interface
- [ ] `src/dns/cloudflare-origin.ts` + `src/dns/cloudflare-origin.test.ts` — Cloudflare Origin SSL implementation
- [ ] `src/middleware/hostname-tenant.ts` + `src/middleware/hostname-tenant.test.ts` — Hostname-based tenant resolution
- [ ] `src/database/schema.ts` — `custom_domains` table added to schema
- [ ] `vitest.config.ts` already exists (Phase 1) — no install needed

*All DNS modules are new — Wave 0 creates stubs that become green as implementation progresses.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CNAME actually resolves via dig/DNS lookup | DNS-01 | Requires live DNS propagation | 1. Add CNAME record in Cloudflare dashboard<br>2. Run `dig CNAME yourdomain.com`<br>3. Verify it resolves to `{shortId}.cname.siteforge.io` |
| Cloudflare Origin cert actually provisioned | DNS-02 | Requires Cloudflare API call | 1. Provision cert via API<br>2. Check Cloudflare SSL/TLS dashboard<br>3. Verify cert appears under Origin Certificates |
| Custom domain loads correct tenant site | DNS-03 | Requires browser/network-level test | 1. Point custom domain to Cloudflare<br>2. Visit `https://yourdomain.com`<br>3. Verify correct tenant content loads |

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
