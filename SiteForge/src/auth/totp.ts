import { generateSecret, generateURI, verify } from 'otplib';
import crypto from 'crypto';

const TOTP_ISSUER = 'SiteForge';

export function generateTotpSecret(): string {
  return generateSecret();
}

export function generateTotpUri(secret: string, email: string): string {
  return generateURI({
    issuer: TOTP_ISSUER,
    label: email,
    secret,
  });
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const result = verify({ secret, token: code, window: 1 });
  return result !== null;
}

const getEncryptionKey = (): Buffer => {
  const key = process.env.TOTP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!key) {
    throw new Error('TOTP_ENCRYPTION_KEY or JWT_SECRET must be set');
  }
  return crypto.createHash('sha256').update(key).digest();
};

export function encryptTotpSecret(secret: string, key?: Buffer): string {
  const encryptionKey = key || getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptTotpSecret(encrypted: string, key?: Buffer): string {
  const encryptionKey = key || getEncryptionKey();
  const [ivBase64, authTagBase64, ciphertextBase64] = encrypted.split(':');
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const ciphertext = Buffer.from(ciphertextBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}
