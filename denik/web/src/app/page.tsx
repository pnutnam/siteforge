'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Play, 
  RefreshCw, 
  AlertCircle, 
  Plus, 
  Clock, 
  CheckCircle2,
  Loader2,
  ArrowRight,
  Image,
  Eye,
  FileText,
  Sparkles,
  History,
  Settings,
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Layers
} from 'lucide-react';
import { Phase, PHASES, PhaseStatus, PipelineState, PipelineListItem } from '@/types/pipeline';
import { BrandForm } from '@/components/BrandForm';
import { PipelineWizard } from '@/components/PipelineWizard';
import { Gallery } from '@/components/Gallery';
import { PrintPreview } from '@/components/PrintPreview';
import { usePipelineWebSocket } from '@/components/usePipelineWebSocket';

// Mock data for demo
const DEMO_PIPELINES: PipelineListItem[] = [
  {
    pipeline_id: 'demo_001',
    client_name: 'Salesforce',
    current_phase: 'phase2_review',
    status: 'running',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    pipeline_id: 'demo_002',
    client_name: 'Airbnb',
    current_phase: 'delivery',
    status: 'completed',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    pipeline_id: 'demo_003',
    client_name: 'Spotify',
    current_phase: 'phase1_inspiration',
    status: 'running',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

const DEMO_STATS = {
  total_pipelines: 47,
  completed: 32,
  running: 8,
  avg_time: '4.2 hours',
  total_cost: '$127.50',
};

interface WizardResult {
  client_name: string;
  logo_path: string;
  primary_colors: string[];
  secondary_colors: string[];
  approved_fonts: string[];
  visual_vibe: string;
  style_preference: string;
  artistic_direction: string;
  documents: string[];
  inspirations: { id: string; type: string; content: string }[];
  selected_prompts: string[];
  custom_prompt?: string;
  selected_design?: { id: string; front: string; back: string; style: string };
  refinement_notes?: string;
  pattern_preferences?: {
    paletteStyle: string;
    shapes: string[];
    layout: string;
    accent: string;
  };
  layout_config?: {
    coverOption: string;
    spineBorder: boolean;
    spineColor: string;
    spineWidth: number;
    bindingSide: string;
  };
}

export default function PipelineDashboard() {
  const [activeView, setActiveView] = useState<'active' | 'history' | 'stats'>('active');
  const [showWizard, setShowWizard] = useState(false);
  const [pipelines, setPipelines] = useState<PipelineListItem[]>(DEMO_PIPELINES);
  const [selectedPipeline, setSelectedPipeline] = useState<PipelineListItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch pipelines from API
  const fetchPipelines = useCallback(async () => {
    try {
      const response = await fetch('/api/pipelines');
      if (response.ok) {
        const data = await response.json();
        if (data.pipelines?.length > 0) {
          setPipelines(data.pipelines);
        }
      }
    } catch {
      // Use demo data on error
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  // WebSocket connection for active pipeline
  const { isConnected, events } = usePipelineWebSocket({
    pipelineId: selectedPipeline?.pipeline_id || 'demo_001',
    onMessage: (data) => {
      console.log('Pipeline event:', data);
      // Handle events
    },
  });

  const handleWizardComplete = async (result: WizardResult) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Start new pipeline via API
      const response = await fetch('/api/pipeline/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: {
            client_name: result.client_name,
            primary_colors: result.primary_colors,
            secondary_colors: result.secondary_colors,
            style_preference: result.style_preference,
            visual_vibe: result.visual_vibe,
          },
          artistic_direction: result.artistic_direction || result.custom_prompt || '',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Add to list and navigate
        setPipelines([
          {
            pipeline_id: data.pipeline_id,
            client_name: result.client_name,
            current_phase: 'input',
            status: 'running',
            timestamp: new Date().toISOString(),
          },
          ...pipelines,
        ]);
        setShowWizard(false);
        
        // Navigate to pipeline detail
        window.location.href = `/pipeline/${data.pipeline_id}`;
      } else {
        throw new Error('Failed to start pipeline');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusBadge = (status: string, phase: Phase) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      completed: { bg: 'bg-green-900/30', text: 'text-green-400', icon: <CheckCircle2 className="w-3 h-3" /> },
      running: { bg: 'bg-blue-900/30', text: 'text-blue-400', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
      paused: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', icon: <Clock className="w-3 h-3" /> },
      failed: { bg: 'bg-red-900/30', text: 'text-red-400', icon: <AlertCircle className="w-3 h-3" /> },
    };
    
    const config = configs[status] || configs.running;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.text}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPhaseBadge = (phase: Phase) => {
    const phaseInfo = PHASES.find(p => p.id === phase);
    return phaseInfo?.name || phase;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Layers className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Brand2Print</h1>
                  <p className="text-xs text-gray-400">Design Pipeline</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <nav className="flex items-center gap-1">
                {[
                  { id: 'active', label: 'Active', icon: Sparkles },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'stats', label: 'Stats', icon: BarChart3 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveView(tab.id as typeof activeView)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeView === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              {/* Connection Status */}
              {selectedPipeline && (
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
                  <span className="text-xs text-gray-400">
                    {isConnected ? 'Live' : 'Offline'}
                  </span>
                </div>
              )}

              {/* New Pipeline Button */}
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Pipeline
              </button>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-200">{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">
              Dismiss
            </button>
          </div>
        )}

        {/* Active View */}
        {activeView === 'active' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Layers className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{pipelines.length}</p>
                    <p className="text-sm text-gray-400">Total Pipelines</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-900/50 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {pipelines.filter(p => p.status === 'completed').length}
                    </p>
                    <p className="text-sm text-gray-400">Completed</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-900/50 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {pipelines.filter(p => p.status === 'running').length}
                    </p>
                    <p className="text-sm text-gray-400">In Progress</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">4.2h</p>
                    <p className="text-sm text-gray-400">Avg Time</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Active Pipelines</h2>
              </div>

              <div className="divide-y divide-gray-700">
                {pipelines
                  .filter(p => p.status === 'running' || p.status === 'paused')
                  .map((pipeline) => (
                    <Link
                      key={pipeline.pipeline_id}
                      href={`/pipeline/${pipeline.pipeline_id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl flex items-center justify-center">
                          <Users className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{pipeline.client_name}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            {getStatusBadge(pipeline.status, pipeline.current_phase as Phase)}
                            <span className="text-xs text-gray-500">
                              {getPhaseBadge(pipeline.current_phase as Phase)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-400">
                          {formatTimestamp(pipeline.timestamp)}
                        </span>
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                      </div>
                    </Link>
                  ))}

                {pipelines.filter(p => p.status === 'running' || p.status === 'paused').length === 0 && (
                  <div className="px-6 py-12 text-center">
                    <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Active Pipelines</h3>
                    <p className="text-gray-400 mb-4">Start a new pipeline to begin generating designs.</p>
                    <button
                      onClick={() => setShowWizard(true)}
                      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Start New Pipeline
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {activeView === 'history' && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Pipeline History</h2>
              <div className="flex items-center gap-2">
                <input
                  type="search"
                  placeholder="Search pipelines..."
                  className="px-3 py-1.5 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-700">
              {pipelines.map((pipeline) => (
                <Link
                  key={pipeline.pipeline_id}
                  href={`/pipeline/${pipeline.pipeline_id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-600 rounded-xl flex items-center justify-center">
                      {pipeline.status === 'completed' ? (
                        <CheckCircle2 className="w-6 h-6 text-green-400" />
                      ) : pipeline.status === 'failed' ? (
                        <AlertCircle className="w-6 h-6 text-red-400" />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-medium">{pipeline.client_name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        {getStatusBadge(pipeline.status, pipeline.current_phase as Phase)}
                        <span className="text-xs text-gray-500">
                          {getPhaseBadge(pipeline.current_phase as Phase)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        {formatTimestamp(pipeline.timestamp)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {pipeline.pipeline_id.substring(0, 16)}...
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats View */}
        {activeView === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pipeline Volume Chart Placeholder */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Pipeline Volume</h3>
              <div className="h-64 flex items-end justify-around gap-2">
                {[12, 18, 15, 22, 28, 25, 32].map((count, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div 
                      className="w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                      style={{ height: `${count * 6}px` }}
                    />
                    <span className="text-xs text-gray-400">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Distribution */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Cost Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: 'Inspiration Generation', value: 45, color: 'bg-blue-500' },
                  { label: 'QA Verification', value: 25, color: 'bg-green-500' },
                  { label: 'High-Fidelity Render', value: 20, color: 'bg-purple-500' },
                  { label: 'PDF Generation', value: 10, color: 'bg-yellow-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="flex-1 text-gray-300">{item.label}</span>
                    <span className="text-white font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total This Month</span>
                  <span className="text-2xl font-bold text-white">$127.50</span>
                </div>
              </div>
            </div>

            {/* Top Brands */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Top Brands</h3>
              <div className="space-y-3">
                {[
                  { name: 'Salesforce', count: 12 },
                  { name: 'Airbnb', count: 8 },
                  { name: 'Spotify', count: 6 },
                  { name: 'Stripe', count: 5 },
                  { name: 'Figma', count: 4 },
                ].map((brand, i) => (
                  <div key={brand.name} className="flex items-center gap-3">
                    <span className="w-6 text-gray-500 text-sm">#{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{brand.name}</span>
                        <span className="text-gray-400 text-sm">{brand.count} pipelines</span>
                      </div>
                      <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${(brand.count / 12) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { action: 'Pipeline completed', brand: 'Airbnb', time: '2 hours ago' },
                  { action: 'QA approved', brand: 'Salesforce', time: '3 hours ago' },
                  { action: 'Design selected', brand: 'Spotify', time: '5 hours ago' },
                  { action: 'New pipeline started', brand: 'Stripe', time: '6 hours ago' },
                ].map((activity, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.action}</p>
                      <p className="text-gray-400 text-xs">{activity.brand}</p>
                    </div>
                    <span className="text-gray-500 text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="min-h-screen py-8 px-4 flex items-start justify-center">
            <PipelineWizard
              onComplete={handleWizardComplete}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
