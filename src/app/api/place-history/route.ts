import { NextResponse } from 'next/server';

// Get audience recommendations based on place type (real travel wisdom)
function getAudienceInfo(placeName: string, placeType?: string): { goodFor: string[]; notFor: string[] } {
  const name = placeName.toLowerCase();
  const type = (placeType || '').toLowerCase();
  
  // Temples / Religious sites
  if (name.includes('temple') || name.includes('shrine') || name.includes('wat ') || type.includes('temple')) {
    return {
      goodFor: ['History buffs', 'Architecture lovers', 'Photographers', 'Spiritual travelers'],
      notFor: ['Those seeking nightlife', 'Visitors uncomfortable with dress codes']
    };
  }
  
  // Museums / Galleries
  if (name.includes('museum') || name.includes('gallery') || type.includes('museum')) {
    return {
      goodFor: ['Art enthusiasts', 'History lovers', 'Rainy day visitors', 'Families with older kids'],
      notFor: ['Active travelers', 'Very young children', 'Those short on time']
    };
  }
  
  // Night markets / Markets
  if (name.includes('night market') || name.includes('walking street')) {
    return {
      goodFor: ['Foodies', 'Budget travelers', 'Night owls', 'Shoppers'],
      notFor: ['Early risers', 'Those who dislike crowds', 'Picky eaters']
    };
  }
  
  if (name.includes('market') || type.includes('market')) {
    return {
      goodFor: ['Foodies', 'Photographers', 'Budget shoppers', 'Cultural explorers'],
      notFor: ['Germaphobes', 'Those uncomfortable with haggling']
    };
  }
  
  // Parks / Nature
  if (name.includes('park') || name.includes('garden') || type.includes('park')) {
    return {
      goodFor: ['Families', 'Nature lovers', 'Joggers', 'Photographers'],
      notFor: ['Those seeking indoor activities', 'Visitors on very hot days']
    };
  }
  
  // Towers / Observation decks
  if (name.includes('tower') || name.includes('observation') || name.includes('skywalk')) {
    return {
      goodFor: ['Photographers', 'Couples', 'First-time visitors', 'View seekers'],
      notFor: ['Those afraid of heights', 'Budget travelers']
    };
  }
  
  // Beaches
  if (name.includes('beach') || type.includes('beach')) {
    return {
      goodFor: ['Swimmers', 'Sunbathers', 'Families', 'Water sports enthusiasts'],
      notFor: ['Those who burn easily', 'Non-swimmers seeking activities']
    };
  }
  
  // Palaces / Historic sites
  if (name.includes('palace') || name.includes('castle') || type.includes('landmark')) {
    return {
      goodFor: ['History enthusiasts', 'Architecture buffs', 'Photographers'],
      notFor: ['Those with mobility issues (often lots of walking)', 'Young children']
    };
  }
  
  // Default for attractions
  return {
    goodFor: ['First-time visitors', 'Curious travelers'],
    notFor: ['Those who prefer off-the-beaten-path']
  };
}

// Fetch real data from Wikipedia API
async function fetchWikipediaExtract(placeName: string, city?: string): Promise<string | null> {
  try {
    // Try with city context first, then just place name
    const searchQueries = city 
      ? [`${placeName} ${city}`, placeName]
      : [placeName];
    
    for (const query of searchQueries) {
      // Search Wikipedia for the place
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const searchRes = await fetch(searchUrl);
      const searchData = await searchRes.json();
      
      if (!searchData.query?.search?.[0]) continue;
      
      const pageTitle = searchData.query.search[0].title;
      
      // Get the extract (summary) for the page
      const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`;
      const extractRes = await fetch(extractUrl);
      const extractData = await extractRes.json();
      
      const pages = extractData.query?.pages;
      if (!pages) continue;
      
      const pageId = Object.keys(pages)[0];
      const extract = pages[pageId]?.extract;
      
      if (extract && extract.length > 50) {
        // Return first 2-3 sentences (roughly 500 chars)
        const sentences = extract.split(/(?<=[.!?])\s+/);
        return sentences.slice(0, 3).join(' ').substring(0, 500);
      }
    }
    
    return null;
  } catch (error) {
    console.error('[Wikipedia] Error fetching:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { placeName, city, type } = await request.json();
    
    if (!placeName) {
      return NextResponse.json({ error: 'placeName required' }, { status: 400 });
    }
    
    const extract = await fetchWikipediaExtract(placeName, city);
    const audience = getAudienceInfo(placeName, type);
    
    return NextResponse.json({
      history: extract,
      source: extract ? 'Wikipedia' : null,
      goodFor: audience.goodFor,
      notFor: audience.notFor
    });
  } catch (error) {
    console.error('[PlaceHistory] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// Also support GET for simple queries
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeName = searchParams.get('place');
  const city = searchParams.get('city');
  
  if (!placeName) {
    return NextResponse.json({ error: 'place param required' }, { status: 400 });
  }
  
  const extract = await fetchWikipediaExtract(placeName, city || undefined);
  
  return NextResponse.json({
    history: extract,
    source: extract ? 'Wikipedia' : null
  });
}
