# scripts/create_playbook.py
"""
Create a playbook with audiences.

=== SKILL GUIDE (for agents) ===
What this script does:
  Creates a playbook attached to one or more audiences
API endpoint:
  POST /account/{account_id}/playbook/
Body:
  {"name": "...", "audiences": [{"id": aud_id}]}
Common errors:
  - playbook ID goes in body, not URL
Example:
  python create_playbook.py --account 152 --name "Industrial Marketing Playbook" --audience-ids 88
"""
import argparse
import json
from scripts.api_client import ChinwagClient

def create_playbook(api_base, token, account_id, name, audience_ids,
                   dry_run=False, description=None, kind=None, metadata=None):
    client = ChinwagClient(api_base=api_base, token=token)
    payload = {
        "name": name,
        "audiences": [{"id": aud_id} for aud_id in audience_ids],
    }
    if description:
        payload["description"] = description
    if kind:
        payload["kind"] = kind
    if metadata:
        payload["metadata"] = metadata

    if dry_run:
        print(f"[DRY RUN] POST /account/{account_id}/playbook/ {payload}")
        return None

    result = client.post(f"account/{account_id}/playbook/", json=payload)
    pb_id = result.get("id")
    if not pb_id:
        raise ValueError(f"No ID returned from playbook POST: {result}")

    # Verify
    verified = client.get(f"account/{account_id}/playbook/{pb_id}/")
    assert verified.get("name") == name, f"Name mismatch: {verified.get('name')}"
    verified_aud_ids = [a["id"] for a in verified.get("audiences", [])]
    for aud_id in audience_ids:
        assert aud_id in verified_aud_ids, f"Audience {aud_id} not in playbook"
    return verified

def main():
    parser = argparse.ArgumentParser(description="Create a playbook")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--account", type=int, required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--audience-ids", type=int, nargs="+", required=True)
    parser.add_argument("--description")
    parser.add_argument("--kind", choices=["chinwag_suggested", "default", "custom", "deactivated"])
    parser.add_argument("--metadata", help="JSON metadata object")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    meta = json.loads(args.metadata) if args.metadata else None
    result = create_playbook(args.api_base, args.token, args.account, args.name,
                              args.audience_ids, args.dry_run, args.description,
                              args.kind, meta)
    if result:
        print(f"Created playbook {result['id']}: {result['name']}")

if __name__ == "__main__":
    main()
