import { NextResponse } from 'next/server';

// Wikivoyage API - FREE, no key needed
// Returns travel tips, safety info, local customs for a destination

// In-memory cache
const cache: Record<string, { data: TravelTips; timestamp: number }> = {};
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface TravelTips {
  destination: string;
  summary: string;
  sections: {
    understand?: string;
    getIn?: string;
    getAround?: string;
    see?: string;
    do?: string;
    buy?: string;
    eat?: string;
    drink?: string;
    sleep?: string;
    staysafe?: string;
    respect?: string;
  };
  source: string;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const destination = searchParams.get('destination');
  const section = searchParams.get('section'); // Optional: get specific section only

  if (!destination) {
    return NextResponse.json({ error: 'destination param required' }, { status: 400 });
  }

  // Check cache
  const cacheKey = destination.toLowerCase();
  if (cache[cacheKey] && Date.now() - cache[cacheKey].timestamp < CACHE_TTL) {
    const cached = cache[cacheKey].data;
    if (section && cached.sections[section as keyof typeof cached.sections]) {
      return NextResponse.json({
        destination: cached.destination,
        content: cached.sections[section as keyof typeof cached.sections],
        section,
        source: cached.source,
      });
    }
    return NextResponse.json(cached);
  }

  try {
    // Search Wikivoyage for the destination
    const searchRes = await fetch(
      `https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(destination)}&format=json&origin=*`,
      { headers: { 'User-Agent': 'Wandr Travel App' } }
    );
    const searchData = await searchRes.json();

    if (!searchData.query?.search?.[0]) {
      return NextResponse.json({ 
        destination,
        summary: null,
        sections: {},
        source: null 
      });
    }

    const pageTitle = searchData.query.search[0].title;

    // Get page content with sections
    const contentRes = await fetch(
      `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections|text&format=json&origin=*`,
      { headers: { 'User-Agent': 'Wandr Travel App' } }
    );
    const contentData = await contentRes.json();

    if (!contentData.parse) {
      return NextResponse.json({ 
        destination,
        summary: null,
        sections: {},
        source: null 
      });
    }

    // Extract sections we care about
    const sections = contentData.parse.sections || [];
    const sectionMap: Record<string, string> = {};
    
    // Map Wikivoyage section names to our keys
    const sectionMapping: Record<string, string> = {
      'understand': 'understand',
      'get in': 'getIn',
      'get around': 'getAround',
      'see': 'see',
      'do': 'do',
      'buy': 'buy',
      'eat': 'eat',
      'drink': 'drink',
      'sleep': 'sleep',
      'stay safe': 'staysafe',
      'respect': 'respect',
      'cope': 'staysafe', // Alternative name
    };

    // Fetch content for relevant sections
    for (const sec of sections) {
      const secName = sec.line?.toLowerCase();
      const mappedKey = sectionMapping[secName];
      
      if (mappedKey && sec.index) {
        try {
          const secRes = await fetch(
            `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${sec.index}&prop=text&format=json&origin=*`,
            { headers: { 'User-Agent': 'Wandr Travel App' } }
          );
          const secData = await secRes.json();
          
          if (secData.parse?.text?.['*']) {
            // Strip HTML tags and clean up
            const text = secData.parse.text['*']
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&amp;/g, '&')
              .replace(/&#\d+;/g, '')
              .trim()
              .substring(0, 1000); // Limit length
            
            if (text.length > 50) {
              sectionMap[mappedKey] = text;
            }
          }
        } catch {
          // Skip failed sections
        }
      }
    }

    // Get summary (first paragraph)
    const summaryRes = await fetch(
      `https://en.wikivoyage.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts&exintro=true&explaintext=true&format=json&origin=*`,
      { headers: { 'User-Agent': 'Wandr Travel App' } }
    );
    const summaryData = await summaryRes.json();
    const pages = summaryData.query?.pages;
    const pageId = pages ? Object.keys(pages)[0] : null;
    const summary = pageId ? pages[pageId]?.extract?.substring(0, 500) : null;

    const result: TravelTips = {
      destination: pageTitle,
      summary: summary || null,
      sections: sectionMap,
      source: `https://en.wikivoyage.org/wiki/${encodeURIComponent(pageTitle)}`,
    };

    cache[cacheKey] = { data: result, timestamp: Date.now() };

    // Return specific section if requested
    if (section && result.sections[section as keyof typeof result.sections]) {
      return NextResponse.json({
        destination: result.destination,
        content: result.sections[section as keyof typeof result.sections],
        section,
        source: result.source,
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[TravelTips] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch travel tips' }, { status: 500 });
  }
}
