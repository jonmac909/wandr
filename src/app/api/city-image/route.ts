import { NextRequest, NextResponse } from 'next/server';

// In-memory cache (persists across requests in the same worker)
const imageCache = new Map<string, string>();

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';
const GOOGLE_API_KEY = 'AIzaSyBGLXcx7JZLa4vcIdD0d-hpcvFNbE0Xy-k';

// Google Places Text Search for city images
async function searchGooglePlaces(city: string, country?: string): Promise<string | null> {
  const query = country ? `${city}, ${country}` : city;
  
  try {
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=locality&key=${GOOGLE_API_KEY}`
    );

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    
    if (searchData.status !== 'OK' || !searchData.results?.length) {
      // Try without type restriction for smaller cities
      const fallbackResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' city')}&key=${GOOGLE_API_KEY}`
      );
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.status !== 'OK' || !fallbackData.results?.length) return null;
      searchData.results = fallbackData.results;
    }

    const place = searchData.results[0];
    if (!place.photos?.length) return null;

    // Get photo URL
    const photoRef = place.photos[0].photo_reference;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
  } catch (error) {
    console.error('Google Places fetch error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  const cacheKey = `city:${city}-${country || ''}`.toLowerCase();

  // 1. Check cache first
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({ 
      imageUrl: imageCache.get(cacheKey), 
      source: 'cache' 
    });
  }

  // 2. Search Google Places API
  const googleUrl = await searchGooglePlaces(city, country || undefined);
  
  if (googleUrl) {
    imageCache.set(cacheKey, googleUrl);
    return NextResponse.json({ 
      imageUrl: googleUrl, 
      source: 'google-places'
    });
  }

  // 3. Fallback
  return NextResponse.json({ 
    imageUrl: FALLBACK_IMAGE, 
    source: 'fallback' 
  });
}
