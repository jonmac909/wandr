import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface ExtractedPlace {
  name: string;
  city?: string;
  googlePlace?: {
    placeId: string;
    name: string;
    address: string;
    rating?: number;
    imageUrl?: string;
    types?: string[];
    location?: { lat: number; lng: number };
  };
}

// Fetch caption from TikTok URL using oEmbed
async function fetchTikTokCaption(url: string): Promise<string | null> {
  try {
    // Expand shortened URLs (vt.tiktok.com)
    let finalUrl = url;
    if (url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')) {
      const response = await fetch(url, { redirect: 'follow' });
      finalUrl = response.url;
    }
    
    // Use TikTok oEmbed API
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(finalUrl)}`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.title || null; // Title contains the caption
  } catch (error) {
    console.error('TikTok fetch error:', error);
    return null;
  }
}

// Fetch caption from Instagram URL
async function fetchInstagramCaption(url: string): Promise<string | null> {
  try {
    // Instagram oEmbed requires access token, so we'll try basic fetch
    // This may not work due to restrictions, but worth trying
    const oembedUrl = `https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.title || null;
  } catch (error) {
    console.error('Instagram fetch error:', error);
    return null;
  }
}

// Detect if input is a URL and fetch caption
async function getCaption(input: string): Promise<{ caption: string; source: 'tiktok' | 'instagram' | 'text' }> {
  const trimmed = input.trim();
  
  // Check if it's a TikTok URL
  if (trimmed.includes('tiktok.com') || trimmed.includes('vt.tiktok.com') || trimmed.includes('vm.tiktok.com')) {
    const caption = await fetchTikTokCaption(trimmed);
    if (caption) {
      return { caption, source: 'tiktok' };
    }
  }
  
  // Check if it's an Instagram URL
  if (trimmed.includes('instagram.com')) {
    const caption = await fetchInstagramCaption(trimmed);
    if (caption) {
      return { caption, source: 'instagram' };
    }
  }
  
  // Otherwise treat as raw caption text
  return { caption: trimmed, source: 'text' };
}

