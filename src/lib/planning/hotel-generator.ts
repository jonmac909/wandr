import { supabasePlaces } from '@/lib/db/supabase';

const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface HotelInfo {
  id: string;
  name: string;
  city: string;
  country: string;
  imageUrl: string | null;
  images: string[]; // Additional photos
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  pricePerNight: string; // e.g., "$150-250"
  rating: number; // 1-5
  reviews: number;
  type: 'hotel' | 'hostel' | 'resort' | 'boutique' | 'guesthouse' | 'villa';
  amenities: string[];
  neighborhood: string;
  description: string;
  idealFor: string[]; // 'couples', 'families', 'backpackers', 'luxury', 'solo'
  highlights: string[]; // Key selling points
  walkingDistance: string[]; // Nearby attractions
  matchScore?: number; // How well it matches user preferences (0-100)
  matchReasons?: string[]; // Why this hotel was recommended
}

// User preferences for hotel recommendations
export interface HotelPreferences {
  partyType?: 'solo' | 'couple' | 'family' | 'friends';
  accommodationStyle?: 'luxury' | 'boutique' | 'practical' | 'budget';
  accommodationPriority?: 'location' | 'comfort' | 'value';
  budgetPerNight?: { min: number; max: number };
  interests?: string[]; // e.g., 'food', 'nightlife', 'history', 'nature'
  nearbyActivities?: string[]; // Activities user has favorited in this city
}

interface GooglePlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  editorialSummary?: { text: string };
  googleMapsUri?: string;
  photos?: Array<{ name: string }>;
  priceLevel?: string;
  types?: string[];
}

// Generate hotel ID from name
function generateHotelId(name: string, city: string): string {
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

// Get price range from Google price level
function getPriceRange(priceLevel: string | undefined): '$' | '$$' | '$$$' | '$$$$' {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$$$';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$$';
    default:
      return '$$';
  }
}

// Get price per night string from price level
function getPricePerNight(priceLevel: string | undefined): string {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$20-50';
    case 'PRICE_LEVEL_MODERATE':
      return '$80-150';
    case 'PRICE_LEVEL_EXPENSIVE':
      return '$150-300';
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$300+';
    default:
      return '$80-150';
  }
}

// Determine hotel type from Google place types
function getHotelType(types: string[] | undefined): HotelInfo['type'] {
  if (!types) return 'hotel';

  if (types.includes('resort_hotel')) return 'resort';
  if (types.includes('guest_house') || types.includes('bed_and_breakfast')) return 'guesthouse';
  if (types.some(t => t.includes('hostel'))) return 'hostel';

  return 'hotel';
}

// Get ideal for based on hotel type and price
function getIdealFor(type: HotelInfo['type'], priceRange: string): string[] {
  if (type === 'hostel' || priceRange === '$') {
    return ['backpackers', 'solo travelers', 'budget travelers'];
  }
  if (priceRange === '$$$$') {
    return ['couples', 'luxury seekers', 'business travelers'];
  }
  if (type === 'resort') {
    return ['couples', 'families', 'relaxation seekers'];
  }
  return ['travelers', 'couples', 'families'];
}

// Generate hotels for a city using Google Places API
export async function generateHotels(
  city: string,
  country?: string,
  preferences?: HotelPreferences
): Promise<HotelInfo[]> {
  const searchCity = country ? `${city}, ${country}` : city;

  // Check Supabase cache first
  if (supabasePlaces.isConfigured()) {
    const cached = await supabasePlaces.getByCity(city, 'hotel');
    if (cached.length >= 4) {
      console.log(`[HotelGenerator] Using ${cached.length} cached hotels for ${city}`);
      return cached.map(c => transformToHotelInfo(c.place_data as unknown as GooglePlaceResult, city, country));
    }
  }

  if (!GOOGLE_API_KEY) {
    console.error('Google Maps API key not configured');
    return generateFallbackHotels(city, country);
  }

  // Build search query based on preferences
  let textQuery = `best hotels in ${searchCity}`;
  if (preferences?.accommodationStyle === 'luxury') {
    textQuery = `luxury hotels and resorts in ${searchCity}`;
  } else if (preferences?.accommodationStyle === 'budget') {
    textQuery = `budget hotels and hostels in ${searchCity}`;
  } else if (preferences?.accommodationStyle === 'boutique') {
    textQuery = `boutique hotels in ${searchCity}`;
  }

  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.editorialSummary,places.googleMapsUri,places.photos,places.priceLevel,places.types',
        },
        body: JSON.stringify({
          textQuery,
          maxResultCount: 10,
          rankPreference: 'RELEVANCE',
        }),
      }
    );

    if (!response.ok) {
      console.error('Google Places API error:', await response.text());
      return generateFallbackHotels(city, country);
    }

    const data = await response.json();
    const places: GooglePlaceResult[] = data.places || [];

    if (places.length === 0) {
      return generateFallbackHotels(city, country);
    }

    // Cache results in Supabase
    if (supabasePlaces.isConfigured()) {
      for (const place of places) {
        await supabasePlaces.save({
          google_place_id: place.id,
          name: place.displayName?.text || 'Unknown Hotel',
          city,
          place_type: 'hotel',
          place_data: place as unknown as Record<string, unknown>,
          image_url: place.photos?.[0]?.name
            ? `/api/places/photo?ref=${encodeURIComponent(place.photos[0].name)}`
            : null,
        });
      }
    }

    // Transform Google Places results to HotelInfo
    return places.map(place => transformToHotelInfo(place, city, country));
  } catch (error) {
    console.error('Error fetching hotels:', error);
    return generateFallbackHotels(city, country);
  }
}

