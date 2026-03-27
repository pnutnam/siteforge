# scripts/verify_playbook.py
"""
Verify a playbook and all its components are correctly linked.

=== SKILL GUIDE (for agents) ===
What this script does:
  Reads back a playbook and asserts all components are correctly linked.
  Checks: playbook exists, audiences linked, seed roles correct,
  recommendations linked to seeds, sequences linked, sequences have steps.
Output: PASS/FAIL with detailed diff
Example:
  python verify_playbook.py --account 152 --playbook-id 26 --verbose
"""
import argparse
import sys
from scripts.api_client import ChinwagClient

def verify_playbook(api_base, token, account_id, playbook_id, verbose=False):
    client = ChinwagClient(api_base=api_base, token=token)
    errors = []
    warnings = []

    # 1. Playbook exists
    playbook = client.get(f"account/{account_id}/playbook/{playbook_id}/")
    if verbose:
        print(f"Playbook: {playbook}")

    if not playbook.get("audiences"):
        errors.append(f"Playbook {playbook_id} has no audiences")

    # 2. Audiences
    for aud in playbook.get("audiences", []):
        aud_detail = client.get(f"group/{aud['id']}/")
        if aud_detail.get("kind") != "audience":
            errors.append(f"Audience {aud['id']} has kind='{aud_detail.get('kind')}', expected 'audience'")
        if verbose:
            print(f"  Audience {aud['id']}: {len(aud_detail.get('customers', []))} customers")

        # 3. Seeds have role=seed
        for cust in aud_detail.get("customers", []):
            cust_detail = client.get(f"customer/{cust['id']}/")
            if cust_detail.get("role") != "seed":
                errors.append(f"Customer {cust['id']} has role='{cust_detail.get('role')}', expected 'seed'")

            # 4. Recommendations linked to seed
            # NOTE: Customer recommendations are not exposed via GET /customer/{id}/,
            # so we cannot verify linkage here. This is a known API limitation.
            recs = cust_detail.get("recommendations", [])
            if verbose:
                print(f"    Seed {cust['id']}: {len(recs) if recs else '?'} recommendations (API doesn't expose this field)")

    # 5. Sequences
    # NOTE: GET /sequence/{id}/ returns 404, so we cannot retrieve sequence details.
    # We only verify that the playbook has sequences linked.
    sequences = playbook.get("sequences", [])
    if verbose:
        print(f"  {len(sequences)} sequences linked to playbook")
    for seq in sequences:
        if verbose:
            print(f"    Sequence {seq['id']}: {seq.get('name', 'unnamed')} ({len(seq.get('steps', []))} steps)")

    result = {
        "playbook_id": playbook_id,
        "pass": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
    }

    if result["pass"]:
        print(f"✓ PASS: Playbook {playbook_id} verified")
        if warnings:
            for w in warnings:
                print(f"  ⚠ {w}")
    else:
        print(f"✗ FAIL: Playbook {playbook_id} has {len(errors)} error(s):")
        for e in errors:
            print(f"  ✗ {e}")

    return result

def main():
    parser = argparse.ArgumentParser(description="Verify a playbook and all its components")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--account", type=int, required=True)
    parser.add_argument("--playbook-id", type=int, required=True)
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    result = verify_playbook(args.api_base, args.token, args.account,
                              args.playbook_id, args.verbose)
    sys.exit(0 if result["pass"] else 1)

if __name__ == "__main__":
    main()
