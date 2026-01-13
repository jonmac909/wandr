import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// Interest labels for the AI prompt
const INTEREST_DESCRIPTIONS: Record<string, string> = {
  'food': 'food and culinary experiences (local cuisine, street food, fine dining)',
  'history': 'historical sites, museums, and heritage locations',
  'art': 'art galleries, installations, and creative spaces',
  'nature': 'parks, gardens, scenic viewpoints, and outdoor spaces',
  'nightlife': 'bars, clubs, live music venues, and evening entertainment',
  'adventure': 'adventure activities, unique experiences, and off-the-beaten-path spots',
  'shopping': 'shopping districts, markets, boutiques, and local shops',
  'local-culture': 'authentic local experiences, cultural sites, and community spots',
};

export async function POST(request: NextRequest) {
  try {
    const { city, category, interests } = await request.json();

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    const categoryFilter = category
      ? `Focus on ${category}s only.`
      : 'Include a mix of attractions, restaurants, cafes, and nightlife.';

    // Build interest-based personalization
    let interestFilter = '';
    if (interests && interests.length > 0) {
      const interestDescriptions = interests
        .map((i: string) => INTEREST_DESCRIPTIONS[i])
        .filter(Boolean)
        .join(', ');
      interestFilter = `

The user is particularly interested in: ${interestDescriptions}.
Prioritize recommendations that match these interests. Tailor the results to someone who loves ${interests.join(', ')}.`;
    }

    const prompt = `Generate 12 place recommendations for ${city}.

${categoryFilter}${interestFilter}

Return ONLY valid JSON (no markdown, no explanation) with this structure:
{
  "places": [
    {
      "id": "unique-id-1",
      "name": "Place Name",
      "type": "attraction" | "restaurant" | "cafe" | "activity" | "nightlife",
      "city": "${city}",
      "neighborhood": "Neighborhood name",
      "description": "Brief description (1-2 sentences)",
      "rating": 4.5,
      "reviewCount": 1234,
      "priceRange": "$" | "$$" | "$$$" | "$$$$",
      "tags": ["tag1", "tag2"],
      "coordinates": { "lat": 35.123, "lng": 139.456 }
    }
  ]
}

Include:
- Real, popular places that exist in ${city}
- Mix of well-known spots and hidden gems
- Accurate neighborhoods and approximate coordinates
- Realistic ratings (3.8-4.9 range)
- Appropriate price ranges

IMPORTANT: Return ONLY the JSON object, no other text.`;

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

    // Extract text content
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON response
    let jsonStr = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    const data = JSON.parse(jsonStr);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations', places: [] },
      { status: 500 }
    );
  }
}
