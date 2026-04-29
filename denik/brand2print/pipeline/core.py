"""
Brand2Print Core Pipeline
Multi-stage design generation pipeline for print-ready notebooks.

Stages:
1. Brand Vectorization - Extract and vectorize brand assets
2. Prompt Engineering - LLM-powered prompt refinement
3. Inspiration Generation - GPU image generation (10-20 samples)
4. Human Review - Gallery selection with feedback
5. QA Verification - Vision agent brand compliance check
6. High-Fidelity Render - 300 DPI print-ready output
7. PDF Delivery - Press-ready PDF with bleed margins
"""

import os
import json
import time
import asyncio
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any, Callable
from enum import Enum
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class Phase(str, Enum):
    """Pipeline phases in execution order."""
    INPUT = "input"
    PHASE0_PROMPT = "phase0_prompt"
    PHASE1_INSPIRATION = "phase1_inspiration"
    PHASE2_REVIEW = "phase2_review"
    PHASE3_QA = "phase3_qa"
    PHASE4_RENDER = "phase4_render"
    DELIVERY = "delivery"


class PhaseStatus(str, Enum):
    """Status of a pipeline phase."""
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETED = "completed"
    FAILED = "failed"
    WAITING = "waiting"


@dataclass
class BrandGuidelines:
    """Brand identity specifications."""
    client_name: str
    primary_colors: List[str] = field(default_factory=list)
    secondary_colors: List[str] = field(default_factory=list)
    approved_fonts: List[str] = field(default_factory=list)
    visual_vibe: str = ""
    style_preference: str = "minimalist"
    constraints: Optional[str] = None
    logo_path: Optional[str] = None
    documents: List[str] = field(default_factory=list)


@dataclass
class InspirationSample:
    """Generated inspiration image."""
    id: str
    path: str
    prompt: str
    style: str
    selected: bool = False


@dataclass
class QAResult:
    """QA verification result."""
    approved: bool
    issues: List[str] = field(default_factory=list)
    refinement_prompt: Optional[str] = None
    confidence: float = 0.0
    checked_at: str = ""


@dataclass
class CostTracking:
    """Cost tracking per phase."""
    phase1_runpod_cost: float = 0.0
    phase3_minimax_cost: float = 0.0
    phase4_flux_cost: float = 0.0
    total_cost: float = 0.0


@dataclass
class PhaseState:
    """State of a pipeline phase."""
    status: PhaseStatus = PhaseStatus.PENDING
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineState:
    """Complete pipeline state."""
    pipeline_id: str
    brand: BrandGuidelines
    artistic_direction: str = ""
    past_designs_context: Optional[str] = None
    
    # Generated content
    generation_prompt: str = ""
    inspiration_samples: List[InspirationSample] = field(default_factory=list)
    selected_image: Optional[str] = None
    human_feedback: Optional[str] = None
    
    # Review tracking
    review_started_at: Optional[str] = None
    review_completed_at: Optional[str] = None
    
    # QA state
    qa_attempts: int = 0
    qa_passed: bool = False
    qa_issues: List[str] = field(default_factory=list)
    refined_prompt: Optional[str] = None
    qa_result: Optional[QAResult] = None
    
    # Final output
    final_image: Optional[str] = None
    print_ready_path: Optional[str] = None
    
    # Cost tracking
    cost_tracking: CostTracking = field(default_factory=CostTracking)
    
    # Metadata
    timestamp: str = ""
    error: Optional[str] = None
    retry_count: int = 0
    current_phase: Phase = Phase.INPUT
    phase_states: Dict[Phase, PhaseState] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        data = asdict(self)
        # Convert enums to strings
        data['current_phase'] = self.current_phase.value if isinstance(self.current_phase, Phase) else self.current_phase
        data['phase_states'] = {k.value: asdict(v) if isinstance(v, PhaseState) else v 
                               for k, v in self.phase_states.items()}
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "PipelineState":
        """Create from dictionary."""
        # Convert phase strings to enums
        if 'current_phase' in data and isinstance(data['current_phase'], str):
            data['current_phase'] = Phase(data['current_phase'])
        
        # Convert phase state strings to enums
        if 'phase_states' in data:
            for k, v in data['phase_states'].items():
                if isinstance(v, dict):
                    if 'status' in v and isinstance(v['status'], str):
                        v['status'] = PhaseStatus(v['status'])
        
        return cls(**data)


