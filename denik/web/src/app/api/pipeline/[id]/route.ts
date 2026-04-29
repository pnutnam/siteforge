import { NextRequest, NextResponse } from 'next/server';

// Demo mode mock data
const DEMO_PIPELINE = {
  pipeline_id: 'demo_001',
  brand: {
    client_name: 'Demo Brand',
    primary_colors: ['#FF5733', '#FFC300'],
    secondary_colors: ['#333333', '#FFFFFF'],
    approved_fonts: ['Helvetica', 'Arial'],
    visual_vibe: 'Modern, energetic, bold',
    style_preference: 'geometric',
    constraints: null,
  },
  artistic_direction: 'Create a dynamic notebook cover design',
  past_designs_context: null,
  generation_prompt: 'A clean, professional notebook cover design with geometric patterns',
  inspiration_samples: [
    { id: '1', path: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550"><rect fill="#FF5733" width="400" height="550"/><rect fill="#FFC300" x="50" y="50" width="300" height="450" rx="10"/><text x="200" y="200" text-anchor="middle" fill="white" font-size="24" font-weight="bold">Design 1</text></svg>'), prompt: 'Geometric pattern', style: 'modern' },
    { id: '2', path: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550"><rect fill="#333333" width="400" height="550"/><circle cx="200" cy="275" r="100" fill="#FF5733"/><text x="200" y="450" text-anchor="middle" fill="white" font-size="24">Design 2</text></svg>'), prompt: 'Bold circular design', style: 'bold' },
    { id: '3', path: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550"><rect fill="#FFFFFF" width="400" height="550"/><polygon points="200,50 350,200 350,400 50,400 50,200" fill="none" stroke="#FF5733" stroke-width="8"/><text x="200" y="280" text-anchor="middle" fill="#333" font-size="24">Design 3</text></svg>'), prompt: 'Triangle geometric', style: 'geometric' },
    { id: '4', path: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550"><rect fill="#FFC300" width="400" height="550"/><rect x="100" y="100" width="200" height="350" fill="none" stroke="#333" stroke-width="4"/><text x="200" y="290" text-anchor="middle" fill="#333" font-size="20">Design 4</text></svg>'), prompt: 'Minimal frame', style: 'minimal' },
    { id: '5', path: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 550"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FF5733"/><stop offset="100%" stop-color="#FFC300"/></linearGradient></defs><rect fill="url(#g)" width="400" height="550"/><text x="200" y="290" text-anchor="middle" fill="white" font-size="28" font-weight="bold">Design 5</text></svg>'), prompt: 'Gradient abstract', style: 'abstract' },
  ],
  selected_image: null,
  human_feedback: null,
  review_started_at: new Date(Date.now() - 3600000).toISOString(),
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
  timestamp: new Date(Date.now() - 3600000).toISOString(),
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try backend first
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${API_BASE}/api/pipeline/${id}`, {
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch {
      // Backend not available
    }
    
    // Demo mode: return demo data
    if (id.startsWith('demo_')) {
      return NextResponse.json({
        ...DEMO_PIPELINE,
        pipeline_id: id,
        timestamp: new Date().toISOString(),
      });
    }
    
    return NextResponse.json(
      { error: 'Pipeline not found', pipeline_id: id },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try backend first
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${API_BASE}/api/pipeline/${id}/cancel`, {
        method: 'POST',
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch {
      // Backend not available
    }
    
    // Demo mode
    return NextResponse.json({
      status: 'cancelled',
      pipeline_id: id,
      mode: 'demo',
    });
    
  } catch (error) {
    console.error('Error cancelling pipeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
