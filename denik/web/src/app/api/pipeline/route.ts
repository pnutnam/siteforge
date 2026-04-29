import { NextRequest, NextResponse } from 'next/server';

// Mock pipeline state for demo mode
const mockPipelines: Record<string, any> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Try to connect to Python backend
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${API_BASE}/api/pipeline/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000), // 3 second timeout
      });
      
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch {
      // Backend not available, use demo mode
    }
    
    // Demo mode: create a mock pipeline
    const pipelineId = `demo_${Date.now()}`;
    const newPipeline = {
      pipeline_id: pipelineId,
      brand: body.brand,
      artistic_direction: body.artistic_direction,
      current_phase: 'phase0_prompt',
      status: 'running',
      timestamp: new Date().toISOString(),
      phase_states: {
        input: { status: 'completed', startedAt: null, completedAt: null, data: {} },
        phase0_prompt: { status: 'completed', startedAt: null, completedAt: null, data: {} },
        phase1_inspiration: { status: 'completed', startedAt: null, completedAt: null, data: {} },
        phase2_review: { status: 'active', startedAt: null, completedAt: null, data: {} },
        phase3_qa: { status: 'pending', startedAt: null, completedAt: null, data: {} },
        phase4_render: { status: 'pending', startedAt: null, completedAt: null, data: {} },
        delivery: { status: 'pending', startedAt: null, completedAt: null, data: {} },
      },
      inspiration_samples: [
        { id: '1', path: '/samples/sample-1.png', prompt: 'Design 1', style: 'modern' },
        { id: '2', path: '/samples/sample-2.png', prompt: 'Design 2', style: 'bold' },
        { id: '3', path: '/samples/sample-3.png', prompt: 'Design 3', style: 'geometric' },
        { id: '4', path: '/samples/sample-4.png', prompt: 'Design 4', style: 'minimal' },
        { id: '5', path: '/samples/sample-5.png', prompt: 'Design 5', style: 'abstract' },
      ],
      selected_image: null,
      qa_passed: false,
      qa_issues: [],
      final_image: null,
      print_ready_path: null,
      cost_tracking: {
        phase1_runpod_cost: 0,
        phase3_minimax_cost: 0,
        phase4_flux_cost: 0,
        total_cost: 0,
      },
    };
    
    mockPipelines[pipelineId] = newPipeline;
    
    return NextResponse.json({
      success: true,
      pipeline_id: pipelineId,
      status: 'started',
      mode: 'demo',
      brand: body.brand?.client_name || 'Unknown',
    });
    
  } catch (error) {
    console.error('Error starting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to start pipeline', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pipelineId = url.searchParams.get('id');
  
  if (pipelineId && mockPipelines[pipelineId]) {
    return NextResponse.json(mockPipelines[pipelineId]);
  }
  
  return NextResponse.json({
    pipelines: Object.values(mockPipelines),
  });
}
