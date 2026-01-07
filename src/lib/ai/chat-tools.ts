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
