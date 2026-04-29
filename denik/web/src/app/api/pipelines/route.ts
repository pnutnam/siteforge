import { NextResponse } from 'next/server';

// Mock pipelines for demo mode
const MOCK_PIPELINES = [
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

export async function GET() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${API_BASE}/api/pipelines`);
    if (response.ok) {
      return NextResponse.json(await response.json());
    }
  } catch {
    // Backend not available, use mock data
  }
  
  // Return mock data for demo
  return NextResponse.json({
    pipelines: MOCK_PIPELINES,
  });
}
