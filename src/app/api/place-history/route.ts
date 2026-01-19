import { NextResponse } from 'next/server';

// This endpoint is disabled - AI features removed
export async function POST() {
  return NextResponse.json(
    { error: 'This feature is currently unavailable' },
    { status: 503 }
  );
}
