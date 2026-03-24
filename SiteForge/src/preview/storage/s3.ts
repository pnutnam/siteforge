import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Config, S3UploadOptions, PreviewFile } from './types';

// S3 key format: {tenant_id}/{business_id}/{content_hash}/index.html
// INFRA-02: Per-tenant key prefix isolation

// Config would be injected via environment or config module
const config: S3Config = {
  bucket: process.env.S3_BUCKET ?? '',
  region: process.env.AWS_REGION ?? 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  cdnBaseUrl: process.env.CDN_BASE_URL ?? '',
};

const s3Client = new S3Client({ region: config.region });

export async function uploadPreview(options: S3UploadOptions): Promise<string> {
  const key = `${options.tenantId}/${options.businessId}/${await generateContentHash(options.content)}/index.html`;

  await s3Client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: options.content,
    ContentType: options.contentType,
    CacheControl: options.cacheControl ?? 'public, max-age=86400',
  }));

  return key;
}

export async function getPreview(key: string): Promise<PreviewFile | null> {
  try {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: config.bucket,
      Key: key,
    }));

    return {
      key,
      body: Buffer.from(await response.Body.transformToByteArray()),
      contentType: response.ContentType ?? 'text/html',
      lastModified: response.LastModified ?? new Date(),
    };
  } catch (error) {
    if (error.name === 'NoSuchKey') return null;
    throw error;
  }
}

export async function deletePreview(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: key,
  }));
}

export async function listTenantPreviews(tenantId: string, businessId?: string): Promise<string[]> {
  const prefix = businessId ? `${tenantId}/${businessId}/` : `${tenantId}/`;
  const response = await s3Client.send(new ListObjectsV2Command({
    Bucket: config.bucket,
    Prefix: prefix,
  }));

  return (response.Contents ?? []).map(obj => obj.Key).filter(Boolean) as string[];
}

export function getCdnUrl(key: string): string {
  return `${config.cdnBaseUrl}/${key}`;
}

async function generateContentHash(content: Buffer): Promise<string> {
  // Use SubtleCrypto for content hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', content);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

export { config };