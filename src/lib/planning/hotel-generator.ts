import Anthropic from '@anthropic-ai/sdk';

export interface HotelInfo {
  id: string;
  name: string;
  city: string;
  country: string;
  imageUrl: string;
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

// Cache for generated hotels
const hotelCache = new Map<string, HotelInfo[]>();

// Unsplash hotel image keywords by type
const HOTEL_IMAGE_KEYWORDS: Record<string, string> = {
  'hotel': 'hotel+room+luxury',
  'hostel': 'hostel+dormitory+backpacker',
  'resort': 'resort+pool+tropical',
  'boutique': 'boutique+hotel+design',
  'guesthouse': 'guesthouse+cozy+room',
  'villa': 'villa+private+pool',
};

// Generate hotel ID from name
function generateHotelId(name: string, city: string): string {
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
}

// Get hotel image from Unsplash
function getHotelImage(hotelName: string, type: string, index: number = 0): string {
  const keyword = HOTEL_IMAGE_KEYWORDS[type] || 'hotel+room';
  // Use hotel name + type for variety
  const seed = `${hotelName}-${index}`.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return `https://source.unsplash.com/800x600/?${keyword}&sig=${seed}`;
}

// Generate hotels for a city using AI
export async function generateHotels(
  city: string,
  country?: string,
  preferences?: HotelPreferences
): Promise<HotelInfo[]> {
  // Check cache first (only if no preferences, or same preferences)
  const cacheKey = `${city}-${country || ''}-${JSON.stringify(preferences || {})}`;
  if (hotelCache.has(cacheKey)) {
    return hotelCache.get(cacheKey)!;
  }

  const client = new Anthropic();

  // Build preference context for AI
  let preferenceContext = '';
  if (preferences) {
    const parts = [];
    if (preferences.partyType) {
      parts.push(`Traveling as: ${preferences.partyType}`);
    }
    if (preferences.accommodationStyle) {
      parts.push(`Preferred style: ${preferences.accommodationStyle}`);
    }
    if (preferences.accommodationPriority) {
      parts.push(`Top priority: ${preferences.accommodationPriority}`);
    }
    if (preferences.budgetPerNight) {
      parts.push(`Budget: $${preferences.budgetPerNight.min}-${preferences.budgetPerNight.max}/night`);
    }
    if (preferences.interests && preferences.interests.length > 0) {
      parts.push(`Interests: ${preferences.interests.join(', ')}`);
    }
    if (preferences.nearbyActivities && preferences.nearbyActivities.length > 0) {
      parts.push(`\nFavorited activities to stay near:\n- ${preferences.nearbyActivities.join('\n- ')}`);
    }
    if (parts.length > 0) {
      preferenceContext = `\n\nUSER PREFERENCES:\n${parts.join('\n')}\n\nPrioritize hotels that match these preferences. Hotels near the favorited activities should rank higher.`;
    }
  }

  // Determine hotel mix based on accommodation style
  let hotelMix = `Include a MIX of:
- 2 luxury/high-end hotels ($$$$)
- 2 boutique/mid-range hotels ($$$)
- 2 budget-friendly hotels ($$)
- 2 hostels or guesthouses ($)`;

  if (preferences?.accommodationStyle === 'luxury') {
    hotelMix = `Focus on luxury options:
- 4 luxury/high-end hotels ($$$$)
- 2 boutique hotels ($$$)
- 2 upscale options ($$$ or $$$$)`;
  } else if (preferences?.accommodationStyle === 'budget') {
    hotelMix = `Focus on budget-friendly options:
- 4 hostels or budget guesthouses ($)
- 2 budget hotels ($$)
- 2 mid-range options for comparison ($$ or $$$)`;
  } else if (preferences?.accommodationStyle === 'boutique') {
    hotelMix = `Focus on boutique and unique stays:
- 4 boutique hotels ($$ to $$$)
- 2 unique guesthouses or B&Bs
- 2 design hotels with character`;
  }

  const prompt = `Generate 8 real hotel recommendations for ${city}${country ? `, ${country}` : ''}.${preferenceContext}

${hotelMix}

Return ONLY a valid JSON array (no markdown, no explanation) with this structure:
[
  {
    "name": "Real hotel name (use actual hotel names that exist in ${city})",
    "type": "hotel" | "hostel" | "resort" | "boutique" | "guesthouse" | "villa",
    "priceRange": "$" | "$$" | "$$$" | "$$$$",
    "pricePerNight": "Price range in USD, e.g., '$80-120' or '$300+'",
    "rating": 4.5,
    "reviews": 1234,
    "neighborhood": "Area/district name",
    "description": "2-3 sentence description of what makes this place special",
    "amenities": ["Pool", "Free WiFi", "Restaurant", "Spa", etc.],
    "idealFor": ["couples", "families", "solo", "backpackers", "business"],
    "highlights": ["3 key selling points"],
    "walkingDistance": ["2-3 nearby attractions"],
    "matchScore": 85,
    "matchReasons": ["Near your favorited temples", "Great for couples", "Within budget"]
  }
]

Use REAL hotels that actually exist in ${city}. Be specific with neighborhoods and nearby landmarks.
${preferences?.nearbyActivities ? `\nIMPORTANT: Recommend hotels in neighborhoods CLOSE TO these activities: ${preferences.nearbyActivities.join(', ')}` : ''}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const hotels = JSON.parse(content.text) as Array<{
        name: string;
        type: HotelInfo['type'];
        priceRange: HotelInfo['priceRange'];
        pricePerNight: string;
        rating: number;
        reviews: number;
        neighborhood: string;
        description: string;
        amenities: string[];
        idealFor: string[];
        highlights: string[];
        walkingDistance: string[];
        matchScore?: number;
        matchReasons?: string[];
      }>;

      // Transform to full HotelInfo with IDs and images
      const hotelInfos: HotelInfo[] = hotels.map((hotel) => ({
        id: generateHotelId(hotel.name, city),
        name: hotel.name,
        city,
        country: country || '',
        imageUrl: getHotelImage(hotel.name, hotel.type, 0),
        images: [
          getHotelImage(hotel.name, hotel.type, 1),
          getHotelImage(hotel.name, hotel.type, 2),
          getHotelImage(hotel.name, hotel.type, 3),
        ],
        priceRange: hotel.priceRange,
        pricePerNight: hotel.pricePerNight,
        rating: hotel.rating,
        reviews: hotel.reviews,
        type: hotel.type,
        amenities: hotel.amenities,
        neighborhood: hotel.neighborhood,
        description: hotel.description,
        idealFor: hotel.idealFor,
        highlights: hotel.highlights,
        walkingDistance: hotel.walkingDistance,
        matchScore: hotel.matchScore,
        matchReasons: hotel.matchReasons,
      }));

      // Cache the result
      hotelCache.set(cacheKey, hotelInfos);

      return hotelInfos;
    }
  } catch (error) {
    console.error('Error generating hotels:', error);
  }

  // Fallback: return generic recommendations
  return generateFallbackHotels(city, country);
}

// Fallback hotels if AI fails
function generateFallbackHotels(city: string, country?: string): HotelInfo[] {
  const types: Array<{ type: HotelInfo['type']; priceRange: HotelInfo['priceRange']; pricePerNight: string }> = [
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
    imageUrl: getHotelImage(`${city}-${idx}`, t.type, 0),
    images: [
      getHotelImage(`${city}-${idx}`, t.type, 1),
      getHotelImage(`${city}-${idx}`, t.type, 2),
    ],
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
  const cacheKey = `${city}-`;
  for (const [key, value] of hotelCache.entries()) {
    if (key.startsWith(cacheKey)) {
      return value;
    }
  }
  return null;
}
