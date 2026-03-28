# AutoHarness — Quick Start Guide

## What AutoHarness Does

AutoHarness is a conversational pipeline generator. You describe what you want in plain English, and it builds a working ETL pipeline through a guided Q&A session with specialist subagents.

**Input:** A high-level goal like "sync my PostgreSQL sales DB to BigQuery every night"

**Output:** A verified `pipeline.yaml` manifest and a runnable `pipeline.py` script

---

## Starting a New Pipeline

```bash
/autoharness sync PostgreSQL sales DB to BigQuery warehouse daily at 2am
```

The orchestrator will ask you questions one at a time. Answer them and press Enter. After all questions are answered, it spawns specialist subagents for each stage (ingestion → transform → validate → output), verifies their outputs, and compiles your final pipeline.

---

## Resuming an Interrupted Session

If a session was interrupted, resume it:

```bash
/autoharness --resume <session-id>
```

To find incomplete sessions, say "list my incomplete sessions" and the orchestrator will show them via `SessionTracker`.

---

## What Gets Generated

After a successful run, you'll have:

| File | Description |
|------|-------------|
| `context.json` | Full pipeline state (in `~/.claude/auto-pipeline/contexts/{session-id}/`) |
| `pipeline.yaml` | Declarative manifest of the entire pipeline |
| `pipeline.py` | Runnable Python code for the pipeline |

---

## Running Your Pipeline

```bash
# Full run
python pipeline.py

# Dry-run (validates syntax and schema without executing)
python pipeline.py --dry-run
```

---

## Configuration

Edit `~/.claude/skills/autoharness/config/defaults.yaml`:

```yaml
max_iterations_per_stage: 3   # Max specialist redeploy attempts per stage
auto_advance_threshold: "high" # Auto-advance only when confidence is high
output_dir: ~/.claude/auto-pipeline
stages:
  - ingestion
  - transform
  - validate
  - output
```

---

## Architecture

```
autoharness.md                    # Main skill file (orchestrator)
├── specialists/
│   ├── ingestion.md              # Source data extraction specialist
│   ├── transform.md             # Data transformation specialist
│   ├── validate.md               # Data quality validation specialist
│   └── output.md                 # Destination write specialist
├── lib/
│   ├── pipeline_context.py       # JSON state read/write (5 tests)
│   ├── verifier.py               # Definition-of-done checks (9 tests)
│   ├── compiler.py               # YAML + Python generation (3 tests)
│   ├── dry_run.py                # Syntax/schema/connection validation (3 tests)
│   ├── orchestrator.py           # Session resume + stuck detection (4 tests)
│   └── test_integration.py       # Full flow integration test (1 test)
└── config/
    └── defaults.yaml             # Default configuration
```

**25 tests total — all passing.**
