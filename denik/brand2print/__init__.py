"""
Brand2Print - Multi-stage design generation pipeline for print-ready notebooks.
"""

from .pipeline.core import (
    Brand2PrintPipeline,
    BrandGuidelines,
    Phase,
    PhaseStatus,
    PipelineState,
    InspirationSample,
    QAResult,
    CostTracking,
    PhaseState,
    run_brand_pipeline,
)

__version__ = "1.0.0"
__all__ = [
    "Brand2PrintPipeline",
    "BrandGuidelines",
    "Phase",
    "PhaseStatus",
    "PipelineState",
    "InspirationSample",
    "QAResult",
    "CostTracking",
    "PhaseState",
    "run_brand_pipeline",
]
