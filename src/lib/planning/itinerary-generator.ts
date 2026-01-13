import Anthropic from '@anthropic-ai/sdk';
import type { TripDNA } from '@/types/trip-dna';

// ============ TYPES ============

export interface GeneratedActivity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife';
  description?: string;
  history?: string;              // Rich historical/cultural context (2-3 sentences)
  imageUrl?: string;

  // Scheduling
  suggestedTime?: string;        // "09:00"
  duration?: number;             // minutes
  openingHours?: string;         // "8AM-6PM"
  typicalDuration?: string;      // "People typically spend 1-2 hours here"

  // Detailed hours by day (for day-by-day availability)
  hoursPerDay?: {
    monday?: string;      // "9:00 AM - 6:00 PM" or "Closed"
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };

  // Location
  neighborhood?: string;
  address?: string;              // Full street address
  coordinates?: { lat: number; lng: number };
  walkingTimeToNext?: number;    // minutes

  // Ratings & Reviews
  rating?: number;               // Google rating (1-5)
  reviewCount?: number;          // Number of Google reviews
  tripadvisorRating?: number;    // TripAdvisor rating (1-5)
  tripadvisorReviewCount?: number;
  reviewSummary?: string;        // AI summary of reviews
  reviews?: Array<{
    source: 'google' | 'tripadvisor';
    rating: number;
    text: string;
    author: string;
    date: string;                // "2 weeks ago" or "Jan 2025"
  }>;

  // Match info
  matchScore?: number;           // 0-100
  matchReasons?: string[];       // ["Matches your love of temples", "Less crowded"]

  // Meta
  priceRange?: '$' | '$$' | '$$$' | '$$$$' | string;
  tags?: string[];

  // User-added data
  userCost?: number;             // User-entered cost in their currency
  userNotes?: string;            // User notes
  attachments?: Array<{
    type: 'ticket' | 'reservation' | 'link' | 'document';
    name: string;
    url?: string;
  }>;
}

export interface GeneratedDay {
  dayNumber: number;
  date: string;
  city: string;
  theme?: string;               // "Temple Day", "Food Tour", etc.
  activities: GeneratedActivity[];
  hotelId?: string;             // Only if user selected one
}

export interface CityAllocation {
  city: string;
  nights: number;
  startDay: number;             // Day number in trip (1-indexed)
  endDay: number;
  startDate?: string;           // ISO date if dates provided
  endDate?: string;
}

export interface GeneratedItinerary {
  dayAllocation: CityAllocation[];
  days: GeneratedDay[];
  totalDays: number;
}

// ============ RECOMMENDED NIGHTS PER CITY ============

// Base recommended nights (can be adjusted by pace preference)
const RECOMMENDED_NIGHTS: Record<string, number> = {
  // Japan
  'Tokyo': 4, 'Kyoto': 3, 'Osaka': 2, 'Hakone': 2, 'Nara': 1, 'Hiroshima': 2, 'Fukuoka': 2, 'Nikko': 1,
  // Thailand
  'Bangkok': 3, 'Chiang Mai': 3, 'Chiang Rai': 2, 'Phuket': 4, 'Krabi': 3,
  'Koh Samui': 4, 'Koh Phangan': 3, 'Koh Tao': 3, 'Koh Lanta': 3, 'Koh Phi Phi': 2,
  'Sukhothai': 1, 'Ayutthaya': 1, 'Pai': 2, 'Hua Hin': 2, 'Kanchanaburi': 2,
  // Vietnam
  'Hanoi': 3, 'Ho Chi Minh City': 3, 'Da Nang': 2, 'Hoi An': 3, 'Hue': 2,
  'Nha Trang': 3, 'Ha Long Bay': 2, 'Ninh Binh': 2, 'Sapa': 2,
  // Hawaii
  'Honolulu': 4, 'Maui': 4, 'Kauai': 3, 'Big Island': 3,
  // Spain
  'Barcelona': 4, 'Madrid': 3, 'Seville': 3, 'Valencia': 2, 'Granada': 2,
  'San Sebastian': 2, 'Bilbao': 2, 'Malaga': 2, 'Toledo': 1, 'Cordoba': 1,
  // Portugal
  'Lisbon': 4, 'Porto': 3, 'Lagos': 3, 'Sintra': 1, 'Cascais': 1, 'Faro': 2,
  // France
  'Paris': 4, 'Nice': 3, 'Lyon': 2, 'Marseille': 2,
  // Italy
  'Rome': 4, 'Florence': 3, 'Venice': 2, 'Milan': 2, 'Naples': 2, 'Amalfi': 3,
  // Greece
  'Athens': 3, 'Santorini': 3, 'Mykonos': 3,
  // Turkey
  'Istanbul': 4, 'Cappadocia': 3, 'Antalya': 4,
};

