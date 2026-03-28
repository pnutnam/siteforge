# ~/.claude/skills/autoharness/lib/test_orchestrator.py
import pytest, tempfile, sys, json
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "lib"))
from pipeline_context import PipelineContext
from orchestrator import Orchestrator, SessionTracker

def test_list_incomplete_sessions():
    """SessionTracker returns all in-progress sessions."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create two sessions, complete one
        ctx1 = PipelineContext.new("pipeline-a", base_dir=tmpdir)
        ctx2 = PipelineContext.new("pipeline-b", base_dir=tmpdir)
        ctx1.data["status"] = "complete"
        ctx1.save()

        tracker = SessionTracker(tmpdir)
        incomplete = tracker.list_incomplete_sessions()
        assert len(incomplete) == 1
        assert incomplete[0]["name"] == "pipeline-b"

def test_get_incomplete_stages():
    """Returns stages that are not yet passed."""
    with tempfile.TemporaryDirectory() as tmpdir:
        ctx = PipelineContext.new("test", base_dir=tmpdir)
        ctx.update_stage("ingestion", {"status": "passed"})
        ctx.update_stage("transform", {"status": "in_progress"})
        incomplete = ctx.get_incomplete_stages()
        assert "ingestion" not in incomplete  # passed
        assert "transform" in incomplete       # in_progress
        assert "validate" in incomplete        # pending
        assert "output" in incomplete         # pending

def test_stuck_detection():
    """Detects when same question asked 3+ times without progress."""
    from orchestrator import Orchestrator
    with tempfile.TemporaryDirectory() as tmpdir:
        ctx = PipelineContext.new("test", base_dir=tmpdir)
        orch = Orchestrator(ctx)

        # Simulate stuck: same question asked repeatedly
        for _ in range(3):
            orch.record_question("ingestion", "What is the source_type?")

        assert orch.is_stuck("ingestion") is True

def test_resume_session():
    """Orchestrator.resume() loads an interrupted session from disk."""
    from orchestrator import Orchestrator
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a session with partial progress
        ctx = PipelineContext.new("interrupted-pipeline", base_dir=tmpdir)
        ctx.update_stage("ingestion", {
            "source_type": "postgresql",
            "status": "passed",
            "question_count": 2,
            "last_question": "What is the source type?"
        })
        ctx.update_stage("transform", {
            "status": "in_progress",
            "question_count": 1,
            "last_question": "What transformations are needed?"
        })
        saved_session_id = ctx.session_id

        # Resume the session
        resumed = Orchestrator.resume(saved_session_id, tmpdir)
        assert resumed.ctx.data["name"] == "interrupted-pipeline"
        assert resumed.ctx.data["current_stage"] == "transform"
