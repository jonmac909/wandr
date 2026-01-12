import { NextRequest, NextResponse } from 'next/server';
import { generateHotels } from '@/lib/planning/hotel-generator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  try {
    const hotels = await generateHotels(city, country || undefined);
    return NextResponse.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}
