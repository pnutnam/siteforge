# scripts/playbook_pipeline.py
"""
Orchestrate the full playbook creation pipeline with checkpointing.

=== SKILL GUIDE (for agents) ===
What this script does:
  Runs the full pipeline: audience → seeds → add to audience →
  recommendations → link to seeds → playbook → sequences → link sequences
  Each phase is checkpointed; interrupted runs resume from last checkpoint.
Checkpoint file: ~/.playbook_pipeline/{account_id}_{playbook_name}_{timestamp}.json
On resume: reads checkpoint, skips completed phases, continues from next.
Example:
  python playbook_pipeline.py --account 152 --playbook-name "Industrial Marketing" \\
    --audience-name "Industrial Leads" \\
    --seeds '[{"first_name": "John", "last_name": "Doe", "email": "john@example.com"}]' \\
    --recommendations '[{"first_name": "Jane", "last_name": "Smith", "email": "jane@company.com", "platform": "linkedin", "username": "jane-smith-123"}]' \\
    --sequences '[{"name": "Authority", "steps": [{"platform": "linkedin", "subject": "TL", "body": "...", "delay": 0, "order": 1}]}]'
"""
import argparse
import json
import os
import sys
from pathlib import Path

from scripts.api_client import ChinwagClient
from scripts.create_audience import create_audience
from scripts.create_seed import create_seed
from scripts.add_seeds_to_audience import add_seeds_to_audience
from scripts.create_recommendation import create_recommendation
from scripts.link_recommendations_to_seed import link_recommendations_to_seed
from scripts.create_playbook import create_playbook
from scripts.create_sequence import create_sequence
from scripts.link_sequences_to_playbook import link_sequences_to_playbook

CHECKPOINT_DIR = Path.home() / ".playbook_pipeline"

def load_checkpoint(account_id, playbook_name):
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    pattern = f"{account_id}_{playbook_name.replace(' ', '_')}_*.json"
    for f in CHECKPOINT_DIR.glob(pattern):
        with open(f) as fh:
            return json.load(f), f
    return None, None

def save_checkpoint(checkpoint, path=None):
    CHECKPOINT_DIR.mkdir(parents=True, exist_ok=True)
    if path is None:
        path = CHECKPOINT_DIR / f"{checkpoint['account_id']}_{checkpoint['playbook_name'].replace(' ', '_')}_{checkpoint['timestamp']}.json"
    with open(path, "w") as fh:
        json.dump(checkpoint, fh, indent=2)
    return path

def run_phase(name, fn, *args, **kwargs):
    print(f"\n[PHASE] {name}")
    result = fn(*args, **kwargs)
    print(f"  ✓ {name} complete")
    return result