// Default nights for unknown cities
const DEFAULT_NIGHTS = 2;

// Export for UI access
export { RECOMMENDED_NIGHTS, DEFAULT_NIGHTS };

// ============ DAY ALLOCATION ============

/**
 * Allocate trip days across cities based on:
 * 1. Recommended nights per city (from database)
 * 2. TripDNA pace preference (relaxed = more nights, fast = fewer)
 * 3. Total available days
 */
export function allocateDays(
  cities: string[],
  totalDays: number,
  tripDna: TripDNA | null | undefined,
  startDate?: string
): CityAllocation[] {
  if (cities.length === 0) return [];

  // Get pace multiplier (default to balanced if tripDna not available)
  const paceMultiplier = getPaceMultiplier(tripDna?.vibeAndPace?.tripPace || 'balanced');

  // Calculate base allocation
  const baseAllocations = cities.map(city => {
    const baseNights = RECOMMENDED_NIGHTS[city] || DEFAULT_NIGHTS;
    return {
      city,
      nights: Math.round(baseNights * paceMultiplier),
    };
  });

  // Calculate total base nights
  const totalBaseNights = baseAllocations.reduce((sum, a) => sum + a.nights, 0);

  // Scale allocations to fit total days
  const scaleFactor = totalDays / totalBaseNights;
  const allocations = baseAllocations.map(a => ({
    city: a.city,
    nights: Math.max(1, Math.round(a.nights * scaleFactor)),
  }));

  // Adjust to exactly match totalDays
  let currentTotal = allocations.reduce((sum, a) => sum + a.nights, 0);

  while (currentTotal !== totalDays) {
    if (currentTotal < totalDays) {
      // Add nights to cities with most recommended nights first
      const sortedByRecommended = [...allocations].sort((a, b) =>
        (RECOMMENDED_NIGHTS[b.city] || DEFAULT_NIGHTS) - (RECOMMENDED_NIGHTS[a.city] || DEFAULT_NIGHTS)
      );
      for (const alloc of sortedByRecommended) {
        if (currentTotal >= totalDays) break;
        alloc.nights += 1;
        currentTotal += 1;
      }
    } else {
      // Remove nights from cities with fewer recommended nights first
      const sortedByRecommended = [...allocations].sort((a, b) =>
        (RECOMMENDED_NIGHTS[a.city] || DEFAULT_NIGHTS) - (RECOMMENDED_NIGHTS[b.city] || DEFAULT_NIGHTS)
      );
      for (const alloc of sortedByRecommended) {
        if (currentTotal <= totalDays) break;
        if (alloc.nights > 1) {
          alloc.nights -= 1;
          currentTotal -= 1;
        }
      }
    }
  }

  // Calculate day numbers and dates
  let currentDay = 1;
  const start = startDate ? new Date(startDate) : undefined;

  const result: CityAllocation[] = allocations.map(alloc => {
    const startDayNum = currentDay;
    const endDayNum = currentDay + alloc.nights - 1;
    currentDay = endDayNum + 1;

    const allocation: CityAllocation = {
      city: alloc.city,
      nights: alloc.nights,
      startDay: startDayNum,
      endDay: endDayNum,
    };

    // Add dates if start date provided
    if (start) {
      const allocStartDate = new Date(start);
      allocStartDate.setDate(start.getDate() + startDayNum - 1);
      allocation.startDate = allocStartDate.toISOString().split('T')[0];

      const allocEndDate = new Date(start);
      allocEndDate.setDate(start.getDate() + endDayNum - 1);
      allocation.endDate = allocEndDate.toISOString().split('T')[0];
    }

    return allocation;
  });

  return result;
}

/**
 * Get pace multiplier based on trip pace preference
 */
function getPaceMultiplier(pace: 'relaxed' | 'balanced' | 'fast'): number {
  switch (pace) {
    case 'relaxed': return 1.3;  // 30% more nights
    case 'balanced': return 1.0; // Standard
    case 'fast': return 0.7;     // 30% fewer nights
    default: return 1.0;
  }
}

// ============ IMAGE GENERATION ============

