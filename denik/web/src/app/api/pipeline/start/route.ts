import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Try backend first
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${API_BASE}/api/pipeline/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch {
      // Backend not available
    }
    
    // Demo mode: create a mock pipeline
    const pipelineId = `demo_${Date.now()}`;
    
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
