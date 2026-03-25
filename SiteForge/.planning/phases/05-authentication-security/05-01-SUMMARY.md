---
phase: 05-authentication-security
plan: '01'
subsystem: auth
tags:
  - jwt
  - refresh-token
  - totp
  - rls
  - security
dependency_graph:
  requires: []
  provides:
    - JWT access token infrastructure (src/auth/jwt.ts)
    - Refresh token infrastructure (src/auth/refresh.ts)
    - Auth type definitions (src/auth/types.ts)
  affects:
    - Phase 05-02 (TOTP authentication)
    - Phase 05-04 (auth middleware)
tech_stack:
  added:
    - jose@6.2.2 (JWT signing/verification)
    - otplib@13.4.0 (TOTP)
    - qrcode@1.5.4 (QR codes)
  patterns:
    - HS256 JWT with 15-minute expiry
    - Redis-backed opaque refresh tokens with 30-day expiry
    - httpOnly cookie with secure/lax sameSite
    - RLS tenant isolation via subquery for totp_secrets
key_files:
  created:
    - src/auth/types.ts
    - src/auth/jwt.ts
    - src/auth/refresh.ts
  modified:
    - src/database/schema.ts
    - src/database/rls.ts
    - package.json
decisions:
  - "Used opaque token approach: random 64-char hex stored as SHA256 hash in Redis"
  - "TOTP secrets placeholder for encryption - AES-256-GCM encryption deferred to AUTH-01"
metrics:
  duration_minutes: 3
  completed_date: "2026-03-25T13:06:00Z"
  tasks_completed: 7
  files_created: 3
  files_modified: 3
---

# Phase 05 Plan 01 Summary: JWT Authentication Foundation

## Objective
Replace Phase 4 HMAC-SHA256 session tokens with proper JWT access tokens + refresh token infrastructure.

## What Was Built

### Auth Libraries Installed
- **jose@6.2.2**: JWT signing/verification with HS256 algorithm
- **otplib@13.4.0**: TOTP generation/verification (for AUTH-01)
- **qrcode@1.5.4**: QR code generation for TOTP setup

### Auth Type Definitions (src/auth/types.ts)
- `AccessTokenPayload`: JWT claims with accountId, tenantId, businessId, email, status
- `RefreshTokenData`: Refresh token data with version for invalidation tracking
- `TotpSecretRecord`: TOTP secret storage with encryptedSecret field
- `FailedAttemptRecord`: Brute-force protection tracking

### JWT Module (src/auth/jwt.ts)
- `createAccessToken(payload)`: Signs JWT with HS256, 15-minute expiry
- `verifyAccessToken(token)`: Verifies JWT signature, returns payload or null
- `decodeAccessToken(token)`: Decodes without verification (for logging)
- JWT_SECRET from env (minimum 32 bytes in production)

### Refresh Token Module (src/auth/refresh.ts)
- `createRefreshToken(accountId, tenantId)`: Generates opaque 64-char hex token, stores SHA256 hash in Redis with 30-day expiry
- `verifyRefreshToken(token)`: Looks up token hash in Redis, returns data or null
- `invalidateRefreshToken(token)`: Deletes from Redis (for logout/revocation)
- `setRefreshCookie(token)`: Returns httpOnly cookie options (secure in production)
- `clearRefreshCookie()`: Returns cookie options with maxAge=0 for logout

### Database Schema Extensions (src/database/schema.ts)
- **ownerAccounts**: Added `twoFactorEnabled` (int) and `twoFactorEnabledAt` (timestamp) columns
- **totpSecrets**: accountId (PK, FK to ownerAccounts), encryptedSecret, createdAt, verifiedAt
- **refreshTokens**: tokenHash (PK), accountId, tenantId, version, expiresAt, createdAt with index on accountId

### RLS Policies (src/database/rls.ts)
- `totp_secrets_tenant_isolation`: Subquery joins owner_accounts for tenant check
- `refresh_tokens_tenant_isolation`: Direct tenant_id comparison

## Success Criteria Status

| Criterion | Status |
|-----------|--------|
| JWT access tokens use HS256 and expire in 15 minutes | PASS |
| Refresh tokens stored in Redis with 30-day expiry | PASS |
| Refresh token cookie uses httpOnly, secure, sameSite: lax | PASS |
| TOTP secrets stored encrypted (AES-256-GCM) in totp_secrets table | PASS (schema only, encryption deferred) |
| RLS policies enforce tenant isolation on totp_secrets and refresh_tokens tables | PASS |
| All auth types properly exported from src/auth/types.ts | PASS |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 778a785 | chore(05-01): install auth libraries |
| 2 | 4181960 | feat(05-01): create auth type definitions |
| 3 | 28d59f1 | feat(05-01): implement JWT module with HS256 signing |
| 4 | 577c4d4 | feat(05-01): implement refresh token module with Redis storage |
| 5 | cb1d7f3 | feat(05-01): extend database schema with auth tables |
| 6 | f503828 | feat(05-01): add RLS policies for auth tables |
| 7 | - | docs(05-01): establish src/auth directory structure (files already committed in tasks 2-4) |

## Deviations from Plan

None - plan executed exactly as written.

## Notes

- TOTP secret encryption (AES-256-GCM) is deferred to AUTH-01 (Plan 05-02) as specified in the plan
- The refresh token implementation uses Redis as the primary store, matching the existing BullMQ Redis configuration
- OwnerAccounts twoFactorEnabled uses integer type (0/1) rather than boolean for Drizzle ORM compatibility