// Extract place names from caption text
function extractPlaceNames(caption: string): string[] {
  const places: string[] = [];
  
  // Pattern 1: Numbered lists (1. Place Name, 2. Place Name)
  const numberedPattern = /(?:^|\n)\s*(?:\d+[\.\)\-\:]?\s*)([A-Z][^,\n\d]{2,50})/gm;
  let match;
  while ((match = numberedPattern.exec(caption)) !== null) {
    const place = match[1].trim();
    if (place.length > 2 && !isCommonWord(place)) {
      places.push(place);
    }
  }
  
  // Pattern 2: After emojis like 📍🏛️🍜 (📍 Place Name)
  const emojiPattern = /[📍🏛️🍜🍽️🏖️⛩️🛕🏰🎡🌊🏔️☕🍸🛍️]\s*([A-Z][^,\n📍🏛️🍜🍽️🏖️⛩️🛕🏰🎡🌊🏔️☕🍸🛍️]{2,50})/g;
  while ((match = emojiPattern.exec(caption)) !== null) {
    const place = match[1].trim();
    if (place.length > 2 && !isCommonWord(place) && !places.includes(place)) {
      places.push(place);
    }
  }
  
  // Pattern 3: Bullet points (• Place Name, - Place Name, * Place Name)
  const bulletPattern = /(?:^|\n)\s*[•\-\*]\s*([A-Z][^,\n•\-\*]{2,50})/gm;
  while ((match = bulletPattern.exec(caption)) !== null) {
    const place = match[1].trim();
    if (place.length > 2 && !isCommonWord(place) && !places.includes(place)) {
      places.push(place);
    }
  }
  
  // Pattern 4: "at [Place Name]" or "@ [Place Name]"
  const atPattern = /(?:at|@)\s+([A-Z][A-Za-z\s&']{2,40})/gi;
  while ((match = atPattern.exec(caption)) !== null) {
    const place = match[1].trim();
    if (place.length > 2 && !isCommonWord(place) && !places.includes(place)) {
      places.push(place);
    }
  }
  
  // Pattern 5: Hashtags that look like places (#WatArun #GrandPalace)
  const hashtagPattern = /#([A-Z][a-z]+(?:[A-Z][a-z]+)+)/g;
  while ((match = hashtagPattern.exec(caption)) !== null) {
    // Convert CamelCase to spaces: WatArun -> Wat Arun
    const place = match[1].replace(/([a-z])([A-Z])/g, '$1 $2');
    if (place.length > 2 && !isCommonWord(place) && !places.includes(place)) {
      places.push(place);
    }
  }
  
  return places.slice(0, 10); // Limit to 10 places
}

// Common words to filter out
function isCommonWord(text: string): boolean {
  const commonWords = [
    'the', 'and', 'but', 'for', 'best', 'top', 'must', 'visit', 'see', 'day', 'trip',
    'travel', 'guide', 'tips', 'things', 'places', 'spot', 'spots', 'location',
    'thailand', 'japan', 'vietnam', 'indonesia', 'malaysia', 'singapore', 'korea',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'morning', 'afternoon', 'evening', 'night', 'day', 'week', 'month',
    'part', 'episode', 'vlog', 'video', 'follow', 'like', 'share', 'save',
  ];
  return commonWords.includes(text.toLowerCase());
}

// Detect city/country from caption
function detectLocation(caption: string): string | null {
  // Common city patterns
  const cityPatterns = [
    /in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /([A-Z][a-z]+)\s+(?:travel|trip|guide|vlog)/i,
    /#([A-Z][a-z]+)(?:travel|trip|guide|food)/i,
  ];
  
  for (const pattern of cityPatterns) {
    const match = caption.match(pattern);
    if (match) {
      const city = match[1].trim();
      if (!isCommonWord(city) && city.length > 2) {
        return city;
      }
    }
  }
  
  // Check for known cities
  const knownCities = [
    'Bangkok', 'Chiang Mai', 'Phuket', 'Tokyo', 'Kyoto', 'Osaka',
    'Seoul', 'Busan', 'Singapore', 'Bali', 'Jakarta', 'Hanoi',
    'Ho Chi Minh', 'Da Nang', 'Kuala Lumpur', 'Penang', 'Edinburgh',
    'London', 'Paris', 'Rome', 'Barcelona', 'New York', 'Los Angeles',
  ];
  
  for (const city of knownCities) {
    if (caption.toLowerCase().includes(city.toLowerCase())) {
      return city;
    }
  }
  
  return null;
}

// Look up place via Google Places API
async function lookupPlace(placeName: string, city?: string): Promise<ExtractedPlace['googlePlace'] | null> {
  if (!GOOGLE_API_KEY) return null;
  
  try {
    const query = city ? `${placeName} ${city}` : placeName;
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.results || data.results.length === 0) return null;
    
    const place = data.results[0];
    
    // Get photo URL if available
    let imageUrl: string | undefined;
    if (place.photos && place.photos[0]) {
      imageUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`;
    }
    
    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      imageUrl,
      types: place.types,
      location: place.geometry?.location,
    };
  } catch (error) {
    console.error('Google Places lookup failed:', error);
    return null;
  }
}

// Determine place type from Google types
function getPlaceType(types?: string[]): string {
  if (!types) return 'attraction';
  
  if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
  if (types.includes('cafe')) return 'cafe';
  if (types.includes('bar') || types.includes('night_club')) return 'bar';
  if (types.includes('lodging')) return 'hotel';
  if (types.includes('museum')) return 'museum';
  if (types.includes('place_of_worship') || types.includes('hindu_temple') || types.includes('church')) return 'temple';
  if (types.includes('park') || types.includes('natural_feature')) return 'nature';
  if (types.includes('shopping_mall') || types.includes('store')) return 'shopping';
  
  return 'attraction';
}

export async function POST(request: NextRequest) {
  try {
    const { caption: input } = await request.json();
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'Caption text or URL is required' }, { status: 400 });
    }
    
    // Get caption (either from URL or use as-is)
    const { caption, source } = await getCaption(input);
    
    if (!caption) {
      return NextResponse.json({ 
        error: 'Could not fetch caption from URL. Try pasting the caption text directly.',
        places: [] 
      }, { status: 200 });
    }
    
    console.log(`[ParseCaption] Source: ${source}, Caption: ${caption.substring(0, 100)}...`);
    
    // Extract place names
    const placeNames = extractPlaceNames(caption);
    
    if (placeNames.length === 0) {
      return NextResponse.json({ 
        error: 'No places found in caption. Try pasting text with numbered lists or place names.',
        places: [] 
      }, { status: 200 });
    }
    
    // Detect city context
    const detectedCity = detectLocation(caption);
    
    // Look up each place
    const results: Array<{
      name: string;
      city: string;
      type: string;
      address?: string;
      rating?: number;
      imageUrl?: string;
      placeId?: string;
      location?: { lat: number; lng: number };
    }> = [];
    
    for (const placeName of placeNames) {
      const googlePlace = await lookupPlace(placeName, detectedCity || undefined);
      
      if (googlePlace) {
        results.push({
          name: googlePlace.name,
          city: detectedCity || extractCityFromAddress(googlePlace.address),
          type: getPlaceType(googlePlace.types),
          address: googlePlace.address,
          rating: googlePlace.rating,
          imageUrl: googlePlace.imageUrl,
          placeId: googlePlace.placeId,
          location: googlePlace.location,
        });
      }
    }
    
    return NextResponse.json({
      source,
      caption: caption.substring(0, 200) + (caption.length > 200 ? '...' : ''),
      detectedCity,
      extractedNames: placeNames,
      places: results,
    });
    
  } catch (error) {
    console.error('Parse caption error:', error);
    return NextResponse.json({ error: 'Failed to parse caption' }, { status: 500 });
  }
}

// Extract city from address string
function extractCityFromAddress(address: string): string {
  // Try to get city from address (usually after first comma)
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return 'Unknown';
}
