import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { enforceApiKey, enforceRateLimit, enforceSameOrigin } from '@/lib/server/api-guard';
import { debug } from '@/lib/logger';
import { withTimeout } from '@/lib/async';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Activity type from AI
interface AIActivity {
  name: string;
  type: 'attraction' | 'restaurant' | 'activity';
  description: string;
  suggestedTime?: string;
  duration?: number;
  openingHours?: string;
  neighborhood: string;
  priceRange: string;
  tags: string[];
}

const ActivitySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['attraction', 'restaurant', 'activity']),
  description: z.string().optional().default(''),
  suggestedTime: z.string().optional(),
  duration: z.number().int().min(0).optional(),
  openingHours: z.string().optional(),
  neighborhood: z.string().optional().default(''),
  priceRange: z.string().optional().default('$'),
  tags: z.array(z.string()).optional().default([]),
});

const ActivitiesResponseSchema = z.object({
  activities: z.array(ActivitySchema),
});

export async function POST(request: NextRequest) {
  try {
    const originResponse = enforceSameOrigin(request);
    if (originResponse) return originResponse;

    const apiKeyResponse = enforceApiKey(request);
    if (apiKeyResponse) return apiKeyResponse;

    const rateLimitResponse = enforceRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Check if API key is available
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('[generate-itinerary] ANTHROPIC_API_KEY is not set');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { city, nights, country, tripStyle, interests, budget, mustHaves, avoidances, excludeActivities } = await request.json();

    if (!city || !nights) {
      return NextResponse.json(
        { error: 'City and nights are required' },
        { status: 400 }
      );
    }

    // Build budget guidance
    const budgetGuide = budget === 'budget' || budget === 'low'
      ? 'Focus on budget-friendly options ($ to $$). Include free attractions, street food, and affordable local spots.'
      : budget === 'luxury' || budget === 'high'
      ? 'Include upscale experiences ($$ to $$$). Fine dining, premium tours, exclusive venues.'
      : 'Mix of moderate options ($ to $$). Balance value with quality experiences.';

    // Activity count based on pace preference
    const activitiesPerDay = tripStyle === 'relaxed' ? 2 : tripStyle === 'packed' ? 6 : 4;

    // Request MORE activities than needed to ensure we have enough unique ones
    const totalActivitiesNeeded = nights * activitiesPerDay;
    const activitiesToRequest = Math.max(totalActivitiesNeeded + 6, totalActivitiesNeeded * 1.5); // Request 50% extra

    // Build exclusion list
    const excludeList = excludeActivities?.length > 0
      ? `\n\nDO NOT INCLUDE these places (already in itinerary): ${excludeActivities.join(', ')}`
      : '';

    debug(`[generate-itinerary] Requesting ${activitiesToRequest} unique activities for ${nights} days in ${city}${excludeActivities?.length ? `, excluding ${excludeActivities.length} already-used` : ''}`);

    // NEW APPROACH: Request a FLAT LIST of unique activities, then distribute
    const prompt = `You are a travel expert recommending places to visit in ${city}${country ? `, ${country}` : ''}.

TRAVELER PROFILE:
- Travel pace: ${tripStyle || 'balanced'}
- Interests: ${interests?.length > 0 ? interests.join(', ') : 'general sightseeing, local food, cultural experiences'}
- Budget: ${budgetGuide}
${mustHaves?.length > 0 ? `- Must include: ${mustHaves.join(', ')}` : ''}
${avoidances?.length > 0 ? `- Avoid: ${avoidances.join(', ')}` : ''}${excludeList}

Generate a list of ${Math.ceil(activitiesToRequest)} UNIQUE places to visit in ${city}.

CRITICAL REQUIREMENTS:
- Every single place must be DIFFERENT - no duplicates or variations of the same place
- Focus on attractions (temples, museums, landmarks, parks) and activities - NOT restaurants/cafes
- Include both famous landmarks AND hidden local gems
- Use REAL places that actually exist in ${city}

IMPORTANT - GEOGRAPHIC GROUPING:
- Group activities by neighborhood so they can be visited together
- Order activities following COMMON TOUR ROUTES that make geographic sense
- Activities in the same neighborhood should be listed consecutively
- Consider walking distance - nearby attractions should be grouped
- Example: If visiting a temple district, list all temples/attractions in that area together
- Return activities in an order that minimizes travel time between them

For EACH place, provide:
1. name: The specific place name (real place that exists)
2. type: "attraction" | "activity"
3. description: 1-2 sentence description
4. duration: Time to spend in minutes (30-180)
5. openingHours: Typical hours (e.g., "9AM-5PM")
6. neighborhood: Which area/district (IMPORTANT for grouping)
7. priceRange: "$" (budget), "$$" (moderate), "$$$" (expensive)
8. tags: 2-4 relevant tags

Return activities ORDERED BY NEIGHBORHOOD so consecutive items are walkable from each other.

Return ONLY valid JSON in this exact format:
{
  "activities": [
    {
      "name": "Place Name",
      "type": "attraction",
      "description": "Description here",
      "duration": 90,
      "openingHours": "9AM-5PM",
      "neighborhood": "Area Name",
      "priceRange": "$",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

    const message = await withTimeout(anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }), 60000, 'Anthropic request timed out');

    // Extract the text content
    const textContent = message.content.find((block) => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse the JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response as JSON');
    }

    const data = JSON.parse(jsonMatch[0]);
    const parsed = ActivitiesResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('[generate-itinerary] Invalid AI response schema', parsed.error.flatten());
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
    }

    let allActivities: AIActivity[] = parsed.data.activities;

    debug(`[generate-itinerary] Received ${allActivities.length} activities from AI`);

    // DEDUPLICATE: Remove any activities with similar names
    const seenNames = new Set<string>();
    allActivities = allActivities.filter((act: AIActivity) => {
      const normalizedName = act.name.toLowerCase().trim();

      // Check for exact or partial duplicates
      for (const seen of seenNames) {
        if (normalizedName.includes(seen) || seen.includes(normalizedName)) {
          debug(`[generate-itinerary] Removing duplicate: "${act.name}"`);
          return false;
        }
      }

      seenNames.add(normalizedName);
      return true;
    });

    debug(`[generate-itinerary] After deduplication: ${allActivities.length} unique activities`);

    // DISTRIBUTE activities across days
    const days = [];
    const themes = [
      'Iconic Landmarks & Local Flavors',
      'Hidden Gems & Street Food',
      'Cultural Immersion',
      'Nature & Relaxation',
      'Art & Architecture',
      'Markets & Shopping',
      'Historic Quarter',
      'Modern City Life',
    ];

    let activityIndex = 0;
    for (let dayNum = 1; dayNum <= nights; dayNum++) {
      const dayActivities = [];
      const startTime = 9; // Start at 9 AM

      // Assign activities to this day
      for (let i = 0; i < activitiesPerDay && activityIndex < allActivities.length; i++) {
        const activity = allActivities[activityIndex];
        const hour = startTime + (i * 2.5); // Space activities ~2.5 hours apart
        const suggestedTime = `${Math.floor(hour).toString().padStart(2, '0')}:${(hour % 1) * 60 === 0 ? '00' : '30'}`;

        dayActivities.push({
          ...activity,
          suggestedTime,
          duration: activity.duration ?? 90,
          neighborhood: activity.neighborhood || city,
          priceRange: activity.priceRange || '$',
          tags: activity.tags || [],
          id: `${city.toLowerCase().replace(/\s+/g, '-')}-day${dayNum}-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          imageUrl: getActivityImage(activity.type, city),
          matchScore: 85 + Math.floor(Math.random() * 15),
          matchReasons: ['AI recommended', 'Highly rated'],
        });

        activityIndex++;
      }

      // Get a theme based on the day's activities or use default
      const dayTheme = themes[(dayNum - 1) % themes.length];

      days.push({
        dayNumber: dayNum,
        theme: dayTheme,
        activities: dayActivities,
      });

      debug(`[generate-itinerary] Day ${dayNum} "${dayTheme}": ${dayActivities.map(a => a.name).join(', ')}`);
    }

    // Verify uniqueness across all days
    const allNames = days.flatMap(d => d.activities.map(a => a.name.toLowerCase()));
    const uniqueNames = new Set(allNames);
    if (allNames.length !== uniqueNames.size) {
      console.error(`[generate-itinerary] ERROR: Found duplicate activities after distribution!`);
    } else {
      debug(`[generate-itinerary] SUCCESS: All ${allNames.length} activities are unique across ${nights} days`);
    }

    return NextResponse.json({ days });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[generate-itinerary] Error:', errorMessage, error);
    return NextResponse.json(
      { error: `Failed to generate itinerary: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Helper to get relevant placeholder images based on activity type
function getActivityImage(type: string, city: string): string {
  const cityImages: Record<string, string> = {
    'Tokyo': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Kyoto': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Bangkok': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Chiang Mai': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Chiang Rai': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Paris': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'London': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'New York': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Singapore': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'Bali': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  };

  const typeImages: Record<string, string> = {
    'restaurant': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'attraction': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
    'activity': 'https://images.pexels.com/photos/2325446/pexels-photo-2325446.jpeg?auto=compress&cs=tinysrgb&w=600',
  };

  // Use city-specific image or fall back to type-based
  return cityImages[city] || typeImages[type] || typeImages['attraction'];
}
// Deploy trigger 1768357935
