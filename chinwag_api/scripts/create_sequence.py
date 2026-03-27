# scripts/create_sequence.py
"""
Create a sequence with steps inside a playbook.

=== SKILL GUIDE (for agents) ===
What this script does:
  Creates a sequence with steps attached to a playbook
API endpoint:
  POST /sequence/
Body:
  {"name": "...", "playbook": pb_id, "account": account_id, "steps": [...]}
  NOTE: playbook ID and account ID go in body, not URL
Step fields:
  - platform: MUST be "email" (other platforms require existing platform objects)
  - subject: max 75 chars
  - body: string
  - delay: integer (seconds)
  - order: integer
Common errors:
  - Putting playbook ID in URL instead of body
  - Using non-email platforms (only "email" is supported)
Example:
  python create_sequence.py --account 38 --playbook-id 26 --name "Authority Tone Sequence" --steps '[{"platform": "email", "subject": "TL", "body": "...", "delay": 0, "order": 1}]'
"""
import argparse
import json
from scripts.api_client import ChinwagClient

SUPPORTED_STEP_PLATFORMS = {"email"}  # Only "email" is confirmed working; other platforms require existing platform objects

def create_sequence(api_base, token, account_id, playbook_id, name, steps,
                    dry_run=False, metadata=None):
    client = ChinwagClient(api_base=api_base, token=token)

    # Validate platforms - only "email" works without existing platform objects
    for step in steps:
        plat = step.get("platform", "")
        if plat not in SUPPORTED_STEP_PLATFORMS:
            raise ValueError(
                f"Unsupported platform '{plat}' in step. Only {SUPPORTED_STEP_PLATFORMS} are supported. "
                f"Other platforms require existing platform objects in the system."
            )

    payload = {
        "name": name,
        "playbook": playbook_id,
        "account": account_id,  # Required to avoid IntegrityError
        "steps": steps,
    }
    if metadata:
        payload["metadata"] = metadata

    if dry_run:
        print(f"[DRY RUN] POST /sequence/ {payload}")
        return None

    result = client.post("sequence/", json=payload)
    seq_id = result.get("id")
    if not seq_id:
        raise ValueError(f"No ID returned from sequence/ POST: {result}")

    # Note: Sequence GET endpoint doesn't exist (/sequence/{id}/ returns 404).
    # Verification of linking is done via GET /account/{account_id}/playbook/{playbook_id}/
    # after linking sequences via link_sequences_to_playbook.
    return result

def main():
    parser = argparse.ArgumentParser(description="Create a sequence with steps")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--account", type=int, required=True, help="Account ID")
    parser.add_argument("--playbook-id", type=int, required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--steps", required=True, help="JSON array of step objects")
    parser.add_argument("--metadata", help="JSON metadata object")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    steps = json.loads(args.steps)
    meta = json.loads(args.metadata) if args.metadata else None
    result = create_sequence(args.api_base, args.token, args.account, args.playbook_id,
                              args.name, steps, args.dry_run, meta)
    if result:
        print(f"Created sequence {result['id']}: {result['name']} with {len(result.get('steps', []))} step(s)")

if __name__ == "__main__":
    main()
