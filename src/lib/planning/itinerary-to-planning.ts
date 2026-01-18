// Convert existing Itinerary data to PlanningItem format for the Planning View

import type { Itinerary, Base, Activity, FoodRecommendation } from '@/types/itinerary';
import type { PlanningItem } from '@/components/planning/PlanningTripToggle';

/**
 * Returns empty string - components should fetch real images async
 * from /api/site-image or /api/city-image endpoints
 */
function getPlaceholderImage(): string {
  return '';
}

/**
 * Converts an existing Itinerary into PlanningItem[] format
 * All existing items are marked as selected (isFavorited = true)
 * Day assignments are preserved from the itinerary
 *
 * IMPORTANT: Existing flights and hotels are LOCKED by default
 * to prevent accidental modification. User can only ADD new items.
 */
export function itineraryToPlanningItems(itinerary: Itinerary | null | undefined): PlanningItem[] {
  if (!itinerary) return [];

  const items: PlanningItem[] = [];

  // 1. Extract CITIES from route.bases (cities are locked - can't remove destinations)
  const citySet = new Set<string>();
  itinerary.route.bases.forEach((base) => {
    const cityName = base.location;
    if (!citySet.has(cityName)) {
      citySet.add(cityName);
      items.push({
        id: `city-${base.id}`,
        name: cityName,
        description: base.rationale || `${base.nights} nights in ${cityName}`,
        imageUrl: getPlaceholderImage(),
        category: 'activities', // Cities are a special case
        tags: ['cities'],
        isFavorited: true,
        isLocked: true, // Cities are locked - part of the route
        // Cities aren't assigned to specific days
      });
    }
  });

  // 2. Extract HOTELS from route.bases (LOCKED - booked accommodations)
  itinerary.route.bases.forEach((base) => {
    if (base.accommodation?.name) {
      items.push({
        id: `hotel-${base.id}`,
        name: base.accommodation.name,
        description: `${base.accommodation.type} in ${base.location}`,
        imageUrl: getPlaceholderImage(),
        category: 'hotels',
        priceInfo: base.accommodation.priceRange,
        neighborhood: base.location,
        tags: ['hotels'],
        isFavorited: true,
        isLocked: true, // Hotels are LOCKED - booked
        // Hotels span multiple days, don't assign to single day
      });
    }
  });

  // 3. Extract ACTIVITIES from days
  itinerary.days.forEach((day, dayIndex) => {
    day.blocks.forEach((block, blockIndex) => {
      if (block.activity) {
        const activity = block.activity;
        const category = mapActivityCategory(activity.category);

        // Flights and transit are LOCKED (booked)
        // Other activities inherit lock status from the block
        const isFlightOrTransit = activity.category === 'flight' || activity.category === 'transit';
        const shouldLock = isFlightOrTransit || block.isLocked;

        items.push({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          imageUrl: getPlaceholderImage(),
          category,
          rating: undefined,
          priceInfo: activity.cost ? `${activity.cost.currency} ${activity.cost.amount}` : undefined,
          hours: activity.scheduledTime,
          duration: activity.duration,
          tips: activity.tips,
          neighborhood: activity.location?.name,
          tags: [category, ...activity.tags],
          isFavorited: true,
          isLocked: shouldLock, // Flights/transit are always locked
          dayAssigned: dayIndex,
          orderInDay: blockIndex,
        });
      }
    });
  });

  // 4. Extract RESTAURANTS from foodLayer (not locked by default - can modify)
  itinerary.foodLayer.forEach((food) => {
    // Find which day this food recommendation is for
    const dayIndex = food.dayId
      ? itinerary.days.findIndex(d => d.id === food.dayId)
      : undefined;

    items.push({
      id: food.id,
      name: food.name,
      description: food.notes || `${food.cuisine} cuisine`,
      imageUrl: getPlaceholderImage(),
      category: 'restaurants',
      priceInfo: food.priceRange,
      neighborhood: food.location?.name,
      tags: ['restaurants', food.type, food.cuisine],
      isFavorited: true,
      isLocked: food.reservationRequired, // Lock if reservation required (booked)
      dayAssigned: dayIndex !== undefined && dayIndex >= 0 ? dayIndex : undefined,
    });
  });

  return items;
}

/**
 * Maps Itinerary ActivityCategory to PlanningItem category
 */
function mapActivityCategory(category: Activity['category']): PlanningItem['category'] {
  switch (category) {
    case 'food':
      return 'restaurants';
    case 'accommodation':
      return 'hotels';
    case 'flight':
    case 'transit':
      return 'transit';
    default:
      return 'activities';
  }
}

/**
 * Extracts unique cities from an itinerary
 */
export function extractCitiesFromItinerary(itinerary: Itinerary | null | undefined): string[] {
  if (!itinerary) return [];

  const cities: string[] = [];
  const seen = new Set<string>();

  itinerary.route.bases.forEach((base) => {
    if (!seen.has(base.location)) {
      seen.add(base.location);
      cities.push(base.location);
    }
  });

  return cities;
}

/**
 * Gets the duration (number of days) from an itinerary
 */
export function getItineraryDuration(itinerary: Itinerary | null | undefined): number {
  if (!itinerary) return 7; // Default
  return itinerary.meta.totalDays || itinerary.days.length || 7;
}

/**
 * Converts PlanningItem[] back to Itinerary format (for saving)
 * This merges planning changes into the existing itinerary
 */
export function planningItemsToItinerary(
  items: PlanningItem[],
  existingItinerary: Itinerary
): Itinerary {
  // Create a copy of the existing itinerary
  const updated = { ...existingItinerary, updatedAt: new Date() };

  // Update days with new activity assignments
  updated.days = updated.days.map((day, dayIndex) => {
    // Get items assigned to this day, sorted by order
    const dayItems = items
      .filter(item => item.dayAssigned === dayIndex && item.category !== 'hotels')
      .sort((a, b) => (a.orderInDay || 0) - (b.orderInDay || 0));

    // Convert back to TimeBlocks
    const blocks = dayItems.map((item, blockIndex) => ({
      id: `block-${item.id}`,
      type: 'midday-flex' as const,
      activity: {
        id: item.id,
        name: item.name,
        category: mapPlanningCategoryToActivity(item.category),
        description: item.description,
        duration: item.duration || 60,
        bookingRequired: false,
        tags: item.tags || [],
        location: item.neighborhood ? { name: item.neighborhood } : undefined,
        tips: item.tips,
      },
      priority: 'must-see' as const,
      isLocked: item.isLocked || false,
    }));

    return {
      ...day,
      blocks: blocks.length > 0 ? blocks : day.blocks,
    };
  });

  return updated;
}

/**
 * Maps PlanningItem category back to Activity category
 */
function mapPlanningCategoryToActivity(category: PlanningItem['category']): Activity['category'] {
  switch (category) {
    case 'restaurants':
    case 'cafes':
      return 'food';
    case 'hotels':
      return 'accommodation';
    case 'transit':
      return 'transit';
    default:
      return 'activity';
  }
}
