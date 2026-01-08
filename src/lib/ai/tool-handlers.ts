// Tool execution handlers for Claude chatbot

import type { ToolName } from '@/types/chat';
import {
  generateFlightUrl,
  generateHotelUrl,
  generateRestaurantUrl,
  generateActivityUrl,
} from '@/lib/booking/urls';
import type {
  Itinerary,
  DayPlan,
  TimeBlock,
  Activity,
  FoodRecommendation,
  TimeBlockType,
  ActivityPriority,
  ActivityCategory,
  FoodType,
  PriceRange,
} from '@/types/itinerary';

interface ToolContext {
  itinerary: Itinerary;
  tripId: string;
}

interface ToolResult {
  result: unknown;
  updatedItinerary?: Itinerary;
  error?: string;
}

// Main tool executor
export async function executeToolCall(
  toolName: ToolName,
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  switch (toolName) {
    case 'get_itinerary':
      return handleGetItinerary(input, context);
    case 'search_restaurants':
      return await handleSearchRestaurants(input, context);
    case 'add_activity':
      return handleAddActivity(input, context);
    case 'update_activity':
      return handleUpdateActivity(input, context);
    case 'delete_activity':
      return handleDeleteActivity(input, context);
    case 'move_activity':
      return handleMoveActivity(input, context);
    case 'add_restaurant':
      return handleAddRestaurant(input, context);
    case 'get_booking_link':
      return handleGetBookingLink(input, context);
    default:
      return { result: null, error: `Unknown tool: ${toolName}` };
  }
}

// Get itinerary summary or full details
function handleGetItinerary(
  input: Record<string, unknown>,
  context: ToolContext
): ToolResult {
  const { itinerary } = context;
  const includeDetails = input.includeDetails as boolean ?? false;

  if (includeDetails) {
    return { result: itinerary };
  }

  // Return summary
  const summary = {
    destination: itinerary.meta.destination,
    dates: `${itinerary.meta.startDate} to ${itinerary.meta.endDate}`,
    totalDays: itinerary.meta.totalDays,
    days: itinerary.days.map((day) => ({
      dayNumber: day.dayNumber,
      date: day.date,
      theme: day.theme,
      activities: day.blocks
        .filter((b) => b.activity)
        .map((b) => ({
          id: b.activity!.id,
          name: b.activity!.name,
          time: b.startTime,
          category: b.activity!.category,
          priority: b.priority,
        })),
    })),
    foodRecommendations: itinerary.foodLayer.length,
    bases: itinerary.route.bases.map((b) => ({
      location: b.location,
      nights: b.nights,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
    })),
  };

  return { result: summary };
}

// Search restaurants via Google Places API
async function handleSearchRestaurants(
  input: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const location = input.location as string;
  const mealType = input.mealType as string | undefined;
  const budget = input.budget as string | undefined;
  const count = (input.count as number) || 5;
  const cuisine = input.cuisine as string | undefined;

  // Build query for existing restaurant API
  const params = new URLSearchParams();
  params.set('location', location);
  if (mealType) params.set('mealType', mealType);
  if (budget) params.set('budget', budget);
  if (count) params.set('count', count.toString());
  if (cuisine) params.set('query', cuisine);

  try {
    const response = await fetch(`/api/places/restaurants?${params.toString()}`);
    if (!response.ok) {
      return { result: null, error: `Restaurant search failed: ${response.statusText}` };
    }
    const data = await response.json();
    return { result: data };
  } catch (error) {
    return { result: null, error: `Restaurant search error: ${error}` };
  }
}

