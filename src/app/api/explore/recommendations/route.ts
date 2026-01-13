import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { city, category } = await request.json();

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }

    const categoryFilter = category
      ? `Focus on ${category}s only.`
      : 'Include a mix of attractions, restaurants, cafes, and nightlife.';

    const prompt = `Generate 12 place recommendations for ${city}.

${categoryFilter}

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
