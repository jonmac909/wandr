import { NextRequest, NextResponse } from 'next/server';
import { supabaseCities } from '@/lib/db/supabase';

// In-memory cache (persists across requests in the same worker)
const imageCache = new Map<string, string>();

// Use server-side env var, fallback to NEXT_PUBLIC_ for backwards compatibility
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Get photo URL from photo reference
async function getPhotoUrl(photoRef: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) return null;
  
  const photoApiUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
  
  try {
    const photoResponse = await fetch(photoApiUrl, { redirect: 'follow' });
    if (!photoResponse.ok) return null;
    return photoResponse.url;
  } catch {
    return null;
  }
}

// Try multiple search strategies to find city images
async function searchGooglePlaces(city: string, country?: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) {
    console.error('[city-image] Google Maps API key not configured');
    return null;
  }

  console.log(`[city-image] Searching for: ${city}, ${country || 'no country'}`);

  // Strategy 1: Use new Places API (Text Search)
  try {
    const textQuery = country 
      ? `${city} ${country} city skyline`
      : `${city} city skyline`;
    
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.photos,places.displayName',
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 5,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.places?.length) {
        for (const place of data.places) {
          if (place.photos?.length) {
            // New API uses photo name format: places/{place_id}/photos/{photo_id}
            const photoName = place.photos[0].name;
            const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_API_KEY}`;
            
            // Test if URL works
            const testResponse = await fetch(photoUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              console.log(`[city-image] Got image via new Places API for ${city}`);
              return photoUrl;
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('[city-image] New Places API failed:', error);
  }

  // Strategy 2: Legacy Text Search - search for tourist attractions
  const searchQueries = [
    country ? `${city} ${country}` : city,
    `${city} tourist attraction`,
    `${city} landmark`,
    `${city} downtown`,
  ];

  for (const query of searchQueries) {
    try {
      const searchResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`
      );

      if (!searchResponse.ok) continue;

      const searchData = await searchResponse.json();
      if (searchData.status !== 'OK' || !searchData.results?.length) continue;

      // Look through results to find one with photos
      for (const place of searchData.results.slice(0, 5)) {
        if (place.photos?.length) {
          const photoUrl = await getPhotoUrl(place.photos[0].photo_reference);
          if (photoUrl) {
            console.log(`[city-image] Got image for ${city} via legacy search: "${query}"`);
            return photoUrl;
          }
        }
      }
    } catch (error) {
      console.log(`[city-image] Search failed for query "${query}":`, error);
    }
  }

  console.log(`[city-image] No image found for ${city} after all strategies`);
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  const cacheKey = `city:${city}-${country || ''}`.toLowerCase();

  // 1. Check in-memory cache first (fastest)
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({
      imageUrl: imageCache.get(cacheKey),
      source: 'memory-cache'
    });
  }

  // 2. Check Supabase cache
  try {
    const cachedCity = await supabaseCities.get(city, country || undefined);
    if (cachedCity?.image_url) {
      console.log(`[city-image] Found ${city} in Supabase cache`);
      imageCache.set(cacheKey, cachedCity.image_url);
      return NextResponse.json({
        imageUrl: cachedCity.image_url,
        source: 'supabase-cache'
      });
    }
  } catch (error) {
    console.error('[city-image] Supabase cache check failed:', error);
  }

  // 3. Search Google Places API
  const googleUrl = await searchGooglePlaces(city, country || undefined);

  if (googleUrl) {
    console.log(`[city-image] Got image for ${city} from Google Places, caching...`);
    imageCache.set(cacheKey, googleUrl);

    // Save to Supabase cache for future requests
    try {
      await supabaseCities.save({
        city_name: city,
        country: country || null,
        city_info: {},
        image_url: googleUrl,
      });
      console.log(`[city-image] Saved ${city} image to Supabase cache`);
    } catch (error) {
      console.error('[city-image] Failed to save to Supabase cache:', error);
    }

    return NextResponse.json({
      imageUrl: googleUrl,
      source: 'google-places'
    });
  }

  // 4. No image found - return placeholder URL instead of 404
  console.log(`[city-image] No Google image for ${city}, returning placeholder`);

  // Return a placeholder image URL
  const placeholderUrl = `/api/placeholder/city/${encodeURIComponent(city)}`;

  return NextResponse.json({
    imageUrl: placeholderUrl,
    source: 'placeholder'
  });
}
