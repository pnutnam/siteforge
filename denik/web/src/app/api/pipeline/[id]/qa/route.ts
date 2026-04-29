import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Demo mode: simulate QA submission
    return NextResponse.json({
      success: true,
      status: 'qa_submitted',
      pipeline_id: id,
      approved: body.approved || false,
      issues: body.issues || [],
      refinement_prompt: body.refinement_prompt || null,
      confidence: body.confidence || 0.5,
      mode: 'demo',
    });
    
  } catch (error) {
    console.error('Error submitting QA:', error);
    return NextResponse.json(
      { error: 'Failed to submit QA', details: String(error) },
      { status: 500 }
    );
  }
}
