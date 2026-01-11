import { NextRequest, NextResponse } from 'next/server';

// Curated high-quality images for popular cities (fast loading)
const CURATED_IMAGES: Record<string, string> = {
  // Hawaii
  'Honolulu': 'https://images.unsplash.com/photo-1507876466758-bc54f384809c?w=600&q=80',
  'Waikiki': 'https://images.unsplash.com/photo-1571041804726-53f7a7f0039b?w=600&q=80',
  'Maui': 'https://images.unsplash.com/photo-1542259009477-d625272157b7?w=600&q=80',
  'Kauai': 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=600&q=80',
  'Oahu': 'https://images.unsplash.com/photo-1598135753163-6167c1a1ad65?w=600&q=80',
  // Major cities
  'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'Paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'Rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80',
  'Barcelona': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600&q=80',
  'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=600&q=80',
};

// Cache for dynamically searched images
const imageCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const country = searchParams.get('country');

  if (!city) {
    return NextResponse.json({ error: 'City parameter required' }, { status: 400 });
  }

  // 1. Check curated images first
  if (CURATED_IMAGES[city]) {
    return NextResponse.json({ imageUrl: CURATED_IMAGES[city], source: 'curated' });
  }

  // 2. Check cache
  const cacheKey = `${city}-${country || ''}`;
  if (imageCache.has(cacheKey)) {
    return NextResponse.json({ imageUrl: imageCache.get(cacheKey), source: 'cache' });
  }

  // 3. Try to fetch from Wikipedia API (free, no API key needed)
  try {
    const searchTerm = country ? `${city}, ${country}` : city;
    const wikiResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`
    );

    if (wikiResponse.ok) {
      const data = await wikiResponse.json();
      if (data.thumbnail?.source) {
        // Get higher resolution version
        const imageUrl = data.thumbnail.source.replace(/\/\d+px-/, '/600px-');
        imageCache.set(cacheKey, imageUrl);
        return NextResponse.json({ imageUrl, source: 'wikipedia' });
      }
      if (data.originalimage?.source) {
        imageCache.set(cacheKey, data.originalimage.source);
        return NextResponse.json({ imageUrl: data.originalimage.source, source: 'wikipedia' });
      }
    }
  } catch (error) {
    console.error('Wikipedia API error:', error);
  }

  // 4. Fallback: use a generic travel image with city name as seed
  const fallbackUrl = `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80`;
  return NextResponse.json({ imageUrl: fallbackUrl, source: 'fallback' });
}
