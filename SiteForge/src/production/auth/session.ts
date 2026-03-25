import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const SESSION_COOKIE_NAME = 'sf_session';
const SESSION_EXPIRY_DAYS = 30;

export interface SessionData {
  accountId: string;
  tenantId: string;
  businessId: string;
  email: string;
  status: 'pending' | 'active' | 'disabled';
}

/**
 * Create session token (signed JWT-like token using HMAC-SHA256).
 * In Phase 5 this will be replaced with proper JWT + refresh tokens.
 */
export function createSessionToken(data: SessionData): string {
  const payload = JSON.stringify(data);
  const payloadBase64 = Buffer.from(payload).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payloadBase64)
    .digest('base64url');
  return `${payloadBase64}.${signature}`;
}

/**
 * Verify and decode session token.
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());
    return payload as SessionData;
  } catch {
    return null;
  }
}

/**
 * Get session cookie options.
 */
export function getSessionCookieOptions(maxAge: number = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}
