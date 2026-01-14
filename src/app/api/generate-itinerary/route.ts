import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { city, nights, country, tripStyle, interests, budget, mustHaves, avoidances } = await request.json();

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
    const activityCount = tripStyle === 'relaxed' ? '1-3' : tripStyle === 'packed' ? '5-7' : '3-5';

    const prompt = `You are a travel expert creating a detailed ${nights}-day itinerary for ${city}${country ? `, ${country}` : ''}.

TRAVELER PROFILE:
- Travel pace: ${tripStyle || 'balanced'} (${tripStyle === 'relaxed' ? 'fewer activities, more downtime' : tripStyle === 'packed' ? 'maximize experiences, busy days' : 'good balance of activities and rest'})
- Interests: ${interests?.length > 0 ? interests.join(', ') : 'general sightseeing, local food, cultural experiences'}
- Budget: ${budgetGuide}
${mustHaves?.length > 0 ? `- Must include: ${mustHaves.join(', ')}` : ''}
${avoidances?.length > 0 ? `- Avoid: ${avoidances.join(', ')}` : ''}

Create a day-by-day itinerary with ${activityCount} activities per day. For EACH activity, provide:
1. name: The specific place/restaurant/attraction name (real places that exist)
2. type: "attraction" | "restaurant" | "activity"
3. description: 1-2 sentence description of why it's worth visiting
4. suggestedTime: When to visit (e.g., "09:00", "12:30")
5. duration: How long to spend there in minutes
6. openingHours: Typical opening hours (e.g., "9AM-5PM")
7. neighborhood: Which area/district it's in
8. priceRange: "$" (budget), "$$" (moderate), "$$$" (expensive)
9. tags: 2-4 relevant tags like ["temple", "history", "photography"]
10. walkingTimeToNext: Minutes to walk to the next activity (optional, for flow)

ABSOLUTELY CRITICAL - UNIQUE DAYS:
- You MUST generate ${nights} COMPLETELY DIFFERENT days
- NEVER repeat the same activity across different days
- Each day MUST visit DIFFERENT places, neighborhoods, and restaurants
- If generating 3 days, you need at least ${nights * 3} UNIQUE places total (no duplicates!)
- Day 1 activities must be 100% different from Day 2, Day 3, etc.

REQUIREMENTS:
- Use REAL places that actually exist in ${city}
- Include a mix of famous landmarks AND local hidden gems
- Include at least one great local restaurant/food experience per day
- Each day should explore a DIFFERENT neighborhood/area of ${city}
- Each day should have a distinct theme (e.g., "Historic Temples", "Street Food & Markets", "Nature Day")

Return ONLY valid JSON in this exact format:
{
  "days": [
    {
      "dayNumber": 1,
      "theme": "Brief theme like 'Historic Center & Local Eats'",
      "activities": [
        {
          "name": "Place Name",
          "type": "attraction",
          "description": "Description here",
          "suggestedTime": "09:00",
          "duration": 90,
          "openingHours": "8AM-5PM",
          "neighborhood": "Area Name",
          "priceRange": "$",
          "tags": ["tag1", "tag2"],
          "walkingTimeToNext": 10
        }
      ]
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

    const itinerary = JSON.parse(jsonMatch[0]);

    console.log(`[generate-itinerary] Generated ${itinerary.days?.length || 0} days for ${city}`);

    // DEDUPLICATE: Remove activities that appear in previous days
    const seenActivityNames = new Set<string>();

    itinerary.days = itinerary.days?.map((day: { dayNumber: number; theme?: string; activities: Array<{ name: string; type: string; description?: string }> }) => {
      // Filter out any activity we've already seen
      const uniqueActivities = day.activities.filter((act: { name: string }) => {
        const normalizedName = act.name.toLowerCase().trim();
        // Also check for partial matches (e.g., "Blue Temple" matches "Blue Temple (Wat Rong Suea Ten)")
        const isPartialDupe = Array.from(seenActivityNames).some(seen =>
          normalizedName.includes(seen) || seen.includes(normalizedName)
        );

        if (seenActivityNames.has(normalizedName) || isPartialDupe) {
          console.log(`[generate-itinerary] REMOVING duplicate "${act.name}" from Day ${day.dayNumber}`);
          return false;
        }
        seenActivityNames.add(normalizedName);
        return true;
      });

      console.log(`[generate-itinerary] Day ${day.dayNumber} "${day.theme}": ${uniqueActivities.map((a: { name: string }) => a.name).join(', ')} (${day.activities.length - uniqueActivities.length} duplicates removed)`);

      return {
        ...day,
        activities: uniqueActivities,
      };
    });

    // Add unique IDs and image URLs to each activity
    itinerary.days = itinerary.days.map((day: { dayNumber: number; activities: Array<{ name: string; type: string }> }) => ({
      ...day,
      activities: day.activities.map((activity: { name: string; type: string }, idx: number) => ({
        ...activity,
        id: `${city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${idx}-${Date.now()}`,
        imageUrl: getActivityImage(activity.type, city),
        matchScore: 85 + Math.floor(Math.random() * 15),
        matchReasons: ['AI recommended', 'Highly rated'],
      })),
    }));

    return NextResponse.json(itinerary);
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
