# Structure: SEO Extractor

## Directory Layout
```
seo-extractor/
├── extract.py          # Main script (~355 lines)
├── ga_results.json     # Sample data (5 domains with errors)
├── README.md           # Setup/usage docs
└── requirements.txt    # pip dependencies
```

## Key Files

### `extract.py` — Main entry point
- `SEOExtractor` class (lines 34-315)
- `main()` function (lines 318-355)
- Shebang: `#!/usr/bin/env python3`

### `ga_results.json` — Sample output (with errors)
- Array of 5 domain profiles
- All show `error: "Token refresh: 401"`
- `keywords: []` on all entries

### `requirements.txt` — Dependencies
- 9 packages total

## Naming Conventions
- **Class**: `PascalCase` (e.g., `SEOExtractor`)
- **Methods**: `snake_case` (e.g., `extract_ga_keywords`)
- **Private methods**: `_leading_underscore` (e.g., `_mock_ga_keywords`)
- **Constants**: Not explicitly defined

## Output Files (generated at runtime)
```
output/
├── domain_summary_{timestamp}.csv
├── keywords_{timestamp}.csv
└── full_analysis_{timestamp}.json
```