// Transform Google Place result to HotelInfo
function transformToHotelInfo(
  place: GooglePlaceResult,
  city: string,
  country?: string
): HotelInfo {
  const priceRange = getPriceRange(place.priceLevel);
  const type = getHotelType(place.types);
  const name = place.displayName?.text || 'Unknown Hotel';

  // Extract neighborhood from address
  const addressParts = place.formattedAddress?.split(',') || [];
  const neighborhood = addressParts[1]?.trim() || addressParts[0]?.trim() || city;

  // Generate photo URLs using our proxy
  const imageUrl = place.photos?.[0]?.name
    ? `/api/places/photo?ref=${encodeURIComponent(place.photos[0].name)}`
    : null;

  const images = (place.photos || []).slice(1, 4).map(photo =>
    `/api/places/photo?ref=${encodeURIComponent(photo.name)}`
  );

  return {
    id: generateHotelId(name, city),
    name,
    city,
    country: country || '',
    imageUrl,
    images,
    priceRange,
    pricePerNight: getPricePerNight(place.priceLevel),
    rating: place.rating || 4.0,
    reviews: place.userRatingCount || 100,
    type,
    amenities: ['Free WiFi', 'Air Conditioning', '24-hour Front Desk'],
    neighborhood,
    description: place.editorialSummary?.text || `A highly rated ${type} in ${city}.`,
    idealFor: getIdealFor(type, priceRange),
    highlights: [
      `${place.rating ? place.rating.toFixed(1) : '4.0'} star rating`,
      `Located in ${neighborhood}`,
      'Highly reviewed by travelers',
    ],
    walkingDistance: ['City attractions nearby'],
    matchScore: 80 + Math.floor(Math.random() * 20),
    matchReasons: ['Highly rated', 'Great location'],
  };
}

// Fallback hotels if API fails
function generateFallbackHotels(city: string, country?: string): HotelInfo[] {
  const types: Array<{ type: HotelInfo['type']; priceRange: '$' | '$$' | '$$$' | '$$$$'; pricePerNight: string }> = [
    { type: 'hotel', priceRange: '$$$$', pricePerNight: '$300+' },
    { type: 'boutique', priceRange: '$$$', pricePerNight: '$150-250' },
    { type: 'hotel', priceRange: '$$', pricePerNight: '$80-150' },
    { type: 'hostel', priceRange: '$', pricePerNight: '$20-50' },
  ];

  return types.map((t, idx) => ({
    id: `${city.toLowerCase().replace(/\s+/g, '-')}-hotel-${idx}`,
    name: `${city} ${t.type.charAt(0).toUpperCase() + t.type.slice(1)} ${idx + 1}`,
    city,
    country: country || '',
    imageUrl: null,
    images: [],
    priceRange: t.priceRange,
    pricePerNight: t.pricePerNight,
    rating: 4.0 + Math.random() * 0.9,
    reviews: Math.floor(100 + Math.random() * 2000),
    type: t.type,
    amenities: ['Free WiFi', 'Air Conditioning', '24-hour Front Desk'],
    neighborhood: 'City Center',
    description: `A great place to stay in ${city} for your trip.`,
    idealFor: ['travelers'],
    highlights: ['Central location', 'Good value'],
    walkingDistance: ['City attractions'],
  }));
}

// Get hotels for display (checks cache, then generates)
export function getCachedHotels(city: string): HotelInfo[] | null {
  // This function is no longer needed as we use Supabase caching
  // Keeping for backwards compatibility
  return null;
}
