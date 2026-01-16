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

  // Try multiple search queries to find a good image
  const queries = [
    siteName, // Try exact name first (e.g., "Senso-ji Temple")
    city ? `${siteName} ${city}` : siteName, // With city context
    siteName.replace(/temple|shrine|palace|museum|market|park/gi, '').trim() + ' travel', // Simplified
  ].filter(Boolean);

  for (const query of queries) {
    try {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
        {
          headers: {
            'Authorization': apiKey,
          },
        }
      );

      if (!response.ok) {
        console.error('Pexels API error:', response.status);
        continue;
      }

      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        // Pick a random photo from results to add variety
        const randomIndex = Math.floor(Math.random() * Math.min(data.photos.length, 3));
        return data.photos[randomIndex].src.medium;
      }
    } catch (error) {
      console.error('Pexels fetch error:', error);
      continue;
    }
  }
  
  return null;
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

  // Fallback - try a generic category search based on common keywords
  const categoryFallbacks: Record<string, string> = {
    temple: 'https://images.pexels.com/photos/5759954/pexels-photo-5759954.jpeg?auto=compress&cs=tinysrgb&w=600',
    shrine: 'https://images.pexels.com/photos/5759954/pexels-photo-5759954.jpeg?auto=compress&cs=tinysrgb&w=600',
    palace: 'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=600',
    castle: 'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=600',
    market: 'https://images.pexels.com/photos/1267682/pexels-photo-1267682.jpeg?auto=compress&cs=tinysrgb&w=600',
    museum: 'https://images.pexels.com/photos/2372978/pexels-photo-2372978.jpeg?auto=compress&cs=tinysrgb&w=600',
    park: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=600',
    garden: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=600',
    beach: 'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=600',
    tower: 'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg?auto=compress&cs=tinysrgb&w=600',
    street: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=600',
    crossing: 'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=600',
    district: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=600',
    food: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
    restaurant: 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=600',
  };

  // Find a category-specific fallback
  const siteLower = site.toLowerCase();
  let fallbackUrl = FALLBACK_IMAGE;
  for (const [keyword, url] of Object.entries(categoryFallbacks)) {
    if (siteLower.includes(keyword)) {
      fallbackUrl = url;
      break;
    }
  }

  // Cache the fallback too
  pexelsCache.set(cacheKey, fallbackUrl);

  return NextResponse.json({ 
    imageUrl: fallbackUrl, 
    source: 'fallback' 
  });
}