def pipeline(api_base, token, account_id, playbook_name, audience_name,
            seeds, recommendations, sequences, dry_run=False, resume_from=None):
    client = ChinwagClient(api_base=api_base, token=token)
    checkpoint = None
    checkpoint_path = None

    if resume_from:
        with open(resume_from) as f:
            checkpoint = json.load(f)
        print(f"[RESUME] Loaded checkpoint from {resume_from}")
        checkpoint_path = Path(resume_from)
    else:
        checkpoint = {
            "account_id": account_id,
            "playbook_name": playbook_name,
            "timestamp": "",
            "phases": {},
        }

    import time
    if not checkpoint.get("timestamp"):
        checkpoint["timestamp"] = time.strftime("%Y%m%d_%H%M%S")
        checkpoint_path = save_checkpoint(checkpoint)
        print(f"[CHECKPOINT] Created at {checkpoint_path}")

    phases = checkpoint.setdefault("phases", {})

    # Phase 1: Create audience
    if "audience" not in phases:
        audience = run_phase(
            "Create audience",
            lambda: create_audience(api_base, token, account_id, audience_name, dry_run)
        )
        if audience and audience.get("_inherited_id"):
            print(f"  ⚠ WARNING: Audience '{audience_name}' inherited existing ID {audience['id']} — may have old settings")
        phases["audience"] = {"id": audience["id"], "name": audience["name"]}
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print(f"[SKIP] Audience already created: {phases['audience']['id']}")

    aud_id = phases["audience"]["id"]

    # Phase 2: Create seeds
    if "seeds" not in phases:
        created_seeds = []
        for seed in seeds:
            s = run_phase(
                f"Create seed: {seed['first_name']} {seed['last_name']}",
                lambda s=seed: create_seed(api_base, token, account_id, s["first_name"],
                                          s["last_name"], s["email"], dry_run)
            )
            if s:
                created_seeds.append(s)
        phases["seeds"] = [{"id": s["id"], "email": s["email"]} for s in created_seeds]
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print(f"[SKIP] Seeds already created: {[s['id'] for s in phases['seeds']]}")

    seed_ids = [s["id"] for s in phases["seeds"]]

    # Phase 3: Add seeds to audience
    if "seeds_in_audience" not in phases:
        run_phase(
            "Add seeds to audience",
            lambda: add_seeds_to_audience(api_base, token, account_id, aud_id, seed_ids, dry_run)
        )
        phases["seeds_in_audience"] = True
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print("[SKIP] Seeds already added to audience")

    # Phase 4: Create recommendations
    if "recommendations" not in phases:
        created_recs = []
        for rec in recommendations:
            r = run_phase(
                f"Create recommendation: {rec['first_name']} {rec['last_name']}",
                lambda r=rec: create_recommendation(api_base, token, r["first_name"],
                                                    r["last_name"], r["email"],
                                                    r["platform"], r["username"], dry_run)
            )
            if r:
                created_recs.append(r)
        phases["recommendations"] = [{"id": r["id"], "email": r["email"]} for r in created_recs]
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print(f"[SKIP] Recommendations already created: {[r['id'] for r in phases['recommendations']]}")

    rec_ids = [r["id"] for r in phases["recommendations"]]

    # Phase 5: Link recommendations to seeds
    if "recommendations_linked" not in phases:
        for seed_id in seed_ids:
            run_phase(
                f"Link recommendations to seed {seed_id}",
                lambda sid=seed_id: link_recommendations_to_seed(api_base, token, sid, rec_ids, dry_run)
            )
        phases["recommendations_linked"] = True
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print("[SKIP] Recommendations already linked to seeds")

    # Phase 6: Create playbook
    if "playbook" not in phases:
        playbook = run_phase(
            "Create playbook",
            lambda: create_playbook(api_base, token, account_id, playbook_name, [aud_id], dry_run)
        )
        phases["playbook"] = {"id": playbook["id"], "name": playbook["name"]}
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print(f"[SKIP] Playbook already created: {phases['playbook']['id']}")

    pb_id = phases["playbook"]["id"]

    # Phase 7: Create sequences
    if "sequences" not in phases:
        created_seqs = []
        for seq in sequences:
            s = run_phase(
                f"Create sequence: {seq['name']}",
                lambda seq=seq: create_sequence(api_base, token, account_id, pb_id, seq["name"],
                                               seq["steps"], dry_run)
            )
            if s:
                created_seqs.append(s)
        phases["sequences"] = [{"id": s["id"], "name": s["name"]} for s in created_seqs]
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print(f"[SKIP] Sequences already created: {[s['id'] for s in phases['sequences']]}")

    seq_ids = [s["id"] for s in phases["sequences"]]

    # Phase 8: Link sequences to playbook
    if "sequences_linked" not in phases:
        run_phase(
            "Link sequences to playbook",
            lambda: link_sequences_to_playbook(api_base, token, account_id, pb_id, seq_ids, dry_run)
        )
        phases["sequences_linked"] = True
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print("[SKIP] Sequences already linked to playbook")

    # Phase 9: Final verification
    if "verified" not in phases:
        from scripts.verify_playbook import verify_playbook
        verified = run_phase(
            "Verify playbook",
            lambda: verify_playbook(api_base, token, account_id, pb_id)
        )
        phases["verified"] = verified
        checkpoint_path = save_checkpoint(checkpoint, checkpoint_path)
    else:
        print("[SKIP] Playbook already verified")

    print(f"\n{'='*50}")
    print(f"Pipeline complete! Playbook ID: {pb_id}")
    print(f"Checkpoint saved at: {checkpoint_path}")
    print(f"{'='*50}")
    return checkpoint

def main():
    parser = argparse.ArgumentParser(description="Run the full playbook pipeline with checkpointing")
    parser.add_argument("--api-base", default="https://djg-debian.coho-jazz.ts.net/be/")
    parser.add_argument("--token", default=None)
    parser.add_argument("--account", type=int, required=True)
    parser.add_argument("--playbook-name", required=True)
    parser.add_argument("--audience-name", required=True)
    parser.add_argument("--seeds", required=True, help="JSON array of seed objects")
    parser.add_argument("--recommendations", required=True, help="JSON array of recommendation objects")
    parser.add_argument("--sequences", required=True, help="JSON array of sequence objects")
    parser.add_argument("--resume-from", help="Path to checkpoint file to resume from")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.token:
        from scripts.config import TOKEN
        args.token = TOKEN

    pipeline(args.api_base, args.token, args.account, args.playbook_name,
             args.audience_name, json.loads(args.seeds),
             json.loads(args.recommendations), json.loads(args.sequences),
             args.dry_run, args.resume_from)

if __name__ == "__main__":
    main()
