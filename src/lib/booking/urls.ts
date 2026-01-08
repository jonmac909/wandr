/**
 * Generate booking URLs for different activity categories
 * - Flights: Skyscanner (clean URL format with prefilled airports/dates)
 * - Hotels/Accommodation: TripAdvisor
 * - Restaurants/Food: Google Search
 * - Other activities: Google Search
 */

import { Activity, ActivityCategory } from '@/types/itinerary';

interface BookingUrlOptions {
  origin?: string;
  destination?: string;
  date?: string;
  returnDate?: string;
  location?: string;
  city?: string;
}

/**
 * Common airport codes mapping for cities
 */
const CITY_TO_AIRPORT: Record<string, string> = {
  // North America
  'toronto': 'YYZ',
  'vancouver': 'YVR',
  'kelowna': 'YLW',
  'montreal': 'YUL',
  'calgary': 'YYC',
  'new york': 'JFK',
  'nyc': 'JFK',
  'los angeles': 'LAX',
  'la': 'LAX',
  'san francisco': 'SFO',
  'chicago': 'ORD',
  'miami': 'MIA',
  'seattle': 'SEA',
  'boston': 'BOS',
  'denver': 'DEN',
  'dallas': 'DFW',
  'houston': 'IAH',
  'atlanta': 'ATL',
  'honolulu': 'HNL',
  'hawaii': 'HNL',
  'maui': 'OGG',
  // Asia
  'tokyo': 'NRT',
  'narita': 'NRT',
  'haneda': 'HND',
  'osaka': 'KIX',
  'bangkok': 'BKK',
  'singapore': 'SIN',
  'hong kong': 'HKG',
  'seoul': 'ICN',
  'taipei': 'TPE',
  'manila': 'MNL',
  'kuala lumpur': 'KUL',
  'ho chi minh': 'SGN',
  'saigon': 'SGN',
  'hanoi': 'HAN',
  'da nang': 'DAD',
  'bali': 'DPS',
  'denpasar': 'DPS',
  'jakarta': 'CGK',
  'phuket': 'HKT',
  'chiang mai': 'CNX',
  'krabi': 'KBV',
  'beijing': 'PEK',
  'shanghai': 'PVG',
  'delhi': 'DEL',
  'mumbai': 'BOM',
  // Europe
  'london': 'LHR',
  'paris': 'CDG',
  'amsterdam': 'AMS',
  'frankfurt': 'FRA',
  'munich': 'MUC',
  'rome': 'FCO',
  'milan': 'MXP',
  'barcelona': 'BCN',
  'madrid': 'MAD',
  'lisbon': 'LIS',
  'dublin': 'DUB',
  'zurich': 'ZRH',
  'vienna': 'VIE',
  'prague': 'PRG',
  'berlin': 'BER',
  'copenhagen': 'CPH',
  'stockholm': 'ARN',
  'oslo': 'OSL',
  'helsinki': 'HEL',
  'athens': 'ATH',
  'istanbul': 'IST',
  // Oceania
  'sydney': 'SYD',
  'melbourne': 'MEL',
  'brisbane': 'BNE',
  'auckland': 'AKL',
  'fiji': 'NAN',
  // Middle East
  'dubai': 'DXB',
  'doha': 'DOH',
  'abu dhabi': 'AUH',
  // South America
  'sao paulo': 'GRU',
  'rio': 'GIG',
  'buenos aires': 'EZE',
  'lima': 'LIM',
  'bogota': 'BOG',
  'santiago': 'SCL',
  // Africa
  'cape town': 'CPT',
  'johannesburg': 'JNB',
  'cairo': 'CAI',
  'casablanca': 'CMN',
  'nairobi': 'NBO',
};

/**
 * Extract airport code from text (city name or already an airport code)
 */
