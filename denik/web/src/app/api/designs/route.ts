import { NextRequest, NextResponse } from 'next/server';
import { ITERATION_DESIGNS, getAvailableRounds } from '@/lib/generations';

// GET /api/designs - Get all design iterations
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const style = url.searchParams.get('style');
  const round = url.searchParams.get('round');
  const source = url.searchParams.get('source');
  const bestOnly = url.searchParams.get('best') === 'true';
  
  // Return available rounds info
  if (source === 'rounds') {
    const rounds = getAvailableRounds();
    return NextResponse.json({
      rounds: rounds.map(r => ({
        round: r,
        count: ITERATION_DESIGNS.filter(d => d.round === r).length,
        best: ITERATION_DESIGNS.filter(d => d.round === r && d.best).length,
      })),
      total_designs: ITERATION_DESIGNS.length,
      best_rounds: [11, 16],
    });
  }
  
  // Filter designs
  let designs = ITERATION_DESIGNS;
  
  if (style) {
    designs = designs.filter(d => d.style === style);
  }
  
  if (round) {
    const roundNum = parseInt(round);
    designs = designs.filter(d => d.round === roundNum);
  }
  
  if (bestOnly) {
    designs = designs.filter(d => d.best);
  }
  
  return NextResponse.json({
    designs: designs.slice(0, 200), // Limit to 200 for performance
    count: designs.length,
    total: ITERATION_DESIGNS.length,
    available_styles: [...new Set(ITERATION_DESIGNS.map(d => d.style))],
    available_rounds: getAvailableRounds(),
  });
}