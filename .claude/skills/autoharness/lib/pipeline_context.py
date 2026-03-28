"""
PipelineContext — read/write shared pipeline state JSON.
"""
import json
import uuid
from pathlib import Path
from typing import Optional, Any

PIPELINE_CONTEXT_VERSION = "1.0.0"

REQUIRED_STAGES = ["ingestion", "transform", "validate", "output"]

STAGE_REQUIREMENTS = {
    "ingestion": ["source_type", "load_mode", "tables"],
    "transform": ["transforms"],
    "validate": ["rules"],
    "output": ["destination_type", "write_mode"],
}

class PipelineContextError(Exception):
    """Base exception for PipelineContext errors."""
    pass


class PipelineContext:
    def __init__(self, data: dict, session_id: str, base_dir: str):
        self.data = data
        self.session_id = session_id
        self.base_dir = Path(base_dir)
        self._context_file = self.base_dir / self.session_id / "context.json"

    @classmethod
    def new(cls, name: str, base_dir: str) -> "PipelineContext":
        session_id = str(uuid.uuid4())[:8]
        data = {
            "pipeline_id": str(uuid.uuid4()),
            "name": name,
            "version": PIPELINE_CONTEXT_VERSION,
            "status": "in_progress",
            "current_stage": "ingestion",
            "stages": {stage: {"status": "pending", "iteration_count": 0}
                       for stage in REQUIRED_STAGES},
            "schedule": {},
        }
        ctx = cls(data, session_id, base_dir)
        ctx.save()
        return ctx

    @classmethod
    def load(cls, session_id: str, base_dir: str) -> "PipelineContext":
        ctx_file = Path(base_dir) / session_id / "context.json"
        try:
            with open(ctx_file) as f:
                data = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Pipeline session '{session_id}' not found at {ctx_file}"
            )
        except json.JSONDecodeError as e:
            raise PipelineContextError(
                f"Invalid JSON in context file {ctx_file}: {e}"
            ) from e
        return cls(data, session_id, base_dir)

    def save(self) -> None:
        self._context_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self._context_file, "w") as f:
            json.dump(self.data, f, indent=2)

    def update_stage(self, stage: str, updates: dict) -> None:
        if stage not in self.data["stages"]:
            self.data["stages"][stage] = {"iteration_count": 0}
        self.data["stages"][stage].update(updates)
        self.save()

    def get_missing_fields(self, stage: str) -> list[str]:
        """Return list of required fields that are missing or empty for this stage."""
        if stage not in STAGE_REQUIREMENTS:
            return []
        stage_data = self.data.get("stages", {}).get(stage, {})
        missing = []
        for field in STAGE_REQUIREMENTS[stage]:
            value = stage_data.get(field)
            if value is None or value == "" or value == []:
                missing.append(field)
        return missing

    @property
    def pipeline_id(self) -> str:
        return self.data.get("pipeline_id", "")

    def get_incomplete_stages(self) -> list[str]:
        """Return list of stage names that are not yet passed."""
        incomplete = []
        for stage, data in self.data.get("stages", {}).items():
            if data.get("status") != "passed":
                incomplete.append(stage)
        return incomplete