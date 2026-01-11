import { NextRequest, NextResponse } from 'next/server';
import { generateCityInfo, POPULAR_CITY_INFO } from '@/lib/ai/city-info-generator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  // Check if we have pre-populated data
  if (POPULAR_CITY_INFO[city]) {
    return NextResponse.json(POPULAR_CITY_INFO[city]);
  }

  // Generate using AI
  try {
    const cityInfo = await generateCityInfo(city, country || undefined);
    return NextResponse.json(cityInfo);
  } catch (error) {
    console.error('Error generating city info:', error);
    return NextResponse.json({
      bestFor: ['Exploration'],
      crowdLevel: 'Moderate',
      bestTime: 'Spring or Fall',
      topSites: ['City Center', 'Main Square', 'Local Museum', 'Historic District'],
      localTip: 'Ask locals for their favorite hidden spots',
      avgDays: '2-3 days',
      pros: ['Unique local culture', 'Authentic experiences', 'New discoveries'],
      cons: ['May require more research', 'Limited tourist info', 'Adventure awaits'],
    });
  }
}
