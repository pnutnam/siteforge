import { PipelineState, StartPipelineRequest, SelectImageRequest, BrandGuidelines } from '@/types/pipeline';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function startPipeline(request: StartPipelineRequest): Promise<{ pipeline_id: string }> {
  const response = await fetch(`${API_BASE}/api/pipeline/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to start pipeline: ${response.statusText}`);
  }
  
  return response.json();
}

export async function getPipelineState(pipelineId: string): Promise<PipelineState> {
  const response = await fetch(`${API_BASE}/api/pipeline/${pipelineId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to get pipeline state: ${response.statusText}`);
  }
  
  return response.json();
}

export async function selectImage(pipelineId: string, request: SelectImageRequest): Promise<{ status: string; final_path?: string }> {
  const response = await fetch(`${API_BASE}/api/pipeline/${pipelineId}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to select image: ${response.statusText}`);
  }
  
  return response.json();
}

export async function listPipelines(): Promise<{ pipelines: { pipeline_id: string; client_name: string; status: string }[] }> {
  const response = await fetch(`${API_BASE}/api/pipelines`);
  
  if (!response.ok) {
    throw new Error(`Failed to list pipelines: ${response.statusText}`);
  }
  
  return response.json();
}

export async function cancelPipeline(pipelineId: string): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE}/api/pipeline/${pipelineId}/cancel`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error(`Failed to cancel pipeline: ${response.statusText}`);
  }
  
  return response.json();
}

// WebSocket connection for real-time updates
export function createPipelineWebSocket(
  pipelineId: string,
  onMessage: (data: unknown) => void,
  onError?: (error: Event) => void
): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(`${protocol}//${window.location.host}${API_BASE}/ws/pipeline/${pipelineId}`);
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  if (onError) {
    ws.onerror = onError;
  }
  
  return ws;
}

// Mock data for development (when backend isn't running)
export function getMockPipelineState(): PipelineState {
  return {
    pipeline_id: 'demo-' + Date.now(),
    brand: {
      client_name: 'Demo Client',
      primary_colors: ['#00A1E0', '#032D60'],
      secondary_colors: ['#FFFFFF'],
      approved_fonts: ['Helvetica', 'Arial'],
      visual_vibe: 'Modern, clean, professional',
      style_preference: 'Minimalist geometric',
      constraints: null,
    },
    artistic_direction: 'Create a modern notebook cover design featuring the client logo prominently with geometric accents',
    past_designs_context: 'Based on successful Salesforce notebook designs',
    generation_prompt: 'A clean, professional notebook cover design with the Salesforce cloud logo, geometric patterns in brand colors (blue gradient), minimalist layout, ultra-high resolution, print-ready quality',
    inspiration_samples: [
      { id: '1', path: '/samples/sample-1.png', prompt: 'Geometric blue pattern', style: 'modern' },
      { id: '2', path: '/samples/sample-2.png', prompt: 'Cloud motif', style: 'minimal' },
      { id: '3', path: '/samples/sample-3.png', prompt: 'Abstract shapes', style: 'bold' },
    ],
    selected_image: null,
    human_feedback: null,
    review_started_at: new Date().toISOString(),
    review_completed_at: null,
    qa_attempts: 0,
    qa_passed: false,
    qa_issues: [],
    refined_prompt: null,
    qa_result: null,
    final_image: null,
    print_ready_path: null,
    cost_tracking: {
      phase1_runpod_cost: 0,
      phase3_minimax_cost: 0,
      phase4_flux_cost: 0,
      total_cost: 0,
    },
    timestamp: new Date().toISOString(),
    error: null,
    retry_count: 0,
    current_phase: 'phase2_review',
    phase_states: {
      input: { status: 'completed', startedAt: null, completedAt: null, data: {} },
      phase0_prompt: { status: 'completed', startedAt: null, completedAt: null, data: {} },
      phase1_inspiration: { status: 'completed', startedAt: null, completedAt: null, data: {} },
      phase2_review: { status: 'active', startedAt: null, completedAt: null, data: {} },
      phase3_qa: { status: 'pending', startedAt: null, completedAt: null, data: {} },
      phase4_render: { status: 'pending', startedAt: null, completedAt: null, data: {} },
      delivery: { status: 'pending', startedAt: null, completedAt: null, data: {} },
    },
  };
}
