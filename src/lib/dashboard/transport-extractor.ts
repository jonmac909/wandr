// Extract transport information from itineraries

import type { Itinerary, Movement, Activity, DayPlan } from '@/types/itinerary';

export interface ExtractedTransport {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'ferry' | 'car' | 'other';
  from: string;
  to: string;
  departureTime?: string;
  arrivalTime?: string;
  duration: number; // minutes
  carrier?: string;
  date: string;
  isPaid: boolean;
  price?: number;
  currency?: string;
}

/**
 * Get location name from base ID
 */
function getBaseLocation(itinerary: Itinerary, baseId: string): string {
  const base = itinerary.route?.bases?.find(b => b.id === baseId);
  if (base) {
    // Extract city name (first part before comma)
    const parts = base.location.split(',');
    return parts[0].trim();
  }
  return baseId;
}

/**
 * Extract carrier name from activity name
 * e.g., "Air Transat Flight to Rome" -> "Air Transat"
 */
function extractCarrier(name: string): string | undefined {
  // Common airline patterns
  const airlinePatterns = [
    /^(.*?)\s+flight/i,
    /^(.*?)\s+to\s+/i,
    /fly\s+(.*?)\s+/i,
  ];

  for (const pattern of airlinePatterns) {
    const match = name.match(pattern);
    if (match && match[1]) {
      const carrier = match[1].trim();
      // Filter out common words that aren't airlines
      if (!['take', 'book', 'catch'].includes(carrier.toLowerCase())) {
        return carrier;
      }
    }
  }

  return undefined;
}

/**
 * Parse time from activity description
 * e.g., "07:20" or "7:20 AM"
 */
function parseTimeFromDescription(description: string): { departure?: string; arrival?: string } {
  const times: string[] = [];

  // Match time patterns like "07:20", "7:20", "7:20 AM", "19:30"
  const timePattern = /\b(\d{1,2}):(\d{2})(?:\s*(AM|PM))?\b/gi;
  let match;

  while ((match = timePattern.exec(description)) !== null) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const meridiem = match[3]?.toUpperCase();

    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    times.push(`${hours.toString().padStart(2, '0')}:${minutes}`);
  }

  return {
    departure: times[0],
    arrival: times[1],
  };
}

/**
 * Convert transport mode to ExtractedTransport type
 */
function normalizeTransportType(mode: string): ExtractedTransport['type'] {
  const normalized = mode.toLowerCase();
  if (['flight', 'plane', 'air'].some(t => normalized.includes(t))) return 'flight';
  if (['train', 'rail'].some(t => normalized.includes(t))) return 'train';
  if (['bus', 'coach'].some(t => normalized.includes(t))) return 'bus';
  if (['ferry', 'boat', 'ship'].some(t => normalized.includes(t))) return 'ferry';
  if (['car', 'drive', 'rental'].some(t => normalized.includes(t))) return 'car';
  return 'other';
}

/**
 * Extract transport from a single movement
 */
function extractFromMovement(itinerary: Itinerary, movement: Movement): ExtractedTransport {
  return {
    id: movement.id,
    type: normalizeTransportType(movement.transportType),
    from: getBaseLocation(itinerary, movement.from),
    to: getBaseLocation(itinerary, movement.to),
    duration: movement.duration,
    date: movement.date,
    isPaid: false, // Movements don't have payment status
    price: movement.cost?.amount,
    currency: movement.cost?.currency,
  };
}

/**
 * Extract transport from a flight/transit activity
 */
function extractFromActivity(activity: Activity, date: string): ExtractedTransport | null {
  // Only process flight or transit activities
  if (activity.category !== 'flight' && activity.category !== 'transit') {
    return null;
  }

  const times = parseTimeFromDescription(activity.description || activity.name);

  // Try to extract from/to from location or description
  let from = '';
  let to = '';

  // Parse "City to City" pattern from name or description
  const routePattern = /(.+?)\s+to\s+(.+)/i;
  const nameMatch = activity.name.match(routePattern);
  const descMatch = activity.description?.match(routePattern);

  if (nameMatch) {
    from = nameMatch[1].replace(/^(fly|flight|train|bus)\s+/i, '').trim();
    to = nameMatch[2].split(/[,@]/)[0].trim();
  } else if (descMatch) {
    from = descMatch[1].trim();
    to = descMatch[2].split(/[,@]/)[0].trim();
  } else if (activity.location?.name) {
    to = activity.location.name;
  }

  return {
    id: activity.id,
    type: activity.category === 'flight' ? 'flight' : normalizeTransportType(activity.transport || 'other'),
    from,
    to,
    departureTime: activity.scheduledTime || times.departure,
    arrivalTime: times.arrival,
    duration: activity.duration,
    date,
    carrier: extractCarrier(activity.name),
    isPaid: activity.reservationStatus === 'done',
    price: activity.cost?.amount,
    currency: activity.cost?.currency,
  };
}

/**
 * Extract all transport from an itinerary
 */
export function extractTransportFromItinerary(itinerary: Itinerary | null | undefined): ExtractedTransport[] {
  if (!itinerary) return [];

  const transport: ExtractedTransport[] = [];

  // 1. Extract from movements
  if (itinerary.route?.movements) {
    itinerary.route.movements.forEach(movement => {
      transport.push(extractFromMovement(itinerary, movement));
    });
  }

  // 2. Extract from day activities with category 'flight' or 'transit'
  if (itinerary.days) {
    itinerary.days.forEach((day: DayPlan) => {
      day.blocks?.forEach(block => {
        if (block.activity) {
          const extracted = extractFromActivity(block.activity, day.date);
          if (extracted) {
            // Avoid duplicates with movements
            const isDuplicate = transport.some(t =>
              t.date === extracted.date &&
              t.from === extracted.from &&
              t.to === extracted.to
            );
            if (!isDuplicate) {
              transport.push(extracted);
            }
          }
        }
      });
    });
  }

  // Sort by date
  transport.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return transport;
}

/**
 * Get upcoming transport (after today)
 */
export function getUpcomingTransport(itinerary: Itinerary | null | undefined): ExtractedTransport[] {
  const all = extractTransportFromItinerary(itinerary);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return all.filter(t => new Date(t.date) >= today);
}
