import { NextRequest, NextResponse } from 'next/server';
import { supabasePlaces } from '@/lib/db/supabase';

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Fetch Wikivoyage recommendations for a city
async function getWikivoyageRecommendations(city: string): Promise<{ see: string[]; do: string[] }> {
  try {
    // Search Wikivoyage for the city
    const searchRes = await fetch(
      `https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(city)}&format=json&origin=*`,
      { headers: { 'User-Agent': 'Wandr Travel App' } }
    );
    const searchData = await searchRes.json();
    
    if (!searchData.query?.search?.[0]) return { see: [], do: [] };
    
    const pageTitle = searchData.query.search[0].title;
    
    // Get sections
    const sectionsRes = await fetch(
      `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json&origin=*`,
      { headers: { 'User-Agent': 'Wandr Travel App' } }
    );
    const sectionsData = await sectionsRes.json();
    
    const sections = sectionsData.parse?.sections || [];
    const seeSection = sections.find((s: { line: string }) => s.line?.toLowerCase() === 'see');
    const doSection = sections.find((s: { line: string }) => s.line?.toLowerCase() === 'do');
    
    const recommendations: { see: string[]; do: string[] } = { see: [], do: [] };
    
    // Extract "See" section content
    if (seeSection?.index) {
      const seeRes = await fetch(
        `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${seeSection.index}&prop=text&format=json&origin=*`,
        { headers: { 'User-Agent': 'Wandr Travel App' } }
      );
      const seeData = await seeRes.json();
      if (seeData.parse?.text?.['*']) {
        // Extract place names from bold text and links
        const html = seeData.parse.text['*'];
        const boldMatches = html.match(/<b>([^<]+)<\/b>/g) || [];
        const linkMatches = html.match(/title="([^"]+)"/g) || [];
        recommendations.see = [
          ...boldMatches.map((m: string) => m.replace(/<\/?b>/g, '').trim()),
          ...linkMatches.map((m: string) => m.replace(/title="|"/g, '').trim())
        ].filter((s: string) => s.length > 3 && s.length < 50).slice(0, 20);
      }
    }
    
    // Extract "Do" section content
    if (doSection?.index) {
      const doRes = await fetch(
        `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${doSection.index}&prop=text&format=json&origin=*`,
        { headers: { 'User-Agent': 'Wandr Travel App' } }
      );
      const doData = await doRes.json();
      if (doData.parse?.text?.['*']) {
        const html = doData.parse.text['*'];
        const boldMatches = html.match(/<b>([^<]+)<\/b>/g) || [];
        const linkMatches = html.match(/title="([^"]+)"/g) || [];
        recommendations.do = [
          ...boldMatches.map((m: string) => m.replace(/<\/?b>/g, '').trim()),
          ...linkMatches.map((m: string) => m.replace(/title="|"/g, '').trim())
        ].filter((s: string) => s.length > 3 && s.length < 50).slice(0, 20);
      }
    }
    
    console.log(`[Wikivoyage] ${city} - See: ${recommendations.see.slice(0, 5).join(', ')} | Do: ${recommendations.do.slice(0, 5).join(', ')}`);
    return recommendations;
  } catch (error) {
    console.error('[Wikivoyage] Failed to fetch:', error);
    return { see: [], do: [] };
  }
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
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
  };
  googleMapsUri?: string;
  photos?: Array<{ name: string }>;
  primaryType?: string;
  types?: string[];
  priceLevel?: string;
  location?: { latitude: number; longitude: number };
  reservable?: boolean;
  businessStatus?: string; // OPERATIONAL, CLOSED_TEMPORARILY, CLOSED_PERMANENTLY
}

interface PlaceSearchResult {
  places?: PlaceResult[];
}

interface ScoredPlace extends PlaceResult {
  mustSeeScore: number;
  warnings: string[];
  bestTimeSlot: 'morning' | 'afternoon' | 'evening' | 'anytime';
  cluster?: number;
}

