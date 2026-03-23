export const RLS_MIGRATIONS = [
  'ALTER TABLE businesses ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE google_maps_raw ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE instagram_raw ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE facebook_raw ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE yelp_raw ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE google_reviews_raw ENABLE ROW LEVEL SECURITY',
  'ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY',

  `CREATE POLICY tenant_isolation_businesses ON businesses
     FOR ALL USING (tenant_id = current_setting('app.current_tenant', true))`,
  `CREATE POLICY tenant_isolation_google_maps_raw ON google_maps_raw
     FOR ALL USING (tenant_id = current_setting('app.current_tenant', true))`,
  `CREATE POLICY tenant_isolation_instagram_raw ON instagram_raw
     FOR ALL USING (tenant_id = current_setting('app.current_tenant', true))`,
  `CREATE POLICY tenant_isolation_facebook_raw ON facebook_raw
     FOR ALL USING (tenant_id = current_setting('app.current_tenant', true))`,
  `CREATE POLICY tenant_isolation_yelp_raw ON yelp_raw
     FOR ALL USING (tenant_id = current_setting('app.current_tenant', true))`,
  `CREATE POLICY tenant_isolation_google_reviews_raw ON google_reviews_raw
     FOR ALL USING (tenant_id = current_setting('app.current_tenant', true))`,
  `CREATE POLICY tenant_isolation_scrape_jobs ON scrape_jobs
     FOR ALL USING (tenant_id = current_setting('app.current_tenant', true))`,
];
