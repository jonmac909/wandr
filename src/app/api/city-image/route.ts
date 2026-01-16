import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for Pexels results (persists across requests in the same worker)
const pexelsCache = new Map<string, string>();

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';

// Pexels API search for city images
async function searchPexels(city: string, country?: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    console.warn('PEXELS_API_KEY not configured');
    return null;
  }

  const query = country 
    ? `${city} ${country} travel landscape` 
    : `${city} travel landmark`;
  
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
      // Use medium size (350px height) - good for cards
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
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  const cacheKey = `${city}-${country || ''}`.toLowerCase();

  // 1. Check cache first
  if (pexelsCache.has(cacheKey)) {
    return NextResponse.json({ 
      imageUrl: pexelsCache.get(cacheKey), 
      source: 'cache' 
    });
  }

  // 2. Search Pexels API
  const pexelsUrl = await searchPexels(city, country || undefined);
  
  if (pexelsUrl) {
    pexelsCache.set(cacheKey, pexelsUrl);
    return NextResponse.json({ 
      imageUrl: pexelsUrl, 
      source: 'pexels',
      photographer: 'Pexels' // Attribution
    });
  }

  // 3. Fallback to generic travel image
  return NextResponse.json({ 
    imageUrl: FALLBACK_IMAGE, 
    source: 'fallback' 
  });
}