// Places that typically need reservations
const RESERVATION_KEYWORDS = [
  'museum', 'gallery', 'palace', 'castle', 'tower', 'observatory',
  'show', 'performance', 'tour', 'experience', 'class', 'workshop',
  'michelin', 'fine dining', 'omakase', 'tasting menu'
];

// Check if a place is open at a specific hour (0-23) on a given day (0=Sunday, 6=Saturday)
function isOpenAtHour(place: PlaceResult, hour: number, dayOfWeek: number = 1): boolean {
  const periods = place.currentOpeningHours?.periods;
  const placeName = (place.displayName?.text || '').toLowerCase();
  
  // Check if place name indicates it's only open on specific days
  // Saturday market should only be on Saturday (day 6)
  if (placeName.includes('saturday') && dayOfWeek !== 6) {
    console.log(`[OpenHours] ${place.displayName?.text} is Saturday-only, today is day ${dayOfWeek}`);
    return false;
  }
  // Sunday market should only be on Sunday (day 0)
  if (placeName.includes('sunday') && dayOfWeek !== 0) {
    console.log(`[OpenHours] ${place.displayName?.text} is Sunday-only, today is day ${dayOfWeek}`);
    return false;
  }
  // Weekend market - only Sat/Sun
  if (placeName.includes('weekend market') && dayOfWeek !== 0 && dayOfWeek !== 6) {
    return false;
  }
  
  // If no opening hours data, assume open (better UX than blocking)
  if (!periods || periods.length === 0) return true;
  
  // Find periods for this day
  const todayPeriods = periods.filter(p => p.open.day === dayOfWeek);
  
  // If no periods for this day, it's closed
  if (todayPeriods.length === 0) return false;
  
  // Check if the hour falls within any open period
  for (const period of todayPeriods) {
    const openHour = period.open.hour;
    const closeHour = period.close?.hour ?? 24; // If no close time, assume closes at midnight
    
    // Handle overnight periods (e.g., bar open 22:00 - 02:00)
    if (closeHour < openHour) {
      // Opens today and closes tomorrow
      if (hour >= openHour || hour < closeHour) return true;
    } else {
      // Normal same-day period
      if (hour >= openHour && hour < closeHour) return true;
    }
  }
  
  return false;
}

// Get valid hours for a place (when it's open)
function getValidHoursForPlace(place: PlaceResult, preferredSlot: 'morning' | 'afternoon' | 'evening' | 'anytime'): number[] {
  const periods = place.currentOpeningHours?.periods;
  
  // Default hours by slot
  const slotHours: Record<string, number[]> = {
    morning: [9, 10, 11],
    afternoon: [14, 15, 16],
    evening: [18, 19, 20],
    anytime: [9, 10, 11, 14, 15, 16, 18, 19, 20],
  };
  
  const preferred = slotHours[preferredSlot];
  
  // If no opening hours data, return preferred hours
  if (!periods || periods.length === 0) return preferred;
  
  // Filter to hours when place is actually open (check Monday as typical day)
  const validHours = preferred.filter(h => isOpenAtHour(place, h, 1));
  
  // If no valid hours in preferred slot, expand search
  if (validHours.length === 0) {
    return slotHours.anytime.filter(h => isOpenAtHour(place, h, 1));
  }
  
  return validHours;
}

