import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Activity type from AI
interface AIActivity {
  name: string;
  type: 'attraction' | 'restaurant' | 'activity';
  description: string;
  suggestedTime?: string;
  duration: number;
  openingHours?: string;
  neighborhood: string;
  priceRange: string;
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
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

    console.log(`[generate-itinerary] Requesting ${activitiesToRequest} unique activities for ${nights} days in ${city}${excludeActivities?.length ? `, excluding ${excludeActivities.length} already-used` : ''}`);

    // NEW APPROACH: Request a FLAT LIST of unique activities, then distribute
    const prompt = `You are a travel expert recommending places to visit in ${city}${country ? `, ${country}` : ''}.

TRAVELER PROFILE:
- Travel pace: ${tripStyle || 'balanced'}
- Interests: ${interests?.length > 0 ? interests.join(', ') : 'general sightseeing, local food, cultural experiences'}
- Budget: ${budgetGuide}
${mustHaves?.length > 0 ? `- Must include: ${mustHaves.join(', ')}` : ''}
${avoidances?.length > 0 ? `- Avoid: ${avoidances.join(', ')}` : ''}${excludeList}

Generate a list of ${Math.ceil(activitiesToRequest)} UNIQUE places to visit/eat in ${city}.

CRITICAL REQUIREMENTS:
- Every single place must be DIFFERENT - no duplicates or variations of the same place
- Mix of attractions (temples, museums, landmarks), restaurants, cafes, and activities
- Include both famous landmarks AND hidden local gems
- Use REAL places that actually exist in ${city}
- Cover different neighborhoods across the city

For EACH place, provide:
1. name: The specific place name (real place that exists)
2. type: "attraction" | "restaurant" | "activity"
3. description: 1-2 sentence description
4. duration: Time to spend in minutes (30-180)
5. openingHours: Typical hours (e.g., "9AM-5PM")
6. neighborhood: Which area/district
7. priceRange: "$" (budget), "$$" (moderate), "$$$" (expensive)
8. tags: 2-4 relevant tags

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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

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
    let allActivities: AIActivity[] = data.activities || [];

    console.log(`[generate-itinerary] Received ${allActivities.length} activities from AI`);

    // DEDUPLICATE: Remove any activities with similar names
    const seenNames = new Set<string>();
    allActivities = allActivities.filter((act: AIActivity) => {
      const normalizedName = act.name.toLowerCase().trim();

      // Check for exact or partial duplicates
      for (const seen of seenNames) {
        if (normalizedName.includes(seen) || seen.includes(normalizedName)) {
          console.log(`[generate-itinerary] Removing duplicate: "${act.name}"`);
          return false;
        }
      }

      seenNames.add(normalizedName);
      return true;
    });

    console.log(`[generate-itinerary] After deduplication: ${allActivities.length} unique activities`);

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

      console.log(`[generate-itinerary] Day ${dayNum} "${dayTheme}": ${dayActivities.map(a => a.name).join(', ')}`);
    }

    // Verify uniqueness across all days
    const allNames = days.flatMap(d => d.activities.map(a => a.name.toLowerCase()));
    const uniqueNames = new Set(allNames);
    if (allNames.length !== uniqueNames.size) {
      console.error(`[generate-itinerary] ERROR: Found duplicate activities after distribution!`);
    } else {
      console.log(`[generate-itinerary] SUCCESS: All ${allNames.length} activities are unique across ${nights} days`);
    }

    return NextResponse.json({ days });
  } catch (error) {
    console.error('Error generating itinerary:', error);
    return NextResponse.json(
      { error: 'Failed to generate itinerary' },
      { status: 500 }
    );
  }
}

// Helper to get relevant placeholder images based on activity type
function getActivityImage(type: string, city: string): string {
  const cityImages: Record<string, string> = {
    'Tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
    'Kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
    'Bangkok': 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
    'Chiang Mai': 'https://images.unsplash.com/photo-1512553424870-a2a2d9e5ed73?w=600&q=80',
    'Chiang Rai': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
    'Paris': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
    'London': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=600&q=80',
    'New York': 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=600&q=80',
    'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=600&q=80',
    'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  };

  const typeImages: Record<string, string> = {
    'restaurant': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
    'attraction': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
    'activity': 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
  };

  // Use city-specific image or fall back to type-based
  return cityImages[city] || typeImages[type] || typeImages['attraction'];
}
