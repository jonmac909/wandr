import { NextResponse } from 'next/server';

// This endpoint is disabled - AI features removed
// Recommendations now come from Google Places API directly
export async function POST() {
  return NextResponse.json(
    { error: 'Use Google Places API for recommendations' },
    { status: 503 }
  );
}
