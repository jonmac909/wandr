import { NextRequest, NextResponse } from 'next/server';
import { supabasePlaces } from '@/lib/db/supabase';

// In-memory cache (persists across requests in the same worker)
const imageCache = new Map<string, string>();

// Use server-side env var, fallback to NEXT_PUBLIC_ for backwards compatibility
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Simple hash function for consistent image selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

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

// Google Places Text Search for attractions/sites
async function searchGooglePlaces(siteName: string, city?: string): Promise<string | null> {
  if (!GOOGLE_API_KEY) {
    console.error('[site-image] Google Maps API key not configured');
    return null;
  }

  const query = city ? `${siteName} ${city}` : siteName;
  console.log(`[site-image] Searching for: ${query}`);

  // Strategy 1: Use new Places API
  try {
    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'places.photos,places.displayName',
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 5,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.places?.length) {
        for (const place of data.places) {
          if (place.photos?.length) {
            const siteHash = hashString(siteName + (city || ''));
            const photoIndex = siteHash % place.photos.length;
            const photoName = place.photos[photoIndex].name;
            const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=${GOOGLE_API_KEY}`;
            
            const testResponse = await fetch(photoUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              console.log(`[site-image] Got image via new Places API for ${siteName}`);
              return photoUrl;
            }
          }
        }
      }
    }
  } catch (error) {
    console.log('[site-image] New Places API failed:', error);
  }

  // Strategy 2: Legacy Text Search
  try {
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`
    );

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    if (searchData.status !== 'OK' || !searchData.results?.length) return null;

    // Look through results to find one with photos
    for (const place of searchData.results.slice(0, 5)) {
      if (place.photos?.length) {
        const siteHash = hashString(siteName + (city || ''));
        const photoIndex = siteHash % place.photos.length;
        const photoUrl = await getPhotoUrl(place.photos[photoIndex].photo_reference);
        if (photoUrl) {
          console.log(`[site-image] Got image for ${siteName} via legacy search`);
          return photoUrl;
        }
      }
    }
  } catch (error) {
    console.error('[site-image] Legacy search error:', error);
  }

  console.log(`[site-image] No image found for ${siteName}`);
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const site = searchParams.get('site');
  const city = searchParams.get('city');

  if (!site) {
    return NextResponse.json({ error: 'Site parameter required' }, { status: 400 });
  }

  const cacheKey = `site:${site}-${city || ''}`.toLowerCase();

  // 1. Check in-memory cache first (fastest)
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({
      imageUrl: imageCache.get(cacheKey),
      source: 'memory-cache'
    });
  }

  // 2. Check Supabase cache
  try {
    if (city) {
      const cachedPlaces = await supabasePlaces.getByCity(city);
      const cachedPlace = cachedPlaces.find(p =>
        p.name.toLowerCase() === site.toLowerCase() ||
        p.name.toLowerCase().includes(site.toLowerCase()) ||
        site.toLowerCase().includes(p.name.toLowerCase())
      );
      if (cachedPlace?.image_url) {
        console.log(`[site-image] Found ${site} in Supabase cache`);
        imageCache.set(cacheKey, cachedPlace.image_url);
        return NextResponse.json({
          imageUrl: cachedPlace.image_url,
          source: 'supabase-cache'
        });
      }
    }
  } catch (error) {
    console.error('[site-image] Supabase cache check failed:', error);
  }

  // 3. Search Google Places API
  const googleUrl = await searchGooglePlaces(site, city || undefined);

  if (googleUrl) {
    console.log(`[site-image] Got image for ${site} from Google Places, caching...`);
    imageCache.set(cacheKey, googleUrl);

    // Save to Supabase cache for future requests
    try {
      // Generate a simple place ID from name+city
      const placeId = `site_${site}_${city || 'unknown'}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await supabasePlaces.save({
        google_place_id: placeId,
        name: site,
        city: city || 'unknown',
        place_type: 'attraction',
        place_data: { fetchedAt: new Date().toISOString() },
        image_url: googleUrl,
      });
      console.log(`[site-image] Saved ${site} image to Supabase cache`);
    } catch (error) {
      console.error('[site-image] Failed to save to Supabase cache:', error);
    }

    return NextResponse.json({
      imageUrl: googleUrl,
      source: 'google-places'
    });
  }

  // 4. No image found - return placeholder instead of 404
  console.log(`[site-image] No Google image for ${site}, returning placeholder`);

  const placeholderUrl = `/api/placeholder/city/${encodeURIComponent(site)}`;

  return NextResponse.json({
    imageUrl: placeholderUrl,
    source: 'placeholder'
  });
}
