# scripts/link_sequences_to_playbook.py
"""
Attach sequences to a playbook.

=== SKILL GUIDE (for agents) ===
What this script does:
  Attaches created sequences to a playbook
API endpoint:
  PATCH /account/{account_id}/playbook/{playbook_id}/
Body:
  {"sequences": [{"id": seq_id}, {"id": seq_id2}]}
Common errors:
  - Using POST instead of PATCH
  - Forgetting the playbook ID is already set, not added here
Example:
  python link_sequences_to_playbook.py --account 152 --playbook-id 26 --sequence-ids 100 101
"""
import argparse
from scripts.api_client import ChinwagClient

def link_sequences_to_playbook(api_base, token, account_id, playbook_id,
                                sequence_ids, dry_run=False):
    client = ChinwagClient(api_base=api_base, token=token)
    payload = {"sequences": [{"id": sid} for sid in sequence_ids]}

    if dry_run:
        print(f"[DRY RUN] PATCH /account/{account_id}/playbook/{playbook_id}/ {payload}")
        return None

    result = client.patch(f"account/{account_id}/playbook/{playbook_id}/", json=payload)

    # Verify
    verified = client.get(f"account/{account_id}/playbook/{playbook_id}/")
    seq_ids = [s["id"] for s in verified.get("sequences", [])]
    for sid in sequence_ids:
        assert sid in seq_ids, f"Sequence {sid} not linked to playbook {playbook_id}"
    return verified

def main():
    parser = argparse.ArgumentParser(description="Link sequences to a playbook")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--account", type=int, required=True)
    parser.add_argument("--playbook-id", type=int, required=True)
    parser.add_argument("--sequence-ids", type=int, nargs="+", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    result = link_sequences_to_playbook(args.api_base, args.token, args.account,
                                          args.playbook_id, args.sequence_ids, args.dry_run)
    if result:
        print(f"Linked {len(args.sequence_ids)} sequence(s) to playbook {args.playbook_id}")

if __name__ == "__main__":
    main()
