import { NextRequest, NextResponse } from 'next/server';
import { getCityInfo, POPULAR_CITY_INFO } from '@/lib/ai/city-info-generator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  // Check if we have pre-populated data for this city
  const existingInfo = POPULAR_CITY_INFO[city];
  if (existingInfo) {
    return NextResponse.json(existingInfo);
  }

  // Return fallback data for cities not in our database
  // No more Anthropic API calls - just use static/cached data
  return NextResponse.json(getCityInfo(city));
}
