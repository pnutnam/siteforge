# scripts/add_seeds_to_audience.py
"""
Add seed customers to an audience group.

=== SKILL GUIDE (for agents) ===
What this script does:
  Adds one or more seed customers to an audience group
API endpoint:
  POST /group/{audience_id}/customer/{seed_id}/
Body:
  {"account": account_id}
Common errors:
  - Using PATCH instead of POST
  - Putting seed ID in body instead of URL path
Example:
  python add_seeds_to_audience.py --audience-id 88 --seed-id 8490
  python add_seeds_to_audience.py --audience-id 88 --seed-ids 8490 8491 8492
"""
import argparse
import sys
from scripts.api_client import ChinwagClient

def add_seeds_to_audience(api_base, token, account_id, audience_id, seed_ids, dry_run=False):
    client = ChinwagClient(api_base=api_base, token=token)

    if dry_run:
        for sid in seed_ids:
            print(f"[DRY RUN] POST /group/{audience_id}/customer/{sid}/ {{'account': {account_id}}}")
        return None

    added_ids = []
    for seed_id in seed_ids:
        # URL path: /group/{audience_id}/customer/{seed_id}/
        # Body: {"account": account_id}
        result = client.post(f"group/{audience_id}/customer/{seed_id}/", json={"account": account_id})
        # API returns list of customers in group
        if isinstance(result, list):
            added_ids.extend([c.get("id") for c in result if c.get("id")])
        else:
            added_ids.append(result.get("id") if isinstance(result, dict) else seed_id)

    # Verify via the group's customer list
    group_customers = client.get(f"group/{audience_id}/customer/")
    customer_ids = [c["id"] for c in group_customers] if isinstance(group_customers, list) else []
    for sid in seed_ids:
        if sid not in customer_ids:
            # The API may not update immediately; warn but don't fail
            print(f"  WARNING: Seed {sid} may not have been added (not in GET /group/{audience_id}/customer/)")
    return {"audience_id": audience_id, "added": added_ids}

def main():
    parser = argparse.ArgumentParser(description="Add seed customers to an audience")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--audience-id", type=int, required=True)
    parser.add_argument("--account", type=int, required=True, help="Account ID (required for body)")
    parser.add_argument("--seed-id", type=int, help="Single seed ID")
    parser.add_argument("--seed-ids", type=int, nargs="+", help="Multiple seed IDs")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    seed_ids = []
    if args.seed_id:
        seed_ids.append(args.seed_id)
    if args.seed_ids:
        seed_ids.extend(args.seed_ids)

    if not seed_ids:
        print("Error: must provide --seed-id or --seed-ids")
        sys.exit(1)

    result = add_seeds_to_audience(args.api_base, args.token, args.account,
                                    args.audience_id, seed_ids, args.dry_run)
    if result:
        print(f"Added {len(seed_ids)} seed(s) to audience {args.audience_id}")

if __name__ == "__main__":
    main()
