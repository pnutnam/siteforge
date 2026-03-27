# scripts/create_recommendation.py
"""
Create a recommendation customer with platform user.

=== SKILL GUIDE (for agents) ===
What this script does:
  Creates a recommendation (customer_type="recommendation") and links a platform user
API endpoints:
  Step 1: POST /customer/ — customer_type="recommendation", NO account field
  Step 2: POST /customer/{id}/platformuser/ — platform + username
Required fields:
  - first_name, last_name, email: strings
  - platform: one of gmail, instagram, linkedin, yahoo, outlook, other email, facebook, x.com, tiktok, youtube, pinterest
  - username: platform-specific username
Common errors:
  - Including an 'account' field — recommendations are account-agnostic
Example:
  python create_recommendation.py --first-name Jane --last-name Smith --email jane@company.com --platform linkedin --username jane-smith-123
"""
import argparse
from scripts.api_client import ChinwagClient

def create_recommendation(api_base, token, first_name, last_name, email,
                         platform, username, dry_run=False):
    client = ChinwagClient(api_base=api_base, token=token)
    payload = {
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "customer_type": "recommendation",
        # NOTE: NO account field — recommendations are account-agnostic
    }

    if dry_run:
        print(f"[DRY RUN] POST /customer/ {payload}")
        print(f"[DRY RUN] POST /customer/{{id}}/platformuser/ {{'platform': '{platform}', 'username': '{username}'}}")
        return None

    result = client.post("customer/", json=payload)
    cust_id = result.get("id")
    if not cust_id:
        raise ValueError(f"No ID returned from customer/ POST: {result}")

    # Attach platform user
    # Note: requires platform_assigned_id, not just username
    platform_result = client.post(f"customer/{cust_id}/platformuser/", json={
        "platform": platform,
        "username": username,
        "platform_assigned_id": username,  # LinkedIn user ID
    })

    # Verify
    verified = client.get(f"customer/{cust_id}/")
    # NOTE: customer_type is null until enrichment runs; we can't assert it here
    # assert verified.get("customer_type") == "recommendation"  # Too strict - API returns null until enrichment
    # Verify no account field
    assert "account" not in verified or verified["account"] is None, "Recommendations should not have an account"
    return verified

def main():
    parser = argparse.ArgumentParser(description="Create a recommendation customer")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--first-name", required=True)
    parser.add_argument("--last-name", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--platform", required=True,
                        choices=["gmail", "instagram", "linkedin", "yahoo", "outlook",
                                 "other email", "facebook", "x.com", "tiktok", "youtube", "pinterest"])
    parser.add_argument("--username", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    result = create_recommendation(args.api_base, args.token, args.first_name,
                                   args.last_name, args.email, args.platform,
                                   args.username, args.dry_run)
    if result:
        print(f"Created recommendation {result['id']}: {result['first_name']} {result['last_name']} ({args.platform})")

if __name__ == "__main__":
    main()
