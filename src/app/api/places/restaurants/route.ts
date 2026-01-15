import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export interface RestaurantResult {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceLevel: number; // 1-4 ($-$$$$)
  cuisine: string;
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
  priceLevel?: string;
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
  nextPageToken?: string;
}

// Map price level query params to Google's values
function getPriceLevelFilter(budget: string): string[] {
  switch (budget) {
    case 'budget':
      return ['PRICE_LEVEL_INEXPENSIVE'];
    case 'moderate':
      return ['PRICE_LEVEL_MODERATE'];
    case 'splurge':
      return ['PRICE_LEVEL_EXPENSIVE', 'PRICE_LEVEL_VERY_EXPENSIVE'];
    default:
      return ['PRICE_LEVEL_INEXPENSIVE', 'PRICE_LEVEL_MODERATE', 'PRICE_LEVEL_EXPENSIVE'];
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

function getMealTypeQuery(mealType: string): string {
  switch (mealType) {
    case 'breakfast':
      return 'breakfast brunch cafe';
    case 'lunch':
      return 'lunch restaurant';
    case 'dinner':
      return 'dinner restaurant';
    default:
      return 'restaurant';
  }
}

function extractCuisine(types: string[] | undefined, name: string): string {
  if (!types) return 'Restaurant';

  const cuisineTypes: Record<string, string> = {
    'japanese_restaurant': 'Japanese',
    'thai_restaurant': 'Thai',
    'vietnamese_restaurant': 'Vietnamese',
    'chinese_restaurant': 'Chinese',
    'indian_restaurant': 'Indian',
    'italian_restaurant': 'Italian',
    'french_restaurant': 'French',
    'mexican_restaurant': 'Mexican',
    'american_restaurant': 'American',
    'korean_restaurant': 'Korean',
    'seafood_restaurant': 'Seafood',
    'steakhouse': 'Steakhouse',
    'sushi_restaurant': 'Sushi',
    'ramen_restaurant': 'Ramen',
    'pizza_restaurant': 'Pizza',
    'barbecue_restaurant': 'BBQ',
    'vegetarian_restaurant': 'Vegetarian',
    'vegan_restaurant': 'Vegan',
    'cafe': 'Café',
    'coffee_shop': 'Coffee Shop',
    'bakery': 'Bakery',
    'brunch_restaurant': 'Brunch',
    'fast_food_restaurant': 'Fast Food',
    'fine_dining_restaurant': 'Fine Dining',
  };

  for (const type of types) {
    if (cuisineTypes[type]) {
      return cuisineTypes[type];
    }
  }

  // Try to extract from name
  const cuisineKeywords = ['thai', 'japanese', 'sushi', 'ramen', 'italian', 'french', 'mexican', 'indian', 'chinese', 'korean', 'vietnamese'];
  const nameLower = name.toLowerCase();
  for (const keyword of cuisineKeywords) {
    if (nameLower.includes(keyword)) {
      return keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }
  }

  return 'Restaurant';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const location = searchParams.get('location'); // e.g., "Chiang Mai, Thailand"
  const mealType = searchParams.get('mealType') || 'dinner'; // breakfast, lunch, dinner
  const budget = searchParams.get('budget') || 'moderate'; // budget, moderate, splurge
  const count = parseInt(searchParams.get('count') || '5', 10);
  const minRating = parseFloat(searchParams.get('minRating') || '0'); // 0-5, e.g., 4.5
  const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, rating, reviews

  if (!location) {
    return NextResponse.json({ error: 'Location parameter is required' }, { status: 400 });
  }

  if (!GOOGLE_API_KEY) {
    return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 });
  }

  try {
    const mealQuery = getMealTypeQuery(mealType);
    const priceFilters = getPriceLevelFilter(budget);

    // Build multiple search queries to get more diverse results
    // Google Places API searchText max is 20 results per query
    const searchQueries = [
      `best ${mealQuery} in ${location}`,
      `top rated ${mealQuery} restaurants ${location}`,
      `popular ${mealQuery} spots ${location}`,
      `recommended ${mealQuery} places ${location}`,
      `highly reviewed ${mealQuery} ${location}`,
    ];

    // Use a Set to track unique place IDs
    const seenIds = new Set<string>();
    const allPlaces: PlaceResult[] = [];

    // Fetch from multiple queries in parallel
    const searchPromises = searchQueries.slice(0, Math.ceil(count / 20)).map(async (textQuery) => {
      try {
        const searchResponse = await fetchWithTimeout(
          'https://places.googleapis.com/v1/places:searchText',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': GOOGLE_API_KEY,
              'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.currentOpeningHours,places.googleMapsUri,places.photos,places.primaryType,places.types',
            },
            body: JSON.stringify({
              textQuery,
              maxResultCount: 20,
              includedType: 'restaurant',
              rankPreference: 'RELEVANCE',
            }),
          },
          15000
        );

        if (!searchResponse.ok) {
          console.error('Google Places API error for query:', textQuery);
          return [];
        }

        const searchData: PlaceSearchResult = await searchResponse.json();
        return searchData.places || [];
      } catch (err) {
        console.error('Error fetching:', textQuery, err);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);

    // Combine results, removing duplicates
    for (const places of results) {
      for (const place of places) {
        if (!seenIds.has(place.id)) {
          seenIds.add(place.id);
          allPlaces.push(place);
        }
      }
    }

    if (allPlaces.length === 0) {
      return NextResponse.json({ restaurants: [], message: 'No restaurants found' });
    }

    // Filter by price level and minimum rating, then map results
    const restaurants: RestaurantResult[] = allPlaces
      .filter((place) => {
        // Filter by minimum rating if specified
        if (minRating > 0 && (place.rating || 0) < minRating) {
          return false;
        }
        // If no price level, include it (better than nothing)
        if (!place.priceLevel) return true;
        return priceFilters.includes(place.priceLevel);
      })
      .map((place) => {
        let photoUrl: string | undefined;
        if (place.photos && place.photos.length > 0) {
          photoUrl = `https://places.googleapis.com/v1/${place.photos[0].name}/media?maxHeightPx=200&maxWidthPx=300&key=${GOOGLE_API_KEY}`;
        }

        return {
          id: place.id,
          name: place.displayName?.text || 'Unknown',
          address: place.formattedAddress || '',
          rating: place.rating || 0,
          reviewCount: place.userRatingCount || 0,
          priceLevel: place.priceLevel ? parsePriceLevel(place.priceLevel) : 2,
          cuisine: extractCuisine(place.types, place.displayName?.text || ''),
          mapsUrl: place.googleMapsUri || '',
          photoUrl,
          isOpen: place.currentOpeningHours?.openNow,
          openingHours: place.currentOpeningHours?.weekdayDescriptions,
        };
      });

    // Sort based on user preference
    restaurants.sort((a, b) => {
      switch (sortBy) {
        case 'reviews':
          // Sort by review count (most reviews first)
          return b.reviewCount - a.reviewCount;
        case 'rating':
          // Sort by rating (highest first), with review count as tiebreaker
          if (b.rating !== a.rating) return b.rating - a.rating;
          return b.reviewCount - a.reviewCount;
        case 'relevance':
        default:
          // Combined score: rating weighted by log of review count
          const scoreA = a.rating * Math.log10(a.reviewCount + 1);
          const scoreB = b.rating * Math.log10(b.reviewCount + 1);
          return scoreB - scoreA;
      }
    });

    // Slice after sorting to get top results
    const limitedRestaurants = restaurants.slice(0, count);

    return NextResponse.json({
      restaurants: limitedRestaurants,
      query: { location, mealType, budget, minRating, sortBy },
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
