# Concerns: SEO Extractor

## Expired Credentials
- **All 5 domains in `ga_results.json` show 401 token refresh errors**
- No credential refresh logic implemented
- Will fail in production until credentials are renewed

## No Ahrefs Integration
- `ahrefs_api_key` defined in config documentation but never used
- `calculate_domain_authority` uses only rough traffic-based heuristics, not real backlink data
- Domain authority scores are estimates, not actual Majestic/ Moz/ Ahrefs DA

## Error Handling
- API failures are logged to stdout but otherwise silently ignored
- A single domain's failure doesn't stop the batch, but also doesn't surface the error prominently
- No retry logic for transient failures

## Missing Features
- No rate limiting on API calls
- No caching of results
- No incremental updates — every run re-fetches all data

## Security
- Service account JSON path stored in plaintext config
- No `.gitignore` to prevent accidental credential commits (but no credentials present yet)
- `python-dotenv` imported but not actively used

## Code Quality
- No type checking enforced
- No tests
- `calculate_domain_authority` has dead/commented code (Majestic API reference)