class PipelineEventHandler:
    """Event handler for pipeline progress updates."""
    
    def __init__(self, pipeline_id: str, storage_path: str):
        self.pipeline_id = pipeline_id
        self.storage_path = Path(storage_path)
        self.events: List[Dict[str, Any]] = []
        self._ensure_storage()
    
    def _ensure_storage(self):
        """Ensure storage directory exists."""
        (self.storage_path / self.pipeline_id).mkdir(parents=True, exist_ok=True)
    
    def emit(self, event_type: str, data: Dict[str, Any]):
        """Emit a pipeline event."""
        event = {
            "pipeline_id": self.pipeline_id,
            "type": event_type,
            "data": data,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }
        self.events.append(event)
        logger.info(f"[{self.pipeline_id}] Event: {event_type}")
        
        # Persist event
        event_file = self.storage_path / self.pipeline_id / f"{event_type}_{len(self.events)}.json"
        with open(event_file, 'w') as f:
            json.dump(event, f, indent=2)
    
    def get_events(self) -> List[Dict[str, Any]]:
        """Get all events."""
        return self.events


class BrandVectorizer:
    """Extract and vectorize brand assets."""
    
    def __init__(self, storage_path: str):
        self.storage_path = Path(storage_path)
    
    async def vectorize(
        self, 
        logo_path: Optional[str] = None,
        primary_colors: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Vectorize brand assets.
        
        Returns:
            Dict with extracted vectors and color analysis
        """
        output_dir = self.storage_path / "vectorized"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        result = {
            "logo_svg": None,
            "logo_vector_path": None,
            "primary_color_vectors": [],
            "palette_analysis": None,
        }
        
        # If logo provided, convert to SVG vector
        if logo_path:
            svg_path = await self._convert_to_svg(logo_path, output_dir)
            result["logo_svg"] = svg_path
            result["logo_vector_path"] = svg_path
        
        # Analyze colors
        if primary_colors:
            result["palette_analysis"] = self._analyze_palette(primary_colors)
        
        return result
    
    async def _convert_to_svg(self, input_path: str, output_dir: Path) -> Optional[str]:
        """Convert image to SVG vector."""
        # Placeholder - actual implementation would use potrace or similar
        ext = Path(input_path).suffix.lower()
        if ext == '.svg':
            return input_path
        return None
    
    def _analyze_palette(self, colors: List[str]) -> Dict[str, Any]:
        """Analyze brand color palette."""
        return {
            "primary": colors[0] if colors else "#000000",
            "secondary": colors[1] if len(colors) > 1 else None,
            "tertiary": colors[2] if len(colors) > 2 else None,
        }


class PromptEngine:
    """LLM-powered prompt engineering."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
    
    async def refine(
        self,
        brand: BrandGuidelines,
        artistic_direction: str,
        style_count: int = 5
    ) -> List[str]:
        """
        Generate refined prompts for image generation.
        
        Args:
            brand: Brand guidelines
            artistic_direction: Creative direction text
            style_count: Number of variations to generate
            
        Returns:
            List of refined prompts
        """
        # Base prompt template
        base_prompt = self._build_base_prompt(brand, artistic_direction)
        
        # Generate style variations
        prompts = []
        style_variations = [
            "minimalist geometric",
            "bold abstract", 
            "elegant typography",
            "playful pattern",
            "professional editorial",
            "artistic illustration",
            "modern gradient",
            "classic serif",
            "futuristic tech",
            "organic flow"
        ]
        
        for i in range(min(style_count, len(style_variations))):
            prompt = f"""
{base_prompt}

Style variation {i+1}: {style_variations[i]}

Focus: {artistic_direction}

Requirements:
- Clean composition suitable for notebook cover
- Strong brand color presence ({', '.join(brand.primary_colors[:3])})
- Professional yet distinctive aesthetic
- High contrast for print visibility
- Minimal text, focus on visual impact
"""
            prompts.append(prompt.strip())
        
        return prompts
    
    def _build_base_prompt(self, brand: BrandGuidelines, direction: str) -> str:
        """Build base prompt from brand guidelines."""
        return f"""
Notebook cover design for {brand.client_name}.

Brand identity:
- Visual vibe: {brand.visual_vibe or 'modern professional'}
- Style preference: {brand.style_preference}
- Colors: Primary {brand.primary_colors[0] if brand.primary_colors else 'N/A'}, 
  Secondary {brand.primary_colors[1] if len(brand.primary_colors) > 1 else 'N/A'}

Creative direction: {direction}

The design should be print-ready, high resolution, suitable for premium merchandise.
"""


class InspirationGenerator:
    """GPU-accelerated inspiration image generation via RunPod."""
    
    def __init__(
        self, 
        api_key: Optional[str] = None,
        endpoint_id: Optional[str] = None
    ):
        self.api_key = api_key or os.environ.get("RUNPOD_API_KEY")
        self.endpoint_id = endpoint_id or os.environ.get("RUNPOD_ENDPOINT_ID", "z-image-turbo")
        self.base_url = "https://api.runpod.io/graphql"
    
    async def generate_batch(
        self,
        prompts: List[str],
        output_dir: Path,
        on_progress: Optional[Callable[[int, int], None]] = None
    ) -> List[InspirationSample]:
        """
        Generate batch of inspiration images.
        
        Args:
            prompts: List of generation prompts
            output_dir: Directory to save generated images
            on_progress: Progress callback (current, total)
            
        Returns:
            List of generated inspiration samples
        """
        samples = []
        output_dir.mkdir(parents=True, exist_ok=True)
        
        for i, prompt in enumerate(prompts):
            # Generate with RunPod
            image_path = await self._generate_single(
                prompt, 
                output_dir / f"inspiration_{i+1}.png"
            )
            
            sample = InspirationSample(
                id=f"insp_{int(time.time())}_{i}",
                path=str(image_path) if image_path else "",
                prompt=prompt,
                style=self._extract_style_from_prompt(prompt),
                selected=False
            )
            samples.append(sample)
            
            if on_progress:
                on_progress(i + 1, len(prompts))
        
        return samples
    
    async def _generate_single(
        self, 
        prompt: str, 
        output_path: Path
    ) -> Optional[Path]:
        """Generate single image."""
        # Placeholder - actual implementation calls RunPod API
        # For now, return a placeholder path
        return output_path
    
    def _extract_style_from_prompt(self, prompt: str) -> str:
        """Extract style from prompt text."""
        styles = ["minimalist", "bold", "elegant", "playful", "professional", "artistic", "modern", "classic", "futuristic", "organic"]
        prompt_lower = prompt.lower()
        for style in styles:
            if style in prompt_lower:
                return style
        return "modern"


class QAVerifier:
    """Vision agent for QA verification via MiniMax."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("MINIMAX_API_KEY")
        self.group_id = os.environ.get("MINIMAX_GROUP_ID")
    
    async def verify(
        self,
        image_path: str,
        brand: BrandGuidelines,
        selected_prompt: str
    ) -> QAResult:
        """
        Verify generated image meets brand standards.
        
        Args:
            image_path: Path to generated image
            brand: Brand guidelines to check against
            selected_prompt: The prompt used for generation
            
        Returns:
            QA verification result
        """
        # Check color presence
        color_issues = self._check_color_presence(image_path, brand.primary_colors)
        
        # Check composition
        composition_issues = self._check_composition(image_path)
        
        # Check print suitability
        print_issues = self._check_print_quality(image_path)
        
        all_issues = color_issues + composition_issues + print_issues
        
        result = QAResult(
            approved=len(all_issues) == 0,
            issues=all_issues,
            refinement_prompt=self._generate_refinement_prompt(all_issues, brand) if all_issues else None,
            confidence=1.0 - (len(all_issues) * 0.1),
            checked_at=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        )
        
        return result
    
    def _check_color_presence(self, image_path: str, colors: List[str]) -> List[str]:
        """Check if primary brand colors are present in image."""
        # Placeholder - actual implementation uses vision model
        return []
    
    def _check_composition(self, image_path: str) -> List[str]:
        """Check image composition."""
        return []
    
    def _check_print_quality(self, image_path: str) -> List[str]:
        """Check print-ready quality."""
        return []
    
    def _generate_refinement_prompt(self, issues: List[str], brand: BrandGuidelines) -> str:
        """Generate refinement prompt based on issues."""
        return f"""
Please revise the design to address the following issues:
{chr(10).join(f'- {issue}' for issue in issues)}

Maintain the brand identity:
- Client: {brand.client_name}
- Colors: {', '.join(brand.primary_colors)}
- Style: {brand.style_preference}
"""


class HighFidelityRenderer:
    """High-fidelity render via Flux for print-ready output."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("RUNPOD_API_KEY")
        self.flux_endpoint = os.environ.get("RUNPOD_ENDPOINT_FLUX", "flux-pro")
    
    async def render(
        self,
        selected_image_path: str,
        brand: BrandGuidelines,
        refinement_notes: Optional[str] = None,
        resolution: int = 300  # DPI
    ) -> str:
        """
        Render high-fidelity print-ready image.
        
        Args:
            selected_image_path: Path to selected inspiration
            brand: Brand guidelines
            refinement_notes: Optional refinement instructions
            resolution: Target DPI (300 for print)
            
        Returns:
            Path to rendered high-fidelity image
        """
        # Placeholder - actual implementation uses Flux
        output_path = Path(selected_image_path).parent / "hifi" / f"rendered_{int(time.time())}.png"
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        return str(output_path)
    
    async def upscale(self, image_path: str, scale: float = 2.0) -> str:
        """Upscale image for print quality."""
        # Placeholder
        return image_path


class PDFGenerator:
    """Generate press-ready PDF with bleed margins."""
    
    def __init__(self, storage_path: str):
        self.storage_path = Path(storage_path)
    
    async def generate(
        self,
        front_cover_path: str,
        back_cover_path: str,
        spine_path: Optional[str] = None,
        brand: Optional[BrandGuidelines] = None
    ) -> str:
        """
        Generate print-ready PDF.
        
        Args:
            front_cover_path: Path to front cover SVG/PNG
            back_cover_path: Path to back cover SVG/PNG
            spine_path: Optional spine design
            brand: Brand info for metadata
            
        Returns:
            Path to generated PDF
        """
        # Print specs (in points, 72pt = 1 inch)
        page_width = 378   # 5.25" 
        page_height = 594  # 8.25"
        bleed = 3
        safe_margin = 12
        binding_width = 15
        
        output_dir = self.storage_path / "print_ready"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate PDF
        output_path = output_dir / f"{brand.client_name if brand else 'notebook'}_print_ready.pdf"
        
        # Placeholder - actual implementation uses reportlab or similar
        return str(output_path)
    
    def _calculate_dimensions(
        self,
        front_path: str,
        back_path: str,
        spine_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate PDF page dimensions."""
        # Standard notebook: 5.25" x 8.25"
        return {
            "width": 378,   # 5.25" * 72pt
            "height": 594,  # 8.25" * 72pt
            "bleed": 3,
            "safe_margin": 12,
            "binding_width": 15,
        }


class Brand2PrintPipeline:
    """
    Main Brand2Print Pipeline Orchestrator.
    
    Coordinates all phases of the design generation pipeline.
    """
    
    def __init__(
        self,
        storage_path: str = "./pipeline_data",
        runpod_key: Optional[str] = None,
        minimax_key: Optional[str] = None,
        verbose: bool = True
    ):
        self.storage_path = Path(storage_path)
        self.verbose = verbose
        
        # Initialize phase handlers
        self.vectorizer = BrandVectorizer(str(self.storage_path))
        self.prompt_engine = PromptEngine()
        self.inspiration_gen = InspirationGenerator(
            api_key=runpod_key,
            endpoint_id=os.environ.get("RUNPOD_ENDPOINT_ID")
        )
        self.qa_verifier = QAVerifier(api_key=minimax_key)
        self.renderer = HighFidelityRenderer(api_key=runpod_key)
        self.pdf_generator = PDFGenerator(str(self.storage_path))
        
        # State management
        self.state: Optional[PipelineState] = None
        self.event_handler: Optional[PipelineEventHandler] = None
    
    def _log(self, message: str):
        """Log message if verbose mode enabled."""
        if self.verbose:
            logger.info(message)
    
    def initialize(
        self, 
        brand: BrandGuidelines,
        artistic_direction: str,
        past_designs_context: Optional[str] = None
    ) -> PipelineState:
        """Initialize pipeline with brand guidelines."""
        pipeline_id = f"pipeline_{int(time.time())}"
        
        # Create initial state
        self.state = PipelineState(
            pipeline_id=pipeline_id,
            brand=brand,
            artistic_direction=artistic_direction,
            past_designs_context=past_designs_context,
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            phase_states={phase: PhaseState() for phase in Phase}
        )
        
        # Initialize event handler
        self.event_handler = PipelineEventHandler(pipeline_id, str(self.storage_path))
        self.event_handler.emit("initialized", {"brand": brand.client_name})
        
        return self.state
    
    async def run(
        self,
        brand: BrandGuidelines,
        artistic_direction: str,
        past_designs_context: Optional[str] = None,
        skip_phases: Optional[List[Phase]] = None
    ) -> PipelineState:
        """
        Run complete pipeline.
        
        Args:
            brand: Brand guidelines
            artistic_direction: Creative direction
            past_designs_context: Optional context from previous designs
            skip_phases: Phases to skip
            
        Returns:
            Final pipeline state
        """
        # Initialize
        self.state = self.initialize(brand, artistic_direction, past_designs_context)
        skip_phases = skip_phases or []
        
        # Phase 0: Prompt Engineering
        if Phase.PHASE0_PROMPT not in skip_phases:
            await self._run_prompt_phase()
        
        # Phase 1: Inspiration Generation
        if Phase.PHASE1_INSPIRATION not in skip_phases:
            await self._run_inspiration_phase()
        
        # Phase 2: Human Review (handled externally)
        # Phase 2 is marked as waiting for human input
        
        # Phase 3: QA Verification
        if Phase.PHASE3_QA not in skip_phases:
            await self._run_qa_phase()
        
        # Phase 4: High-Fidelity Render
        if Phase.PHASE4_RENDER not in skip_phases:
            await self._run_render_phase()
        
        # Phase 5: PDF Delivery
        if Phase.DELIVERY not in skip_phases:
            await self._run_delivery_phase()
        
        return self.state
    
    async def _run_prompt_phase(self):
        """Execute prompt engineering phase."""
        self._log("Running Phase 0: Prompt Engineering")
        self.state.current_phase = Phase.PHASE0_PROMPT
        self.state.phase_states[Phase.PHASE0_PROMPT].status = PhaseStatus.ACTIVE
        
        self.event_handler.emit("phase_started", {"phase": "phase0_prompt"})
        
        prompts = await self.prompt_engine.refine(
            self.state.brand,
            self.state.artistic_direction,
            style_count=10
        )
        
        self.state.generation_prompt = prompts[0] if prompts else ""
        self.state.phase_states[Phase.PHASE0_PROMPT].status = PhaseStatus.COMPLETED
        self.state.phase_states[Phase.PHASE0_PROMPT].data = {"prompts": prompts}
        
        self.event_handler.emit("phase_completed", {
            "phase": "phase0_prompt",
            "prompt_count": len(prompts)
        })
    
    async def _run_inspiration_phase(self):
        """Execute inspiration generation phase."""
        self._log("Running Phase 1: Inspiration Generation")
        self.state.current_phase = Phase.PHASE1_INSPIRATION
        self.state.phase_states[Phase.PHASE1_INSPIRATION].status = PhaseStatus.ACTIVE
        
        self.event_handler.emit("phase_started", {"phase": "phase1_inspiration"})
        
        prompts = self.state.phase_states[Phase.PHASE0_PROMPT].data.get("prompts", [])
        if not prompts:
            prompts = await self.prompt_engine.refine(
                self.state.brand,
                self.state.artistic_direction,
                style_count=10
            )
        
        output_dir = self.storage_path / self.state.pipeline_id / "inspirations"
        
        def on_progress(current: int, total: int):
            self.event_handler.emit("progress", {
                "phase": "phase1_inspiration",
                "current": current,
                "total": total
            })
        
        samples = await self.inspiration_gen.generate_batch(
            prompts[:10],
            output_dir,
            on_progress=on_progress
        )
        
        self.state.inspiration_samples = samples
        self.state.phase_states[Phase.PHASE1_INSPIRATION].status = PhaseStatus.COMPLETED
        self.state.phase_states[Phase.PHASE1_INSPIRATION].data = {
            "sample_count": len(samples)
        }
        
        self.event_handler.emit("phase_completed", {
            "phase": "phase1_inspiration",
            "samples": len(samples)
        })
    
    async def _run_qa_phase(self):
        """Execute QA verification phase."""
        self._log("Running Phase 3: QA Verification")
        
        if not self.state.selected_image:
            self._log("No image selected, skipping QA")
            return
        
        self.state.current_phase = Phase.PHASE3_QA
        self.state.phase_states[Phase.PHASE3_QA].status = PhaseStatus.ACTIVE
        
        self.event_handler.emit("phase_started", {"phase": "phase3_qa"})
        
        self.state.qa_result = await self.qa_verifier.verify(
            self.state.selected_image,
            self.state.brand,
            self.state.generation_prompt
        )
        
        self.state.qa_attempts += 1
        self.state.qa_passed = self.state.qa_result.approved
        self.state.qa_issues = self.state.qa_result.issues
        self.state.refined_prompt = self.state.qa_result.refinement_prompt
        
        if self.state.qa_result.approved:
            self.state.phase_states[Phase.PHASE3_QA].status = PhaseStatus.COMPLETED
        else:
            self.state.phase_states[Phase.PHASE3_QA].status = PhaseStatus.WAITING
        
        self.event_handler.emit("qa_completed", asdict(self.state.qa_result))
    
    async def _run_render_phase(self):
        """Execute high-fidelity render phase."""
        self._log("Running Phase 4: High-Fidelity Render")
        
        if not self.state.selected_image:
            self._log("No image selected, skipping render")
            return
        
        self.state.current_phase = Phase.PHASE4_RENDER
        self.state.phase_states[Phase.PHASE4_RENDER].status = PhaseStatus.ACTIVE
        
        self.event_handler.emit("phase_started", {"phase": "phase4_render"})
        
        self.state.final_image = await self.renderer.render(
            self.state.selected_image,
            self.state.brand,
            self.state.refined_prompt
        )
        
        self.state.phase_states[Phase.PHASE4_RENDER].status = PhaseStatus.COMPLETED
        
        self.event_handler.emit("phase_completed", {
            "phase": "phase4_render",
            "output": self.state.final_image
        })
    
    async def _run_delivery_phase(self):
        """Execute PDF delivery phase."""
        self._log("Running Phase 5: PDF Delivery")
        
        if not self.state.final_image:
            self._log("No final image, skipping delivery")
            return
        
        self.state.current_phase = Phase.DELIVERY
        self.state.phase_states[Phase.DELIVERY].status = PhaseStatus.ACTIVE
        
        self.event_handler.emit("phase_started", {"phase": "delivery"})
        
        self.state.print_ready_path = await self.pdf_generator.generate(
            self.state.final_image,
            self.state.final_image,  # Would be separate back cover
            brand=self.state.brand
        )
        
        self.state.phase_states[Phase.DELIVERY].status = PhaseStatus.COMPLETED
        self.state.cost_tracking.total_cost = (
            self.state.cost_tracking.phase1_runpod_cost +
            self.state.cost_tracking.phase3_minimax_cost +
            self.state.cost_tracking.phase4_flux_cost
        )
        
        self.event_handler.emit("delivery_completed", {
            "path": self.state.print_ready_path,
            "total_cost": self.state.cost_tracking.total_cost
        })
    
    def select_image(self, image_path: str, feedback: Optional[str] = None):
        """Select an image for refinement."""
        self.state.selected_image = image_path
        self.state.human_feedback = feedback
        self.state.review_completed_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.state.phase_states[Phase.PHASE2_REVIEW].status = PhaseStatus.COMPLETED
        
        # Update samples to mark selection
        for sample in self.state.inspiration_samples:
            sample.selected = sample.path == image_path
        
        self.event_handler.emit("image_selected", {
            "path": image_path,
            "feedback": feedback
        })
    
    def save_state(self) -> str:
        """Save current state to file."""
        if not self.state:
            return ""
        
        state_file = self.storage_path / self.state.pipeline_id / "state.json"
        state_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(state_file, 'w') as f:
            json.dump(self.state.to_dict(), f, indent=2)
        
        return str(state_file)
    
    def load_state(self, pipeline_id: str) -> PipelineState:
        """Load state from file."""
        state_file = self.storage_path / pipeline_id / "state.json"
        
        if not state_file.exists():
            raise FileNotFoundError(f"Pipeline state not found: {pipeline_id}")
        
        with open(state_file, 'r') as f:
            data = json.load(f)
        
        self.state = PipelineState.from_dict(data)
        self.event_handler = PipelineEventHandler(pipeline_id, str(self.storage_path))
        
        return self.state


# Convenience function for quick pipeline execution
async def run_brand_pipeline(
    brand: BrandGuidelines,
    artistic_direction: str,
    storage_path: str = "./pipeline_data"
) -> PipelineState:
    """
    Run brand pipeline with minimal configuration.
    
    Args:
        brand: Brand guidelines
        artistic_direction: Creative direction
        storage_path: Path for pipeline data
        
    Returns:
        Final pipeline state
    """
    pipeline = Brand2PrintPipeline(storage_path=storage_path)
    return await pipeline.run(brand, artistic_direction)


if __name__ == "__main__":
    # Example usage
    async def main():
        brand = BrandGuidelines(
            client_name="Acme Corp",
            primary_colors=["#FF5733", "#FFC300"],
            secondary_colors=["#333333"],
            visual_vibe="Modern, energetic, bold",
            style_preference="geometric"
        )
        
        pipeline = Brand2PrintPipeline(verbose=True)
        result = await pipeline.run(
            brand,
            "Create a dynamic notebook cover that captures the energetic spirit of Acme Corp"
        )
        
        print(f"Pipeline completed: {result.pipeline_id}")
        print(f"Final state: {result.current_phase}")
    
    asyncio.run(main())
