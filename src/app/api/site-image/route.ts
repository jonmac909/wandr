import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// In-memory cache for quick lookups
const memoryCache = new Map<string, { url: string; expires: number }>();

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Simple hash function to get consistent but varied index for each site
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// Initialize Supabase client for caching
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Google Places Text Search for attractions/sites
async function searchGooglePlaces(siteName: string, city?: string): Promise<{ url: string; placeId: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not configured');
    return null;
  }

  // Build search query - include city for better accuracy
  const query = city ? `${siteName} ${city}` : siteName;
  
  try {
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`
    );

    if (!searchResponse.ok) {
      console.error('Google Places search error:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    
    if (searchData.status !== 'OK' || !searchData.results?.length) {
      return null;
    }

    const place = searchData.results[0];
    if (!place.photos?.length) {
      return null;
    }

    // Get photo - use hash for consistent selection if multiple photos
    const siteHash = hashString(siteName + (city || ''));
    const photoIndex = siteHash % place.photos.length;
    const photoRef = place.photos[photoIndex].photo_reference;
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
    // Table might not exist yet
  }
  return null;
}

// Save to Supabase cache
async function setCachedImage(cacheKey: string, photoUrl: string, placeId?: string, source = 'google'): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase
      .from('image_cache')
      .upsert({
        id: cacheKey,
        photo_url: photoUrl,
        place_id: placeId,
        source,
        expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      });
  } catch {
    // Cache write failures are non-critical
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const site = searchParams.get('site');
  const city = searchParams.get('city');

  if (!site) {
    return NextResponse.json({ error: 'Site parameter required' }, { status: 400 });
  }

  const cacheKey = `site:${site}-${city || ''}`.toLowerCase();

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
  const googleResult = await searchGooglePlaces(site, city || undefined);
  
  if (googleResult) {
    memoryCache.set(cacheKey, { url: googleResult.url, expires: Date.now() + CACHE_TTL_MS });
    setCachedImage(cacheKey, googleResult.url, googleResult.placeId);
    return NextResponse.json({ 
      imageUrl: googleResult.url, 
      source: 'google-places'
    });
  }

  // 4. Fallback - use category-specific Pexels images
  const categoryFallbacks: Record<string, string[]> = {
    temple: [
      'https://images.pexels.com/photos/5759954/pexels-photo-5759954.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    shrine: [
      'https://images.pexels.com/photos/5759954/pexels-photo-5759954.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/5169056/pexels-photo-5169056.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    palace: [
      'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2675266/pexels-photo-2675266.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    castle: [
      'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2832034/pexels-photo-2832034.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    market: [
      'https://images.pexels.com/photos/1267682/pexels-photo-1267682.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2292953/pexels-photo-2292953.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    museum: [
      'https://images.pexels.com/photos/2372978/pexels-photo-2372978.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3369102/pexels-photo-3369102.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    park: [
      'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    garden: [
      'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1470092/pexels-photo-1470092.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    beach: [
      'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    tower: [
      'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    street: [
      'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    crossing: [
      'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    district: [
      'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    food: [
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    restaurant: [
      'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  };

  const siteLower = site.toLowerCase();
  let fallbackUrl = FALLBACK_IMAGE;
  const siteHash = hashString(site + (city || ''));
  
  for (const [keyword, urls] of Object.entries(categoryFallbacks)) {
    if (siteLower.includes(keyword)) {
      fallbackUrl = urls[siteHash % urls.length];
      break;
    }
  }

  // Cache the fallback too
  memoryCache.set(cacheKey, { url: fallbackUrl, expires: Date.now() + CACHE_TTL_MS });
  setCachedImage(cacheKey, fallbackUrl, undefined, 'fallback');

  return NextResponse.json({ 
    imageUrl: fallbackUrl, 
    source: 'fallback' 
  });
}
