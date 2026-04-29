'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Download,
  ExternalLink,
  MessageSquare,
  Wand2,
  Eye,
  FileText,
  Sparkles
} from 'lucide-react';
import { Phase, PhaseStatus, PHASES, PipelineState } from '@/types/pipeline';
import { Gallery } from '@/components/Gallery';
import { PrintPreview } from '@/components/PrintPreview';

interface PipelineDetailProps {
  params: Promise<{ id: string }>;
}

export default function PipelineDetailPage({ params }: PipelineDetailProps) {
  const { id: pipelineId } = use(params);
  const router = useRouter();
  
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInspiration, setSelectedInspiration] = useState<string | null>(null);
  const [refinementNotes, setRefinementNotes] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'preview'>('overview');

  // Fetch pipeline state
  const fetchPipeline = useCallback(async () => {
    try {
      const response = await fetch(`/api/pipeline/${pipelineId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline');
      }
      const data = await response.json();
      setPipeline(data);
      if (data.selected_image) {
        setSelectedInspiration(data.selected_image);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [pipelineId]);

  // Initial fetch
  useEffect(() => {
    fetchPipeline();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchPipeline, 5000);
    return () => clearInterval(interval);
  }, [fetchPipeline]);

  // Select image handler
  const handleSelectImage = async (imageId: string) => {
    const image = pipeline?.inspiration_samples?.find(s => s.id === imageId);
    if (!image) return;

    setSelectedInspiration(image.path);

    try {
      await fetch(`/api/pipeline/${pipelineId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selected_image: image.path,
          human_feedback: refinementNotes || null
        }),
      });
      fetchPipeline();
    } catch (err) {
      console.error('Failed to select image:', err);
    }
  };

  // Regenerate handler
  const handleRegenerate = async () => {
    try {
      await fetch(`/api/debug/mock-inspirations?pipeline_id=${pipelineId}&count=10`, {
        method: 'POST',
      });
      fetchPipeline();
    } catch (err) {
      console.error('Failed to regenerate:', err);
    }
  };

  // Refine handler
  const handleRefine = async (notes: string) => {
    setRefinementNotes(notes);
    setIsRefining(true);

    try {
      // Submit QA as not approved with refinement needed
      await fetch(`/api/pipeline/${pipelineId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: false,
          issues: ['Refinement requested'],
          refinement_prompt: notes,
          confidence: 0.5
        }),
      });

      // Continue pipeline with refinement
      await fetch(`/api/pipeline/${pipelineId}/continue`, {
        method: 'POST',
      });

      fetchPipeline();
    } catch (err) {
      console.error('Failed to refine:', err);
    } finally {
      setIsRefining(false);
    }
  };

  // Approve QA handler
  const handleApproveQA = async () => {
    try {
      await fetch(`/api/pipeline/${pipelineId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approved: true,
          issues: [],
          confidence: 1.0
        }),
      });

      // Continue to render
      await fetch(`/api/pipeline/${pipelineId}/continue`, {
        method: 'POST',
      });

      fetchPipeline();
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  // Get phase status
  const getPhaseStatus = (phaseId: Phase): PhaseStatus => {
    if (!pipeline) return PhaseStatus.PENDING;
    
    const phaseIndex = PHASES.findIndex(p => p.id === phaseId);
    const currentIndex = PHASES.findIndex(p => p.id === pipeline.current_phase);
    
    if (phaseIndex < currentIndex) return PhaseStatus.COMPLETED;
    if (phaseIndex === currentIndex) return PhaseStatus.ACTIVE;
    if (phaseId === 'phase2_review' && pipeline.current_phase === 'phase2_review') return PhaseStatus.WAITING;
    return PhaseStatus.PENDING;
  };

  // Status icon component
  const StatusIcon = ({ status }: { status: PhaseStatus }) => {
    switch (status) {
      case PhaseStatus.COMPLETED:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case PhaseStatus.ACTIVE:
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case PhaseStatus.FAILED:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case PhaseStatus.WAITING:
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-4 text-gray-400">Loading pipeline...</span>
      </div>
    );
  }

  if (error || !pipeline) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-red-900/30 border border-red-600 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Pipeline Not Found</h2>
          <p className="text-gray-400 mb-4">{error || 'The requested pipeline could not be found.'}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isReviewPhase = pipeline.current_phase === 'phase2_review';
  const isQAPhase = pipeline.current_phase === 'phase3_qa';
  const isRenderPhase = pipeline.current_phase === 'phase4_render';
  const isDeliveryPhase = pipeline.current_phase === 'delivery';
  const canPreview = !!pipeline.final_image || isDeliveryPhase;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">{pipeline.brand.client_name}</h1>
                <p className="text-sm text-gray-400">
                  Pipeline {pipeline.pipeline_id.substring(0, 12)}...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isReviewPhase && selectedInspiration && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Preview Design
                </button>
              )}
              {isQAPhase && !pipeline.qa_passed && (
                <button
                  onClick={handleApproveQA}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve for Render
                </button>
              )}
              {canPreview && (
                <button
                  onClick={() => setActiveTab('preview')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Print Files
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'gallery', label: 'Gallery', icon: Eye },
              { id: 'preview', label: 'Print Preview', icon: FileText },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pipeline Progress */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-lg font-semibold text-white mb-6">Pipeline Progress</h2>
                
                <div className="space-y-4">
                  {PHASES.map((phase, index) => {
                    const status = getPhaseStatus(phase.id);
                    const isClickable = status === PhaseStatus.WAITING || status === PhaseStatus.COMPLETED;
                    
                    return (
                      <div
                        key={phase.id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                          isClickable ? 'bg-gray-700/50 cursor-pointer hover:bg-gray-700' : 'bg-gray-800'
                        }`}
                        onClick={() => {
                          if (phase.id === 'phase2_review') setActiveTab('gallery');
                          if (phase.id === 'delivery') setActiveTab('preview');
                        }}
                      >
                        <StatusIcon status={status} />
                        
                        <div className="flex-1">
                          <h3 className="text-white font-medium">{phase.name}</h3>
                          <p className="text-sm text-gray-400">{phase.description}</p>
                        </div>

                        {index < PHASES.length - 1 && (
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* QA Issues (if any) */}
              {pipeline.qa_issues && pipeline.qa_issues.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-600/50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    QA Issues
                  </h3>
                  <ul className="space-y-2">
                    {pipeline.qa_issues.map((issue, i) => (
                      <li key={i} className="text-yellow-200 flex items-start gap-2">
                        <span className="mt-1.5">•</span>
                        {issue}
                      </li>
                    ))}
                  </ul>
                  {pipeline.refined_prompt && (
                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Refinement Prompt:</p>
                      <p className="text-sm text-gray-300">{pipeline.refined_prompt}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Brand Summary */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Brand</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-white">{pipeline.brand.client_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Colors</p>
                    <div className="flex gap-2">
                      {pipeline.brand.primary_colors.map((color, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-lg border border-gray-600"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Style</p>
                    <p className="text-white">{pipeline.brand.style_preference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Direction</p>
                    <p className="text-sm text-gray-300">{pipeline.artistic_direction}</p>
                  </div>
                </div>
              </div>

              {/* Selected Design */}
              {pipeline.selected_image && (
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Selected Design</h3>
                  <img
                    src={pipeline.selected_image}
                    alt="Selected"
                    className="w-full rounded-lg"
                  />
                </div>
              )}

              {/* Cost Summary */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-sm font-semibold text-gray-400 uppercase mb-4">Cost Tracking</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">RunPod (Inspiration)</span>
                    <span className="text-white">${pipeline.cost_tracking.phase1_runpod_cost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">MiniMax (QA)</span>
                    <span className="text-white">${pipeline.cost_tracking.phase3_minimax_cost.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Flux (Render)</span>
                    <span className="text-white">${pipeline.cost_tracking.phase4_flux_cost.toFixed(4)}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-green-400">${pipeline.cost_tracking.total_cost.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div>
            {isReviewPhase || pipeline.inspiration_samples?.length > 0 ? (
              <Gallery
                items={pipeline.inspiration_samples || []}
                selectedId={pipeline.inspiration_samples?.find(s => s.path === pipeline.selected_image)?.id || null}
                onSelect={(item) => handleSelectImage(item.id)}
                onRegenerate={handleRegenerate}
                onRefine={isReviewPhase ? handleRefine : undefined}
                isRefining={isRefining}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Eye className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Designs Yet</h3>
                <p className="text-gray-400 mb-6">Inspiration designs will appear here once generated.</p>
                <button
                  onClick={handleRegenerate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Wand2 className="w-4 h-4" />
                  Generate Inspirations
                </button>
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div>
            {pipeline.final_image || pipeline.selected_image ? (
              <PrintPreview
                frontCover={pipeline.final_image || pipeline.selected_image || ''}
                backCover={pipeline.final_image || undefined}
                brandName={pipeline.brand.client_name}
                specs={{
                  width: 378,
                  height: 594,
                  bleed: 3,
                  safeMargin: 12,
                  bindingWidth: 15,
                }}
                onDownload={() => {
                  // Trigger download
                  console.log('Download triggered');
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <FileText className="w-16 h-16 text-gray-600 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Preview Available</h3>
                <p className="text-gray-400">
                  Select a design and complete QA to generate the print preview.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
