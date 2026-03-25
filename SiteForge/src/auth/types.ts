export interface AccessTokenPayload {
  accountId: string;
  tenantId: string;
  businessId: string;
  email: string;
  status: 'pending' | 'active' | 'disabled';
  iat?: number;
  exp?: number;
}

export interface RefreshTokenData {
  accountId: string;
  tenantId: string;
  version: number;  // For token invalidation tracking
}

export interface TotpSecretRecord {
  accountId: string;
  encryptedSecret: string;  // AES-256-GCM encrypted
  createdAt: Date;
  verifiedAt: Date | null;   // null until first successful verification
}

export interface FailedAttemptRecord {
  accountId: string;
  attempts: number;
  windowStart: number;  // Unix timestamp ms
  lockedUntil: number | null;  // Unix timestamp ms, null if not locked
}