// Add activity to a day
function handleAddActivity(
  input: Record<string, unknown>,
  context: ToolContext
): ToolResult {
  const { itinerary } = context;
  const dayId = input.dayId as string | undefined;
  const dayNumber = input.dayNumber as number | undefined;
  const activityInput = input.activity as Record<string, unknown>;
  const blockType = (input.blockType as TimeBlockType) || 'midday-flex';
  const priority = (input.priority as ActivityPriority) || 'if-energy';

  // Find the target day
  let targetDay: DayPlan | undefined;
  if (dayId) {
    targetDay = itinerary.days.find((d) => d.id === dayId);
  } else if (dayNumber) {
    targetDay = itinerary.days.find((d) => d.dayNumber === dayNumber);
  }

  if (!targetDay) {
    return { result: null, error: `Day not found: ${dayId || dayNumber}` };
  }

  // Create the activity
  const category = (activityInput.category as ActivityCategory) || 'activity';
  const costInput = activityInput.cost as { amount?: number; currency?: string } | undefined;
  const activity: Activity = {
    id: crypto.randomUUID(),
    name: activityInput.name as string,
    category,
    description: (activityInput.description as string) || '',
    duration: (activityInput.duration as number) || 60,
    scheduledTime: activityInput.scheduledTime as string | undefined,
    location: activityInput.location as Activity['location'],
    bookingRequired: category === 'flight' || category === 'accommodation',
    tags: [],
    cost: costInput?.amount ? { amount: costInput.amount, currency: costInput.currency || 'USD', isEstimate: true } : undefined,
    tips: activityInput.tips as string[] | undefined,
  };

  // Create the time block
  const timeBlock: TimeBlock = {
    id: crypto.randomUUID(),
    type: blockType,
    startTime: activity.scheduledTime,
    activity,
    priority,
    isLocked: false,
  };

  // Add to day
  const updatedDay: DayPlan = {
    ...targetDay,
    blocks: [...targetDay.blocks, timeBlock],
  };

  const updatedItinerary: Itinerary = {
    ...itinerary,
    days: itinerary.days.map((d) => (d.id === targetDay!.id ? updatedDay : d)),
    updatedAt: new Date(),
  };

  return {
    result: {
      success: true,
      message: `Added "${activity.name}" to Day ${targetDay.dayNumber}`,
      activityId: activity.id,
      blockId: timeBlock.id,
    },
    updatedItinerary,
  };
}

// Update an existing activity
function handleUpdateActivity(
  input: Record<string, unknown>,
  context: ToolContext
): ToolResult {
  const { itinerary } = context;
  const activityId = input.activityId as string | undefined;
  const activityName = input.activityName as string | undefined;
  const updates = input.updates as Record<string, unknown>;

  // Find the activity
  let foundDay: DayPlan | undefined;
  let foundBlock: TimeBlock | undefined;

  for (const day of itinerary.days) {
    for (const block of day.blocks) {
      if (block.activity) {
        if (activityId && block.activity.id === activityId) {
          foundDay = day;
          foundBlock = block;
          break;
        }
        if (activityName && block.activity.name.toLowerCase().includes(activityName.toLowerCase())) {
          foundDay = day;
          foundBlock = block;
          break;
        }
      }
    }
    if (foundBlock) break;
  }

  if (!foundBlock || !foundDay) {
    return { result: null, error: `Activity not found: ${activityId || activityName}` };
  }

  // Apply updates
  const currentActivity = foundBlock.activity!;
  const updatedActivity: Activity = {
    ...currentActivity,
    name: (updates.name as string) ?? currentActivity.name,
    description: (updates.description as string) ?? currentActivity.description,
    duration: (updates.duration as number) ?? currentActivity.duration,
    scheduledTime: (updates.scheduledTime as string) ?? currentActivity.scheduledTime,
  };

  const updatedBlock: TimeBlock = {
    ...foundBlock,
    activity: updatedActivity,
    priority: (updates.priority as ActivityPriority) ?? foundBlock.priority,
    notes: (updates.notes as string) ?? foundBlock.notes,
    startTime: (updates.scheduledTime as string) ?? foundBlock.startTime,
  };

  const updatedDay: DayPlan = {
    ...foundDay,
    blocks: foundDay.blocks.map((b) => (b.id === foundBlock!.id ? updatedBlock : b)),
  };

  const updatedItinerary: Itinerary = {
    ...itinerary,
    days: itinerary.days.map((d) => (d.id === foundDay!.id ? updatedDay : d)),
    updatedAt: new Date(),
  };

  return {
    result: {
      success: true,
      message: `Updated "${updatedActivity.name}"`,
      activityId: updatedActivity.id,
    },
    updatedItinerary,
  };
}

