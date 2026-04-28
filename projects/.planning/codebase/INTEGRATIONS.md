# Integrations: SEO Extractor

## Google Analytics 4 (GA4)
- **API**: `analyticsdata v1beta` via `googleapiclient.discovery.build`
- **Auth**: Service account credentials (`service_account.Credentials.from_service_account_file`)
- **Scope**: `https://www.googleapis.com/auth/analytics.readonly`
- **Data pulled**: Organic search sessions, users by source
- **Config keys**: `google_analytics.property_id`, `google_analytics.credentials_path`

## Google Search Console (GSC)
- **API**: `searchconsole v1` via `googleapiclient.discovery.build`
- **Auth**: Same service account credentials
- **Scope**: `https://www.googleapis.com/auth/webmasters.readonly`
- **Data pulled**: Query-level clicks, impressions, CTR, position
- **Config keys**: `google_search_console.credentials_path`
- **Site URL format**: `sc-domain:{domain}`

## Ahrefs (planned)
- **API key**: `ahrefs_api_key` in config (defined but not integrated)
- No actual Ahrefs calls in current code

## Mock Data Fallbacks
When APIs unavailable or fail, graceful degradation via:
- `_mock_ga_keywords(domain)` — returns random SEO keyword patterns
- `_mock_gsc_keywords(domain)` — returns random GSC query patterns

## Known Integration Issues
- **401 Token Refresh Errors**: `ga_results.json` shows all 5 domains fail with "Token refresh: 401" — credentials are expired
- No retry logic for expired tokens
- No refresh token rotation logic
