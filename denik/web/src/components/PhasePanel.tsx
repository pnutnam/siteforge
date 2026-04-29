'use client';

import { Phase, PHASES, PipelineState, PhaseStatus } from '@/types/pipeline';
import { ChevronDown, ChevronUp, Loader2, Check, AlertCircle, Clock } from 'lucide-react';

interface PhasePanelProps {
  phase: Phase;
  state: PipelineState | null;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

const statusIcons: Record<PhaseStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-gray-400" />,
  active: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
  completed: <Check className="w-4 h-4 text-green-400" />,
  failed: <AlertCircle className="w-4 h-4 text-red-400" />,
  waiting: <Clock className="w-4 h-4 text-yellow-400" />,
};

export function PhasePanel({ phase, state, isActive, isExpanded, onToggle }: PhasePanelProps) {
  const phaseInfo = PHASES.find(p => p.id === phase);
  if (!phaseInfo) return null;

  const getStatus = (): PhaseStatus => {
    if (!state) return 'pending';
    if (state.current_phase === phase) return 'active';
    const phaseIndex = PHASES.findIndex(p => p.id === phase);
    const currentIndex = PHASES.findIndex(p => p.id === state.current_phase);
    if (phaseIndex < currentIndex) return 'completed';
    return 'pending';
  };

  const status = getStatus();

  return (
    <div className={`rounded-xl border transition-all ${isActive ? 'border-blue-500 bg-blue-950/20' : 'border-gray-700 bg-gray-800/50'}`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {statusIcons[status]}
          <div className="text-left">
            <h3 className="font-medium text-white">{phaseInfo.name}</h3>
            <p className="text-sm text-gray-400">{phaseInfo.description}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-700 pt-4">
          <PhaseContent phase={phase} state={state} />
        </div>
      )}
    </div>
  );
}

function PhaseContent({ phase, state }: { phase: Phase; state: PipelineState | null }) {
  if (!state) {
    return <p className="text-gray-500 italic">No pipeline data available</p>;
  }

  switch (phase) {
    case 'input':
      return (
        <div className="space-y-3">
          <DetailRow label="Client" value={state.brand.client_name} />
          <DetailRow label="Primary Colors" value={state.brand.primary_colors.join(', ')} />
          <DetailRow label="Visual Vibe" value={state.brand.visual_vibe} />
          <DetailRow label="Style" value={state.brand.style_preference} />
          <DetailRow label="Direction" value={state.artistic_direction} />
        </div>
      );

    case 'phase0_prompt':
      return (
        <div className="space-y-3">
          <DetailRow label="Prompts Generated" value={state.generation_prompt ? 'Yes' : 'No'} />
          {state.generation_prompt && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Generation Prompt:</p>
              <div className="p-3 bg-gray-900 rounded-lg text-sm text-gray-300 max-h-40 overflow-y-auto">
                {state.generation_prompt}
              </div>
            </div>
          )}
        </div>
      );

    case 'phase1_inspiration':
      return (
        <div className="space-y-3">
          <DetailRow label="Samples Generated" value={String(state.inspiration_samples?.length || 0)} />
          {state.inspiration_samples && state.inspiration_samples.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {state.inspiration_samples.slice(0, 8).map((sample) => (
                <img
                  key={sample.id}
                  src={sample.path}
                  alt={sample.style}
                  className="w-full aspect-square object-cover rounded"
                />
              ))}
              {state.inspiration_samples.length > 8 && (
                <div className="aspect-square rounded bg-gray-700 flex items-center justify-center text-gray-400">
                  +{state.inspiration_samples.length - 8}
                </div>
              )}
            </div>
          )}
        </div>
      );

    case 'phase2_review':
      return (
        <div className="space-y-3">
          <DetailRow label="Status" value={state.selected_image ? 'Selection Made' : 'Awaiting Selection'} />
          {state.selected_image && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Selected Design:</p>
              <img src={state.selected_image} alt="Selected" className="w-32 h-32 object-cover rounded" />
            </div>
          )}
          {state.human_feedback && (
            <DetailRow label="Feedback" value={state.human_feedback} />
          )}
        </div>
      );

    case 'phase3_qa':
      return (
        <div className="space-y-3">
          <DetailRow label="Attempts" value={String(state.qa_attempts)} />
          <DetailRow label="QA Passed" value={state.qa_passed ? 'Yes' : 'No'} />
          {state.qa_issues.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Issues Found:</p>
              <ul className="list-disc list-inside text-sm text-red-400">
                {state.qa_issues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            </div>
          )}
          {state.qa_result && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Confidence:</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${state.qa_result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300">{Math.round(state.qa_result.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      );

    case 'phase4_render':
      return (
        <div className="space-y-3">
          <DetailRow label="Final Image" value={state.final_image ? 'Generated' : 'Pending'} />
          {state.final_image && (
            <div>
              <p className="text-sm text-gray-400 mb-1">Preview:</p>
              <img src={state.final_image} alt="Final" className="w-48 h-auto rounded" />
            </div>
          )}
          <DetailRow label="RunPod Cost" value={`$${state.cost_tracking.phase1_runpod_cost.toFixed(4)}`} />
          <DetailRow label="Minimax Cost" value={`$${state.cost_tracking.phase3_minimax_cost.toFixed(4)}`} />
          <DetailRow label="Flux Cost" value={`$${state.cost_tracking.phase4_flux_cost.toFixed(4)}`} />
        </div>
      );

    case 'delivery':
      return (
        <div className="space-y-3">
          <DetailRow label="Print Ready" value={state.print_ready_path ? 'Available' : 'Pending'} />
          {state.print_ready_path && (
            <a
              href={state.print_ready_path}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Download Print-Ready PDF
            </a>
          )}
          <DetailRow label="Total Cost" value={`$${state.cost_tracking.total_cost.toFixed(4)}`} />
        </div>
      );

    default:
      return null;
  }
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-400">{label}:</span>
      <span className="text-sm text-white text-right max-w-xs truncate" title={value}>
        {value || 'N/A'}
      </span>
    </div>
  );
}
