# Conventions: SEO Extractor

## Code Style
- **Formatter**: Not enforced (no black, ruff, autopepp)
- **Linter**: Not configured
- **Type hints**: Used (`typing.Dict`, `List`, `Optional`, `Tuple`)
- **Docstrings**: Google-style class docstring; no method docstrings for private methods

## Error Handling
- **API calls**: `try/except Exception` — logs to stdout and returns empty result on failure
- **File I/O**: No explicit error handling for missing config or output dir failures
- **Pattern**: Fail silently, let batch continue

## Patterns
- **Config**: JSON file loaded at init, returns `{}` if missing
- **Mock fallback**: `if not AVAILABLE:` check before API calls, returns mock data
- **Deduplication**: Dict-based merge keyed by keyword/query string
- **CLI**: `argparse` with multi-mode input (file, arg list, JSON)

## Imports
- Standard library first, then third-party
- Graceful optional imports for Google APIs (`try/except ImportError`)
- `tqdm` always imported at top (no lazy loading)
