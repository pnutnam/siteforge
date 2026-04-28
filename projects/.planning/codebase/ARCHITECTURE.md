# Architecture: SEO Extractor

## Pattern
Single-class monolith — `SEOExtractor` handles all extraction, merging, and output.

## Class: `SEOExtractor`

### Methods
| Method | Responsibility |
|--------|----------------|
| `__init__` | Load config |
| `_load_config` | Parse config.json |
| `extract_ga_keywords` | Pull GA4 organic search data |
| `extract_search_console_keywords` | Pull GSC query data |
| `_mock_ga_keywords` | Fallback mock GA data |
| `_mock_gsc_keywords` | Fallback mock GSC data |
| `calculate_domain_authority` | Estimate DA from traffic signals |
| `analyze_domain_seo` | Orchestrate full domain analysis |
| `_merge_keywords` | Deduplicate GA + GSC keywords |
| `process_domains` | Batch process domain list |
| `_save_results` | Write CSV/JSON outputs |

## Data Flow
```
analyze_domain_seo(domain)
  ├── extract_ga_keywords(domain)
  │     └── [GA4 API] or _mock_ga_keywords
  ├── extract_search_console_keywords(domain)
  │     └── [GSC API] or _mock_gsc_keywords
  ├── _merge_keywords(ga_data, gsc_data)
  │     └── deduplicate by keyword/query
  └── calculate_domain_authority(domain)
        └── estimate DA from traffic

process_domains(domains)
  └── tqdm loop over analyze_domain_seo
        └── _save_results (CSV + JSON)
```

## Key Design Decisions
- **Graceful degradation**: If Google APIs unavailable, falls back to mock data silently
- **No persistent state**: Results held in memory, flushed to disk after batch
- **CLI-driven**: All behavior triggered via `main()` argparse parsing
- **Timestamped outputs**: Each run creates unique output files to avoid overwrites
