# Deterministic Playbook Pipeline — Specification

**Date:** 2026-03-25
**Status:** Approved
**API Base:** `https://djg-debian.coho-jazz.ts.net/api/`

---

## 1. Overview

A suite of standalone, deterministic Python scripts that interact with the Chinwag API to create playbooks with audiences, seeds, recommendations, and sequences. Every script produces identical results on every run — no ambiguity, no guessing, no agent drift.

### Goals

- Scripts are **idempotent** — re-running with the same inputs produces the same outputs (no duplicates)
- Scripts **wait for confirmation** — each API call is verified before proceeding
- Scripts **checkpoint progress** — interrupted runs can resume from the last successful step
- Scripts are **agent-agnostic** — the dumbest possible agent can run them with only `--help` output

---

## 2. Data Model

```
Playbook (PlaybookWrite)
  └── audiences[] (Group, kind="audience")
        └── customers[] (Customer, role="seed")
              └── recommendations linked via POST /customer/{seed_id}/recommend/
                    └── recommendations are Customer (customer_type="recommendation")
                          └── have PlatformUser entries for contact info
  └── sequences[] (Sequence, playbook=PLAYBOOK_ID)
        └── steps[] (Step)
```

### Critical API Idiosyncrasies

| # | Rule | Why It Matters |
|---|------|---------------|
| 1 | `role: "seed"` must be **explicitly** set on seed customers | API does NOT infer from `customer_type`; seed won't show recommendations in UI without it |
| 2 | Recommendations are **standalone customers** linked TO seeds | They are NOT added to the audience directly |
| 3 | `company` field is **read-only** | Returns null even when sent in POST/PATCH — use `first_name`, `last_name`, `email` |
| 4 | Adding seed to audience: `POST /group/{id}/customer/ {"id": seed_id}` | NOT `PATCH`, NOT array — single object with `id` key |
| 5 | Linking recommendations: `POST /customer/{seed_id}/recommend/ [{"id": rec_id}]` | Array of objects with `id` key, attached to the seed |
| 6 | Creating sequence: `playbook` ID goes in POST **body**, not path | `POST /sequence/ {"playbook": pb_id, ...}` not in URL |
| 7 | `kind="audience"` for audiences, NOT "group" | `kind="group"` creates a "Group" not an "Audience" |
| 8 | Recommendations have **NO** `account` field | They are account-agnostic standalone entities |

---

## 3. Scripts

### 3.1 `create_audience.py`

**Purpose:** Create a Group with `kind="audience"`.

```bash
python create_audience.py --account 152 --name "Industrial Leads" [--dry-run]
```

**API Call:** `POST /group/ {"name": "...", "kind": "audience"}`

**Key Fields:**
- `name` (required): Display name
- `kind`: MUST be `"audience"` (not `"group"`)
- `metadata` (optional): Arbitrary object

**Verification:** GET `/group/{id}/` and assert `kind == "audience"`

---

### 3.2 `create_seed.py`

**Purpose:** Create a seed customer (required before linking recommendations).

```bash
python create_seed.py --account 152 --first-name "John" --last-name "Doe" --email "john@example.com" [--dry-run]
```

**API Call:** `POST /customer/`

**Required Fields:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "role": "seed",
  "account": 152
}
```

**Critical:** `role` MUST be `"seed"` — this is NOT inferred from context.

**Optional Fields:**
- `metadata`: Arbitrary object

**Verification:** GET `/customer/{id}/` and assert `role == "seed"` and `account == 152`

---

### 3.3 `add_seeds_to_audience.py`

**Purpose:** Add one or more seed customers to an audience group.

```bash
python add_seeds_to_audience.py --audience-id 88 --seed-id 8490 [--dry-run]
# Multiple seeds:
python add_seeds_to_audience.py --audience-id 88 --seed-ids 8490 8491 8492
```

**API Call:** `POST /group/{audience_id}/customer/ {"id": seed_id}`

**Note:** One POST per seed. Body is a single object with `id` key — NOT an array.

**Verification:** GET `/group/{audience_id}/` and assert seed ID appears in `customers`

---

### 3.4 `create_recommendation.py`

**Purpose:** Create a recommendation customer (no account link).

```bash
python create_recommendation.py \
  --first-name "Jane" \
  --last-name "Smith" \
  --email "jane@company.com" \
  --platform "linkedin" \
  --username "jane-smith-123" \
  [--dry-run]
