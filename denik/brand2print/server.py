"""
Brand2Print FastAPI Server

REST API for the Brand2Print pipeline.
Handles:
- Pipeline creation and management
- Image selection
- QA submission
- Real-time progress via WebSocket
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import pipeline components
import sys
sys.path.insert(0, str(Path(__file__).parent))
from pipeline.core import (
    Brand2PrintPipeline,
    BrandGuidelines,
    Phase,
    PhaseStatus,
    PipelineState,
    InspirationSample,
    QAResult,
)


# ============================================
# Configuration
# ============================================

STORAGE_PATH = os.environ.get("PIPELINE_STORAGE_PATH", "./pipeline_data")
os.makedirs(STORAGE_PATH, exist_ok=True)

# API Keys
RUNPOD_KEY = os.environ.get("RUNPOD_API_KEY")
MINIMAX_KEY = os.environ.get("MINIMAX_API_KEY")


# ============================================
# In-Memory State
# ============================================

pipelines: Dict[str, PipelineState] = {}
ws_connections: Dict[str, List[WebSocket]] = {}


# ============================================
# Pydantic Models
# ============================================

class BrandGuidelinesInput(BaseModel):
    client_name: str
    primary_colors: List[str] = []
    secondary_colors: List[str] = []
    approved_fonts: List[str] = []
    visual_vibe: str = ""
    style_preference: str = "minimalist"
    constraints: Optional[str] = None
    logo_path: Optional[str] = None
    documents: List[str] = []


class StartPipelineRequest(BaseModel):
    brand: BrandGuidelinesInput
    artistic_direction: str
    past_designs_context: Optional[str] = None


class SelectImageRequest(BaseModel):
    selected_image: str
    human_feedback: Optional[str] = None


class QARequest(BaseModel):
    approved: bool
    issues: List[str] = []
    refinement_prompt: Optional[str] = None
    confidence: float = 1.0


class PipelineListItem(BaseModel):
    pipeline_id: str
    client_name: str
    current_phase: str
    status: str
    timestamp: str


# ============================================
# WebSocket Manager
# ============================================

class ConnectionManager:
    """Manage WebSocket connections for real-time updates."""
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, pipeline_id: str, websocket: WebSocket):
        await websocket.accept()
        if pipeline_id not in self.active_connections:
            self.active_connections[pipeline_id] = []
        self.active_connections[pipeline_id].append(websocket)
    
    def disconnect(self, pipeline_id: str, websocket: WebSocket):
        if pipeline_id in self.active_connections:
            self.active_connections[pipeline_id].remove(websocket)
    
    async def broadcast(self, pipeline_id: str, message: Dict[str, Any]):
        if pipeline_id in self.active_connections:
            for connection in self.active_connections[pipeline_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"WebSocket send error: {e}")


manager = ConnectionManager()


# ============================================
# FastAPI App
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting Brand2Print API Server")
    yield
    logger.info("Shutting down Brand2Print API Server")


app = FastAPI(
    title="Brand2Print API",
    description="Multi-stage design generation pipeline for print-ready notebooks",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Pipeline Operations
# ============================================

def convert_brand_input(input_data: BrandGuidelinesInput) -> BrandGuidelines:
    """Convert input model to pipeline BrandGuidelines."""
    return BrandGuidelines(
        client_name=input_data.client_name,
        primary_colors=input_data.primary_colors,
        secondary_colors=input_data.secondary_colors,
        approved_fonts=input_data.approved_fonts,
        visual_vibe=input_data.visual_vibe,
        style_preference=input_data.style_preference,
        constraints=input_data.constraints,
        logo_path=input_data.logo_path,
        documents=input_data.documents
    )


async def run_pipeline_async(pipeline_id: str, request: StartPipelineRequest):
    """Run pipeline in background."""
    logger.info(f"Starting background pipeline: {pipeline_id}")
    
    try:
        pipeline = Brand2PrintPipeline(
            storage_path=STORAGE_PATH,
            runpod_key=RUNPOD_KEY,
            minimax_key=MINIMAX_KEY,
            verbose=True
        )
        
        # Create custom event handler for WebSocket broadcasts
        class WSEventHandler:
            def __init__(self, pid):
                self.pipeline_id = pid
            
            def emit(self, event_type: str, data: Dict[str, Any]):
                asyncio.create_task(manager.broadcast(self.pipeline_id, {
                    "type": event_type,
                    "data": data,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }))
        
        ws_handler = WSEventHandler(pipeline_id)
        
        # Initialize pipeline
        brand = convert_brand_input(request.brand)
        state = pipeline.initialize(
            brand=brand,
            artistic_direction=request.artistic_direction,
            past_designs_context=request.past_designs_context
        )
        
        # Store in memory
        pipelines[pipeline_id] = state
        
        # Broadcast initialization
        await manager.broadcast(pipeline_id, {
            "type": "initialized",
            "data": {"pipeline_id": pipeline_id, "brand": request.brand.client_name},
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
        
        # Run phases (skip review - needs human input)
        skip_phases = [Phase.PHASE2_REVIEW]
        
        for phase in Phase:
            if phase in skip_phases:
                continue
            
            try:
                if phase == Phase.PHASE0_PROMPT:
                    await pipeline._run_prompt_phase()
                elif phase == Phase.PHASE1_INSPIRATION:
                    await pipeline._run_inspiration_phase()
                elif phase == Phase.PHASE3_QA:
                    # Only run if image selected
                    if state.selected_image:
                        await pipeline._run_qa_phase()
                elif phase == Phase.PHASE4_RENDER:
                    if state.selected_image and state.qa_passed:
                        await pipeline._run_render_phase()
                elif phase == Phase.DELIVERY:
                    if state.final_image:
                        await pipeline._run_delivery_phase()
                
                # Update stored state
                pipelines[pipeline_id] = pipeline.state
                
            except Exception as e:
                logger.error(f"Phase {phase} failed: {e}")
                pipeline.state.phase_states[phase].status = PhaseStatus.FAILED
                pipeline.state.error = str(e)
        
        # Save final state
        pipeline.save_state()
        
        # Broadcast completion
        await manager.broadcast(pipeline_id, {
            "type": "completed",
            "data": {
                "pipeline_id": pipeline_id,
                "phase": pipeline.state.current_phase.value,
                "error": pipeline.state.error
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
        
        logger.info(f"Pipeline {pipeline_id} completed")
        
    except Exception as e:
        logger.error(f"Pipeline {pipeline_id} failed: {e}")
        await manager.broadcast(pipeline_id, {
            "type": "error",
            "data": {"error": str(e)},
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })


# ============================================
# API Routes
# ============================================

@app.get("/")
async def root():
    """Health check."""
    return {
        "status": "ok",
        "service": "Brand2Print API",
        "version": "1.0.0",
        "active_pipelines": len(pipelines)
    }


@app.get("/health")
async def health():
    """Detailed health check."""
    return {
        "status": "healthy",
        "storage_path": STORAGE_PATH,
        "pipelines": {
            pid: {
                "phase": state.current_phase.value if isinstance(state.current_phase, Phase) else state.current_phase,
                "timestamp": state.timestamp
            }
            for pid, state in pipelines.items()
        }
    }


# --- Pipeline Management ---

@app.post("/api/pipeline/start", response_model=Dict[str, Any])
async def start_pipeline(request: StartPipelineRequest, background_tasks: BackgroundTasks):
    """Start a new pipeline."""
    pipeline_id = f"pipeline_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{len(pipelines) + 1}"
    
    # Start pipeline in background
    background_tasks.add_task(run_pipeline_async, pipeline_id, request)
    
    return {
        "pipeline_id": pipeline_id,
        "status": "started",
        "brand": request.brand.client_name
    }


@app.get("/api/pipelines", response_model=Dict[str, List[Dict[str, Any]]])
async def list_pipelines():
    """List all pipelines."""
    return {
        "pipelines": [
            {
                "pipeline_id": pid,
                "client_name": state.brand.client_name,
                "current_phase": state.current_phase.value if isinstance(state.current_phase, Phase) else state.current_phase,
                "status": "running" if not state.error else "failed",
                "timestamp": state.timestamp
            }
            for pid, state in pipelines.items()
        ]
    }


@app.get("/api/pipeline/{pipeline_id}", response_model=Dict[str, Any])
async def get_pipeline(pipeline_id: str):
    """Get pipeline state."""
    if pipeline_id not in pipelines:
        # Try loading from storage
        state_file = Path(STORAGE_PATH) / pipeline_id / "state.json"
        if state_file.exists():
            with open(state_file) as f:
                data = json.load(f)
                pipelines[pipeline_id] = PipelineState.from_dict(data)
        else:
            raise HTTPException(status_code=404, detail="Pipeline not found")
    
    state = pipelines[pipeline_id]
    return state.to_dict()


@app.post("/api/pipeline/{pipeline_id}/select")
async def select_image(pipeline_id: str, request: SelectImageRequest):
    """Select an image for the pipeline."""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    state = pipelines[pipeline_id]
    state.selected_image = request.selected_image
    state.human_feedback = request.human_feedback
    state.review_completed_at = datetime.utcnow().isoformat() + "Z"
    state.phase_states[Phase.PHASE2_REVIEW].status = PhaseStatus.COMPLETED
    
    # Broadcast selection
    await manager.broadcast(pipeline_id, {
        "type": "image_selected",
        "data": {
            "selected_image": request.selected_image,
            "feedback": request.human_feedback
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    
    return {"status": "selected", "pipeline_id": pipeline_id}


@app.post("/api/pipeline/{pipeline_id}/qa")
async def submit_qa(pipeline_id: str, request: QARequest):
    """Submit QA verification result."""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    state = pipelines[pipeline_id]
    state.qa_result = QAResult(
        approved=request.approved,
        issues=request.issues,
        refinement_prompt=request.refinement_prompt,
        confidence=request.confidence,
        checked_at=datetime.utcnow().isoformat() + "Z"
    )
    state.qa_attempts += 1
    state.qa_passed = request.approved
    state.qa_issues = request.issues
    
    if request.approved:
        state.phase_states[Phase.PHASE3_QA].status = PhaseStatus.COMPLETED
    else:
        state.phase_states[Phase.PHASE3_QA].status = PhaseStatus.WAITING
        state.refined_prompt = request.refinement_prompt
    
    return {
        "status": "qa_submitted",
        "approved": request.approved,
        "pipeline_id": pipeline_id
    }


@app.post("/api/pipeline/{pipeline_id}/continue")
async def continue_pipeline(pipeline_id: str, background_tasks: BackgroundTasks):
    """Continue pipeline after QA/review."""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    state = pipelines[pipeline_id]
    
    # Create a continuation request
    request = StartPipelineRequest(
        brand=BrandGuidelinesInput(
            client_name=state.brand.client_name,
            primary_colors=state.brand.primary_colors,
            secondary_colors=state.brand.secondary_colors,
            approved_fonts=state.brand.approved_fonts,
            visual_vibe=state.brand.visual_vibe,
            style_preference=state.brand.style_preference
        ),
        artistic_direction=state.artistic_direction
    )
    
    # Continue in background
    background_tasks.add_task(run_pipeline_async, pipeline_id, request)
    
    return {"status": "continuing", "pipeline_id": pipeline_id}


@app.delete("/api/pipeline/{pipeline_id}")
async def cancel_pipeline(pipeline_id: str):
    """Cancel a pipeline."""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    pipelines[pipeline_id].error = "Cancelled by user"
    pipelines[pipeline_id].phase_states[pipelines[pipeline_id].current_phase].status = PhaseStatus.FAILED
    
    await manager.broadcast(pipeline_id, {
        "type": "cancelled",
        "data": {},
        "timestamp": datetime.utcnow().isoformat() + "Z"
    })
    
    return {"status": "cancelled", "pipeline_id": pipeline_id}


# --- Inspiration Management ---

@app.get("/api/pipeline/{pipeline_id}/inspirations")
async def get_inspirations(pipeline_id: str):
    """Get inspiration samples for a pipeline."""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    state = pipelines[pipeline_id]
    return {
        "inspirations": [
            {
                "id": s.id,
                "path": s.path,
                "prompt": s.prompt,
                "style": s.style,
                "selected": s.selected
            }
            for s in state.inspiration_samples
        ]
    }


# --- WebSocket ---

@app.websocket("/ws/pipeline/{pipeline_id}")
async def websocket_endpoint(websocket: WebSocket, pipeline_id: str):
    """WebSocket endpoint for real-time pipeline updates."""
    await manager.connect(pipeline_id, websocket)
    try:
        while True:
            # Receive messages from client (keep-alive)
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(pipeline_id, websocket)


# --- Debug/Development ---

@app.post("/api/debug/mock-inspirations")
async def create_mock_inspirations(pipeline_id: str, count: int = 10):
    """Create mock inspiration samples for testing."""
    if pipeline_id not in pipelines:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    
    state = pipelines[pipeline_id]
    
    # Generate mock SVG images
    colors = state.brand.primary_colors[:3] if state.brand.primary_colors else ["#FF5733", "#333333", "#FFFFFF"]
    
    for i in range(count):
        sample = InspirationSample(
            id=f"mock_{i+1}",
            path=f"data:image/svg+xml,{_generate_mock_svg(colors, i)}",
            prompt=f"Design variation {i+1}",
            style=["minimalist", "bold", "geometric", "abstract", "modern"][i % 5],
            selected=False
        )
        state.inspiration_samples.append(sample)
    
    state.phase_states[Phase.PHASE1_INSPIRATION].status = PhaseStatus.COMPLETED
    
    return {
        "status": "created",
        "count": count,
        "pipeline_id": pipeline_id
    }


def _generate_mock_svg(colors: List[str], index: int) -> str:
    """Generate a mock SVG for testing."""
    bg = colors[index % len(colors)]
    accent = colors[(index + 1) % len(colors)]
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550">
        <rect fill="{bg}" width="400" height="550"/>
        <rect x="40" y="40" width="320" height="470" fill="{accent}" opacity="0.3" rx="20"/>
        <circle cx="200" cy="250" r="80" fill="white" opacity="0.2"/>
        <text x="200" y="280" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Design {index + 1}</text>
    </svg>'''
    
    return svg.replace('"', '%22').replace('\n', '')


# ============================================
# Server Entry Point
# ============================================

def main():
    """Run the server."""
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("HOST", "0.0.0.0")
    
    uvicorn.run(
        "server:app",
        host=host,
        port=port,
        reload=os.environ.get("DEBUG", "false").lower() == "true"
    )


if __name__ == "__main__":
    main()
