import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Demo mode: simulate continuing pipeline
    return NextResponse.json({
      success: true,
      status: 'continuing',
      pipeline_id: id,
      current_phase: 'phase4_render',
      mode: 'demo',
    });
    
  } catch (error) {
    console.error('Error continuing pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to continue pipeline', details: String(error) },
      { status: 500 }
    );
  }
}
