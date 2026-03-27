# scripts/create_seed.py
"""
Create a seed customer.

=== SKILL GUIDE (for agents) ===
What this script does:
  Creates a seed customer with role="seed"
API endpoint:
  POST /customer/
Required fields:
  - role: MUST be "seed" (not inferred from context)
  - account: integer
  - first_name, last_name, email: strings
Common errors:
  - role MUST be "seed" — API does NOT infer from customer_type
  - company field is read-only — use first_name, last_name, email only
Example:
  python create_seed.py --account 152 --first-name John --last-name Doe --email john@example.com
"""
import argparse
from scripts.api_client import ChinwagClient

def create_seed(api_base, token, account_id, first_name, last_name, email,
                dry_run=False, metadata=None):
    client = ChinwagClient(api_base=api_base, token=token)
    payload = {
        "role": "seed",
        "account": account_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
    }
    if metadata:
        payload["metadata"] = metadata

    if dry_run:
        print(f"[DRY RUN] POST /customer/ {payload}")
        return None

    result = client.post("customer/", json=payload)
    cust_id = result.get("id")
    if not cust_id:
        raise ValueError(f"No ID returned from customer/ POST: {result}")

    # Verify
    verified = client.get(f"customer/{cust_id}/")
    assert verified.get("role") == "seed", f"Expected role=seed, got {verified.get('role')}"
    return verified

def main():
    parser = argparse.ArgumentParser(description="Create a seed customer")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--account", type=int, required=True)
    parser.add_argument("--first-name", required=True)
    parser.add_argument("--last-name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--metadata", help="JSON metadata object")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    import json
    meta = json.loads(args.metadata) if args.metadata else None
    result = create_seed(args.api_base, args.token, args.account,
                         args.first_name, args.last_name, args.email, args.dry_run, meta)
    if result:
        print(f"Created seed {result['id']}: {result['first_name']} {result['last_name']}")

if __name__ == "__main__":
    main()
