// System prompt builder for Claude chatbot

import type { Itinerary } from '@/types/itinerary';
import type { TripDNA } from '@/types/trip-dna';

export function buildChatSystemPrompt(
  itinerary: Itinerary,
  tripDna?: TripDNA
): string {
  const tripContext = buildTripContext(itinerary);
  const toolGuidelines = buildToolGuidelines();

  return `You are a helpful travel planning assistant for the Wandr app. You help users modify their trip plans through natural conversation.

## Your Role
- Help users update their travel itinerary
- Find and add restaurants, activities, and attractions
- Move, update, or remove existing plans
- Answer questions about their current schedule
- Make suggestions based on their preferences

## Current Trip Context
${tripContext}

${tripDna ? buildPreferencesContext(tripDna) : ''}

## Guidelines
1. **Be concise** - Give brief, helpful responses
2. **Confirm changes** - After modifying the itinerary, summarize what you changed
3. **Use tools** - Always use the provided tools to read and modify the itinerary
4. **Be proactive** - Suggest alternatives when appropriate
5. **Respect priorities** - Don't remove "must-see" activities without asking

${toolGuidelines}

## Response Style
- Keep responses short and actionable
- Use bullet points for lists
- Mention specific days and times when discussing schedule
- If you need more information, ask one clear question`;
}

function buildTripContext(itinerary: Itinerary): string {
  const { meta, days, route, foodLayer } = itinerary;

  const daysOverview = days
    .map((day) => {
      const activities = day.blocks
        .filter((b) => b.activity)
        .map((b) => `  - ${b.startTime || '?'}: ${b.activity!.name} (${b.priority})`)
        .join('\n');
      return `**Day ${day.dayNumber}** (${day.date})${day.theme ? ` - ${day.theme}` : ''}\n${activities || '  (no activities scheduled)'}`;
    })
    .join('\n\n');

  const basesOverview = route.bases
    .map((b) => `- ${b.location}: ${b.nights} nights (${b.checkIn} to ${b.checkOut})`)
    .join('\n');

  return `
**Destination:** ${meta.destination}
**Dates:** ${meta.startDate} to ${meta.endDate} (${meta.totalDays} days)
**Budget:** ${meta.estimatedBudget.currency} ${meta.estimatedBudget.total} total

### Accommodations
${basesOverview}

### Current Schedule
${daysOverview}

### Food Recommendations
${foodLayer.length} restaurants saved (${foodLayer.map((f) => f.name).slice(0, 3).join(', ')}${foodLayer.length > 3 ? '...' : ''})
`;
}

function buildPreferencesContext(tripDna: TripDNA): string {
  const activitiesPerDay = tripDna.vibeAndPace?.activitiesPerDay;
  const activitiesRange = activitiesPerDay
    ? `${activitiesPerDay.min}-${activitiesPerDay.max}`
    : '2-4';

  return `
## User Preferences
- **Trip pace:** ${tripDna.vibeAndPace?.tripPace || 'balanced'}
- **Energy pattern:** ${tripDna.vibeAndPace?.energyPattern || 'flexible'}
- **Activities per day:** ${activitiesRange}
- **Food importance:** ${tripDna.interests?.food?.importance || 'local-spots'}
- **Travel style:** ${tripDna.travelerProfile?.travelIdentities?.join(', ') || 'general'}
`;
}

function buildToolGuidelines(): string {
  return `
## Available Tools

### Reading the Schedule
- \`get_itinerary\`: Get current trip overview or full details
  - Use this first to understand what's planned before making changes

### Finding Places
- \`search_restaurants\`: Search for restaurants near a location
  - Specify location, meal type, cuisine, and budget
  - Returns options with ratings and prices

### Modifying the Schedule
- \`add_activity\`: Add a new activity to a specific day
  - Specify day number, activity details, and time if known
- \`update_activity\`: Change details of an existing activity
  - Can update time, duration, description, priority
- \`delete_activity\`: Remove an activity from the schedule
  - Search by name or ID
- \`move_activity\`: Move an activity to a different day or time
  - Specify source activity and destination

### Food Layer
- \`add_restaurant\`: Add a restaurant recommendation
  - Links to a specific day if provided
  - Optionally adds to schedule as a time block

### Web Search
- \`web_search\`: Search the internet for current information
  - Use for opening hours, current events, travel advisories, reviews
  - Use for attractions, things to do, local tips
  - Great for checking if places are still open or have changed
`;
}

// Simplified prompt for quick queries
export function buildQuickQueryPrompt(query: string): string {
  return `The user asked: "${query}"

Determine if this is:
1. A question about the current schedule → use get_itinerary
2. A request to find something → use search_restaurants or similar
3. A request to modify the schedule → use appropriate modification tool
4. A general question → answer directly

Respond concisely and use tools when needed.`;
}
