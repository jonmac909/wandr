import { NextRequest, NextResponse } from 'next/server';

// In-memory cache (persists across requests in the same worker)
const imageCache = new Map<string, string>();

// Use server-side env var, fallback to NEXT_PUBLIC_ for backwards compatibility
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Google Places Text Search for city images
async function searchGooglePlaces(city: string, country?: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) {
    console.error('[city-image] Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    return null;
  }

  console.log(`[city-image] Searching Google Places for: ${city}, ${country || 'no country'}`);


  const query = country ? `${city}, ${country}` : city;

  try {
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=locality&key=${GOOGLE_API_KEY}`
    );

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' || !searchData.results?.length) {
      console.log(`[city-image] Initial search for ${city} returned status: ${searchData.status}, trying fallback...`);
      // Try without type restriction for smaller cities
      const fallbackResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' city')}&key=${GOOGLE_API_KEY}`
      );
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.status !== 'OK' || !fallbackData.results?.length) {
        console.log(`[city-image] Fallback search for ${city} also failed: ${fallbackData.status}`);
        return null;
      }
      searchData.results = fallbackData.results;
    }

    const place = searchData.results[0];
    if (!place.photos?.length) {
      console.log(`[city-image] No photos found for ${city} in Google Places`);
      return null;
    }

    // Get photo reference and follow redirect to get stable URL
    const photoRef = place.photos[0].photo_reference;
    const photoApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;

    // Follow the redirect to get the stable lh3.googleusercontent.com URL
    const photoResponse = await fetch(photoApiUrl, { redirect: 'follow' });
    if (!photoResponse.ok) return null;

    // The final URL after redirect is stable and doesn't expire
    return photoResponse.url;
  } catch (error) {
    console.error('[city-image] Google Places fetch error for', city, ':', error);
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
    console.log(`[city-image] Got image for ${city} from Google Places`);
    imageCache.set(cacheKey, googleUrl);
    return NextResponse.json({
      imageUrl: googleUrl,
      source: 'google-places'
    });
  }

  // 3. No fallback - return error if Google Places fails
  // Log for debugging
  console.error(`[city-image] Failed to get image for ${city}. API key configured: ${!!GOOGLE_API_KEY}`);

  return NextResponse.json({
    error: 'Could not find image for city',
    city,
    apiKeyConfigured: !!GOOGLE_API_KEY
  }, { status: 404 });
}
