import { NextRequest, NextResponse } from 'next/server';

// In-memory cache for Pexels results
const pexelsCache = new Map<string, string>();

const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600';

// Simple hash function to get consistent but varied index for each site
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// Pexels API search for site/attraction images
async function searchPexels(siteName: string, city?: string, index?: number): Promise<string | null> {
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
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
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
        // Use hash of siteName to get consistent but varied image selection
        const siteHash = hashString(siteName + (city || ''));
        const photoIndex = (index !== undefined ? index : siteHash) % data.photos.length;
        return data.photos[photoIndex].src.medium;
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
  // Each category has multiple options for variety
  const categoryFallbacks: Record<string, string[]> = {
    temple: [
      'https://images.pexels.com/photos/5759954/pexels-photo-5759954.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    shrine: [
      'https://images.pexels.com/photos/5759954/pexels-photo-5759954.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/5169056/pexels-photo-5169056.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3408354/pexels-photo-3408354.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    palace: [
      'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2675266/pexels-photo-2675266.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    castle: [
      'https://images.pexels.com/photos/3290068/pexels-photo-3290068.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2832034/pexels-photo-2832034.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/672358/pexels-photo-672358.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    market: [
      'https://images.pexels.com/photos/1267682/pexels-photo-1267682.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2292953/pexels-photo-2292953.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3965545/pexels-photo-3965545.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    museum: [
      'https://images.pexels.com/photos/2372978/pexels-photo-2372978.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3369102/pexels-photo-3369102.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    park: [
      'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/358457/pexels-photo-358457.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    garden: [
      'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1470092/pexels-photo-1470092.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2132180/pexels-photo-2132180.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    beach: [
      'https://images.pexels.com/photos/1032650/pexels-photo-1032650.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/994605/pexels-photo-994605.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    tower: [
      'https://images.pexels.com/photos/2363/france-landmark-lights-night.jpg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2082103/pexels-photo-2082103.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    street: [
      'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1486222/pexels-photo-1486222.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    crossing: [
      'https://images.pexels.com/photos/2506923/pexels-photo-2506923.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2614818/pexels-photo-2614818.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    district: [
      'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/3075993/pexels-photo-3075993.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    food: [
      'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
    restaurant: [
      'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=600',
      'https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=600',
    ],
  };

  // Find a category-specific fallback
  const siteLower = site.toLowerCase();
  let fallbackUrl = FALLBACK_IMAGE;
  const siteHash = hashString(site + (city || ''));
  
  for (const [keyword, urls] of Object.entries(categoryFallbacks)) {
    if (siteLower.includes(keyword)) {
      // Use hash to pick from multiple fallback options for variety
      fallbackUrl = urls[siteHash % urls.length];
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