// Calculate distance between two points (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Cluster places by geographic proximity using simple greedy clustering
function clusterPlaces(places: ScoredPlace[], maxClusters: number): ScoredPlace[] {
  const withLocation = places.filter(p => p.location?.latitude && p.location?.longitude);
  const withoutLocation = places.filter(p => !p.location?.latitude || !p.location?.longitude);
  
  if (withLocation.length === 0) return places;
  
  // Simple k-means-ish clustering
  const clusters: ScoredPlace[][] = [];
  const assigned = new Set<string>();
  
  // Start with highest-rated unassigned place as cluster center
  const sorted = [...withLocation].sort((a, b) => b.mustSeeScore - a.mustSeeScore);
  
  for (const centerPlace of sorted) {
    if (assigned.has(centerPlace.id) || clusters.length >= maxClusters) continue;
    
    const cluster: ScoredPlace[] = [centerPlace];
    assigned.add(centerPlace.id);
    
    // Find nearby places (within 2km)
    for (const place of withLocation) {
      if (assigned.has(place.id)) continue;
      
      const distance = getDistance(
        centerPlace.location!.latitude, centerPlace.location!.longitude,
        place.location!.latitude, place.location!.longitude
      );
      
      if (distance < 2) { // 2km radius
        cluster.push(place);
        assigned.add(place.id);
      }
    }
    
    clusters.push(cluster);
  }
  
  // Assign cluster numbers and flatten
  const result: ScoredPlace[] = [];
  clusters.forEach((cluster, idx) => {
    cluster.forEach(place => {
      result.push({ ...place, cluster: idx });
    });
  });
  
  // Add places without location at the end
  withoutLocation.forEach(place => {
    result.push({ ...place, cluster: -1 });
  });
  
  return result;
}

// Calculate must-see score (higher = more important)
function calculateMustSeeScore(place: PlaceResult, interests: string[] = []): number {
  const rating = place.rating || 0;
  const reviewCount = place.userRatingCount || 0;
  
  // Score = rating * log(reviewCount + 1) * type_multiplier
  // This favors highly-rated places with many reviews
  let score = rating * Math.log10(reviewCount + 1);
  
  // Boost famous landmark types
  const types = place.types || [];
  const name = (place.displayName?.text || '').toLowerCase();
  
  if (types.includes('tourist_attraction')) score *= 1.3;
  if (types.includes('landmark') || types.includes('historical_landmark')) score *= 1.4;
  if (types.includes('world_heritage_site')) score *= 1.5;
  if (types.includes('museum')) score *= 1.2;
  
  // BOOST based on user interests
  const interestLower = interests.map(i => i.toLowerCase());
  
  // Culture vulture / History buff
  if (interestLower.some(i => i.includes('culture') || i.includes('history'))) {
    if (types.some(t => ['museum', 'temple', 'hindu_temple', 'buddhist_temple', 'church', 'historical_landmark', 'art_gallery'].includes(t))) {
      score *= 1.5;
    }
  }
  
  // Foodie
  if (interestLower.some(i => i.includes('food') || i.includes('culinary'))) {
    if (types.some(t => ['restaurant', 'food', 'market', 'cafe'].includes(t)) || name.includes('market') || name.includes('food')) {
      score *= 1.5;
    }
  }
  
  // Nature lover / Adventure
  if (interestLower.some(i => i.includes('nature') || i.includes('adventure') || i.includes('outdoor'))) {
    if (types.some(t => ['park', 'hiking_area', 'beach', 'garden', 'zoo', 'aquarium'].includes(t))) {
      score *= 1.5;
    }
  }
  
  // Nightlife
  if (interestLower.some(i => i.includes('nightlife') || i.includes('party'))) {
    if (types.some(t => ['bar', 'night_club'].includes(t)) || name.includes('night')) {
      score *= 1.5;
    }
  }
  
  // Relaxation / Wellness
  if (interestLower.some(i => i.includes('relax') || i.includes('wellness'))) {
    if (types.some(t => ['spa', 'beach', 'resort'].includes(t))) {
      score *= 1.5;
    }
  }
  
  // Shopping
  if (interestLower.some(i => i.includes('shopping'))) {
    if (types.some(t => ['shopping_mall', 'market'].includes(t)) || name.includes('market') || name.includes('mall')) {
      score *= 1.5;
    }
  }
  
  return Math.round(score * 10);
}

