import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface PlaceSearchResult {
  places?: Array<{
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    priceLevel?: string;
    currentOpeningHours?: {
      openNow?: boolean;
      weekdayDescriptions?: string[];
    };
    nationalPhoneNumber?: string;
    websiteUri?: string;
    googleMapsUri?: string;
    photos?: Array<{ name: string }>;
    reviews?: Array<{
      authorAttribution?: { displayName: string; photoUri?: string };
      rating?: number;
      text?: { text: string };
      publishTime?: string;
    }>;
    types?: string[];
    location?: { latitude: number; longitude: number };
  }>;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    // Use Places API (New) - Text Search
    const searchResponse = await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.photos,places.reviews,places.types,places.location',
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 1,
        }),
      },
      15000
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Google Places API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to search for place' },
        { status: searchResponse.status }
      );
    }

    const searchData: PlaceSearchResult = await searchResponse.json();

    if (!searchData.places || searchData.places.length === 0) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const place = searchData.places[0];

    // Fetch photos if available
    const photos: { url: string; attribution?: string }[] = [];
    if (place.photos && place.photos.length > 0) {
      // Get up to 5 photos
      for (const photo of place.photos.slice(0, 5)) {
        const photoUrl = `https://places.googleapis.com/v1/${photo.name}/media?maxHeightPx=400&maxWidthPx=600&key=${GOOGLE_API_KEY}`;
        photos.push({ url: photoUrl });
      }
    }

    // Format the response
    const result = {
      name: place.displayName?.text || query,
      formatted_address: place.formattedAddress,
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      price_level: place.priceLevel ? parsePriceLevel(place.priceLevel) : undefined,
      opening_hours: place.currentOpeningHours
        ? {
            open_now: place.currentOpeningHours.openNow,
            weekday_text: place.currentOpeningHours.weekdayDescriptions,
          }
        : undefined,
      formatted_phone_number: place.nationalPhoneNumber,
      website: place.websiteUri,
      url: place.googleMapsUri,
      photos,
      reviews: place.reviews?.map((review) => ({
        author_name: review.authorAttribution?.displayName || 'Anonymous',
        rating: review.rating || 0,
        text: review.text?.text || '',
        time: review.publishTime ? Math.floor(new Date(review.publishTime).getTime() / 1000) : 0,
        profile_photo_url: review.authorAttribution?.photoUri,
      })),
      types: place.types,
      geometry: place.location
        ? {
            location: {
              lat: place.location.latitude,
              lng: place.location.longitude,
            },
          }
        : undefined,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching place details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parsePriceLevel(priceLevel: string): number {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
      return 0;
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    default:
      return 2;
  }
}
