import { NextRequest, NextResponse } from 'next/server';

// In-memory cache
const imageCache = new Map<string, string>();

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';
const GOOGLE_API_KEY = 'AIzaSyBGLXcx7JZLa4vcIdD0d-hpcvFNbE0Xy-k';

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

// Google Places Text Search for attractions/sites
async function searchGooglePlaces(siteName: string, city?: string): Promise<string | null> {
  const query = city ? `${siteName} ${city}` : siteName;
  
  try {
    const searchResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`
    );

    if (!searchResponse.ok) return null;

    const searchData = await searchResponse.json();
    if (searchData.status !== 'OK' || !searchData.results?.length) return null;

    const place = searchData.results[0];
    if (!place.photos?.length) return null;

    // Use hash for consistent selection
    const siteHash = hashString(siteName + (city || ''));
    const photoIndex = siteHash % place.photos.length;
    const photoRef = place.photos[photoIndex].photo_reference;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_API_KEY}`;
  } catch (error) {
    console.error('Google Places fetch error:', error);
    return null;
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

  // 1. Check cache first
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({ 
      imageUrl: imageCache.get(cacheKey), 
      source: 'cache' 
    });
  }

  // 2. Search Google Places API
  const googleUrl = await searchGooglePlaces(site, city || undefined);
  
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
