# Stack: SEO Extractor

## Languages & Runtime
- **Python 3** — main language, no version constraint specified
- **Python stdlib** — json, os, csv, re, argparse, datetime, pathlib, typing, urllib

## Dependencies (`requirements.txt`)
| Package | Purpose |
|---------|---------|
| `google-api-python-client` | GA4 & Search Console API access |
| `google-auth-httplib2` | OAuth authentication |
| `google-auth-oauthlib` | OAuth flow helpers |
| `requests` | HTTP client (used in domain authority calculation) |
| `beautifulsoup4` | HTML parsing |
| `lxml` | XML/HTML parser backend |
| `pandas` | Dataframe operations for CSV output |
| `tqdm` | Progress bars |
| `python-dotenv` | Env var loading |

## Data Output
- **pandas** — CSV export (domain summary, keywords)
- **json** — full analysis JSON

## External APIs
- Google Analytics Data API v1beta (GA4)
- Google Search Console API v1
- Google OAuth2 service account auth

## Entry Points
```bash
python3 extract.py --domains domains.txt --output results/
python3 extract.py --domains-json profiles.json
python3 extract.py --domain-list example.com test.com
```

## Configuration
- `config.json` — JSON config file (path overridable via `--config`)
- `.env` — supported via python-dotenv (not currently used in code)
- No secret management beyond service account JSON files
