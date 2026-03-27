# scripts/link_recommendations_to_seed.py
"""
Link recommendation customers to a seed.

=== SKILL GUIDE (for agents) ===
What this script does:
  Links recommendation customers to a seed so they appear in the playbook
API endpoint:
  POST /customer/{seed_id}/recommend/
Body:
  [{"id": rec_id}, {"id": rec_id2}, ...]  — array of objects with id keys
Common errors:
  - Sending single object instead of array
  - Attaching recommendations directly to audience instead of to seed
Example:
  python link_recommendations_to_seed.py --seed-id 8490 --recommendation-ids 8500 8501 8502
"""
import argparse
from scripts.api_client import ChinwagClient

def link_recommendations_to_seed(api_base, token, seed_id, recommendation_ids, dry_run=False):
    client = ChinwagClient(api_base=api_base, token=token)
    payload = [{"id": rid} for rid in recommendation_ids]

    if dry_run:
        print(f"[DRY RUN] POST /customer/{seed_id}/recommend/ {payload}")
        return None

    result = client.post(f"customer/{seed_id}/recommend/", json=payload)

    # NOTE: POST returns 201 with empty body on success. The customer GET endpoint
    # does not expose a "recommendations" field, so we cannot verify via GET.
    # The 201 response is the only confirmation of successful linkage.
    return recommendation_ids

def main():
    parser = argparse.ArgumentParser(description="Link recommendations to a seed")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--seed-id", type=int, required=True)
    parser.add_argument("--recommendation-ids", type=int, nargs="+", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    result = link_recommendations_to_seed(args.api_base, args.token, args.seed_id,
                                          args.recommendation_ids, args.dry_run)
    if result:
        print(f"Linked {len(args.recommendation_ids)} recommendation(s) to seed {args.seed_id}")

if __name__ == "__main__":
    main()
