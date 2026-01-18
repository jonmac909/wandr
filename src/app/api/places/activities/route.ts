import { NextRequest, NextResponse } from 'next/server';
import { supabasePlaces } from '@/lib/db/supabase';

// Use server-side env var, fallback to NEXT_PUBLIC_ for backwards compatibility
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface ActivityResult {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  description: string;
  type: string;
  mapsUrl: string;
  photoUrl?: string;
  isOpen?: boolean;
  openingHours?: string[];
}

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
}

interface PlaceSearchResult {
  places?: PlaceResult[];
}

function getActivityType(types: string[] | undefined): string {
  if (!types) return 'Attraction';

  const typeMap: Record<string, string> = {
    'tourist_attraction': 'Attraction',
    'museum': 'Museum',
    'art_gallery': 'Art Gallery',
    'park': 'Park',
    'national_park': 'National Park',
    'historical_landmark': 'Historical Site',
    'temple': 'Temple',
    'church': 'Church',
    'mosque': 'Mosque',
    'zoo': 'Zoo',
    'aquarium': 'Aquarium',
    'amusement_park': 'Theme Park',
    'beach': 'Beach',
    'hiking_area': 'Hiking',
    'shopping_mall': 'Shopping',
    'night_club': 'Nightlife',
    'spa': 'Spa',
    'stadium': 'Stadium',
    'casino': 'Casino',
    'botanical_garden': 'Garden',
  };

  for (const type of types) {
    if (typeMap[type]) {
      return typeMap[type];
    }
  }

  return 'Attraction';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city');
  const type = searchParams.get('type') || 'attraction'; // attraction, restaurant, cafe, etc.
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!city) {
    return NextResponse.json({ error: 'City parameter is required' }, { status: 400 });
  }

  // Check Supabase cache first
  if (supabasePlaces.isConfigured()) {
    const cachedPlaces = await supabasePlaces.getByCity(city, type);
    if (cachedPlaces.length > 0) {
      console.log(`[Activities] Returning ${cachedPlaces.length} cached ${type}s for ${city}`);
      return NextResponse.json({
        activities: cachedPlaces.slice(0, limit).map(p => ({
          ...p.place_data,
          id: p.google_place_id,
          photoUrl: p.image_url,
        })),
        cached: true,
      });
    }
  }

  // Not in cache, fetch from Google Places
  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    const includedType = type === 'attraction' ? 'tourist_attraction' : type;
    const textQuery = type === 'restaurant'
      ? `best restaurants in ${city}`
      : `top ${type}s and things to do in ${city}`;

    const searchResponse = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.editorialSummary,places.currentOpeningHours,places.googleMapsUri,places.photos,places.primaryType,places.types',
        },
        body: JSON.stringify({
          textQuery,
          maxResultCount: Math.min(limit * 2, 20), // Fetch a bit more to filter
          includedType: includedType !== 'attraction' ? includedType : undefined,
          rankPreference: 'RELEVANCE',
        }),
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Google Places API error:', errorText);
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
    }

    const searchData: PlaceSearchResult = await searchResponse.json();
    const places = searchData.places || [];

    if (places.length === 0) {
      return NextResponse.json({ activities: [], message: 'No activities found' });
    }

    // Map and cache results
    const activities: ActivityResult[] = [];

    for (const place of places.slice(0, limit)) {
      // Build photo URL (we'll proxy this in production)
      let photoUrl: string | undefined;
      if (place.photos && place.photos.length > 0) {
        // Use internal proxy to avoid exposing API key
        photoUrl = `/api/places/photo?ref=${encodeURIComponent(place.photos[0].name)}`;
      }

      const activity: ActivityResult = {
        id: place.id,
        name: place.displayName?.text || 'Unknown',
        address: place.formattedAddress || '',
        rating: place.rating || 0,
        reviewCount: place.userRatingCount || 0,
        description: place.editorialSummary?.text || `Popular ${getActivityType(place.types).toLowerCase()} in ${city}`,
        type: getActivityType(place.types),
        mapsUrl: place.googleMapsUri || '',
        photoUrl,
        isOpen: place.currentOpeningHours?.openNow,
        openingHours: place.currentOpeningHours?.weekdayDescriptions,
      };

      activities.push(activity);

      // Cache in Supabase
      if (supabasePlaces.isConfigured()) {
        await supabasePlaces.save({
          google_place_id: place.id,
          name: activity.name,
          city,
          place_type: type,
          place_data: activity as unknown as Record<string, unknown>,
          image_url: photoUrl || null,
        });
      }
    }

    // Sort by rating * log(reviews) for quality
    activities.sort((a, b) => {
      const scoreA = a.rating * Math.log10(a.reviewCount + 1);
      const scoreB = b.rating * Math.log10(b.reviewCount + 1);
      return scoreB - scoreA;
    });

    return NextResponse.json({
      activities,
      cached: false,
      query: { city, type, limit },
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