// Get activity image from Unsplash based on type and name
function getActivityImage(name: string, type: GeneratedActivity['type'], city: string): string {
  const typeKeywords: Record<string, string> = {
    'attraction': 'landmark+temple+monument',
    'restaurant': 'restaurant+food+dining',
    'cafe': 'cafe+coffee+bakery',
    'activity': 'adventure+tour+experience',
    'nightlife': 'bar+nightclub+night',
  };

  const keyword = typeKeywords[type] || 'travel';
  const seed = `${name}-${city}`.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return `https://source.unsplash.com/600x400/?${keyword}&sig=${seed}`;
}

// ============ FULL ITINERARY GENERATION ============

/**
 * Generate a complete itinerary for all days
 */
export async function generateFullItinerary(
  cities: string[],
  totalDays: number,
  tripDna: TripDNA,
  startDate?: string
): Promise<GeneratedItinerary> {
  // First allocate days
  const dayAllocation = allocateDays(cities, totalDays, tripDna, startDate);

  // Generate activities for each day using AI
  const client = new Anthropic();

  // Build preference context
  const preferences = buildPreferenceContext(tripDna);

  // Generate for each city segment
  const allDays: GeneratedDay[] = [];

  for (const allocation of dayAllocation) {
    const cityDays = await generateCityDays(
      client,
      allocation,
      tripDna,
      preferences,
      allDays.length
    );
    allDays.push(...cityDays);
  }

  return {
    dayAllocation,
    days: allDays,
    totalDays,
  };
}

/**
 * Build preference context string from TripDNA
 */
function buildPreferenceContext(tripDna: TripDNA): string {
  const parts: string[] = [];

  // Party type
  parts.push(`Traveling as: ${tripDna.travelerProfile.partyType}`);
  if (tripDna.travelerProfile.partySize) {
    parts.push(`Party size: ${tripDna.travelerProfile.partySize}`);
  }

  // Travel identities/interests
  if (tripDna.travelerProfile.travelIdentities.length > 0) {
    parts.push(`Key interests: ${tripDna.travelerProfile.travelIdentities.join(', ')}`);
  }

  // Pace
  parts.push(`Pace: ${tripDna.vibeAndPace.tripPace}`);
  parts.push(`Activities per day: ${tripDna.vibeAndPace.activitiesPerDay.min}-${tripDna.vibeAndPace.activitiesPerDay.max}`);

  // Energy pattern
  parts.push(`Energy pattern: ${tripDna.vibeAndPace.energyPattern}`);

  // Budget
  const budget = tripDna.constraints.budget;
  parts.push(`Daily budget: $${budget.dailySpend.min}-${budget.dailySpend.max}`);
  if (budget.splurgeMoments > 2) {
    parts.push(`Open to splurge experiences: ${budget.splurgeCategories?.join(', ') || 'food, experience'}`);
  }

  // Food
  parts.push(`Food importance: ${tripDna.interests.food.importance}`);
  if (tripDna.interests.food.cuisinePreferences?.length) {
    parts.push(`Cuisine preferences: ${tripDna.interests.food.cuisinePreferences.join(', ')}`);
  }
  if (tripDna.interests.food.dietaryRestrictions?.length) {
    parts.push(`Dietary restrictions: ${tripDna.interests.food.dietaryRestrictions.join(', ')}`);
  }

  // Hobbies
  if (tripDna.interests.hobbies.length > 0) {
    parts.push(`Hobbies: ${tripDna.interests.hobbies.join(', ')}`);
  }

  // Avoidances
  if (tripDna.interests.avoid?.length) {
    parts.push(`Avoid: ${tripDna.interests.avoid.join(', ')}`);
  }

  return parts.join('\n');
}

/**
 * Generate days for a single city
 */
