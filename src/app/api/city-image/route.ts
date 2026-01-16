import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory cache for quick lookups (persists across requests in the same worker)
const memoryCache = new Map<string, { url: string; expires: number }>();

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Initialize Supabase client for caching
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Google Places Text Search to find a city and get its photos
async function searchGooglePlaces(city: string, country?: string): Promise<{ url: string; placeId: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  console.log('[city-image] API key exists:', !!apiKey, 'length:', apiKey?.length || 0);
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  const query = country ? `${city}, ${country}` : city;
  
  try {
    // Use Text Search to find the city
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=locality&key=${apiKey}`
    );

    if (!searchResponse.ok) {
      console.error('Google Places search error:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    console.log('[city-image] Google response status:', searchData.status, 'results:', searchData.results?.length || 0);
    
    if (searchData.status !== 'OK' || !searchData.results?.length) {
      // Try without type restriction for smaller cities
      const fallbackResponse = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + ' city')}&key=${apiKey}`
      );
      const fallbackData = await fallbackResponse.json();
      if (fallbackData.status !== 'OK' || !fallbackData.results?.length) {
        return null;
      }
      searchData.results = fallbackData.results;
    }

    const place = searchData.results[0];
    if (!place.photos?.length) {
      return null;
    }

    // Get the first photo reference
    const photoRef = place.photos[0].photo_reference;
    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;

    return { url: photoUrl, placeId: place.place_id };
  } catch (error) {
    console.error('Google Places fetch error:', error);
    return null;
  }
}

// Check Supabase cache
async function getCachedImage(cacheKey: string): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('image_cache')
      .select('photo_url, expires_at')
      .eq('id', cacheKey)
      .single();

    if (data && new Date(data.expires_at) > new Date()) {
      return data.photo_url;
    }
  } catch {
    // Table might not exist yet, that's ok
  }
  return null;
}

// Save to Supabase cache
async function setCachedImage(cacheKey: string, photoUrl: string, placeId?: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('image_cache')
      .upsert({
        id: cacheKey,
        photo_url: photoUrl,
        place_id: placeId,
        source: 'google',
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      });
  } catch {
    // Cache write failures are non-critical
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

  // 1. Check memory cache first (fastest)
  const memoryCached = memoryCache.get(cacheKey);
  if (memoryCached && memoryCached.expires > Date.now()) {
    return NextResponse.json({ 
      imageUrl: memoryCached.url, 
      source: 'memory-cache' 
    });
  }

  // 2. Check Supabase cache
  const supabaseCached = await getCachedImage(cacheKey);
  if (supabaseCached) {
    memoryCache.set(cacheKey, { url: supabaseCached, expires: Date.now() + CACHE_TTL_MS });
    return NextResponse.json({ 
      imageUrl: supabaseCached, 
      source: 'supabase-cache' 
    });
  }

  // 3. Fetch from Google Places API
  const googleResult = await searchGooglePlaces(city, country || undefined);
  
  if (googleResult) {
    memoryCache.set(cacheKey, { url: googleResult.url, expires: Date.now() + CACHE_TTL_MS });
    // Fire and forget - don't await cache write
    setCachedImage(cacheKey, googleResult.url, googleResult.placeId);
    return NextResponse.json({ 
      imageUrl: googleResult.url, 
      source: 'google-places'
    });
  }

  // 4. Fallback to generic travel image
  return NextResponse.json({ 
    imageUrl: FALLBACK_IMAGE, 
    source: 'fallback' 
  });
}
