# scripts/create_audience.py
"""
Create an audience Group.

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
  - Renaming to existing name inherits old ID — verify ID if name already existed
Example:
  python create_audience.py --account 152 --name "Industrial Leads"
"""
import argparse
import sys
import json
from scripts.api_client import ChinwagClient

def create_audience(api_base, token, account_id, name, dry_run=False, metadata=None):
    client = ChinwagClient(api_base=api_base, token=token)
    payload = {"name": name, "kind": "audience"}
    if metadata:
        payload["metadata"] = metadata

    if dry_run:
        print(f"[DRY RUN] POST /group/ {payload}")
        return None

    result = client.post("group/", json=payload)
    aud_id = result.get("id")
    if not aud_id:
        raise ValueError(f"No ID returned from group/ POST: {result}")

    # Verify
    verified = client.get(f"group/{aud_id}/")
    assert verified.get("kind") == "audience", f"Expected kind=audience, got {verified.get('kind')}"

    # Idempotency check: if an audience with this name already existed (but was
    # "deleted" from UI), the API may return the same name with the old ID.
    # We flag this so callers can decide whether to use the inherited ID.
    result["_inherited_id"] = (verified.get("name") == name and result.get("id") != aud_id)

    return verified

def main():
    parser = argparse.ArgumentParser(description="Create an audience group")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--account", type=int, required=True, help="Account ID")
    parser.add_argument("--name", required=True, help="Audience name")
    parser.add_argument("--metadata", help="JSON metadata object")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    meta = json.loads(args.metadata) if args.metadata else None
    result = create_audience(args.api_base, args.token, args.account, args.name, args.dry_run, meta)
    if result:
        if result.get("_inherited_id"):
            print(f"WARNING: Audience '{result['name']}' inherited existing ID {result['id']} — may have old settings")
        print(f"Created audience {result['id']}: {result['name']}")

if __name__ == "__main__":
    main()
