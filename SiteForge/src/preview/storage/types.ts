export interface S3Config {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  cdnBaseUrl: string;  // Cloudflare CDN base URL
}

export interface S3UploadOptions {
  tenantId: string;
  businessId: string;
  content: Buffer;
  contentType: string;
  cacheControl?: string;
}

export interface PreviewFile {
  key: string;
  body: Buffer;
  contentType: string;
  lastModified: Date;
}