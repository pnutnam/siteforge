# Testing: SEO Extractor

## Test Framework
- **None** — no test files exist in the project

## Coverage
- Manual testing via CLI
- Mock data provides offline testing capability

## Mock Data
The mock methods (`_mock_ga_keywords`, `_mock_gsc_keywords`) serve as a testing mechanism:
```python
if not GOOGLE_API_AVAILABLE:
    return self._mock_ga_keywords(domain)
```
- Generates random keyword data without API credentials
- Useful for offline development and CLI smoke testing

## Validation
- Output CSVs reviewed manually
- `ga_results.json` shows actual API error state (401s)
