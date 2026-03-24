export interface CloudflareConfig {
  accountId: string;
  namespaceId: string;  // KV namespace for URL routing
  apiToken: string;
}

export interface PreviewRouting {
  hash: string;        // biz-{hash}
  s3Key: string;       // S3 object key
  tenantId: string;
  businessId: string;
  expiresAt: Date;
}