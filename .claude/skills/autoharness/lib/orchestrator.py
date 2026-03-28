"""
Orchestrator core loop: ask → spawn → verify → iterate.
Implements session resume, stuck detection, and partial save.
"""
import json
from dataclasses import dataclass, field
from typing import Optional
from pipeline_context import PipelineContext

@dataclass
class SessionTracker:
    """Track and list pipeline sessions."""
    base_dir: str

    def list_incomplete_sessions(self) -> list[dict]:
        """Return all sessions that are not complete."""
        import os
        sessions = []
        contexts_dir = self.base_dir
        if not os.path.isdir(contexts_dir):
            return []
        for session_id in os.listdir(contexts_dir):
            ctx_file = os.path.join(contexts_dir, session_id, "context.json")
            if os.path.isfile(ctx_file):
                with open(ctx_file) as f:
                    data = json.load(f)
                if data.get("status") != "complete":
                    sessions.append({
                        "session_id": session_id,
                        "name": data.get("name", "unnamed"),
                        "status": data.get("status"),
                        "current_stage": data.get("current_stage")
                    })
        return sessions

@dataclass
class Orchestrator:
    """Core orchestrator loop implementation."""
    ctx: PipelineContext
    _question_history: dict[str, list[str]] = field(default_factory=dict)

    @classmethod
    def resume(cls, session_id: str, base_dir: str) -> "Orchestrator":
        """
        Resume an interrupted session from disk.
        Implements spec: /autoharness --resume {session-id}
        """
        ctx = PipelineContext.load(session_id, base_dir)
        orch = cls(ctx)
        # Rebuild question history from stage data
        for stage, data in ctx.data.get("stages", {}).items():
            if "question_count" in data:
                count = data["question_count"]
                last_q = data.get("last_question", "")
                orch._question_history[stage] = [last_q] * count
        # Infer current_stage from in_progress stage
        for stage, data in ctx.data.get("stages", {}).items():
            if data.get("status") == "in_progress":
                ctx.data["current_stage"] = stage
                break
        return orch

    def is_stuck(self, stage: str) -> bool:
        """
        Stuck detection: if the same question is asked 3+ times without
        the stage advancing, return True (escalate to user).
        """
        history = self._question_history.get(stage, [])
        if len(history) >= 3:
            return len(set(history[-3:])) == 1
        # Fallback: check context data for same question repeated
        stage_data = self.ctx.data.get("stages", {}).get(stage, {})
        q_count = stage_data.get("question_count", 0)
        if q_count >= 3:
            last_q = stage_data.get("last_question", "")
            return True
        return False

    def record_question(self, stage: str, question: str) -> None:
        """Track question history for stuck detection."""
        if stage not in self._question_history:
            self._question_history[stage] = []
        self._question_history[stage].append(question)
        # Persist to context for resume
        self.ctx.update_stage(stage, {
            "last_question": question,
            "question_count": len(self._question_history[stage])
        })

    def advance_stage(self) -> None:
        """Move to next incomplete stage."""
        stages_order = ["ingestion", "transform", "validate", "output"]
        current_idx = stages_order.index(self.ctx.data.get("current_stage", "ingestion"))
        for stage in stages_order[current_idx + 1:]:
            stage_data = self.ctx.data["stages"].get(stage, {})
            if stage_data.get("status") in ("pending", "in_progress"):
                self.ctx.data["current_stage"] = stage
                self.ctx.save()
                return
        # All stages done
        self.ctx.data["status"] = "complete"
        self.ctx.save()
