import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';

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
