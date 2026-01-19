import { NextRequest, NextResponse } from 'next/server';
import { supabasePlaces } from '@/lib/db/supabase';
import { getFromCache, saveToCache } from '@/lib/api/supabase-cache';

// Use server-side env var, fallback to NEXT_PUBLIC_ for backwards compatibility
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: { text: string };
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  googleMapsUri?: string;
  photos?: Array<{ name: string }>;
  primaryType?: string;
  types?: string[];
  priceLevel?: string;
}

interface PlaceSearchResult {
  places?: PlaceResult[];
}

interface RecommendationPlace {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  priceLevel: string;
  category: string;
  tags: string[];
  address: string;
  mapsUrl: string;
  openNow?: boolean;
  hours?: string[];
}

// Category to search query mapping
const CATEGORY_QUERIES: Record<string, string> = {
  attractions: 'top attractions and things to do',
  restaurants: 'best restaurants',
  cafes: 'best cafes and coffee shops',
  nightlife: 'best bars and nightlife',
  shopping: 'best shopping and markets',
  nature: 'parks and nature attractions',
  museums: 'museums and galleries',
  temples: 'temples and religious sites',
};

// Fetch places from Google Places API
async function fetchPlaces(city: string, category: string, limit: number = 20): Promise<PlaceResult[]> {
  // Check Supabase cache first
  if (supabasePlaces.isConfigured()) {
    const placeType = category === 'attractions' ? 'attraction' : category.replace(/s$/, '');
    const cached = await supabasePlaces.getByCity(city, placeType);
    if (cached.length >= Math.min(limit, 10)) {
      console.log(`[Recommendations] Using ${cached.length} cached ${category} for ${city}`);
      return cached.map(c => ({
        id: c.google_place_id,
        displayName: { text: c.name },
        ...c.place_data,
      })) as PlaceResult[];
    }
  }

  if (!GOOGLE_API_KEY) {
    console.error('[Recommendations] Google Maps API key not configured');
    return [];
  }

  const queryPrefix = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.attractions;
  const textQuery = `${queryPrefix} in ${city}`;

  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.editorialSummary,places.currentOpeningHours,places.googleMapsUri,places.photos,places.primaryType,places.types,places.priceLevel',
        },
        body: JSON.stringify({
          textQuery,
          maxResultCount: limit,
          rankPreference: 'RELEVANCE',
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Recommendations] Google Places API error: ${response.status} - ${errorText}`);
      return [];
    }

    const data: PlaceSearchResult = await response.json();
    const places = data.places || [];
    console.log(`[Recommendations] Got ${places.length} ${category} for ${city} from Google Places API`);

    // Cache results in Supabase
    if (supabasePlaces.isConfigured()) {
      const placeType = category === 'attractions' ? 'attraction' : category.replace(/s$/, '');
      for (const place of places) {
        await supabasePlaces.save({
          google_place_id: place.id,
          name: place.displayName?.text || 'Unknown',
          city,
          place_type: placeType,
          place_data: place as unknown as Record<string, unknown>,
          image_url: place.photos?.[0]?.name
            ? `/api/places/photo?ref=${encodeURIComponent(place.photos[0].name)}`
            : null,
        });
      }
    }

    return places;
  } catch (error) {
    console.error('[Recommendations] Error fetching places:', error);
    return [];
  }
}

// Get price level string
function getPriceLevel(priceLevel: string | undefined): string {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE': return 'Free';
    case 'PRICE_LEVEL_INEXPENSIVE': return '$';
    case 'PRICE_LEVEL_MODERATE': return '$$';
    case 'PRICE_LEVEL_EXPENSIVE': return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE': return '$$$$';
    default: return '$$';
  }
}

// Get category from place types
function getCategory(types: string[] | undefined, requestedCategory?: string): string {
  if (requestedCategory && requestedCategory !== 'all') {
    return requestedCategory;
  }
  if (!types) return 'attraction';

  if (types.some(t => t.includes('restaurant') || t.includes('food'))) return 'restaurant';
  if (types.some(t => t.includes('cafe') || t.includes('coffee'))) return 'cafe';
  if (types.some(t => t.includes('bar') || t.includes('night_club'))) return 'nightlife';
  if (types.some(t => t.includes('museum'))) return 'museum';
  if (types.some(t => t.includes('park') || t.includes('nature'))) return 'nature';
  if (types.some(t => t.includes('shopping') || t.includes('store'))) return 'shopping';
  if (types.some(t => t.includes('temple') || t.includes('church') || t.includes('mosque'))) return 'temple';

  return 'attraction';
}

// Get tags from place types
function getTags(types: string[] | undefined): string[] {
  if (!types) return ['attraction'];

  const tagMap: Record<string, string> = {
    'tourist_attraction': 'Must See',
    'museum': 'Museum',
    'temple': 'Temple',
    'church': 'Religious',
    'park': 'Park',
    'restaurant': 'Food',
    'cafe': 'Coffee',
    'bar': 'Nightlife',
    'night_club': 'Nightlife',
    'shopping_mall': 'Shopping',
    'market': 'Market',
    'beach': 'Beach',
    'hiking_area': 'Nature',
    'spa': 'Wellness',
    'art_gallery': 'Art',
    'historical_place': 'Historic',
  };

  const tags: string[] = [];
  for (const type of types.slice(0, 5)) {
    const normalizedType = type.toLowerCase();
    for (const [key, tag] of Object.entries(tagMap)) {
      if (normalizedType.includes(key) && !tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  return tags.length > 0 ? tags.slice(0, 3) : ['attraction'];
}

// Convert Google Place to recommendation format
function convertToRecommendation(place: PlaceResult, category?: string): RecommendationPlace {
  return {
    id: place.id,
    name: place.displayName?.text || 'Unknown Place',
    description: place.editorialSummary?.text || `A popular ${getCategory(place.types, category)} in the area.`,
    imageUrl: place.photos?.[0]?.name
      ? `/api/places/photo?ref=${encodeURIComponent(place.photos[0].name)}`
      : null,
    rating: place.rating || 0,
    reviewCount: place.userRatingCount || 0,
    priceLevel: getPriceLevel(place.priceLevel),
    category: getCategory(place.types, category),
    tags: getTags(place.types),
    address: place.formattedAddress || '',
    mapsUrl: place.googleMapsUri || '',
    openNow: place.currentOpeningHours?.openNow,
    hours: place.currentOpeningHours?.weekdayDescriptions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, category, interests, limit = 20 } = body;

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${city.toLowerCase()}-${category || 'all'}-${(interests || []).sort().join(',')}`;
    const cached = await getFromCache<RecommendationPlace[]>('recommendations', cacheKey);
    if (cached) {
      console.log(`[Recommendations] Returning cached results for ${city}`);
      return NextResponse.json({ places: cached, cached: true });
    }

    // Determine which categories to fetch
    const categoriesToFetch = category && category !== 'all'
      ? [category]
      : ['attractions', 'restaurants', 'cafes'];

    // Fetch places for each category
    const allPlaces: RecommendationPlace[] = [];
    const placesPerCategory = Math.ceil(limit / categoriesToFetch.length);

    for (const cat of categoriesToFetch) {
      const places = await fetchPlaces(city, cat, placesPerCategory);
      const recommendations = places.map(p => convertToRecommendation(p, cat));
      allPlaces.push(...recommendations);
    }

    // Sort by rating and limit
    const sortedPlaces = allPlaces
      .sort((a, b) => (b.rating * Math.log10(b.reviewCount + 1)) - (a.rating * Math.log10(a.reviewCount + 1)))
      .slice(0, limit);

    // Cache results
    if (sortedPlaces.length > 0) {
      await saveToCache('recommendations', cacheKey, sortedPlaces);
    }

    return NextResponse.json({ places: sortedPlaces });
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