function extractAirportCode(text: string): string | null {
  if (!text) return null;

  const cleaned = text.trim().toLowerCase();

  // Check if it's already a 3-letter airport code (all caps in original)
  const codeMatch = text.match(/\b([A-Z]{3})\b/);
  if (codeMatch) {
    return codeMatch[1];
  }

  // Try to find city in our mapping
  for (const [city, code] of Object.entries(CITY_TO_AIRPORT)) {
    if (cleaned.includes(city)) {
      return code;
    }
  }

  // Return the original text if it might be a code (3 letters)
  if (/^[a-zA-Z]{3}$/.test(cleaned)) {
    return cleaned.toUpperCase();
  }

  return null;
}

/**
 * Convert ISO date (YYYY-MM-DD) to Skyscanner format (YYMMDD)
 */
function formatDateForSkyscanner(isoDate: string): string {
  if (!isoDate) return '';
  // Handle both "2025-11-08" and "2025-11-08T00:00:00.000Z" formats
  const datePart = isoDate.split('T')[0];
  const [year, month, day] = datePart.split('-');
  // Return YYMMDD format
  return `${year.slice(2)}${month}${day}`;
}

/**
 * Generate a Google Flights search URL
 * Format: https://www.google.com/travel/flights?q=flights+from+ORIGIN+to+DEST
 */
