// Types for the Brand-to-Print Pipeline

export type Phase = 
  | 'input'
  | 'phase0_prompt'
  | 'phase1_inspiration'
  | 'phase2_review'
  | 'phase3_qa'
  | 'phase4_render'
  | 'delivery';

export type PhaseStatus = 'pending' | 'active' | 'completed' | 'failed' | 'waiting';

// PhaseStatus constants for runtime use
export const PhaseStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  FAILED: 'failed',
  WAITING: 'waiting',
} as const;

export interface BrandGuidelines {
  client_name: string;
  primary_colors: string[];
  secondary_colors: string[];
  approved_fonts: string[];
  visual_vibe: string;
  style_preference: string;
  constraints: string | null;
}

export interface QAResult {
  approved: boolean;
  issues: string[];
  refinement_prompt: string | null;
  confidence: number;
  checked_at: string;
}

export interface CostTracking {
  phase1_runpod_cost: number;
  phase3_minimax_cost: number;
  phase4_flux_cost: number;
  total_cost: number;
}

export interface InspirationSample {
  id: string;
  path: string;
  prompt: string;
  style: string;
}

export interface PhaseState {
  status: PhaseStatus;
  startedAt: string | null;
  completedAt: string | null;
  data: Record<string, unknown>;
}

export interface PipelineState {
  pipeline_id: string;
  brand: BrandGuidelines;
  artistic_direction: string;
  past_designs_context: string | null;
  generation_prompt: string;
  inspiration_samples: InspirationSample[];
  selected_image: string | null;
  human_feedback: string | null;
  review_started_at: string | null;
  review_completed_at: string | null;
  qa_attempts: number;
  qa_passed: boolean;
  qa_issues: string[];
  refined_prompt: string | null;
  qa_result: QAResult | null;
  final_image: string | null;
  print_ready_path: string | null;
  cost_tracking: CostTracking;
  timestamp: string;
  error: string | null;
  retry_count: number;
  current_phase: Phase;
  phase_states: Record<Phase, PhaseState>;
}

export interface PipelineListItem {
  pipeline_id: string;
  client_name: string;
  current_phase: Phase;
  status: 'running' | 'paused' | 'completed' | 'failed';
  timestamp: string;
}

export interface StartPipelineRequest {
  brand: BrandGuidelines;
  artistic_direction: string;
  past_designs_context?: string;
}

export interface SelectImageRequest {
  selected_image: string;
  human_feedback?: string;
}

// Phase metadata for UI
export const PHASES: { id: Phase; name: string; description: string }[] = [
  { id: 'input', name: 'Input', description: 'Brand guidelines & creative direction' },
  { id: 'phase0_prompt', name: 'Prompt Engineering', description: 'LLM prompt refinement' },
  { id: 'phase1_inspiration', name: 'Inspiration', description: 'GPU image generation (10-20 samples)' },
  { id: 'phase2_review', name: 'Human Review', description: 'Gallery selection' },
  { id: 'phase3_qa', name: 'QA', description: 'Vision agent verification' },
  { id: 'phase4_render', name: 'Render', description: 'High-fidelity 300 DPI output' },
  { id: 'delivery', name: 'Delivery', description: 'Print-ready files' },
];

export const PHASE_ORDER: Phase[] = [
  'input',
  'phase0_prompt', 
  'phase1_inspiration',
  'phase2_review',
  'phase3_qa',
  'phase4_render',
  'delivery',
];