async function generateCityDays(
  client: Anthropic,
  allocation: CityAllocation,
  tripDna: TripDNA,
  preferences: string,
  dayOffset: number
): Promise<GeneratedDay[]> {
  const activitiesPerDay = tripDna.vibeAndPace.activitiesPerDay;
  const targetActivities = Math.round((activitiesPerDay.min + activitiesPerDay.max) / 2);

  const prompt = `Generate a ${allocation.nights}-day itinerary for ${allocation.city}.

TRAVELER PROFILE:
${preferences}

CRITICAL RULES:
1. NEVER repeat the same place/restaurant/attraction across different days
2. Each day MUST have a unique theme (e.g., "Temple Day", "Local Eats", "Art & Culture", "Market Adventure", "Nature Escape")
3. Vary the daily rhythm - not every day should follow the same pattern
4. Consider the trip arc: Day 1 = iconic highlights, Middle days = deeper exploration, Last day = relaxed/farewell

For each day, provide ${targetActivities} UNIQUE activities/meals. Include mix of:
- Major attractions OR hidden gems (alternate between popular and off-beaten-path)
- Different food experiences each day (fine dining, street food, local cafes, markets)
- Unique activities matching the day's theme

Time of day considerations:
- Temples/parks: early morning (before crowds)
- Markets: morning (freshest)
- Museums/indoor: midday (avoid heat)
- Neighborhoods/walking: afternoon
- Food/nightlife: evening

Use REAL places that exist in ${allocation.city}. Be specific with neighborhoods and addresses.

Return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "days": [
    {
      "dayNumber": 1,
      "theme": "Temple Discovery",
      "activities": [
        {
          "name": "Grand Palace",
          "type": "attraction",
          "description": "Thailand's most famous landmark with stunning architecture and intricate details",
          "history": "Built in 1782 when King Rama I moved the capital to Bangkok, the Grand Palace served as the official residence of Thai kings for 150 years. The complex showcases the finest examples of Thai craftsmanship, blending traditional Thai and European architecture. The Emerald Buddha temple within the grounds houses Thailand's most sacred Buddha image, carved from a single block of jade.",
          "suggestedTime": "09:00",
          "duration": 120,
          "openingHours": "8:30AM-3:30PM",
          "typicalDuration": "People typically spend 2-3 hours here",
          "hoursPerDay": {
            "monday": "8:30 AM - 3:30 PM",
            "tuesday": "8:30 AM - 3:30 PM",
            "wednesday": "8:30 AM - 3:30 PM",
            "thursday": "8:30 AM - 3:30 PM",
            "friday": "8:30 AM - 3:30 PM",
            "saturday": "8:30 AM - 3:30 PM",
            "sunday": "8:30 AM - 3:30 PM"
          },
          "neighborhood": "Rattanakosin",
          "address": "Na Phra Lan Rd, Phra Borom Maha Ratchawang, Bangkok 10200",
          "rating": 4.6,
          "reviewCount": 45823,
          "tripadvisorRating": 4.5,
          "tripadvisorReviewCount": 32156,
          "reviewSummary": "Visitors praise the stunning architecture and rich history, but note it can be crowded and hot. Best to arrive early morning.",
          "reviews": [
            {
              "source": "google",
              "rating": 5,
              "text": "Absolutely stunning palace complex. The intricate details are incredible.",
              "author": "Sarah M.",
              "date": "2 weeks ago"
            },
            {
              "source": "tripadvisor",
              "rating": 4,
              "text": "Beautiful but very crowded. Go early to avoid the heat and crowds.",
              "author": "TravelLover123",
              "date": "Jan 2025"
            }
          ],
          "priceRange": "$$",
          "matchScore": 92,
          "matchReasons": ["Matches your interest in history", "Must-see landmark"],
          "tags": ["temple", "history", "photography"]
        }
      ]
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text) as {
        days: Array<{
          dayNumber: number;
          theme?: string;
          activities: Array<{
            name: string;
            type: GeneratedActivity['type'];
            description: string;
            suggestedTime: string;
            duration: number;
            openingHours?: string;
            typicalDuration?: string;
            history?: string;
            hoursPerDay?: GeneratedActivity['hoursPerDay'];
            neighborhood: string;
            address?: string;
            rating?: number;
            reviewCount?: number;
            tripadvisorRating?: number;
            tripadvisorReviewCount?: number;
            reviewSummary?: string;
            reviews?: GeneratedActivity['reviews'];
            priceRange?: '$' | '$$' | '$$$' | '$$$$';
            matchScore: number;
            matchReasons: string[];
            tags: string[];
          }>;
        }>;
      };

      // Transform to GeneratedDay format
      return parsed.days.map((day, idx) => {
        const globalDayNumber = dayOffset + idx + 1;
        const date = allocation.startDate
          ? addDays(allocation.startDate, idx)
          : '';

        // Add walking times between activities
        const activitiesWithWalking = day.activities.map((activity, actIdx) => {
          const generatedActivity: GeneratedActivity = {
            id: `${allocation.city.toLowerCase().replace(/\s+/g, '-')}-day${globalDayNumber}-${actIdx}`,
            name: activity.name,
            type: activity.type,
            description: activity.description,
            imageUrl: getActivityImage(activity.name, activity.type, allocation.city),
            suggestedTime: activity.suggestedTime,
            duration: activity.duration,
            openingHours: activity.openingHours,
            typicalDuration: activity.typicalDuration,
            history: activity.history,
            hoursPerDay: activity.hoursPerDay,
            neighborhood: activity.neighborhood,
            address: activity.address,
            rating: activity.rating,
            reviewCount: activity.reviewCount,
            tripadvisorRating: activity.tripadvisorRating,
            tripadvisorReviewCount: activity.tripadvisorReviewCount,
            reviewSummary: activity.reviewSummary,
            reviews: activity.reviews,
            matchScore: activity.matchScore,
            matchReasons: activity.matchReasons,
            priceRange: activity.priceRange,
            tags: activity.tags,
          };

          // Estimate walking time to next activity
          if (actIdx < day.activities.length - 1) {
            const nextActivity = day.activities[actIdx + 1];
            generatedActivity.walkingTimeToNext = estimateWalkingTime(
              activity.neighborhood,
              nextActivity.neighborhood
            );
          }

          return generatedActivity;
        });

        return {
          dayNumber: globalDayNumber,
          date,
          city: allocation.city,
          theme: day.theme,
          activities: activitiesWithWalking,
        };
      });
    }
  } catch (error) {
    console.error(`Error generating itinerary for ${allocation.city}:`, error);
  }

  // Fallback: return placeholder days
  return Array.from({ length: allocation.nights }, (_, idx) => ({
    dayNumber: dayOffset + idx + 1,
    date: allocation.startDate ? addDays(allocation.startDate, idx) : '',
    city: allocation.city,
    theme: `Day ${idx + 1} in ${allocation.city}`,
    activities: [],
  }));
}

/**
 * Estimate walking time between neighborhoods
 */
function estimateWalkingTime(from: string, to: string): number {
  if (from.toLowerCase() === to.toLowerCase()) {
    return 5 + Math.floor(Math.random() * 10); // 5-15 min same neighborhood
  }
  return 15 + Math.floor(Math.random() * 15); // 15-30 min different neighborhood
}

/**
 * Add days to a date string
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// ============ ALTERNATIVES GENERATION ============

/**
 * Generate alternative activities for swapping
 */
export async function generateAlternatives(
  activityId: string,
  activityName: string,
  activityType: GeneratedActivity['type'],
  city: string,
  tripDna: TripDNA,
  currentDayActivities: string[]
): Promise<GeneratedActivity[]> {
  const client = new Anthropic();
  const preferences = buildPreferenceContext(tripDna);

  const prompt = `Suggest 4 alternatives to "${activityName}" (${activityType}) in ${city}.

TRAVELER PROFILE:
${preferences}

AVOID (already in today's plan):
${currentDayActivities.join(', ')}

Include:
- 2 similar alternatives (same type/category)
- 2 different alternatives (unexpected discoveries that match their interests)

Return ONLY valid JSON (no markdown):
{
  "alternatives": [
    {
      "name": "Wat Arun",
      "type": "attraction",
      "description": "Stunning riverside temple with unique spires",
      "suggestedTime": "09:00",
      "duration": 90,
      "openingHours": "8AM-6PM",
      "neighborhood": "Thonburi",
      "priceRange": "$",
      "matchScore": 88,
      "matchReasons": ["Less crowded alternative", "Beautiful for photography"],
      "tags": ["temple", "river", "photography"]
    }
  ]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = JSON.parse(content.text) as {
        alternatives: Array<{
          name: string;
          type: GeneratedActivity['type'];
          description: string;
          suggestedTime: string;
          duration: number;
          openingHours?: string;
          neighborhood: string;
          priceRange?: '$' | '$$' | '$$$' | '$$$$';
          matchScore: number;
          matchReasons: string[];
          tags: string[];
        }>;
      };

      return parsed.alternatives.map((alt, idx) => ({
        id: `alt-${activityId}-${idx}`,
        name: alt.name,
        type: alt.type,
        description: alt.description,
        imageUrl: getActivityImage(alt.name, alt.type, city),
        suggestedTime: alt.suggestedTime,
        duration: alt.duration,
        openingHours: alt.openingHours,
        neighborhood: alt.neighborhood,
        matchScore: alt.matchScore,
        matchReasons: alt.matchReasons,
        priceRange: alt.priceRange,
        tags: alt.tags,
      }));
    }
  } catch (error) {
    console.error('Error generating alternatives:', error);
  }

  return [];
}
