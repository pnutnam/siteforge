# AutoHarness — Examples

## Example 1: PostgreSQL to BigQuery Nightly Sync

**Prompt:**
```
/autoharness sync PostgreSQL orders and customers tables to BigQuery every night at 2am, incremental using updated_at column
```

**Expected questions you'll be asked:**
1. PostgreSQL host and port?
2. Credentials env var name?
3. BigQuery project ID and dataset?
4. Write mode — append or merge?

---

## Example 2: S3 CSV to Snowflake

**Prompt:**
```
/autoharness load CSV files from S3 bucket s3://my-data/raw/ into Snowflake analytics.raw schema every hour
```

**Expected questions:**
1. AWS credentials or IAM role?
2. File pattern to match (e.g., `*.csv`)?
3. Snowflake connection details?
4. How to handle schema evolution in CSVs?

---

## Example 3: MySQL to Google Sheets

**Prompt:**
```
/autoharness export MySQL query results to Google Sheets every morning at 7am
```

**Expected questions:**
1. MySQL connection string?
2. Google Sheets credentials file?
3. SQL query to run?
4. Target Sheet ID and tab?

---

## Example 4: MongoDB to BigQuery via Aggregation

**Prompt:**
```
/autoharness run MongoDB aggregation on events collection and load to BigQuery metrics dataset every 15 minutes
```

**Expected questions:**
1. MongoDB connection string?
2. Aggregation pipeline stages?
3. BigQuery project and dataset?
4. How to handle large result sets (batching)?

---

## Example 5: Full Reload PostgreSQL to S3 Parquet

**Prompt:**
```
/autoharness dump all PostgreSQL tables to S3 as Parquet files every Sunday at 3am
```

**Expected questions:**
1. PostgreSQL host and credentials?
2. Which tables to export (or discover all)?
3. S3 bucket and prefix?
4. Parquet compression (snappy, gzip)?

---

## Example 6: API to BigQuery (REST ingestion)

**Prompt:**
```
/autoharness fetch JSON from REST API endpoint and load to BigQuery staging dataset every 10 minutes
```

**Expected questions:**
1. API endpoint URL?
2. Authentication method (API key, OAuth, Bearer token)?
3. Pagination strategy?
4. BigQuery table schema?
