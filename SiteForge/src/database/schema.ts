import { pgTable, uuid, text, timestamp, jsonb, index, integer } from 'drizzle-orm/pg-core';

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('businesses_tenant_idx').on(table.tenantId),
]);

export const googleMapsRaw = pgTable('google_maps_raw', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  url: text('url'),
  raw: jsonb('raw').notNull(),
  validated: jsonb('validated'),
  validationErrors: jsonb('validation_errors'),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
}, (table) => [
  index('google_maps_raw_tenant_idx').on(table.tenantId),
  index('google_maps_raw_business_idx').on(table.businessId),
]);

export const instagramRaw = pgTable('instagram_raw', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  url: text('url'),
  raw: jsonb('raw').notNull(),
  validated: jsonb('validated'),
  validationErrors: jsonb('validation_errors'),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
}, (table) => [
  index('instagram_raw_tenant_idx').on(table.tenantId),
  index('instagram_raw_business_idx').on(table.businessId),
]);

export const facebookRaw = pgTable('facebook_raw', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  url: text('url'),
  raw: jsonb('raw').notNull(),
  validated: jsonb('validated'),
  validationErrors: jsonb('validation_errors'),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
}, (table) => [
  index('facebook_raw_tenant_idx').on(table.tenantId),
  index('facebook_raw_business_idx').on(table.businessId),
]);

export const yelpRaw = pgTable('yelp_raw', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  url: text('url'),
  raw: jsonb('raw').notNull(),
  validated: jsonb('validated'),
  validationErrors: jsonb('validation_errors'),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
}, (table) => [
  index('yelp_raw_tenant_idx').on(table.tenantId),
  index('yelp_raw_business_idx').on(table.businessId),
]);

export const googleReviewsRaw = pgTable('google_reviews_raw', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  url: text('url'),
  raw: jsonb('raw').notNull(),
  validated: jsonb('validated'),
  validationErrors: jsonb('validation_errors'),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
}, (table) => [
  index('google_reviews_raw_tenant_idx').on(table.tenantId),
  index('google_reviews_raw_business_idx').on(table.businessId),
]);

export const scrapeJobs = pgTable('scrape_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  status: text('status').notNull().default('pending'),
  parentJobId: text('parent_job_id'),
  sources: jsonb('sources').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
}, (table) => [
  index('scrape_jobs_tenant_idx').on(table.tenantId),
  index('scrape_jobs_business_idx').on(table.businessId),
  index('scrape_jobs_status_idx').on(table.status),
]);

export const generatedImages = pgTable('generated_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  sourcePostId: text('source_post_id'),
  url: text('url').notNull(),
  source: text('source').notNull(),
  engagement: text('engagement'),
  caption: text('caption'),
  qualityScore: text('quality_score'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('generated_images_tenant_idx').on(table.tenantId),
  index('generated_images_business_idx').on(table.businessId),
]);

export const generatedContent = pgTable('generated_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  headline: text('headline').notNull(),
  tagline: text('tagline').notNull(),
  about: text('about').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('generated_content_tenant_idx').on(table.tenantId),
  index('generated_content_business_idx').on(table.businessId),
]);

export const generatedTestimonials = pgTable('generated_testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  author: text('author').notNull(),
  text: text('text').notNull(),
  rating: text('rating').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('generated_testimonials_tenant_idx').on(table.tenantId),
  index('generated_testimonials_business_idx').on(table.businessId),
]);

export const previewLinks = pgTable('preview_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  urlHash: text('url_hash').notNull().unique(),  // The {hash} in biz-{hash}.preview.siteforge.io
  s3Key: text('s3_key').notNull(),  // S3 object key for this preview
  status: text('status').notNull().default('active'),  // active | expired | claimed
  expiresAt: timestamp('expires_at').notNull(),  // 30 days from creation
  createdAt: timestamp('created_at').defaultNow().notNull(),
  viewedAt: timestamp('viewed_at'),  // First view timestamp
  viewCount: text('view_count').notNull().default('0'),  // Total views
  claimedAt: timestamp('claimed_at'),  // When business owner claimed
}, (table) => [
  index('preview_links_tenant_idx').on(table.tenantId),
  index('preview_links_business_idx').on(table.businessId),
  index('preview_links_url_hash_idx').on(table.urlHash),
  index('preview_links_expires_at_idx').on(table.expiresAt),
]);

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull(),
  previewLinkId: uuid('preview_link_id').notNull().references(() => previewLinks.id),
  eventType: text('event_type').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => [
  index('analytics_events_tenant_idx').on(table.tenantId),
  index('analytics_events_business_idx').on(table.businessId),
  index('analytics_events_preview_link_idx').on(table.previewLinkId),
  index('analytics_events_type_idx').on(table.eventType),
  index('analytics_events_timestamp_idx').on(table.timestamp),
]);

