# Brand2Print Pipeline

Multi-stage design generation pipeline for creating print-ready notebook covers.

## Overview

Brand2Print transforms brand guidelines into professional, print-ready notebook designs through an automated pipeline:

```
Brand Guidelines → Vectorization → Prompt Engineering → Inspiration Generation 
                                                               ↓
                              ← QA Verification ← Human Review ← Selection
                                       ↓
                              High-Fidelity Render → PDF Delivery
```

## Pipeline Phases

### Phase 0: Prompt Engineering
- LLM-powered prompt refinement from brand guidelines
- Generates 10-20 style variations

### Phase 1: Inspiration Generation
- GPU-accelerated image generation via RunPod
- Produces initial concept designs

### Phase 2: Human Review
- Gallery interface for design selection
- Feedback collection for refinement

### Phase 3: QA Verification
- Vision agent (MiniMax) validates brand compliance
- Checks color presence, composition, print quality

### Phase 4: High-Fidelity Render
- Flux-based rendering at 300 DPI
- Print-ready resolution

### Phase 5: PDF Delivery
- Press-ready PDF with bleed margins
- Front, back, and spine designs

## Architecture

```
brand2print/
├── pipeline/
│   ├── core.py          # Main pipeline orchestrator
│   └── vectorizer.py    # Logo vectorization
├── server.py            # FastAPI REST API
├── pyproject.toml
└── README.md
```

## API Endpoints

### Pipeline Management
- `POST /api/pipeline/start` - Start new pipeline
- `GET /api/pipelines` - List all pipelines
- `GET /api/pipeline/{id}` - Get pipeline state
- `POST /api/pipeline/{id}/select` - Select inspiration
- `POST /api/pipeline/{id}/qa` - Submit QA result
- `DELETE /api/pipeline/{id}` - Cancel pipeline

### Real-time Updates
- `WS /ws/pipeline/{id}` - WebSocket for live progress

## Setup

1. Install dependencies:
```bash
cd brand2print
pip install -e .
```

2. Set environment variables:
```bash
export RUNPOD_API_KEY="your_runpod_key"
export MINIMAX_API_KEY="your_minimax_key"
export PIPELINE_STORAGE_PATH="./data"
```

3. Start the server:
```bash
python -m brand2print.server
# or
uvicorn brand2print.server:app --reload
```

## Print Specifications

- **Size**: 5.25" × 8.25" (378 × 594 points)
- **Bleed**: 3pt on all edges
- **Safe Margin**: 12pt
- **Binding**: 15pt spine on left side
- **Resolution**: 300 DPI for print

## Usage with Web UI

The `web/` directory contains a Next.js frontend:

```bash
cd web
npm install
npm run dev
```

Access the UI at `http://localhost:3000`

## API Client Example

```python
import httpx
import asyncio

async def start_pipeline():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/pipeline/start",
            json={
                "brand": {
                    "client_name": "Acme Corp",
                    "primary_colors": ["#FF5733"],
                    "style_preference": "geometric"
                },
                "artistic_direction": "Modern, bold, energetic"
            }
        )
        return response.json()

asyncio.run(start_pipeline())
```

## Development

Run tests:
```bash
pytest tests/
```

Run with hot reload:
```bash
uvicorn brand2print.server:app --reload --host 0.0.0.0 --port 8000
```

## License

MIT
