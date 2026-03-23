import { createBusinessScrapeFlow } from './queue';
import { SourceType } from './queue';
import { pool } from '../database/pool';
import { withTenant } from '../database/schema';

export interface StartScrapeInput {
  businessId: string;
  tenantId: string;
  name: string;
  address: string;
  url?: string;
  sources?: SourceType[];
}

/**
 * Start a scrape job for a business - creates parent job that fans out to 5 children (PIPELINE-01)
 */
export async function startBusinessScrape(input: StartScrapeInput) {
  const sources = input.sources ?? ['google_maps', 'instagram', 'facebook', 'yelp', 'google_reviews'];

  await withTenant(input.tenantId, pool, async () => {
    await pool.query(
      `INSERT INTO businesses (id, tenant_id, name, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO NOTHING`,
      [input.businessId, input.tenantId, input.name, null, input.address]
    );
  });

  const flow = await createBusinessScrapeFlow({
    businessId: input.businessId,
    tenantId: input.tenantId,
    name: input.name,
    url: input.url ?? '',
    sources,
  });

  return flow;
}
