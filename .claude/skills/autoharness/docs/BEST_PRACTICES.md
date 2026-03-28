# AutoHarness — Best Practices Guide

## Pipeline Design

### Start with a Clear Goal

Bad: "sync some data"
Better: "sync my PostgreSQL orders and customers tables to BigQuery every night at 2am, only new orders since last run"

The more specific you are upfront, the fewer questions you'll be asked.

---

### Prefer Incremental Over Full Reload

Full reloads are simpler but become expensive at scale. Always prefer incremental loads when possible.

For incremental loads, you need a reliable change-tracking column:
- `updated_at` / `modified_at` — most common, works well
- `id` with monotonic increasing IDs — works but misses updates to existing rows
- `created_at` only — only captures new rows, not updates
- Database-native CDC (PostgreSQL logical replication, MySQL binlog) — most robust but complex

If you don't have a change-tracking column, either add one to your schema or use a full reload with date-based filtering.

---

### Use Environment Variable References for Credentials

Always reference credentials via environment variables, never hardcode them:

```python
# Good
conn_str = os.environ["SALES_DB_CREDENTIALS"]

# Bad
conn_str = "postgresql://user:password@db.example.com:5432/sales"
```

In the specialist prompts, use the `${CREDENTIAL_REF}` syntax so credentials are never written to disk in plaintext.

---

### Name Your Incremental Keys Precisely

When asked for the incremental key, use the exact column name including schema if applicable:

- Good: `updated_at`, `orders.modified_at`
- Bad: `timestamp`, `the date field`

---

## Specialist Interaction

### Answer One Question at a Time

The orchestrator asks questions sequentially for a reason — each answer narrows down the design. Don't try to answer multiple questions at once unless the orchestrator prompts you to.

---

### Be Specific About Tables and Schemas

When asked which tables to sync, provide exact names:

```
tables: ["public.orders", "public.order_items", "public.customers"]
```

Avoid "discover all" unless you genuinely need everything — it produces large pipelines and long sync times.

---

### Ask for Help if Stuck

If the orchestrator's question is unclear or you don't know the answer, say so. The stuck detection will kick in after 3 failed attempts, but you can also escalate early by saying "I don't know, what do you recommend?"

---

## Writing Transform Logic

### Keep Transforms Focused

Each transform function should do one thing well. Don't try to do filtering, aggregation, and type conversion in the same function.

Good:
```python
def normalize__dates(df):
    """Convert all date columns to ISO format."""
    for col in df.select_dtypes(include=["datetime"]):
        df[col] = df[col].dt.isoformat()
    return df

def filter_active_orders(df):
    """Remove cancelled or test orders."""
    return df[df["status"] != "cancelled"]
```

Bad:
```python
def transform(df):
    # Convert dates, filter orders, add derived columns, cast types...
    # 80 lines of everything
```

---

### Always Handle Nulls

The Validate specialist will catch nullability issues, but it's better to handle them in transforms:

```python
def enrich_customer(df):
    df["customer_name"] = df["customer_name"].fillna("Unknown")
    df["customer_email"] = df["customer_email"].fillna("no-email@example.com")
    return df
```

---

## Validation Rules

### Be Specific with Row Count Expectations

When the Validate specialist asks about expected row counts, be honest:

```
Expected rows per run: orders ~5000, customers ~2000
```

Overly permissive rules (row_count > 0) catch almost nothing. Overly strict (exact match) will fail on legitimate growth. Use ranges when you can.

---

### Add Schema Validation for Critical Columns

For columns that downstream systems depend on, always add NOT NULL or type checks:

```json
{
  "rules": [
    {"column": "order_id", "check": "not_null"},
    {"column": "amount", "check": "type", "expected": "numeric"},
    {"column": "created_at", "check": "not_null"}
  ]
}
```

---

## Output Stage

### Use Partitioning for Large Tables

If writing to BigQuery or similar, always specify partitioning:

```
Partition by: date (created_at column)
Cluster by: customer_id, region
```

This dramatically improves query performance and reduces cost.

---

### Choose the Right Write Mode

| Mode | Use When |
|------|----------|
| **Append** | Continuous ingestion, event data |
| **Merge** | Deduplication needed, upserts |
| **Overwrite** | Snapshot tables, full refresh |

---

## Running and Monitoring

### Always Dry-Run First

```bash
python pipeline.py --dry-run
```

This validates syntax, connection credentials, and schema without touching production data.

---

### Store Session IDs

When AutoHarness generates a pipeline, it prints a session ID. Save it — it's the key to resuming if something goes wrong.

---

### Check PipelineContext Before Resume

Before resuming, you can inspect the session state:

```bash
cat ~/.claude/auto-pipeline/contexts/{session-id}/context.json
```

This tells you exactly where the pipeline left off and what's missing.

---

## Security Notes

### Credentials Never Hit Disk

Connection credentials referenced via `${VAR}` syntax stay as references — the actual secret never gets written to `context.json` or `pipeline.yaml`. Only the code in `pipeline.py` resolves the env var at runtime.

### Limit Source Access

Give the source database user only the permissions it needs:
- SELECT on specific tables (ingestion)
- No DDL, no DROP, no admin privileges

### Audit Logs

AutoHarness doesn't currently generate audit logs — consider adding logging to your generated `pipeline.py`:

```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ingest():
    logger.info("Starting ingestion from orders table")
    # ...
    logger.info(f"Ingested {len(df)} rows")
```