export function generateFlightUrl(options: BookingUrlOptions): string {
  const { origin, destination, date } = options;

  const originCode = origin ? extractAirportCode(origin) : null;
  const destCode = destination ? extractAirportCode(destination) : null;

  // Build Google Flights URL
  const baseUrl = 'https://www.google.com/travel/flights';
  const params = new URLSearchParams();

  // Build search query
  let query = 'flights';
  if (originCode) {
    query += ` from ${originCode}`;
  }
  if (destCode) {
    query += ` to ${destCode}`;
  }
  if (date) {
    // Format date as "Feb 15" for Google
    const [year, month, day] = date.split('T')[0].split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const formatted = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    query += ` on ${formatted}`;
  }

  params.set('q', query);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a DuckDuckGo redirect URL that goes directly to TripAdvisor hotel page
 * Uses DuckDuckGo's bang redirect which doesn't show interstitial notices
 */
export function generateHotelUrl(options: BookingUrlOptions & { hotelName?: string }): string {
  const { hotelName, destination, location, city } = options;

  // Use DuckDuckGo's redirect (no interstitial page like Google's)
  const baseUrl = 'https://duckduckgo.com/';
  const params = new URLSearchParams();

  if (hotelName) {
    // Search for the specific hotel on TripAdvisor using DuckDuckGo's \ redirect
    const locationStr = location || city || '';
    const query = locationStr
      ? `\\${hotelName} ${locationStr} tripadvisor`
      : `\\${hotelName} tripadvisor`;
    params.set('q', query);
  } else {
    // Fallback to location-based search
    const searchLocation = location || destination || city || '';
    if (searchLocation) {
      params.set('q', `\\${searchLocation} hotels tripadvisor`);
    }
  }

  const paramString = params.toString();
  return paramString ? `${baseUrl}?${paramString}` : 'https://www.tripadvisor.com/Hotels';
}

/**
 * Generate a Google search URL for restaurants
 */
export function generateRestaurantUrl(options: BookingUrlOptions & { restaurantName?: string }): string {
  const { restaurantName, location, city } = options;

  const baseUrl = 'https://www.google.com/search';
  const params = new URLSearchParams();

  // Build search query
  let query = restaurantName || '';
  const locationStr = location || city || '';

  if (query && locationStr) {
    query = `${query} ${locationStr} reservations`;
  } else if (query) {
    query = `${query} reservations`;
  } else if (locationStr) {
    query = `restaurants ${locationStr}`;
  }

  if (query) {
    params.set('q', query);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate a 12Go.Asia URL for bus/train bookings in Asia
 * or Google search for other regions
 */
export function generateTransitUrl(options: BookingUrlOptions & { transitName?: string }): string {
  const { origin, destination, location, date, transitName } = options;

  // For Asia, 12Go.Asia is the best option
  // Build a search URL
  const baseUrl = 'https://12go.asia/en/travel';

  // Try to build a direct route URL
  const originCity = origin?.toLowerCase().replace(/\s+/g, '-') || '';
  const destCity = destination?.toLowerCase().replace(/\s+/g, '-') || '';

  if (originCity && destCity) {
    // Direct route URL: https://12go.asia/en/travel/chiang-mai/chiang-rai
    return `${baseUrl}/${originCity}/${destCity}`;
  }

  // Fallback to Google search with transit booking keywords
  const googleUrl = 'https://www.google.com/search';
  const params = new URLSearchParams();

  let query = transitName || '';
  if (origin && destination) {
    query = `${origin} to ${destination} bus train booking`;
  } else if (location) {
    query = `${location} bus booking 12go`;
  } else if (query) {
    query = `${query} bus train booking`;
  }

  if (query) {
    params.set('q', query);
  }

  return `${googleUrl}?${params.toString()}`;
}

/**
 * Generate a generic Google search URL for activities
 */
export function generateActivityUrl(options: BookingUrlOptions & { activityName?: string }): string {
  const { activityName, location, city } = options;

  const baseUrl = 'https://www.google.com/search';
  const params = new URLSearchParams();

  let query = activityName || '';
  const locationStr = location || city || '';

  if (query && locationStr) {
    query = `${query} ${locationStr} book tickets`;
  } else if (query) {
    query = `${query} book tickets`;
  }

  if (query) {
    params.set('q', query);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Parse flight details from activity name
 * Examples:
 * - "Zipair YVR→NRT 9:50am-1:00pm+1"
 * - "Air Canada Toronto to Bangkok"
 * - "Fly from Vancouver to Tokyo"
 * - "Flight YYZ-BKK"
 */
function parseFlightDetails(name: string, description?: string): { origin?: string; destination?: string } {
  const text = `${name} ${description || ''}`;

  // Pattern 1: Airport codes with arrow or dash (e.g., "YVR→NRT", "YYZ-BKK", "LAX to JFK")
  const codePattern = text.match(/\b([A-Z]{3})\s*(?:→|->|—|-|to)\s*([A-Z]{3})\b/i);
  if (codePattern) {
    return {
      origin: codePattern[1].toUpperCase(),
      destination: codePattern[2].toUpperCase(),
    };
  }

  // Pattern 2: City names with "to" or arrow (e.g., "Toronto to Bangkok", "Vancouver→Tokyo")
  const cityPattern = text.match(/(?:from\s+)?([A-Za-z\s]+?)\s*(?:→|->|—|-|to)\s*([A-Za-z\s]+?)(?:\s+\d|$|\s+@|\s+flight)/i);
  if (cityPattern) {
    const origin = extractAirportCode(cityPattern[1].trim());
    const destination = extractAirportCode(cityPattern[2].trim());
    if (origin || destination) {
      return { origin: origin || undefined, destination: destination || undefined };
    }
  }

  // Pattern 3: Just look for any airport codes in the text
  const allCodes = text.match(/\b[A-Z]{3}\b/g);
  if (allCodes && allCodes.length >= 2) {
    return {
      origin: allCodes[0],
      destination: allCodes[1],
    };
  }

  // Pattern 4: Look for city names anywhere in the text
  const cities = Object.keys(CITY_TO_AIRPORT);
  const foundCities: string[] = [];
  const lowerText = text.toLowerCase();

  for (const city of cities) {
    if (lowerText.includes(city)) {
      foundCities.push(CITY_TO_AIRPORT[city]);
    }
  }

  if (foundCities.length >= 2) {
    return {
      origin: foundCities[0],
      destination: foundCities[1],
    };
  } else if (foundCities.length === 1) {
    return { destination: foundCities[0] };
  }

  return {};
}

/**
 * Parse transit (bus/train) details from activity name
 * Examples:
 * - "Bus Chiang Mai to Chiang Rai"
 * - "GreenBus Chiang Mai → Chiang Rai"
 * - "Train Bangkok to Chiang Mai"
 */
function parseTransitDetails(name: string, description?: string): { origin?: string; destination?: string } {
  const text = `${name} ${description || ''}`;

  // Pattern 1: City names with "to" or arrow
  const cityPattern = text.match(/(?:bus|train|greenbus|transport|transfer)?\s*(?:from\s+)?([A-Za-z\s]+?)\s*(?:→|->|—|-|to)\s*([A-Za-z\s]+?)(?:\s+\d|$|\s+@|\s+bus|\s+train|$)/i);
  if (cityPattern) {
    const origin = cityPattern[1].trim();
    const destination = cityPattern[2].trim();
    // Clean up common words
    const cleanOrigin = origin.replace(/\b(bus|train|from|the)\b/gi, '').trim();
    const cleanDest = destination.replace(/\b(bus|train|the)\b/gi, '').trim();
    if (cleanOrigin && cleanDest) {
      return { origin: cleanOrigin, destination: cleanDest };
    }
  }

  // Pattern 2: Just look for two city names in the text
  const cities = Object.keys(CITY_TO_AIRPORT);
  const foundCities: string[] = [];
  const lowerText = text.toLowerCase();

  for (const city of cities) {
    if (lowerText.includes(city)) {
      foundCities.push(city);
    }
  }

  if (foundCities.length >= 2) {
    return {
      origin: foundCities[0],
      destination: foundCities[1],
    };
  }

  return {};
}

/**
 * Main function to generate booking URL based on activity category
 */
export function generateBookingUrl(
  activity: Activity,
  options: BookingUrlOptions = {}
): string {
  const { category, name, location, description } = activity;

  // Merge activity location with provided options
  const mergedOptions: BookingUrlOptions & { restaurantName?: string; activityName?: string; hotelName?: string } = {
    ...options,
    location: location?.name || options.location,
  };

  switch (category) {
    case 'flight':
      // Parse flight info from name and description
      const flightDetails = parseFlightDetails(name, description);
      mergedOptions.origin = flightDetails.origin || mergedOptions.origin;
      mergedOptions.destination = flightDetails.destination || mergedOptions.destination;
      return generateFlightUrl(mergedOptions);

    case 'transit':
      // For bus/train, use transit booking (12Go.Asia for Asia)
      const transitDetails = parseTransitDetails(name, description);
      return generateTransitUrl({
        ...mergedOptions,
        origin: transitDetails.origin || mergedOptions.origin,
        destination: transitDetails.destination || mergedOptions.destination,
        transitName: name,
      });

    case 'accommodation':
      // Use the activity name as the hotel name for specific search
      mergedOptions.hotelName = name;
      mergedOptions.location = location?.name;
      return generateHotelUrl(mergedOptions);

    case 'food':
      mergedOptions.restaurantName = name;
      return generateRestaurantUrl(mergedOptions);

    case 'checkin':
      // Check-in is usually hotel check-in - use name as hotel name
      mergedOptions.hotelName = name;
      mergedOptions.location = location?.name;
      return generateHotelUrl(mergedOptions);

    default:
      // For sightseeing, activity, shopping, nightlife, workshop, etc.
      mergedOptions.activityName = name;
      return generateActivityUrl(mergedOptions);
  }
}

/**
 * Get the booking provider name for display
 */
export function getBookingProvider(category: ActivityCategory): { name: string; icon: string } {
  switch (category) {
    case 'flight':
      return { name: 'Google Flights', icon: '✈️' };
    case 'transit':
      return { name: '12Go.Asia', icon: '🚌' };
    case 'accommodation':
    case 'checkin':
      return { name: 'TripAdvisor', icon: '🏨' };
    case 'food':
      return { name: 'Google', icon: '🍽️' };
    default:
      return { name: 'Google', icon: '🔍' };
  }
}
