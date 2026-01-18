import { NextRequest, NextResponse } from 'next/server';
import { supabasePlaces } from '@/lib/db/supabase';

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

// Fetch places from Google Places API or cache
async function fetchPlacesForCity(city: string, type: string, limit: number = 20): Promise<PlaceResult[]> {
  // Check cache first
  if (supabasePlaces.isConfigured()) {
    const cached = await supabasePlaces.getByCity(city, type);
    if (cached.length >= limit) {
      console.log(`[GenerateItinerary] Using ${cached.length} cached ${type}s for ${city}`);
      return cached.map(c => ({
        id: c.google_place_id,
        displayName: { text: c.name },
        ...c.place_data,
      })) as PlaceResult[];
    }
  }

  if (!GOOGLE_API_KEY) {
    console.error('[GenerateItinerary] Google Maps API key not configured. Set GOOGLE_MAPS_API_KEY or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
    return [];
  }

  const textQuery = type === 'restaurant'
    ? `best restaurants in ${city}`
    : type === 'cafe'
    ? `best cafes and coffee shops in ${city}`
    : `top attractions and things to do in ${city}`;

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
      console.error(`[GenerateItinerary] Google Places API error for ${city} (${type}): ${response.status} - ${errorText}`);
      return [];
    }

    const data: PlaceSearchResult = await response.json();
    const places = data.places || [];

    // Cache results
    if (supabasePlaces.isConfigured()) {
      for (const place of places) {
        await supabasePlaces.save({
          google_place_id: place.id,
          name: place.displayName?.text || 'Unknown',
          city,
          place_type: type,
          place_data: place as unknown as Record<string, unknown>,
          image_url: place.photos?.[0]?.name
            ? `/api/places/photo?ref=${encodeURIComponent(place.photos[0].name)}`
            : null,
        });
      }
    }

    return places;
  } catch (error) {
    console.error('Error fetching places:', error);
    return [];
  }
}

// Convert Google place type to activity type
function getActivityType(types: string[] | undefined): 'attraction' | 'restaurant' | 'activity' {
  if (!types) return 'attraction';

  const restaurantTypes = ['restaurant', 'food', 'cafe', 'bakery', 'bar'];
  if (types.some(t => restaurantTypes.some(rt => t.includes(rt)))) {
    return 'restaurant';
  }

  return 'attraction';
}

// Get price range from Google price level
function getPriceRange(priceLevel: string | undefined): '$' | '$$' | '$$$' {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$';
    default:
      return '$$';
  }
}

// Get tags from Google place types
function getTags(types: string[] | undefined): string[] {
  if (!types) return ['attraction'];

  const tagMap: Record<string, string> = {
    'tourist_attraction': 'attraction',
    'museum': 'museum',
    'temple': 'temple',
    'church': 'church',
    'park': 'park',
    'restaurant': 'food',
    'cafe': 'coffee',
    'bar': 'nightlife',
    'shopping_mall': 'shopping',
    'beach': 'beach',
    'hiking_area': 'nature',
    'spa': 'wellness',
    'art_gallery': 'art',
    'historical_landmark': 'history',
  };

  const tags: string[] = [];
  for (const type of types) {
    if (tagMap[type]) {
      tags.push(tagMap[type]);
    }
  }

  return tags.length > 0 ? tags.slice(0, 4) : ['attraction'];
}

// Build itinerary from Google Places data
function buildItinerary(
  attractions: PlaceResult[],
  restaurants: PlaceResult[],
  nights: number,
  city: string,
  tripStyle: string
) {
  const activitiesPerDay = tripStyle === 'relaxed' ? 3 : tripStyle === 'packed' ? 5 : 4;
  const days = [];

  // Shuffle arrays for variety
  const shuffledAttractions = [...attractions].sort(() => Math.random() - 0.5);
  const shuffledRestaurants = [...restaurants].sort(() => Math.random() - 0.5);

  let attractionIndex = 0;
  let restaurantIndex = 0;

  const dayThemes = [
    'City Highlights',
    'Cultural Exploration',
    'Local Flavors',
    'Hidden Gems',
    'Scenic Views',
    'Markets & Shopping',
    'Historic District',
    'Nature & Parks',
  ];

  for (let dayNum = 1; dayNum <= nights; dayNum++) {
    const dayActivities = [];
    const startHour = tripStyle === 'relaxed' ? 10 : 9;
    let currentHour = startHour;

    // Add activities for the day
    for (let i = 0; i < activitiesPerDay; i++) {
      // Alternate between attractions and restaurants
      const isRestaurant = i === 1 || i === activitiesPerDay - 1; // Lunch and dinner spots
      const place = isRestaurant
        ? shuffledRestaurants[restaurantIndex++ % shuffledRestaurants.length]
        : shuffledAttractions[attractionIndex++ % shuffledAttractions.length];

      if (!place) continue;

      const duration = isRestaurant ? 60 : 90;
      const suggestedTime = `${String(currentHour).padStart(2, '0')}:00`;

      // Only include places that have photos from Google
      const photoRef = place.photos?.[0]?.name;
      if (!photoRef) {
        console.log(`[GenerateItinerary] Skipping ${place.displayName?.text} - no photos available`);
        continue;
      }

      dayActivities.push({
        id: `${city.toLowerCase().replace(/\s+/g, '-')}-day${dayNum}-${i}-${Date.now()}`,
        name: place.displayName?.text || 'Unknown Place',
        type: getActivityType(place.types),
        description: place.editorialSummary?.text || `Popular ${getActivityType(place.types)} in ${city}`,
        suggestedTime,
        duration,
        openingHours: place.currentOpeningHours?.weekdayDescriptions?.[0] || '9AM-9PM',
        neighborhood: place.formattedAddress?.split(',')[1]?.trim() || city,
        priceRange: getPriceRange(place.priceLevel),
        tags: getTags(place.types),
        walkingTimeToNext: 15,
        imageUrl: `/api/places/photo?ref=${encodeURIComponent(photoRef)}`,
        rating: place.rating || 4.5,
        reviewCount: place.userRatingCount || 100,
        mapsUrl: place.googleMapsUri || '',
        matchScore: 85 + Math.floor(Math.random() * 15),
        matchReasons: ['Highly rated', 'Popular with travelers'],
      });

      currentHour += Math.ceil(duration / 60) + 1; // Add travel time
    }

    days.push({
      dayNumber: dayNum,
      theme: dayThemes[(dayNum - 1) % dayThemes.length],
      activities: dayActivities,
    });
  }

  return { days };
}

export async function POST(request: NextRequest) {
  try {
    const { city, nights, country, tripStyle } = await request.json();

    if (!city || !nights) {
      return NextResponse.json(
        { error: 'City and nights are required' },
        { status: 400 }
      );
    }

    const searchCity = country ? `${city}, ${country}` : city;

    // Fetch attractions and restaurants in parallel
    const [attractions, restaurants] = await Promise.all([
      fetchPlacesForCity(searchCity, 'attraction', 20),
      fetchPlacesForCity(searchCity, 'restaurant', 10),
    ]);

    if (attractions.length === 0 && restaurants.length === 0) {
      return NextResponse.json(
        { error: 'Could not find places for this city' },
        { status: 404 }
      );
    }

    // Build itinerary from real places
    const itinerary = buildItinerary(
      attractions,
      restaurants,
      nights,
      city,
      tripStyle || 'balanced'
    );

    console.log(`[GenerateItinerary] Generated ${nights}-day itinerary for ${city} with ${attractions.length} attractions and ${restaurants.length} restaurants`);

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}
