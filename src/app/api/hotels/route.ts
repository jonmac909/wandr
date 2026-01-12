import { NextRequest, NextResponse } from 'next/server';
import { generateHotels, type HotelPreferences } from '@/lib/planning/hotel-generator';

// GET - simple request without preferences
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

// POST - request with user preferences and nearby activities
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, country, preferences } = body as {
      city: string;
      country?: string;
      preferences?: HotelPreferences;
    };

    if (!city) {
      return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
    }

    const hotels = await generateHotels(city, country, preferences);
    return NextResponse.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return NextResponse.json({ error: 'Failed to fetch hotels' }, { status: 500 });
  }
}