```

**API Call (Step 1):** `POST /customer/`

**Required Fields:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@company.com",
  "customer_type": "recommendation"
}
```

**Critical:** NO `account` field — recommendations are account-agnostic.

**API Call (Step 2):** `POST /customer/{rec_id}/platformuser/`

**Required Fields:**
```json
{
  "platform": "linkedin",
  "username": "jane-smith-123"
}
```

**Supported Platforms:** `gmail`, `instagram`, `linkedin`, `yahoo`, `outlook`, `other email`, `facebook`, `x.com`, `tiktok`, `youtube`, `pinterest`

**Verification:** GET `/customer/{id}/` and assert `customer_type == "recommendation"` and no `account`

---

### 3.5 `link_recommendations_to_seed.py`

**Purpose:** Link recommendation customers to a seed so they appear in the playbook.

```bash
python link_recommendations_to_seed.py --seed-id 8490 --recommendation-ids 8500 8501 8502 [--dry-run]
```

**API Call:** `POST /customer/{seed_id}/recommend/ [{"id": rec_id}, {"id": rec_id2}, ...]`

**Body:** Array of objects with `id` keys (not a single object).

**Verification:** GET `/customer/{seed_id}/` and assert each recommendation ID appears in `recommendations` or linked state.

---

### 3.6 `create_playbook.py`

**Purpose:** Create a playbook with one or more audiences.

```bash
python create_playbook.py \
  --account 152 \
  --name "Industrial Marketing Playbook" \
  --audience-ids 88 \
  [--description "..."] \
  [--dry-run]
```

**API Call:** `POST /account/{account_id}/playbook/`

**Required Fields:**
```json
{
  "name": "Industrial Marketing Playbook",
  "audiences": [{"id": 88}]
}
```

**Optional Fields:**
- `description`: String
- `kind`: `"chinwag_suggested"` | `"default"` | `"custom"` | `"deactivated"`
- `metadata`: Arbitrary object
- `preferences`: Object with strategy/targeting info

**Verification:** GET `/account/{account_id}/playbook/{pb_id}/` and assert `name` and `audiences[].id` match

---

### 3.7 `create_sequence.py`

**Purpose:** Create a sequence with steps inside a playbook.

```bash
python create_sequence.py \
  --playbook-id 26 \
  --name "Authority Tone Sequence" \
  --steps '[{"platform": "linkedin", "subject": "Thought Leadership", "body": "...", "delay": 0, "order": 1}]' \
  [--dry-run]
```

**API Call:** `POST /sequence/`

**Required Fields:**
```json
{
  "name": "Authority Tone Sequence",
  "playbook": 26,
  "steps": [
    {
      "platform": "linkedin",
      "subject": "Thought Leadership",
      "body": "...",
      "delay": 0,
      "order": 1
    }
  ]
}
```

**Step Fields:**
- `platform`: One of the supported platform values
- `subject`: Max 75 chars
- `body`: String
- `delay`: Integer (seconds)
- `order`: Integer (sequence of steps)
- `metadata`: Arbitrary object
- `target_rank`: Integer (1=highest priority)

**Verification:** GET `/sequence/{id}/` and assert `playbook == 26` and steps match

---

### 3.8 `link_sequences_to_playbook.py`

**Purpose:** Attach created sequences to a playbook.

```bash
python link_sequences_to_playbook.py --account 152 --playbook-id 26 --sequence-ids 100 101 [--dry-run]
```

**API Call:** `PATCH /account/{account_id}/playbook/{playbook_id}/`

**Body:**
```json
{
  "sequences": [{"id": 100}, {"id": 101}]
}
```

**Verification:** GET `/account/{account_id}/playbook/{playbook_id}/` and assert all sequence IDs appear

---

### 3.9 `playbook_pipeline.py`

**Purpose:** Orchestrate the full pipeline with checkpointing and resumability.

```bash
python playbook_pipeline.py \
  --account 152 \
  --playbook-name "Industrial Marketing" \
  --audience-name "Industrial Leads" \
  --seeds '[{"first_name": "John", "last_name": "Doe", "email": "john@example.com"}, ...]' \
  --recommendations '[{"first_name": "Jane", "last_name": "Smith", ...}, ...]' \
  --sequences '[{"name": "Authority", "steps": [...]}, ...]' \
  [--resume-from CHECKPOINT_FILE] \
  [--dry-run]
```