// Real travel wisdom - factual tips based on place type (not made up)
function getTravelTip(place: PlaceResult): string | undefined {
  const types = place.types || [];
  const name = (place.displayName?.text || '').toLowerCase();
  
  // Temples
  if (types.includes('hindu_temple') || types.includes('buddhist_temple') || 
      types.includes('place_of_worship') || name.includes('temple') || name.includes('wat ')) {
    return 'Best visited early morning to avoid crowds and midday heat. Dress modestly (cover shoulders and knees).';
  }
  
  // Night markets
  if (name.includes('night market') || name.includes('walking street')) {
    return 'Opens in the evening, usually around 5-6pm. Come hungry - best for street food grazing.';
  }
  
  // Morning markets
  if (name.includes('morning market') || name.includes('fresh market')) {
    return 'Arrive early (6-8am) for the freshest produce and most authentic experience.';
  }
  
  // Museums
  if (types.includes('museum') || types.includes('art_gallery')) {
    return 'Weekday mornings are least crowded. Check for free admission days. Allow 2-3 hours.';
  }
  
  // Beaches
  if (types.includes('beach') || name.includes('beach')) {
    return 'Early morning or late afternoon for best conditions. Midday sun is intense.';
  }
  
  // Parks and gardens
  if (types.includes('park') || name.includes('garden') || name.includes('botanical')) {
    return 'Morning offers cooler temperatures and better light for photos.';
  }
  
  // Viewpoints and observation decks
  if (name.includes('viewpoint') || name.includes('observation') || name.includes('tower') || name.includes('sky')) {
    return 'Sunset or sunrise for best views. Book ahead for popular spots.';
  }
  
  // Palaces and historic sites
  if (name.includes('palace') || name.includes('castle') || types.includes('historical_landmark')) {
    return 'Arrive at opening time to beat tour groups. Audio guides often available.';
  }
  
  // Zoos and aquariums
  if (types.includes('zoo') || types.includes('aquarium')) {
    return 'Animals are most active in the morning. Allow half a day minimum.';
  }
  
  // Spas
  if (types.includes('spa') || name.includes('spa') || name.includes('massage')) {
    return 'Book in advance, especially for popular places. Afternoon is ideal after sightseeing.';
  }
  
  return undefined;
}

// Determine best time slot based on opening hours and place type
function determineBestTimeSlot(place: PlaceResult): 'morning' | 'afternoon' | 'evening' | 'anytime' {
  const types = place.types || [];
  const name = (place.displayName?.text || '').toLowerCase();
  const hours = place.currentOpeningHours?.weekdayDescriptions?.[0]?.toLowerCase() || '';
  
  // Night markets, bars, nightlife = evening
  if (types.includes('bar') || types.includes('night_club') || 
      name.includes('night market') || name.includes('nightlife')) {
    return 'evening';
  }
  
  // Morning markets
  if (name.includes('morning market') || name.includes('breakfast')) {
    return 'morning';
  }
  
  // Temples often best at sunrise/sunset
  if (types.includes('temple') || types.includes('place_of_worship')) {
    return 'morning'; // Cooler, less crowded
  }
  
  // Parks and outdoor = morning (before heat)
  if (types.includes('park') || types.includes('hiking_area') || types.includes('beach')) {
    return 'morning';
  }
  
  // Museums = afternoon (after outdoor morning activities)
  if (types.includes('museum') || types.includes('art_gallery')) {
    return 'afternoon';
  }
  
  // Check if opens late (after 5pm) = evening only
  if (hours.includes('5:00 pm') || hours.includes('6:00 pm') || hours.includes('17:00') || hours.includes('18:00')) {
    if (!hours.includes('am') && !hours.includes('9:') && !hours.includes('10:')) {
      return 'evening';
    }
  }
  
  return 'anytime';
}

// Check for warnings (reservations needed, preference conflicts)
function getWarnings(place: PlaceResult, preferences?: { avoid?: string[] }): string[] {
  const warnings: string[] = [];
  const name = (place.displayName?.text || '').toLowerCase();
  const types = place.types || [];
  const description = (place.editorialSummary?.text || '').toLowerCase();
  
  // Check if likely needs reservation
  const needsReservation = RESERVATION_KEYWORDS.some(keyword => 
    name.includes(keyword) || types.some(t => t.includes(keyword)) || description.includes(keyword)
  );
  
  if (needsReservation || place.reservable) {
    warnings.push('May require advance reservation');
  }
  
  // Check for very popular places (long wait times)
  if ((place.userRatingCount || 0) > 10000) {
    warnings.push('Very popular - expect crowds');
  }
  
  // Check against user preferences
  if (preferences?.avoid) {
    for (const avoidItem of preferences.avoid) {
      const avoidLower = avoidItem.toLowerCase();
      if (name.includes(avoidLower) || types.some(t => t.includes(avoidLower))) {
        warnings.push(`Note: Contains "${avoidItem}" which you prefer to avoid`);
      }
    }
  }
  
  // Price warnings
  if (place.priceLevel === 'PRICE_LEVEL_VERY_EXPENSIVE') {
    warnings.push('High-end pricing ($$$+)');
  }
  
  return warnings;
}

