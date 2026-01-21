import type { TripDNA } from '@/types/trip-dna';
import { addDaysToIso } from '@/lib/dates';
import { allocateDays, type CityAllocation } from '@/lib/planning/itinerary-allocations';

// ============ TYPES ============

export interface GeneratedActivity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife' | 'flight' | 'train' | 'bus' | 'drive' | 'transit' | 'note';

  // Note-specific fields (for imported notes like "Early dinner", "Rest day")
  isNote?: boolean;
  noteType?: 'transport' | 'arrival' | 'arrive' | 'meal' | 'rest' | 'explore' | 'vague' | 'general';

  // Transport-specific fields (when type is flight/train/bus/drive/transit)
  transportDetails?: {
    from: string;           // Origin city/airport
    to: string;             // Destination city/airport
    departureTime?: string; // "09:00"
    arrivalTime?: string;   // "14:30"
    operator?: string;      // "Thai Airways", "Green Bus"
    bookingRef?: string;    // Booking confirmation number
    distance?: number;      // km
  };
  description?: string;
  history?: string;              // Rich historical/cultural context (2-3 sentences)
  imageUrl?: string | null;

  // Scheduling
  suggestedTime?: string;        // "09:00"
  duration?: number;             // minutes
  openingHours?: string;         // "8AM-6PM"
  typicalDuration?: string;      // "People typically spend 1-2 hours here"
  
  // Structured opening hours from Google (for closed/open validation)
  openingHoursPeriods?: Array<{
    open: { day: number; hour: number; minute: number };
    close?: { day: number; hour: number; minute: number };
  }>;

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
  mapsUrl?: string;

  // User-added data
  userCost?: number;             // User-entered cost in their currency
  userNotes?: string;            // User notes
  attachments?: Array<{
    type: 'ticket' | 'reservation' | 'link' | 'document';
    name: string;
    url?: string;
  }>;

  // Booking/Reservation
  bookingRequired?: boolean;     // Whether booking is required
  reservationStatus?: 'not-started' | 'done' | 'pending' | 'cancelled';
  bookingUrl?: string;           // URL for booking
  
  // Travel wisdom (real tips, not made up)
  travelTip?: string;            // e.g., "Best visited early morning to avoid crowds"
}

export interface GeneratedDay {
  dayNumber: number;
  date: string;
  city: string;
  theme?: string;               // "Temple Day", "Food Tour", etc.
  activities: GeneratedActivity[];
  hotelId?: string;             // Only if user selected one
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
export function allocateTripDays(
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

// ============ UTILITY FUNCTIONS ============

/**
 * Add days to a date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

/**
 * Estimate walking time between neighborhoods
 */
export function estimateWalkingTime(from: string, to: string): number {
  if (from.toLowerCase() === to.toLowerCase()) {
    return 5 + Math.floor(Math.random() * 10); // 5-15 min same neighborhood
  }
  return 15 + Math.floor(Math.random() * 15); // 15-30 min different neighborhood
}