**Pipeline Order:**
1. Create audience → checkpoint
2. Create seeds → checkpoint
3. Add seeds to audience → checkpoint
4. Create recommendations → checkpoint
5. Link recommendations to seeds → checkpoint
6. Create playbook with audience → checkpoint
7. Create sequences → checkpoint
8. Link sequences to playbook → checkpoint
9. Final verification → checkpoint

**Checkpoint File:** JSON file at `~/.playbook_pipeline/{account_id}_{playbook_name}_{timestamp}.json`

**On Resume:** Script reads checkpoint, skips completed phases, continues from next.

**Verification at Each Phase:** Polls API until entity is confirmed created with correct fields.

---

### 3.10 `verify_playbook.py`

**Purpose:** Read back a playbook and assert all components are correctly linked.

```bash
python verify_playbook.py --account 152 --playbook-id 26 [--verbose]
```

**Checks:**
- Playbook exists and `name` matches
- All audience IDs are linked
- All seed IDs in audiences have `role == "seed"`
- All recommendation IDs are linked to seeds
- All sequence IDs are linked to playbook
- All sequences have steps

**Output:** PASS/FAIL with detailed diff of expected vs actual

---

## 4. Shared Configuration

All scripts share a common config module (`config.py`):

```python
# config.py
API_BASE = "https://djg-debian.coho-jazz.ts.net/api/"
TOKEN = os.getenv("CHINWAG_TOKEN", "your-token-here")
TIMEOUT = 30  # seconds per request
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds between retries
```

**Token Source:** Long-term token stored in environment variable `CHINWAG_TOKEN`.

---

## 5. Common Options

Every script supports:

| Flag | Purpose |
|------|---------|
| `--dry-run` | Print API payloads without sending |
| `--verbose` | Print request/response details |
| `--help` | Show usage + skill guide (what dumbest agent needs) |

---

## 6. Error Handling

- **Network errors:** Retry up to `MAX_RETRIES` with exponential backoff
- **4xx errors:** Fail immediately with descriptive message
- **5xx errors:** Retry up to `MAX_RETRIES`
- **Verification failure:** Fail immediately — do not continue with bad state
- **Idempotency:** If entity with matching name already exists, return existing ID instead of creating duplicate

---

## 7. Directory Structure

```
chinwag_api/
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-03-25-deterministic-playbook-pipeline-design.md
├── scripts/
│   ├── config.py
│   ├── create_audience.py
│   ├── create_seed.py
│   ├── add_seeds_to_audience.py
│   ├── create_recommendation.py
│   ├── link_recommendations_to_seed.py
│   ├── create_playbook.py
│   ├── create_sequence.py
│   ├── link_sequences_to_playbook.py
│   ├── playbook_pipeline.py
│   └── verify_playbook.py
└── tests/
    └── test_pipeline_scripts.py
```

---

## 8. Skill Guide Format

Each script's `--help` output includes a **Skill Guide** section at the bottom:

```
=== SKILL GUIDE (for agents) ===

What this script does:
  Creates an audience Group with kind="audience"

API endpoint:
  POST /group/

Required fields:
  - name: string
  - kind: MUST be "audience" (not "group")
  - account: integer (passed as --account)

Common errors:
  - Forgetting kind="audience" creates a "Group" instead
  - company field is read-only — do not try to set it

Example:
  python create_audience.py --account 152 --name "Industrial Leads"
```

This ensures any agent — no matter how limited — can run the scripts correctly.

---

## 9. API Summary

| Operation | Endpoint | Method | Body Key Fields |
|---|---|---|---|
| Create audience | `/group/` | POST | `name`, `kind="audience"` |
| Create seed | `/customer/` | POST | `role="seed"`, `account`, `first_name`, `last_name`, `email` |
| Add seed to audience | `/group/{id}/customer/` | POST | `{"id": seed_id}` |
| Create recommendation | `/customer/` | POST | `customer_type="recommendation"` (NO account) |
| Add platform user | `/customer/{id}/platformuser/` | POST | `platform`, `username` |
| Link recommendation | `/customer/{seed_id}/recommend/` | POST | `[{"id": rec_id}]` |
| Create playbook | `/account/{id}/playbook/` | POST | `name`, `audiences=[{"id": aud_id}]` |
| Create sequence | `/sequence/` | POST | `playbook`, `name`, `steps=[...]` |
| Link sequence | `/account/{id}/playbook/{pb_id}/` | PATCH | `{"sequences": [{"id": seq_id}]}` |

---

## 10. Approved By

Pending user review of this document.
