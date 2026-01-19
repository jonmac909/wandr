import { NextRequest, NextResponse } from 'next/server';
import { supabasePlaces } from '@/lib/db/supabase';

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
function calculateMustSeeScore(place: PlaceResult): number {
  const rating = place.rating || 0;
  const reviewCount = place.userRatingCount || 0;
  
  // Score = rating * log(reviewCount + 1) * type_multiplier
  // This favors highly-rated places with many reviews
  let score = rating * Math.log10(reviewCount + 1);
  
  // Boost famous landmark types
  const types = place.types || [];
  if (types.includes('tourist_attraction')) score *= 1.3;
  if (types.includes('landmark') || types.includes('historical_landmark')) score *= 1.4;
  if (types.includes('world_heritage_site')) score *= 1.5;
  if (types.includes('museum')) score *= 1.2;
  
  return Math.round(score * 10);
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
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.editorialSummary,places.currentOpeningHours,places.googleMapsUri,places.photos,places.primaryType,places.types,places.priceLevel,places.location,places.reservable',
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
    console.log(`[GenerateItinerary] Got ${places.length} ${type}s for ${city} from Google Places API`);

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

function getTags(types: string[] | undefined): string[] {
  if (!types) return ['attraction'];
  const tagMap: Record<string, string> = {
    'tourist_attraction': 'must-see',
    'museum': 'museum',
    'temple': 'temple',
    'church': 'church',
    'park': 'outdoors',
    'restaurant': 'food',
    'cafe': 'coffee',
    'bar': 'nightlife',
    'shopping_mall': 'shopping',
    'beach': 'beach',
    'hiking_area': 'nature',
    'spa': 'wellness',
    'art_gallery': 'art',
    'historical_landmark': 'historic',
    'landmark': 'landmark',
  };

  const tags: string[] = [];
  for (const type of types) {
    if (tagMap[type]) tags.push(tagMap[type]);
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
  preferences?: { avoid?: string[] }
) {
  const activitiesPerDay = tripStyle === 'relaxed' ? 3 : tripStyle === 'packed' ? 5 : 4;
  
  // Score and enhance all places
  const scoredAttractions: ScoredPlace[] = attractions
    .filter(p => p.photos?.[0]?.name) // Must have photo
    .map(place => ({
      ...place,
      mustSeeScore: calculateMustSeeScore(place),
      warnings: getWarnings(place, preferences),
      bestTimeSlot: determineBestTimeSlot(place),
    }))
    .sort((a, b) => b.mustSeeScore - a.mustSeeScore); // Sort by must-see score
  
  const scoredRestaurants: ScoredPlace[] = restaurants
    .filter(p => p.photos?.[0]?.name)
    .map(place => ({
      ...place,
      mustSeeScore: calculateMustSeeScore(place),
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
    
    // Separate by time slot
    const morningPlaces = attractionsPool.filter(p => p.bestTimeSlot === 'morning' || p.bestTimeSlot === 'anytime');
    const afternoonPlaces = attractionsPool.filter(p => p.bestTimeSlot === 'afternoon' || p.bestTimeSlot === 'anytime');
    const eveningPlaces = attractionsPool.filter(p => p.bestTimeSlot === 'evening' || p.bestTimeSlot === 'anytime');
    
    // Schedule: morning activity, lunch, afternoon activity, dinner, evening activity
    const timeSlots = [
      { hour: 9, pool: morningPlaces, isRestaurant: false },
      { hour: 12, pool: scoredRestaurants, isRestaurant: true },
      { hour: 14, pool: afternoonPlaces, isRestaurant: false },
      { hour: 18, pool: scoredRestaurants, isRestaurant: true },
      { hour: 20, pool: eveningPlaces, isRestaurant: false },
    ];
    
    // Adjust for trip style
    const slotsToUse = tripStyle === 'relaxed' 
      ? timeSlots.filter((_, i) => i !== 4) // Skip evening activity
      : tripStyle === 'packed'
      ? timeSlots
      : timeSlots.filter((_, i) => i !== 2); // Skip afternoon activity for balanced
    
    for (const slot of slotsToUse) {
      const usedIds = slot.isRestaurant ? usedRestaurantIds : usedAttractionIds;
      const available = slot.pool.filter(p => !usedIds.has(p.id));
      
      if (available.length === 0) continue;
      
      const place = available[0]; // Take highest-scored available
      usedIds.add(place.id);
      
      const duration = slot.isRestaurant ? 60 : 90;
      const photoRef = place.photos?.[0]?.name;
      
      dayActivities.push({
        id: `${city.toLowerCase().replace(/\s+/g, '-')}-day${dayNum}-${slot.hour}-${Date.now()}`,
        name: place.displayName?.text || 'Unknown Place',
        type: getActivityType(place.types),
        description: place.editorialSummary?.text || `Popular spot in ${city}`,
        suggestedTime: `${String(slot.hour).padStart(2, '0')}:00`,
        duration,
        openingHours: place.currentOpeningHours?.weekdayDescriptions?.[0] || '',
        neighborhood: place.formattedAddress?.split(',')[1]?.trim() || city,
        priceRange: getPriceRange(place.priceLevel),
        tags: getTags(place.types),
        walkingTimeToNext: 15,
        imageUrl: photoRef ? `/api/places/photo?ref=${encodeURIComponent(photoRef)}` : null,
        rating: place.rating || 4.5,
        reviewCount: place.userRatingCount || 0,
        mapsUrl: place.googleMapsUri || '',
        matchScore: Math.min(99, 70 + Math.floor(place.mustSeeScore / 2)),
        matchReasons: place.mustSeeScore > 50 ? ['Must-see attraction', 'Highly rated'] : ['Popular with travelers'],
        warnings: place.warnings,
        mustSee: place.mustSeeScore > 40,
        location: place.location,
      });
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
    const { city, nights, country, tripStyle, preferences } = await request.json();

    if (!city || !nights) {
      return NextResponse.json(
        { error: 'City and nights are required' },
        { status: 400 }
      );
    }

    const searchCity = country ? `${city}, ${country}` : city;

    const [attractions, restaurants] = await Promise.all([
      fetchPlacesForCity(searchCity, 'attraction', 25),
      fetchPlacesForCity(searchCity, 'restaurant', 15),
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
      preferences
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