// Fetch places from Google Places API or cache
async function fetchPlacesForCity(city: string, type: string, limit: number = 20): Promise<PlaceResult[]> {
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
    console.error('[GenerateItinerary] Google Maps API key not configured');
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
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.editorialSummary,places.currentOpeningHours,places.googleMapsUri,places.photos,places.primaryType,places.types,places.priceLevel,places.location,places.reservable,places.businessStatus',
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
    const allPlaces = data.places || [];
    
    // Filter out closed places
    const places = allPlaces.filter(place => {
      if (place.businessStatus === 'CLOSED_PERMANENTLY' || place.businessStatus === 'CLOSED_TEMPORARILY') {
        console.log(`[GenerateItinerary] Filtering out closed: ${place.displayName?.text} (${place.businessStatus})`);
        return false;
      }
      return true;
    });
    
    console.log(`[GenerateItinerary] Got ${places.length} open ${type}s for ${city} (filtered from ${allPlaces.length})`);

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

function getActivityType(types: string[] | undefined): 'attraction' | 'restaurant' | 'activity' {
  if (!types) return 'attraction';
  const restaurantTypes = ['restaurant', 'food', 'cafe', 'bakery', 'bar'];
  if (types.some(t => restaurantTypes.some(rt => t.includes(rt)))) {
    return 'restaurant';
  }
  return 'attraction';
}

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

function getTags(types: string[] | undefined, placeName?: string): string[] {
  const tagMap: Record<string, string> = {
    'tourist_attraction': 'must-see',
    'museum': 'cultural',
    'temple': 'cultural',
    'church': 'cultural',
    'park': 'nature',
    'restaurant': 'food',
    'cafe': 'cafe',
    'bar': 'nightlife',
    'night_club': 'nightlife',
    'shopping_mall': 'shopping',
    'beach': 'beach',
    'hiking_area': 'nature',
    'spa': 'wellness',
    'art_gallery': 'cultural',
    'historical_landmark': 'cultural',
    'landmark': 'landmark',
    'amusement_park': 'activity',
    'zoo': 'activity',
    'aquarium': 'activity',
    'hindu_temple': 'cultural',
    'buddhist_temple': 'cultural',
    'mosque': 'cultural',
    'market': 'market',
    'food_court': 'food',
  };

  const tags: string[] = [];
  
  // Check place name for keywords
  const nameLower = (placeName || '').toLowerCase();
  if (nameLower.includes('night market') || nameLower.includes('walking street')) {
    tags.push('market');
    tags.push('nightlife');
  } else if (nameLower.includes('market')) {
    tags.push('market');
  }
  if (nameLower.includes('temple') || nameLower.includes('wat ')) {
    tags.push('cultural');
  }
  if (nameLower.includes('beach')) {
    tags.push('beach');
  }
  if (nameLower.includes('museum')) {
    tags.push('cultural');
  }
  
  // Add tags from Google types
  if (types) {
    for (const type of types) {
      if (tagMap[type] && !tags.includes(tagMap[type])) {
        tags.push(tagMap[type]);
      }
    }
  }
  
  return tags.length > 0 ? tags.slice(0, 4) : ['attraction'];
}

// Build smart itinerary with clustering, must-see priority, and scheduling
function buildSmartItinerary(
  attractions: PlaceResult[],
  restaurants: PlaceResult[],
  nights: number,
  city: string,
  tripStyle: string,
  interests: string[] = [],
  preferences?: { avoid?: string[] },
  wikivoyageRecs?: { see: string[]; do: string[] }
) {
  // Activity count based on trip pace:
  // - relaxed/easy: 2 activities (1-3 range)
  // - balanced: 4 activities (3-5 range)
  // - packed/full: 6 activities (5+ range)
  const activitiesPerDay = tripStyle === 'relaxed' ? 2 : tripStyle === 'packed' ? 6 : 4;
  
  console.log(`[BuildItinerary] Building for ${city}, ${nights} nights, style=${tripStyle}, interests=${interests.join(', ')}`);
  
  // Check if a place matches Wikivoyage recommendations
  const matchesWikivoyage = (placeName: string): boolean => {
    if (!wikivoyageRecs) return false;
    const nameLower = placeName.toLowerCase();
    const allRecs = [...(wikivoyageRecs.see || []), ...(wikivoyageRecs.do || [])];
    return allRecs.some(rec => {
      const recLower = rec.toLowerCase();
      return nameLower.includes(recLower) || recLower.includes(nameLower);
    });
  };
  
  // Score and enhance all places - NOW USING INTERESTS + WIKIVOYAGE
  const scoredAttractions: ScoredPlace[] = attractions
    .filter(p => p.photos?.[0]?.name) // Must have photo
    .map(place => {
      let score = calculateMustSeeScore(place, interests);
      // Boost by 30% if Wikivoyage recommends this place
      if (matchesWikivoyage(place.displayName?.text || '')) {
        score = Math.round(score * 1.3);
        console.log(`[Wikivoyage Boost] ${place.displayName?.text} boosted to ${score}`);
      }
      return {
        ...place,
        mustSeeScore: score,
        warnings: getWarnings(place, preferences),
        bestTimeSlot: determineBestTimeSlot(place),
      };
    })
    .sort((a, b) => b.mustSeeScore - a.mustSeeScore); // Sort by must-see score
  
  console.log(`[BuildItinerary] Top 5 attractions: ${scoredAttractions.slice(0, 5).map(p => `${p.displayName?.text}(${p.mustSeeScore})`).join(', ')}`);
  
  const scoredRestaurants: ScoredPlace[] = restaurants
    .filter(p => p.photos?.[0]?.name)
    .map(place => ({
      ...place,
      mustSeeScore: calculateMustSeeScore(place, interests),
      warnings: getWarnings(place, preferences),
      bestTimeSlot: determineBestTimeSlot(place),
    }))
    .sort((a, b) => b.mustSeeScore - a.mustSeeScore);
  
  // Cluster attractions by geography
  const clusteredAttractions = clusterPlaces(scoredAttractions, nights);
  
  // Group by cluster for day assignment
  const clusterGroups: Map<number, ScoredPlace[]> = new Map();
  for (const place of clusteredAttractions) {
    const cluster = place.cluster ?? -1;
    if (!clusterGroups.has(cluster)) {
      clusterGroups.set(cluster, []);
    }
    clusterGroups.get(cluster)!.push(place);
  }
  
  // Build days
  const days = [];
  const usedAttractionIds = new Set<string>();
  const usedRestaurantIds = new Set<string>();
  
  // Convert cluster groups to array sorted by highest must-see score in each cluster
  const sortedClusters = Array.from(clusterGroups.entries())
    .sort((a, b) => {
      const maxA = Math.max(...a[1].map(p => p.mustSeeScore));
      const maxB = Math.max(...b[1].map(p => p.mustSeeScore));
      return maxB - maxA;
    });
  
  for (let dayNum = 1; dayNum <= nights; dayNum++) {
    const dayActivities = [];
    
    // Get cluster for this day (round-robin through clusters)
    const clusterIndex = (dayNum - 1) % sortedClusters.length;
    const [, clusterPlaces] = sortedClusters[clusterIndex] || [0, []];
    
    // Get available attractions from this cluster (not yet used)
    const availableAttractions = clusterPlaces.filter(p => !usedAttractionIds.has(p.id));
    
    // If cluster exhausted, pull from any unused attractions
    const attractionsPool = availableAttractions.length > 0 
      ? availableAttractions 
      : clusteredAttractions.filter(p => !usedAttractionIds.has(p.id));
    
    // Separate by ACTUAL best time slot
    const morningPlaces = attractionsPool.filter(p => p.bestTimeSlot === 'morning');
    const afternoonPlaces = attractionsPool.filter(p => p.bestTimeSlot === 'afternoon');
    const eveningPlaces = attractionsPool.filter(p => p.bestTimeSlot === 'evening');
    const anytimePlaces = attractionsPool.filter(p => p.bestTimeSlot === 'anytime');
    
    // Schedule activities respecting their opening hours
    // Morning slots: 9am, 11am | Afternoon: 2pm, 4pm | Evening: 6pm, 8pm
    const schedule: { hour: number; pool: ScoredPlace[] }[] = [
      { hour: 9, pool: [...morningPlaces, ...anytimePlaces] },
      { hour: 11, pool: [...morningPlaces, ...anytimePlaces] },
      { hour: 14, pool: [...afternoonPlaces, ...anytimePlaces] },
      { hour: 16, pool: [...afternoonPlaces, ...anytimePlaces] },
      { hour: 18, pool: [...eveningPlaces, ...anytimePlaces] },
      { hour: 20, pool: [...eveningPlaces, ...anytimePlaces] },
    ];
    
    // Pick activities for this day based on pace
    // Track last selected place to prioritize nearby ones
    let activityCount = 0;
    let lastSelectedPlace: ScoredPlace | null = null;
    
    for (const slot of schedule) {
      if (activityCount >= activitiesPerDay) break;
      
      // Find an unused place from this slot's pool that is OPEN at this hour
      // If we have a previous activity, prefer places within 3km
      let place: ScoredPlace | undefined;
      
      // Filter: unused AND actually open at this slot's hour
      const unusedInPool = slot.pool.filter(p => {
        if (usedAttractionIds.has(p.id)) return false;
        
        // Check if place is open at this hour (use Monday as typical day)
        // If no opening hours data, assume open
        if (!isOpenAtHour(p, slot.hour, 1)) {
          console.log(`[Filtering] Skipping ${p.displayName?.text} - closed at ${slot.hour}:00`);
          return false;
        }
        return true;
      });
      
      if (lastSelectedPlace?.location && unusedInPool.length > 0) {
        // Sort by distance from last place, then by score
        const withDistance = unusedInPool.map(p => ({
          place: p,
          distance: p.location 
            ? getDistance(
                lastSelectedPlace!.location!.latitude, lastSelectedPlace!.location!.longitude,
                p.location.latitude, p.location.longitude
              )
            : 999
        }));
        
        // Find nearby places (within 3km)
        const nearby = withDistance.filter(d => d.distance < 3).sort((a, b) => b.place.mustSeeScore - a.place.mustSeeScore);
        
        if (nearby.length > 0) {
          place = nearby[0].place;
          console.log(`[Clustering] Selected ${place.displayName?.text} (${nearby[0].distance.toFixed(1)}km from previous)`);
        } else {
          // No nearby places, just take highest scored
          place = unusedInPool.sort((a, b) => b.mustSeeScore - a.mustSeeScore)[0];
        }
      } else {
        // First activity of the day - take highest scored
        place = unusedInPool.sort((a, b) => b.mustSeeScore - a.mustSeeScore)[0];
      }
      
      if (!place) continue;
      
      usedAttractionIds.add(place.id);
      lastSelectedPlace = place;
      const photoRef = place.photos?.[0]?.name;
      
      // Use Google's reservable field - they know if a place takes reservations
      const needsBooking = place.reservable === true;
      
      // Find the best time when this place is actually open
      const validHours = getValidHoursForPlace(place, place.bestTimeSlot);
      // Pick the hour closest to the slot hour
      let scheduledHour = slot.hour;
      if (validHours.length > 0) {
        // Find the valid hour closest to slot.hour
        scheduledHour = validHours.reduce((closest, h) => 
          Math.abs(h - slot.hour) < Math.abs(closest - slot.hour) ? h : closest
        , validHours[0]);
      }
      
      dayActivities.push({
        id: `${city.toLowerCase().replace(/\s+/g, '-')}-day${dayNum}-${scheduledHour}-${Date.now()}`,
        name: place.displayName?.text || 'Unknown Place',
        type: getActivityType(place.types),
        description: place.editorialSummary?.text || '',
        suggestedTime: `${String(scheduledHour).padStart(2, '0')}:00`,
        openingHours: place.currentOpeningHours?.weekdayDescriptions?.[0] || '',
        openingHoursPeriods: place.currentOpeningHours?.periods, // Include raw periods for frontend validation
        neighborhood: place.formattedAddress?.split(',')[1]?.trim() || city,
        priceRange: getPriceRange(place.priceLevel),
        tags: getTags(place.types, place.displayName?.text),
        imageUrl: photoRef ? `/api/places/photo?ref=${encodeURIComponent(photoRef)}` : null,
        rating: place.rating,
        reviewCount: place.userRatingCount,
        mapsUrl: place.googleMapsUri || '',
        location: place.location,
        coordinates: place.location ? { lat: place.location.latitude, lng: place.location.longitude } : undefined,
        bookingRequired: needsBooking,
        travelTip: getTravelTip(place),
      });
      
      activityCount++;
    }
    
    // Sort activities by suggested time
    dayActivities.sort((a, b) => {
      const timeA = parseInt(a.suggestedTime.split(':')[0]);
      const timeB = parseInt(b.suggestedTime.split(':')[0]);
      return timeA - timeB;
    });
    
    // Determine day theme based on activities
    const activityTypes = dayActivities.map(a => a.tags).flat();
    let theme = 'City Exploration';
    if (activityTypes.includes('temple') || activityTypes.includes('historic')) theme = 'Cultural Heritage';
    if (activityTypes.includes('outdoors') || activityTypes.includes('nature')) theme = 'Nature & Outdoors';
    if (activityTypes.includes('museum') || activityTypes.includes('art')) theme = 'Arts & Culture';
    if (activityTypes.includes('food')) theme = 'Local Flavors';
    if (activityTypes.includes('shopping')) theme = 'Markets & Shopping';
    
    days.push({
      dayNumber: dayNum,
      theme,
      activities: dayActivities,
      cluster: clusterIndex,
    });
  }
  
  return { days };
}

export async function POST(request: NextRequest) {
  try {
    const { city, nights, country, tripStyle, interests, preferences } = await request.json();

    if (!city || !nights) {
      return NextResponse.json(
        { error: 'City and nights are required' },
        { status: 400 }
      );
    }

    console.log(`[GenerateItinerary] Request for ${city}, ${nights} nights, interests: ${(interests || []).join(', ')}`);
    
    const searchCity = country ? `${city}, ${country}` : city;

    // Fetch Google Places AND Wikivoyage recommendations in parallel
    const [attractions, restaurants, wikivoyageRecs] = await Promise.all([
      fetchPlacesForCity(searchCity, 'attraction', 25),
      fetchPlacesForCity(searchCity, 'restaurant', 15),
      getWikivoyageRecommendations(city), // Use city name without country for Wikivoyage
    ]);

    if (attractions.length === 0 && restaurants.length === 0) {
      return NextResponse.json(
        {
          error: 'Could not find places for this city',
          city: searchCity,
          apiKeyConfigured: !!GOOGLE_API_KEY,
        },
        { status: 404 }
      );
    }

    const itinerary = buildSmartItinerary(
      attractions,
      restaurants,
      nights,
      city,
      tripStyle || 'balanced',
      interests || [],
      preferences,
      wikivoyageRecs // Pass Wikivoyage recommendations to boost matching places
    );

    console.log(`[GenerateItinerary] Generated smart ${nights}-day itinerary for ${city}`);

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}
