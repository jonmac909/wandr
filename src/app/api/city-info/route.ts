import { NextRequest, NextResponse } from 'next/server';
import { generateCityInfo, POPULAR_CITY_INFO, CityInfo } from '@/lib/ai/city-info-generator';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  // Check if we have pre-populated data WITH highlights
  const existingInfo = POPULAR_CITY_INFO[city];
  if (existingInfo && existingInfo.highlights && Object.keys(existingInfo.highlights).length > 0) {
    // Has complete data with highlights
    return NextResponse.json(existingInfo);
  }

  // Generate highlights using AI (either no existing data, or existing data lacks highlights)
  try {
    const aiGeneratedInfo = await generateCityInfo(city, country || undefined);

    // If we had partial data (basic info without highlights), merge them
    if (existingInfo) {
      const mergedInfo: CityInfo = {
        ...existingInfo,
        // Use AI-generated highlights, ratings, and idealFor if they exist
        highlights: aiGeneratedInfo.highlights || existingInfo.highlights,
        ratings: existingInfo.ratings || aiGeneratedInfo.ratings,
        idealFor: existingInfo.idealFor || aiGeneratedInfo.idealFor,
      };
      return NextResponse.json(mergedInfo);
    }

    return NextResponse.json(aiGeneratedInfo);
  } catch (error) {
    console.error('Error generating city info:', error);
    // Return existing partial data if available, or fallback
    if (existingInfo) {
      return NextResponse.json(existingInfo);
    }
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
