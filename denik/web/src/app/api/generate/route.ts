import { NextRequest, NextResponse } from 'next/server';
import { generateDesigns as generateFromMinimax, generateDesigns, generateFromIterations, generateMockDesigns, ITERATION_DESIGNS, getAvailableRounds } from '@/lib/generations';
import { generateDesigns as generateMinimaxDesigns } from '@/lib/minimax';
import { PipelineState } from '@/types/pipeline';

// In-memory store for demo (would be database in production)
const pipelines: Map<string, PipelineState> = new Map();

// POST /api/generate - Generate designs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      brand,
      design,
      refinement_notes,
      count = 10,
      source = 'iterations', // 'iterations' | 'mock' | 'api'
    } = body;
    
    // Validate required fields
    if (!brand?.client_name) {
      return NextResponse.json(
        { error: 'Brand client_name is required' },
        { status: 400 }
      );
    }
    
    let result;
    
    // Generate based on source preference
    if (source === 'mock') {
      result = generateMockDesigns({ brand, design, refinement_notes }, Math.min(count, 4));
    } else if (source === 'iterations' || source === 'auto') {
      // Use pre-generated iterations from pi pipeline
      result = generateFromIterations({ brand, design, refinement_notes }, count);
    } else if (source === 'api') {
      // Use MiniMax API for fresh generation
      const apiKey = process.env.MINIMAX_API_KEY || '';
      if (apiKey && !apiKey.includes('xxxxx')) {
        result = await generateMinimaxDesigns(
          { brand, design, refinement_notes, count: Math.min(count, 4) },
          apiKey
        );
      } else {
        // Fall back to iterations if no API key
        result = generateFromIterations({ brand, design, refinement_notes }, count);
      }
    } else {
      // Try API first, fall back to iterations
      result = await generateDesigns({ brand, design, refinement_notes, count }, { useApi: true });
    }
    
    // Store pipeline state
    const pipelineId = `pipeline_${Date.now()}`;
    const pipelineState: PipelineState = {
      pipeline_id: pipelineId,
      brand: {
        client_name: brand.client_name,
        primary_colors: brand.primary_colors || [],
        secondary_colors: brand.secondary_colors || [],
        approved_fonts: brand.approved_fonts || [],
        visual_vibe: brand.visual_vibe || '',
        style_preference: brand.style_preference || 'minimalist',
        constraints: null,
      },
      artistic_direction: design?.style || 'minimal',
      past_designs_context: null,
      generation_prompt: result.designs[0]?.prompt || '',
      inspiration_samples: result.designs.map((d, i) => ({
        id: d.id,
        path: d.image_url,
        prompt: d.prompt,
        style: d.style,
      })),
      selected_image: null,
      human_feedback: refinement_notes || null,
      review_started_at: new Date().toISOString(),
      review_completed_at: null,
      qa_attempts: 0,
      qa_passed: false,
      qa_issues: [],
      refined_prompt: refinement_notes || null,
      qa_result: null,
      final_image: null,
      print_ready_path: null,
      cost_tracking: {
        phase1_runpod_cost: ('source' in result && result.source === 'api') ? result.cost : 0,
        phase3_minimax_cost: ('source' in result && result.source === 'api') ? result.cost : 0,
        phase4_flux_cost: 0,
        total_cost: result.cost || 0,
      },
      timestamp: new Date().toISOString(),
      error: null,
      retry_count: 0,
      current_phase: 'phase1_inspiration',
      phase_states: {
        input: { status: 'completed', startedAt: null, completedAt: null, data: {} },
        phase0_prompt: { status: 'completed', startedAt: null, completedAt: null, data: {} },
        phase1_inspiration: { status: 'completed', startedAt: null, completedAt: null, data: { designs: result.designs } },
        phase2_review: { status: 'pending', startedAt: null, completedAt: null, data: {} },
        phase3_qa: { status: 'pending', startedAt: null, completedAt: null, data: {} },
        phase4_render: { status: 'pending', startedAt: null, completedAt: null, data: {} },
        delivery: { status: 'pending', startedAt: null, completedAt: null, data: {} },
      },
    };
    
    pipelines.set(pipelineId, pipelineState);
    
    return NextResponse.json({
      success: true,
      pipeline_id: pipelineId,
      generation_id: result.generation_id,
      source: 'source' in result ? result.source : 'iterations',
      designs: result.designs,
      cost: result.cost,
      total_designs: result.designs.length,
    });
    
  } catch (error) {
    console.error('[Generate] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

// GET /api/generate - List designs and pipelines
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const pipelineId = url.searchParams.get('pipeline_id');
  const source = url.searchParams.get('source');
  const style = url.searchParams.get('style');
  const round = url.searchParams.get('round');
  
  // Return available rounds info
  if (source === 'rounds') {
    const rounds = getAvailableRounds();
    return NextResponse.json({
      rounds: rounds.map(r => ({
        round: r,
        count: ITERATION_DESIGNS.filter(d => d.round === r).length,
        best: ITERATION_DESIGNS.filter(d => d.round === r && d.best).length,
      })),
      total_designs: ITERATION_DESIGNS.length,
      best_rounds: [11, 16],
    });
  }
  
  // Filter designs by style or round
  if (style || round) {
    const filtered = ITERATION_DESIGNS.filter(d => {
      if (style && d.style !== style) return false;
      if (round && d.round !== parseInt(round)) return false;
      return true;
    });
    
    return NextResponse.json({
      designs: filtered,
      count: filtered.length,
    });
  }
  
  // Return pipeline state
  if (pipelineId) {
    const pipeline = pipelines.get(pipelineId);
    if (!pipeline) {
      return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    }
    return NextResponse.json({
      pipeline_id: pipelineId,
      designs: pipeline.inspiration_samples,
      phase: pipeline.current_phase,
    });
  }
  
  // Return all pipelines
  return NextResponse.json({
    pipelines: Array.from(pipelines.entries()).map(([id, p]) => ({
      pipeline_id: id,
      client_name: p.brand.client_name,
      phase: p.current_phase,
      created: p.timestamp,
    })),
    total_designs: ITERATION_DESIGNS.length,
    source: 'iterations',
  });
}