// Production site tables (Payload CMS)
export const payloadPages = pgTable('payload_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  title: text('title').notNull().default('Untitled'),
  slug: text('slug').notNull(),
  content: jsonb('content').notNull().default({}),  // Tiptap JSON
  templateId: text('template_id'),
  status: text('status').notNull().default('draft'),  // draft | published
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  version: integer('version').notNull().default(1),
}, (table) => [
  index('payload_pages_tenant_idx').on(table.tenantId),
  index('payload_pages_business_idx').on(table.businessId),
  index('payload_pages_slug_idx').on(table.slug),
]);

export const payloadMedia = pgTable('payload_media', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  filename: text('filename').notNull(),
  mimeType: text('mime_type').notNull(),
  s3Key: text('s3_key').notNull(),  // S3 key following {tenantId}/{businessId}/media/{filename}
  size: integer('size').notNull(),
  width: integer('width'),
  height: integer('height'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('payload_media_tenant_idx').on(table.tenantId),
  index('payload_media_business_idx').on(table.businessId),
]);

export const payloadSiteSettings = pgTable('payload_site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  siteName: text('site_name').notNull(),
  tagline: text('tagline'),
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  address: text('address'),
  socialLinks: jsonb('social_links').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('payload_settings_tenant_idx').on(table.tenantId),
]);

export const ownerAccounts = pgTable('owner_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  email: text('email').notNull().unique(),
  magicLinkToken: text('magic_link_token'),
  magicLinkExpiresAt: timestamp('magic_link_expires_at'),
  status: text('status').notNull().default('pending'),  // pending | active | disabled
  enabledAt: timestamp('enabled_at'),  // When dev team enabled
  twoFactorEnabled: integer('two_factor_enabled').notNull().default(0),  // boolean as integer
  twoFactorEnabledAt: timestamp('two_factor_enabled_at'),  // When 2FA was enabled
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('owner_accounts_tenant_idx').on(table.tenantId),
  index('owner_accounts_email_idx').on(table.email),
  index('owner_accounts_magic_link_token_idx').on(table.magicLinkToken),
]);

export const totpSecrets = pgTable('totp_secrets', {
  accountId: uuid('account_id').primaryKey().references(() => ownerAccounts.id),
  encryptedSecret: text('encrypted_secret').notNull(),  // AES-256-GCM encrypted
  createdAt: timestamp('created_at').defaultNow().notNull(),
  verifiedAt: timestamp('verified_at'),  // null until first successful verification
});

export const refreshTokens = pgTable('refresh_tokens', {
  tokenHash: text('token_hash').primaryKey(),  // SHA256 of the opaque token
  accountId: uuid('account_id').notNull().references(() => ownerAccounts.id),
  tenantId: uuid('tenant_id').notNull(),
  version: integer('version').notNull().default(1),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('refresh_tokens_account_idx').on(table.accountId),
]);

export const feedbackAnnotations = pgTable('feedback_annotations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  previewLinkId: uuid('preview_link_id').notNull().references(() => previewLinks.id),
  ownerAccountId: uuid('owner_account_id').notNull().references(() => ownerAccounts.id),
  pageUrl: text('page_url').notNull(),
  pinX: integer('pin_x').notNull(),  // Percentage position 0-100
  pinY: integer('pin_y').notNull(),
  comment: text('comment').notNull(),
  screenshotUrl: text('screenshot_url'),
  status: text('status').notNull().default('open'),  // open | resolved
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: uuid('resolved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('feedback_annotations_tenant_idx').on(table.tenantId),
  index('feedback_annotations_business_idx').on(table.businessId),
  index('feedback_annotations_preview_link_idx').on(table.previewLinkId),
  index('feedback_annotations_status_idx').on(table.status),
]);

export const customDomains = pgTable('custom_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id),
  businessId: uuid('business_id').notNull().references(() => businesses.id),
  domain: text('domain').notNull().unique(),  // e.g., "www.restaurantname.com"
  cnameTarget: text('cname_target').notNull(),  // e.g., "abc123.cname.siteforge.io"
  verificationStatus: text('verification_status').notNull().default('pending'),  // pending | verified | failed
  sslStatus: text('ssl_status').notNull().default('pending'),  // pending | provisioned | failed
  sslCertificateId: text('ssl_certificate_id'),  // Cloudflare Origin cert ID
  sslExpiresAt: timestamp('ssl_expires_at'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('custom_domains_tenant_idx').on(table.tenantId),
  index('custom_domains_business_idx').on(table.businessId),
  index('custom_domains_domain_idx').on(table.domain),
  index('custom_domains_verification_status_idx').on(table.verificationStatus),
]);

export async function withTenant<T>(
  tenantId: string,
  pool: { connect(): Promise<{ query(sql: string, params?: unknown[]): Promise<unknown>; release(): void }> },
  fn: () => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query(`SET LOCAL app.current_tenant = $1`, [tenantId]);
    return await fn();
  } finally {
    client.release();
  }
}
