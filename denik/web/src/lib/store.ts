import { create } from 'zustand';
import { Phase, PipelineState, BrandGuidelines, InspirationSample, PHASE_ORDER } from '@/types/pipeline';

interface PipelineStore {
  // State
  pipelineId: string | null;
  pipelines: Record<string, PipelineState>;
  currentPhase: Phase;
  phaseStates: Record<Phase, { status: string; data: unknown }>;
  inspirationSamples: InspirationSample[];
  selectedImage: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setPipelineId: (id: string | null) => void;
  setPipelineState: (state: PipelineState) => void;
  setCurrentPhase: (phase: Phase) => void;
  setInspirationSamples: (samples: InspirationSample[]) => void;
  selectImage: (imagePath: string) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Computed
  getCompletedPhases: () => Phase[];
  getPendingPhases: () => Phase[];
  getPhaseProgress: () => number;
}

export const usePipelineStore = create<PipelineStore>((set, get) => ({
  // Initial State
  pipelineId: null,
  pipelines: {},
  currentPhase: 'input',
  phaseStates: {
    input: { status: 'pending', data: null },
    phase0_prompt: { status: 'pending', data: null },
    phase1_inspiration: { status: 'pending', data: null },
    phase2_review: { status: 'pending', data: null },
    phase3_qa: { status: 'pending', data: null },
    phase4_render: { status: 'pending', data: null },
    delivery: { status: 'pending', data: null },
  },
  inspirationSamples: [],
  selectedImage: null,
  isLoading: false,
  error: null,

  // Actions
  setPipelineId: (id) => set({ pipelineId: id }),
  
  setPipelineState: (state) => {
    const currentIndex = PHASE_ORDER.indexOf(state.current_phase);
    
    // Update phase states based on current phase
    const phaseStates = {} as Record<Phase, { status: string; data: unknown }>;
    PHASE_ORDER.forEach((phase, index) => {
      if (index < currentIndex) {
        phaseStates[phase] = { status: 'completed', data: null };
      } else if (index === currentIndex) {
        phaseStates[phase] = { status: 'active', data: null };
      } else if (phase === 'phase2_review' && state.current_phase === 'phase2_review') {
        phaseStates[phase] = { status: 'waiting', data: null };
      } else {
        phaseStates[phase] = { status: 'pending', data: null };
      }
    });

    set({
      pipelineId: state.pipeline_id,
      pipelines: { ...get().pipelines, [state.pipeline_id]: state },
      currentPhase: state.current_phase,
      phaseStates,
      inspirationSamples: state.inspiration_samples || [],
      selectedImage: state.selected_image,
    });
  },

  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  
  setInspirationSamples: (samples) => set({ inspirationSamples: samples }),
  
  selectImage: (imagePath) => set({ selectedImage: imagePath }),
  
  setError: (error) => set({ error }),
  
  setLoading: (loading) => set({ isLoading: loading }),

  // Computed
  getCompletedPhases: () => {
    const { currentPhase } = get();
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    return PHASE_ORDER.slice(0, currentIndex) as Phase[];
  },

  getPendingPhases: () => {
    const { currentPhase } = get();
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    return PHASE_ORDER.slice(currentIndex + 1) as Phase[];
  },

  getPhaseProgress: () => {
    const { currentPhase } = get();
    const currentIndex = PHASE_ORDER.indexOf(currentPhase);
    return Math.round((currentIndex / (PHASE_ORDER.length - 1)) * 100);
  },
}));