// Delete an activity
function handleDeleteActivity(
  input: Record<string, unknown>,
  context: ToolContext
): ToolResult {
  const { itinerary } = context;
  const activityId = input.activityId as string | undefined;
  const activityName = input.activityName as string | undefined;
  const dayNumber = input.dayNumber as number | undefined;

  // Find and remove the activity
  let deletedName = '';
  let foundDayNumber = 0;

  const updatedDays = itinerary.days.map((day) => {
    if (dayNumber && day.dayNumber !== dayNumber) {
      return day;
    }

    const filteredBlocks = day.blocks.filter((block) => {
      if (!block.activity) return true;

      const matches =
        (activityId && block.activity.id === activityId) ||
        (activityName && block.activity.name.toLowerCase().includes(activityName.toLowerCase()));

      if (matches) {
        deletedName = block.activity.name;
        foundDayNumber = day.dayNumber;
        return false;
      }
      return true;
    });

    if (filteredBlocks.length !== day.blocks.length) {
      return { ...day, blocks: filteredBlocks };
    }
    return day;
  });

  if (!deletedName) {
    return { result: null, error: `Activity not found: ${activityId || activityName}` };
  }

  const updatedItinerary: Itinerary = {
    ...itinerary,
    days: updatedDays,
    updatedAt: new Date(),
  };

  return {
    result: {
      success: true,
      message: `Deleted "${deletedName}" from Day ${foundDayNumber}`,
    },
    updatedItinerary,
  };
}

// Move an activity to a different day or time
function handleMoveActivity(
  input: Record<string, unknown>,
  context: ToolContext
): ToolResult {
  const { itinerary } = context;
  const activityId = input.activityId as string | undefined;
  const activityName = input.activityName as string | undefined;
  const toDayId = input.toDayId as string | undefined;
  const toDayNumber = input.toDayNumber as number | undefined;
  const newTime = input.newTime as string | undefined;
  const newBlockType = input.newBlockType as TimeBlockType | undefined;

  // Find the activity
  let sourceDay: DayPlan | undefined;
  let blockToMove: TimeBlock | undefined;

  for (const day of itinerary.days) {
    for (const block of day.blocks) {
      if (block.activity) {
        if (activityId && block.activity.id === activityId) {
          sourceDay = day;
          blockToMove = block;
          break;
        }
        if (activityName && block.activity.name.toLowerCase().includes(activityName.toLowerCase())) {
          sourceDay = day;
          blockToMove = block;
          break;
        }
      }
    }
    if (blockToMove) break;
  }

  if (!blockToMove || !sourceDay) {
    return { result: null, error: `Activity not found: ${activityId || activityName}` };
  }

  // Find target day
  let targetDay: DayPlan | undefined;
  if (toDayId) {
    targetDay = itinerary.days.find((d) => d.id === toDayId);
  } else if (toDayNumber) {
    targetDay = itinerary.days.find((d) => d.dayNumber === toDayNumber);
  } else {
    // Just updating time, not moving days
    targetDay = sourceDay;
  }

  if (!targetDay) {
    return { result: null, error: `Target day not found: ${toDayId || toDayNumber}` };
  }

  // Create updated block
  const movedBlock: TimeBlock = {
    ...blockToMove,
    ...(newTime && { startTime: newTime }),
    ...(newBlockType && { type: newBlockType }),
    activity: {
      ...blockToMove.activity!,
      ...(newTime && { scheduledTime: newTime }),
    },
  };

  // Update days
  const updatedDays = itinerary.days.map((day) => {
    if (day.id === sourceDay!.id && day.id === targetDay!.id) {
      // Same day, just update the block
      return {
        ...day,
        blocks: day.blocks.map((b) => (b.id === blockToMove!.id ? movedBlock : b)),
      };
    }

    if (day.id === sourceDay!.id) {
      // Remove from source
      return {
        ...day,
        blocks: day.blocks.filter((b) => b.id !== blockToMove!.id),
      };
    }

    if (day.id === targetDay!.id) {
      // Add to target
      return {
        ...day,
        blocks: [...day.blocks, movedBlock],
      };
    }

    return day;
  });

  const updatedItinerary: Itinerary = {
    ...itinerary,
    days: updatedDays,
    updatedAt: new Date(),
  };

  return {
    result: {
      success: true,
      message: `Moved "${blockToMove.activity!.name}" to Day ${targetDay.dayNumber}${newTime ? ` at ${newTime}` : ''}`,
    },
    updatedItinerary,
  };
}

