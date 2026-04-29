import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Try backend first
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      const response = await fetch(`${API_BASE}/api/pipeline/${id}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: id,
          selected_image: body.selected_image,
          human_feedback: body.human_feedback,
        }),
        signal: AbortSignal.timeout(3000),
      });
      
      if (response.ok) {
        return NextResponse.json(await response.json());
      }
    } catch {
      // Backend not available
    }
    
    // Demo mode: simulate selection
    return NextResponse.json({
      success: true,
      status: 'selected',
      pipeline_id: id,
      selected_image: body.selected_image,
      human_feedback: body.human_feedback,
      mode: 'demo',
    });
    
  } catch (error) {
    console.error('Error selecting image:', error);
    return NextResponse.json(
      { error: 'Failed to select image', details: String(error) },
      { status: 500 }
    );
  }
}
