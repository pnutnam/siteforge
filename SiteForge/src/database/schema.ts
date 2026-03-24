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
