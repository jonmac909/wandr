// Claude tool definitions for trip modification

import type { ToolDefinition } from '@/types/chat';

export const TRIP_TOOLS: ToolDefinition[] = [
  {
    name: 'get_itinerary',
    description: 'Get the current trip itinerary including all days, activities, and schedule. Use this to understand what is currently planned before making modifications.',
    input_schema: {
      type: 'object',
      properties: {
        includeDetails: {
          type: 'boolean',
          description: 'Whether to include full activity details or just summaries',
        },
      },
    },
  },
  {
    name: 'search_restaurants',
    description: 'Search for restaurants near a location. Returns restaurant options with ratings, cuisine type, and price range.',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The location to search near (e.g., "Shibuya, Tokyo" or "near the hotel")',
        },
        mealType: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'The type of meal',
        },
        cuisine: {
          type: 'string',
          description: 'Preferred cuisine type (e.g., "sushi", "italian", "local")',
        },
        budget: {
          type: 'string',
          enum: ['budget', 'moderate', 'splurge'],
          description: 'Price range preference',
        },
        count: {
          type: 'number',
          description: 'Number of results to return (default: 5)',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'add_activity',
    description: 'Add a new activity to a specific day in the itinerary. The activity will be added as a time block.',
    input_schema: {
      type: 'object',
      properties: {
        dayId: {
          type: 'string',
          description: 'The ID of the day to add the activity to',
        },
        dayNumber: {
          type: 'number',
          description: 'Alternative: the day number (1, 2, 3, etc.) to add the activity to',
        },
        activity: {
          type: 'object',
          description: 'The activity to add',
          properties: {
            name: { type: 'string', description: 'Name of the activity' },
            category: {
              type: 'string',
              enum: ['sightseeing', 'food', 'activity', 'relaxation', 'shopping', 'nightlife', 'workshop', 'transit', 'flight', 'accommodation', 'checkin'],
              description: 'Category of the activity. Use "flight" for flights, "transit" for trains/buses/ferries, "accommodation" for hotels.',
            },
            description: { type: 'string', description: 'Brief description' },
            duration: { type: 'number', description: 'Duration in minutes (for flights, use actual flight duration)' },
            scheduledTime: { type: 'string', description: 'Time in HH:MM format (e.g., "14:00")' },
            location: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: { type: 'string' },
              },
            },
            cost: {
              type: 'object',
              description: 'Cost of the activity',
              properties: {
                amount: { type: 'number', description: 'Price amount' },
                currency: { type: 'string', description: 'Currency code (default: USD)' },
              },
            },
            tips: {
              type: 'array',
              description: 'Tips or notes about the activity (e.g., "10hr flight, flat seats")',
              items: { type: 'string' },
            },
          },
          required: ['name', 'category'],
        },
        blockType: {
          type: 'string',
          enum: ['morning-anchor', 'midday-flex', 'evening-vibe', 'rest-block'],
          description: 'The type of time block',
        },
        priority: {
          type: 'string',
          enum: ['must-see', 'if-energy', 'skip-guilt-free'],
          description: 'Priority level for this activity',
        },
      },
      required: ['activity'],
    },
  },
  {
    name: 'update_activity',
    description: 'Update an existing activity in the itinerary. Can modify time, duration, description, or other properties.',
    input_schema: {
      type: 'object',
      properties: {
        activityId: {
          type: 'string',
          description: 'The ID of the activity to update',
        },
        activityName: {
          type: 'string',
          description: 'Alternative: the name of the activity to find and update',
        },
        updates: {
          type: 'object',
          description: 'The fields to update',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'number' },
            scheduledTime: { type: 'string' },
            priority: { type: 'string', enum: ['must-see', 'if-energy', 'skip-guilt-free'] },
            notes: { type: 'string' },
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'delete_activity',
    description: 'Remove an activity from the itinerary.',
    input_schema: {
      type: 'object',
      properties: {
        activityId: {
          type: 'string',
          description: 'The ID of the activity to delete',
        },
        activityName: {
          type: 'string',
          description: 'Alternative: the name of the activity to find and delete',
        },
        dayNumber: {
          type: 'number',
          description: 'Optional: limit search to a specific day',
        },
      },
    },
  },
  {
    name: 'move_activity',
    description: 'Move an activity from one day to another, or change its time within the same day.',
    input_schema: {
      type: 'object',
      properties: {
        activityId: {
          type: 'string',
          description: 'The ID of the activity to move',
        },
        activityName: {
          type: 'string',
          description: 'Alternative: the name of the activity to find and move',
        },
        toDayId: {
          type: 'string',
          description: 'The ID of the destination day',
        },
        toDayNumber: {
          type: 'number',
          description: 'Alternative: the day number to move to',
        },
        newTime: {
          type: 'string',
          description: 'New scheduled time in HH:MM format',
        },
        newBlockType: {
          type: 'string',
          enum: ['morning-anchor', 'midday-flex', 'evening-vibe', 'rest-block'],
          description: 'New time block type',
        },
      },
    },
  },
  {
    name: 'get_booking_link',
    description: 'Generate a booking link for an activity, flight, hotel, or restaurant. Returns a clickable URL.',
    input_schema: {
      type: 'object',
      properties: {
        activityName: {
          type: 'string',
          description: 'Name of the activity/flight/hotel to generate booking link for',
        },
        category: {
          type: 'string',
          enum: ['flight', 'transit', 'accommodation', 'food', 'sightseeing', 'activity'],
          description: 'Category of the item (flight, transit, accommodation, food, or activity)',
        },
        location: {
          type: 'string',
          description: 'Location/city for the booking search',
        },
        date: {
          type: 'string',
          description: 'Date in YYYY-MM-DD format (optional, for flights)',
        },
      },
      required: ['activityName', 'category'],
    },
  },
  {
    name: 'add_restaurant',
    description: 'Add a restaurant recommendation to the food layer of the itinerary.',
    input_schema: {
      type: 'object',
      properties: {
        dayNumber: {
          type: 'number',
          description: 'The day number to associate this restaurant with',
        },
        dayId: {
          type: 'string',
          description: 'Alternative: the day ID',
        },
        restaurant: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Restaurant name' },
            cuisine: { type: 'string', description: 'Cuisine type' },
            priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
            mealTime: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
            location: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                address: { type: 'string' },
                lat: { type: 'number' },
                lng: { type: 'number' },
              },
            },
            reservationRequired: { type: 'boolean' },
            notes: { type: 'string' },
          },
          required: ['name', 'cuisine', 'mealTime'],
        },
        type: {
          type: 'string',
          enum: ['local-classic', 'splurge', 'casual-backup'],
          description: 'Type of food recommendation',
        },
        addToSchedule: {
          type: 'boolean',
          description: 'Whether to also add this as a scheduled activity',
        },
      },
      required: ['restaurant'],
    },
  },
  {
    name: 'add_base',
    description: 'Add a new base (city/hotel stay) to the trip route. This updates the Overview section with a new destination and accommodation.',
    input_schema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City or location name (e.g., "Tokyo", "Waikiki")',
        },
        region: {
          type: 'string',
          description: 'Specific region or neighborhood (optional)',
        },
        accommodation: {
          type: 'object',
          description: 'Hotel or accommodation details',
          properties: {
            name: { type: 'string', description: 'Hotel/accommodation name' },
            type: { type: 'string', enum: ['hotel', 'resort', 'boutique', 'airbnb', 'hostel', 'ryokan'] },
            priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
            notes: { type: 'string' },
          },
        },
        checkIn: {
          type: 'string',
          description: 'Check-in date in YYYY-MM-DD format',
        },
        checkOut: {
          type: 'string',
          description: 'Check-out date in YYYY-MM-DD format',
        },
        rationale: {
          type: 'string',
          description: 'Why this base was chosen (optional)',
        },
      },
      required: ['location', 'checkIn', 'checkOut'],
    },
  },
  {
    name: 'update_base',
    description: 'Update an existing base (city/hotel) in the trip route. Can modify hotel, dates, or location.',
    input_schema: {
      type: 'object',
      properties: {
        baseId: {
          type: 'string',
          description: 'The ID of the base to update',
        },
        location: {
          type: 'string',
          description: 'Alternative: find base by location name to update',
        },
        updates: {
          type: 'object',
          description: 'Fields to update',
          properties: {
            location: { type: 'string' },
            region: { type: 'string' },
            accommodation: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                type: { type: 'string', enum: ['hotel', 'resort', 'boutique', 'airbnb', 'hostel', 'ryokan'] },
                priceRange: { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
                notes: { type: 'string' },
              },
            },
            checkIn: { type: 'string', description: 'YYYY-MM-DD format' },
            checkOut: { type: 'string', description: 'YYYY-MM-DD format' },
            rationale: { type: 'string' },
          },
        },
      },
      required: ['updates'],
    },
  },
  {
    name: 'delete_base',
    description: 'Remove a base (city/hotel stay) from the trip route.',
    input_schema: {
      type: 'object',
      properties: {
        baseId: {
          type: 'string',
          description: 'The ID of the base to delete',
        },
        location: {
          type: 'string',
          description: 'Alternative: location name of the base to delete',
        },
      },
    },
  },
  {
    name: 'update_trip_dates',
    description: 'Update the overall trip start/end dates. This will shift all activities and bases accordingly.',
    input_schema: {
      type: 'object',
      properties: {
        startDate: {
          type: 'string',
          description: 'New start date in YYYY-MM-DD format',
        },
        endDate: {
          type: 'string',
          description: 'New end date in YYYY-MM-DD format',
        },
      },
    },
  },
];

// Web search tool - Claude's built-in capability
const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 5, // Limit searches per request to control costs
};

// Export as Anthropic API format
export function getToolsForAPI() {
  const customTools = TRIP_TOOLS.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.input_schema,
  }));

  // Add web search as a server-managed tool
  return [...customTools, WEB_SEARCH_TOOL];
}
