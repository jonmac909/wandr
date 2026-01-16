import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for Pexels results
const pexelsCache = new Map<string, string>();

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';

// Pexels API search for site/attraction images
async function searchPexels(siteName: string, city?: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('PEXELS_API_KEY not configured');
    return null;
  }

  // Build search query - include city for context if provided
  const query = city 
    ? `${siteName} ${city} landmark` 
    : `${siteName} landmark attraction`;
  
  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.medium;
    }
    
    return null;
  } catch (error) {
    console.error('Pexels fetch error:', error);
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

  const cacheKey = `${site}-${city || ''}`.toLowerCase();

  // Check cache first
  if (pexelsCache.has(cacheKey)) {
    return NextResponse.json({ 
      imageUrl: pexelsCache.get(cacheKey), 
      source: 'cache' 
    });
  }

  // Search Pexels API
  const pexelsUrl = await searchPexels(site, city || undefined);
  
  if (pexelsUrl) {
    pexelsCache.set(cacheKey, pexelsUrl);
    return NextResponse.json({ 
      imageUrl: pexelsUrl, 
      source: 'pexels'
    });
  }

  // Fallback
  return NextResponse.json({ 
    imageUrl: FALLBACK_IMAGE, 
    source: 'fallback' 
  });
}
