'use client';

import { useState } from 'react';
import { Phase, PHASES, PhaseStatus, PipelineState } from '@/types/pipeline';
import { ChevronRight, Check, AlertCircle, Clock, Loader2 } from 'lucide-react';

interface PipelineGraphProps {
  pipelineState: PipelineState | null;
  onPhaseClick: (phase: Phase) => void;
  activePhase: Phase | null;
}

const statusConfig: Record<PhaseStatus, { color: string; icon: React.ReactNode }> = {
  pending: {
    color: 'bg-gray-700 text-gray-400 border-gray-600',
    icon: <Clock className="w-4 h-4" />,
  },
  active: {
    color: 'bg-blue-600 text-white border-blue-500 animate-pulse',
    icon: <Loader2 className="w-4 h-4 animate-spin" />,
  },
  completed: {
    color: 'bg-green-600 text-white border-green-500',
    icon: <Check className="w-4 h-4" />,
  },
  failed: {
    color: 'bg-red-600 text-white border-red-500',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  waiting: {
    color: 'bg-yellow-600 text-white border-yellow-500',
    icon: <Clock className="w-4 h-4" />,
  },
};

export function PipelineGraph({ pipelineState, onPhaseClick, activePhase }: PipelineGraphProps) {
  const [expandedPhase, setExpandedPhase] = useState<Phase | null>(null);

  const getPhaseStatus = (phase: Phase): PhaseStatus => {
    if (!pipelineState) return 'pending';
    
    const phaseState = pipelineState.phase_states?.[phase];
    if (phaseState?.status) return phaseState.status;

    // Determine status based on current phase and order
    const phaseOrder: Phase[] = ['input', 'phase0_prompt', 'phase1_inspiration', 'phase2_review', 'phase3_qa', 'phase4_render', 'delivery'];
    const currentIndex = phaseOrder.indexOf(pipelineState.current_phase);
    const phaseIndex = phaseOrder.indexOf(phase);

    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    if (phase === 'phase2_review' && pipelineState.current_phase === 'phase2_review') return 'waiting';
    return 'pending';
  };

  const handlePhaseClick = (phase: Phase) => {
    setExpandedPhase(expandedPhase === phase ? null : phase);
    onPhaseClick(phase);
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* Horizontal Pipeline */}
      <div className="flex items-center gap-2 min-w-max px-4 py-6">
        {PHASES.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          const isActive = status === 'active' || (activePhase === phase.id);
          const config = statusConfig[status];

          return (
            <div key={phase.id} className="flex items-center">
              {/* Phase Node */}
              <button
                onClick={() => handlePhaseClick(phase.id)}
                className={`
                  flex flex-col items-center justify-center
                  w-28 h-28 rounded-xl border-2 transition-all
                  ${config.color}
                  ${isActive ? 'ring-4 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''}
                  hover:scale-105 cursor-pointer
                `}
              >
                <div className="mb-1">{config.icon}</div>
                <span className="text-xs font-medium text-center px-1">
                  {phase.name}
                </span>
              </button>

              {/* Connector Line */}
              {index < PHASES.length - 1 && (
                <div className="w-8 h-0.5 bg-gray-600 mx-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Expanded Phase Details */}
      {expandedPhase && (
        <div className="mt-4 p-4 bg-gray-800 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">
              {PHASES.find(p => p.id === expandedPhase)?.name}
            </h3>
            <button
              onClick={() => setExpandedPhase(null)}
              className="text-gray-400 hover:text-white"
            >
              <ChevronRight className="w-5 h-5 rotate-90" />
            </button>
          </div>
          <p className="text-gray-400 text-sm">
            {PHASES.find(p => p.id === expandedPhase)?.description}
          </p>
          
          {/* Phase-specific content would go here */}
          {pipelineState && (
            <div className="mt-4 text-sm text-gray-300">
              {getPhaseDetails(expandedPhase, pipelineState)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getPhaseDetails(phase: Phase, state: PipelineState): React.ReactNode {
  switch (phase) {
    case 'input':
      return (
        <div>
          <p><span className="text-gray-500">Client:</span> {state.brand?.client_name || 'N/A'}</p>
          <p><span className="text-gray-500">Direction:</span> {state.artistic_direction || 'N/A'}</p>
        </div>
      );
    case 'phase0_prompt':
      return (
        <div>
          <p><span className="text-gray-500">Prompts Generated:</span> {state.generation_prompt ? 'Yes' : 'No'}</p>
          {state.generation_prompt && (
            <p className="mt-2 p-2 bg-gray-900 rounded text-xs max-h-20 overflow-y-auto">
              {state.generation_prompt.substring(0, 200)}...
            </p>
          )}
        </div>
      );
    case 'phase1_inspiration':
      return (
        <div>
          <p><span className="text-gray-500">Samples Generated:</span> {state.inspiration_samples?.length || 0}</p>
        </div>
      );
    case 'phase2_review':
      return (
        <div>
          <p><span className="text-gray-500">Status:</span> {state.selected_image ? 'Selection made' : 'Awaiting selection'}</p>
          {state.selected_image && (
            <img 
              src={state.selected_image} 
              alt="Selected" 
              className="mt-2 w-24 h-24 object-cover rounded"
            />
          )}
        </div>
      );
    case 'phase3_qa':
      return (
        <div>
          <p><span className="text-gray-500">Attempts:</span> {state.qa_attempts}</p>
          <p><span className="text-gray-500">Passed:</span> {state.qa_passed ? 'Yes' : 'No'}</p>
          {state.qa_issues.length > 0 && (
            <p><span className="text-gray-500">Issues:</span> {state.qa_issues.length}</p>
          )}
        </div>
      );
    case 'phase4_render':
      return (
        <div>
          <p><span className="text-gray-500">Final Image:</span> {state.final_image ? 'Generated' : 'Pending'}</p>
          {state.final_image && (
            <img 
              src={state.final_image} 
              alt="Final" 
              className="mt-2 w-24 h-24 object-cover rounded"
            />
          )}
        </div>
      );
    case 'delivery':
      return (
        <div>
          <p><span className="text-gray-500">Print Ready:</span> {state.print_ready_path ? 'Yes' : 'Pending'}</p>
          {state.print_ready_path && (
            <a 
              href={state.print_ready_path} 
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Download PDF
            </a>
          )}
        </div>
      );
    default:
      return null;
  }
}
