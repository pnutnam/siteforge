import { NextResponse } from 'next/server';

export async function GET() {
  // This page shows "Your account is pending" state
  // Copy from UI-SPEC: Pending account heading + body
  return NextResponse.json({
    heading: 'Your account is pending',
    body: 'The dev team is reviewing your feedback. You\'ll have full access once approved.',
  });
}