// Add a restaurant to the food layer
function handleAddRestaurant(
  input: Record<string, unknown>,
  context: ToolContext
): ToolResult {
  const { itinerary } = context;
  const dayNumber = input.dayNumber as number | undefined;
  const dayId = input.dayId as string | undefined;
  const restaurantInput = input.restaurant as Record<string, unknown>;
  const foodType = (input.type as FoodType) || 'casual-backup';
  const addToSchedule = input.addToSchedule as boolean ?? false;

  // Find day ID if dayNumber provided
  let targetDayId: string | undefined = dayId;
  let targetDay: DayPlan | undefined;
  if (dayNumber) {
    targetDay = itinerary.days.find((d) => d.dayNumber === dayNumber);
    targetDayId = targetDay?.id;
  }

  // Create food recommendation
  const recommendation: FoodRecommendation = {
    id: crypto.randomUUID(),
    dayId: targetDayId,
    type: foodType,
    name: restaurantInput.name as string,
    cuisine: restaurantInput.cuisine as string,
    location: restaurantInput.location as FoodRecommendation['location'],
    priceRange: (restaurantInput.priceRange as PriceRange) || '$$',
    reservationRequired: (restaurantInput.reservationRequired as boolean) ?? false,
    skipTheHype: false,
    notes: (restaurantInput.notes as string) || '',
    mealTime: restaurantInput.mealTime as FoodRecommendation['mealTime'],
  };

  let updatedItinerary: Itinerary = {
    ...itinerary,
    foodLayer: [...itinerary.foodLayer, recommendation],
    updatedAt: new Date(),
  };

  // Optionally add to schedule
  if (addToSchedule && targetDay) {
    const mealTime = restaurantInput.mealTime as string;
    const blockType: TimeBlockType = mealTime === 'breakfast'
      ? 'morning-anchor'
      : mealTime === 'dinner'
        ? 'evening-vibe'
        : 'midday-flex';

    const activity: Activity = {
      id: crypto.randomUUID(),
      name: restaurantInput.name as string,
      category: 'food',
      description: `${restaurantInput.cuisine} - ${restaurantInput.priceRange || '$$'}`,
      duration: 90,
      location: restaurantInput.location as Activity['location'],
      bookingRequired: recommendation.reservationRequired,
      tags: ['restaurant', restaurantInput.cuisine as string],
    };

    const timeBlock: TimeBlock = {
      id: crypto.randomUUID(),
      type: blockType,
      activity,
      priority: 'if-energy',
      isLocked: false,
    };

    updatedItinerary = {
      ...updatedItinerary,
      days: updatedItinerary.days.map((d) =>
        d.id === targetDay!.id ? { ...d, blocks: [...d.blocks, timeBlock] } : d
      ),
    };
  }

  return {
    result: {
      success: true,
      message: `Added "${recommendation.name}" to food recommendations${targetDay ? ` for Day ${targetDay.dayNumber}` : ''}`,
      recommendationId: recommendation.id,
    },
    updatedItinerary,
  };
}

// Generate booking link for an activity
function handleGetBookingLink(
  input: Record<string, unknown>,
  context: ToolContext
): ToolResult {
  const activityName = input.activityName as string;
  const category = input.category as string;
  const location = input.location as string | undefined;
  const date = input.date as string | undefined;

  let url: string;
  let provider: string;

  switch (category) {
    case 'flight':
    case 'transit':
      url = generateFlightUrl({
        origin: undefined, // Will be parsed from name if formatted correctly
        destination: location,
        date,
      });
      // If the name contains airport codes, use them directly
      if (activityName) {
        const codeMatch = activityName.match(/\b([A-Z]{3})\s*(?:→|->|—|-|to)\s*([A-Z]{3})\b/i);
        if (codeMatch) {
          url = generateFlightUrl({
            origin: codeMatch[1].toUpperCase(),
            destination: codeMatch[2].toUpperCase(),
            date,
          });
        }
      }
      provider = 'Google Flights';
      break;

    case 'accommodation':
      url = generateHotelUrl({
        hotelName: activityName,
        location,
      });
      provider = 'TripAdvisor';
      break;

    case 'food':
      url = generateRestaurantUrl({
        restaurantName: activityName,
        location,
      });
      provider = 'Google';
      break;

    default:
      url = generateActivityUrl({
        activityName,
        location,
      });
      provider = 'Google';
  }

  return {
    result: {
      success: true,
      url,
      provider,
      message: `Here's the booking link for ${activityName}: ${url}`,
    },
  };
}
