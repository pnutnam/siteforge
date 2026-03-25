import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import type { AccessTokenPayload } from './types.js';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.warn('JWT_SECRET not set, generating temporary secret');
    return crypto.randomBytes(64);
  }
  if (secret.length < 32 && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be at least 32 bytes');
  }
  return new TextEncoder().encode(secret);
};

const JWT_SECRET = getJwtSecret();

export async function createAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = decodeJwt(token);
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}
