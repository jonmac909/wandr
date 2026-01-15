import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { enforceApiKey, enforceRateLimit, enforceSameOrigin } from '@/lib/server/api-guard';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

// API key from environment (same pattern as chat route)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Mock data for when API key is not available
const MOCK_PLACES: Record<string, Array<{
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife';
  city: string;
  neighborhood: string;
  description: string;
  rating: number;
  reviewCount: number;
  priceRange: string;
  tags: string[];
  coordinates: { lat: number; lng: number };
}>> = {
  'Tokyo': [
    { id: 'tok-1', name: 'Senso-ji Temple', type: 'attraction', city: 'Tokyo', neighborhood: 'Asakusa', description: 'Tokyo\'s oldest Buddhist temple with iconic Thunder Gate and bustling Nakamise shopping street.', rating: 4.7, reviewCount: 45230, priceRange: '$', tags: ['temple', 'historic', 'culture'], coordinates: { lat: 35.7148, lng: 139.7967 } },
    { id: 'tok-2', name: 'teamLab Borderless', type: 'attraction', city: 'Tokyo', neighborhood: 'Odaiba', description: 'Immersive digital art museum with stunning interactive light installations.', rating: 4.8, reviewCount: 23456, priceRange: '$$', tags: ['art', 'interactive', 'instagram'], coordinates: { lat: 35.6264, lng: 139.7838 } },
    { id: 'tok-3', name: 'Shibuya Sky', type: 'attraction', city: 'Tokyo', neighborhood: 'Shibuya', description: 'Rooftop observation deck with 360-degree views of Tokyo skyline.', rating: 4.6, reviewCount: 18234, priceRange: '$$', tags: ['viewpoint', 'skyline', 'sunset'], coordinates: { lat: 35.6580, lng: 139.7016 } },
    { id: 'tok-4', name: 'Golden Gai', type: 'nightlife', city: 'Tokyo', neighborhood: 'Shinjuku', description: 'Maze of tiny bars in narrow alleys - quintessential Tokyo nightlife experience.', rating: 4.5, reviewCount: 12890, priceRange: '$$', tags: ['bars', 'local', 'nightlife'], coordinates: { lat: 35.6938, lng: 139.7036 } },
    { id: 'tok-5', name: 'Ichiran Ramen', type: 'restaurant', city: 'Tokyo', neighborhood: 'Shibuya', description: 'Famous tonkotsu ramen chain with private booth seating.', rating: 4.4, reviewCount: 34567, priceRange: '$', tags: ['ramen', 'local', 'must-try'], coordinates: { lat: 35.6595, lng: 139.7005 } },
    { id: 'tok-6', name: 'Meiji Shrine', type: 'attraction', city: 'Tokyo', neighborhood: 'Harajuku', description: 'Serene Shinto shrine surrounded by lush forest in the heart of Tokyo.', rating: 4.7, reviewCount: 28901, priceRange: '$', tags: ['shrine', 'nature', 'peaceful'], coordinates: { lat: 35.6764, lng: 139.6993 } },
    { id: 'tok-7', name: 'Fuglen Tokyo', type: 'cafe', city: 'Tokyo', neighborhood: 'Yoyogi', description: 'Norwegian coffee shop with vintage furniture and excellent espresso.', rating: 4.5, reviewCount: 4567, priceRange: '$$', tags: ['coffee', 'design', 'chill'], coordinates: { lat: 35.6697, lng: 139.6889 } },
    { id: 'tok-8', name: 'Tsukiji Outer Market', type: 'activity', city: 'Tokyo', neighborhood: 'Tsukiji', description: 'Fresh sushi, seafood, and Japanese street food paradise.', rating: 4.6, reviewCount: 19234, priceRange: '$$', tags: ['food', 'sushi', 'market'], coordinates: { lat: 35.6654, lng: 139.7707 } },
    { id: 'tok-9', name: 'Nakameguro', type: 'activity', city: 'Tokyo', neighborhood: 'Meguro', description: 'Trendy riverside area with boutiques, cafes, and cherry blossoms.', rating: 4.4, reviewCount: 8901, priceRange: '$$', tags: ['trendy', 'cafes', 'shopping'], coordinates: { lat: 35.6441, lng: 139.6989 } },
    { id: 'tok-10', name: 'Robot Restaurant', type: 'nightlife', city: 'Tokyo', neighborhood: 'Shinjuku', description: 'Wild, neon-lit robot cabaret show - uniquely Tokyo entertainment.', rating: 4.2, reviewCount: 15678, priceRange: '$$$', tags: ['entertainment', 'unique', 'show'], coordinates: { lat: 35.6941, lng: 139.7035 } },
    { id: 'tok-11', name: 'Yanaka Ginza', type: 'activity', city: 'Tokyo', neighborhood: 'Yanaka', description: 'Charming old-Tokyo shopping street with traditional snacks and cat statues.', rating: 4.5, reviewCount: 6789, priceRange: '$', tags: ['traditional', 'local', 'shopping'], coordinates: { lat: 35.7269, lng: 139.7673 } },
    { id: 'tok-12', name: 'Shinjuku Gyoen', type: 'attraction', city: 'Tokyo', neighborhood: 'Shinjuku', description: 'Beautiful garden with Japanese, French, and English landscape styles.', rating: 4.7, reviewCount: 21345, priceRange: '$', tags: ['garden', 'nature', 'peaceful'], coordinates: { lat: 35.6852, lng: 139.7100 } },
  ],
  'Bangkok': [
    { id: 'bkk-1', name: 'Grand Palace', type: 'attraction', city: 'Bangkok', neighborhood: 'Rattanakosin', description: 'Thailand\'s most sacred site with stunning architecture and the Emerald Buddha.', rating: 4.6, reviewCount: 67890, priceRange: '$$', tags: ['temple', 'royal', 'must-see'], coordinates: { lat: 13.7500, lng: 100.4914 } },
    { id: 'bkk-2', name: 'Wat Pho', type: 'attraction', city: 'Bangkok', neighborhood: 'Rattanakosin', description: 'Home to the massive reclining Buddha and famous Thai massage school.', rating: 4.7, reviewCount: 45678, priceRange: '$', tags: ['temple', 'buddha', 'massage'], coordinates: { lat: 13.7465, lng: 100.4930 } },
    { id: 'bkk-3', name: 'Chatuchak Weekend Market', type: 'activity', city: 'Bangkok', neighborhood: 'Chatuchak', description: 'World\'s largest weekend market with 15,000+ stalls selling everything.', rating: 4.5, reviewCount: 34567, priceRange: '$', tags: ['market', 'shopping', 'local'], coordinates: { lat: 13.7999, lng: 100.5500 } },
    { id: 'bkk-4', name: 'Jay Fai', type: 'restaurant', city: 'Bangkok', neighborhood: 'Old Town', description: 'Michelin-starred street food legend famous for crab omelette.', rating: 4.8, reviewCount: 12345, priceRange: '$$$', tags: ['michelin', 'street-food', 'famous'], coordinates: { lat: 13.7533, lng: 100.5066 } },
    { id: 'bkk-5', name: 'Warehouse 30', type: 'activity', city: 'Bangkok', neighborhood: 'Charoen Krung', description: 'Creative hub with galleries, cafes, and vintage shops in old warehouses.', rating: 4.4, reviewCount: 5678, priceRange: '$$', tags: ['creative', 'hipster', 'art'], coordinates: { lat: 13.7246, lng: 100.5160 } },
    { id: 'bkk-6', name: 'Thip Samai', type: 'restaurant', city: 'Bangkok', neighborhood: 'Old Town', description: 'Famous for the best Pad Thai in Bangkok - worth the queue.', rating: 4.6, reviewCount: 23456, priceRange: '$', tags: ['pad-thai', 'local', 'must-try'], coordinates: { lat: 13.7541, lng: 100.5053 } },
    { id: 'bkk-7', name: 'Wat Arun', type: 'attraction', city: 'Bangkok', neighborhood: 'Thonburi', description: 'Iconic riverside temple with stunning Khmer-style spire.', rating: 4.6, reviewCount: 34567, priceRange: '$', tags: ['temple', 'river', 'sunset'], coordinates: { lat: 13.7437, lng: 100.4888 } },
    { id: 'bkk-8', name: 'Soi 11 Bangkok', type: 'nightlife', city: 'Bangkok', neighborhood: 'Sukhumvit', description: 'Legendary nightlife street with rooftop bars and clubs.', rating: 4.3, reviewCount: 9876, priceRange: '$$', tags: ['nightlife', 'bars', 'clubs'], coordinates: { lat: 13.7410, lng: 100.5553 } },
    { id: 'bkk-9', name: 'Icon Siam', type: 'activity', city: 'Bangkok', neighborhood: 'Riverside', description: 'Luxurious riverside mall with floating market food hall.', rating: 4.5, reviewCount: 18765, priceRange: '$$$', tags: ['shopping', 'mall', 'food'], coordinates: { lat: 13.7268, lng: 100.5100 } },
    { id: 'bkk-10', name: 'Rocket Coffeebar', type: 'cafe', city: 'Bangkok', neighborhood: 'Sathorn', description: 'Specialty coffee pioneer in Bangkok with excellent brews.', rating: 4.6, reviewCount: 3456, priceRange: '$$', tags: ['coffee', 'specialty', 'hipster'], coordinates: { lat: 13.7220, lng: 100.5268 } },
    { id: 'bkk-11', name: 'Chinatown (Yaowarat)', type: 'activity', city: 'Bangkok', neighborhood: 'Chinatown', description: 'Vibrant street food paradise that comes alive at night.', rating: 4.5, reviewCount: 28901, priceRange: '$', tags: ['street-food', 'night', 'local'], coordinates: { lat: 13.7389, lng: 100.5094 } },
    { id: 'bkk-12', name: 'Maggie Choo\'s', type: 'nightlife', city: 'Bangkok', neighborhood: 'Silom', description: 'Glamorous speakeasy bar in an old bank vault.', rating: 4.4, reviewCount: 6789, priceRange: '$$$', tags: ['speakeasy', 'cocktails', 'fancy'], coordinates: { lat: 13.7285, lng: 100.5343 } },
  ],
  'Chiang Mai': [
    { id: 'cnx-1', name: 'Doi Suthep', type: 'attraction', city: 'Chiang Mai', neighborhood: 'Doi Suthep', description: 'Sacred hilltop temple with 309 steps and panoramic city views.', rating: 4.7, reviewCount: 34567, priceRange: '$', tags: ['temple', 'mountain', 'sacred'], coordinates: { lat: 18.8048, lng: 98.9217 } },
    { id: 'cnx-2', name: 'Sunday Walking Street', type: 'activity', city: 'Chiang Mai', neighborhood: 'Old City', description: 'Weekly night market along the main road with crafts, food, and music.', rating: 4.6, reviewCount: 23456, priceRange: '$', tags: ['market', 'night', 'local'], coordinates: { lat: 18.7883, lng: 98.9927 } },
    { id: 'cnx-3', name: 'Wat Chedi Luang', type: 'attraction', city: 'Chiang Mai', neighborhood: 'Old City', description: 'Ancient ruined temple with massive 14th-century chedi.', rating: 4.5, reviewCount: 18765, priceRange: '$', tags: ['temple', 'ruins', 'historic'], coordinates: { lat: 18.7863, lng: 98.9867 } },
    { id: 'cnx-4', name: 'Khao Soi Khun Yai', type: 'restaurant', city: 'Chiang Mai', neighborhood: 'Old City', description: 'Best khao soi in the city - rich curry noodles with crispy topping.', rating: 4.7, reviewCount: 8901, priceRange: '$', tags: ['khao-soi', 'local', 'must-try'], coordinates: { lat: 18.7954, lng: 98.9844 } },
    { id: 'cnx-5', name: 'Ristr8to Lab', type: 'cafe', city: 'Chiang Mai', neighborhood: 'Nimman', description: 'World latte art champion\'s coffee shop with stunning designs.', rating: 4.6, reviewCount: 5678, priceRange: '$$', tags: ['coffee', 'latte-art', 'specialty'], coordinates: { lat: 18.7979, lng: 98.9678 } },
    { id: 'cnx-6', name: 'Elephant Nature Park', type: 'activity', city: 'Chiang Mai', neighborhood: 'Mae Taeng', description: 'Ethical elephant sanctuary for rescued elephants - no riding.', rating: 4.9, reviewCount: 15678, priceRange: '$$$', tags: ['elephants', 'ethical', 'nature'], coordinates: { lat: 19.1755, lng: 98.8988 } },
    { id: 'cnx-7', name: 'Zoe in Yellow', type: 'nightlife', city: 'Chiang Mai', neighborhood: 'Old City', description: 'Popular open-air bar area with multiple venues and live music.', rating: 4.2, reviewCount: 6789, priceRange: '$', tags: ['nightlife', 'bars', 'backpacker'], coordinates: { lat: 18.7901, lng: 98.9919 } },
    { id: 'cnx-8', name: 'Nimman Road', type: 'activity', city: 'Chiang Mai', neighborhood: 'Nimman', description: 'Trendy street with boutiques, cafes, and art galleries.', rating: 4.4, reviewCount: 12345, priceRange: '$$', tags: ['shopping', 'cafes', 'trendy'], coordinates: { lat: 18.7970, lng: 98.9675 } },
    { id: 'cnx-9', name: 'Warorot Market', type: 'activity', city: 'Chiang Mai', neighborhood: 'Old City', description: 'Local market for northern Thai food, spices, and goods.', rating: 4.3, reviewCount: 7890, priceRange: '$', tags: ['market', 'local', 'food'], coordinates: { lat: 18.7892, lng: 99.0007 } },
    { id: 'cnx-10', name: 'Wat Phra Singh', type: 'attraction', city: 'Chiang Mai', neighborhood: 'Old City', description: 'Beautiful temple housing the revered Phra Singh Buddha image.', rating: 4.6, reviewCount: 14567, priceRange: '$', tags: ['temple', 'buddhist', 'art'], coordinates: { lat: 18.7886, lng: 98.9815 } },
    { id: 'cnx-11', name: 'Baan Kang Wat', type: 'activity', city: 'Chiang Mai', neighborhood: 'Suthep', description: 'Artist village with workshops, galleries, and weekend markets.', rating: 4.5, reviewCount: 4567, priceRange: '$$', tags: ['art', 'crafts', 'local'], coordinates: { lat: 18.8012, lng: 98.9558 } },
    { id: 'cnx-12', name: 'SP Chicken', type: 'restaurant', city: 'Chiang Mai', neighborhood: 'Old City', description: 'Famous rotisserie chicken spot with perfectly crispy skin.', rating: 4.5, reviewCount: 6789, priceRange: '$', tags: ['chicken', 'local', 'cheap'], coordinates: { lat: 18.7871, lng: 98.9936 } },
  ],
};

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

const PlaceSchema = z.object({
  id: z.string().optional().default(''),
  name: z.string().min(1),
  type: z.enum(['attraction', 'restaurant', 'cafe', 'activity', 'nightlife']),
  city: z.string().min(1),
  neighborhood: z.string().optional().default(''),
  description: z.string().optional().default(''),
  rating: z.number().optional(),
  reviewCount: z.number().optional(),
  priceRange: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

const PlacesResponseSchema = z.object({
  places: z.array(PlaceSchema),
});

export async function POST(request: NextRequest) {
  try {
    const originResponse = enforceSameOrigin(request);
    if (originResponse) return originResponse;

    const apiKeyResponse = enforceApiKey(request);
    if (apiKeyResponse) return apiKeyResponse;

    const rateLimitResponse = enforceRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    const { city, category, interests } = await request.json();

    // If no API key, return mock data
    if (!ANTHROPIC_API_KEY) {
      const normalizedCity = city?.toLowerCase() || '';
      let mockPlaces = MOCK_PLACES['Tokyo']; // Default fallback

      // Find matching city
      for (const [cityKey, places] of Object.entries(MOCK_PLACES)) {
        if (normalizedCity.includes(cityKey.toLowerCase()) || cityKey.toLowerCase().includes(normalizedCity)) {
          mockPlaces = places;
          break;
        }
      }

      // Filter by category if specified
      let filteredPlaces = [...mockPlaces];
      if (category && category !== 'all') {
        const categoryMap: Record<string, string[]> = {
          'things-to-do': ['attraction', 'activity'],
          'food': ['restaurant'],
          'cafes': ['cafe'],
          'nightlife': ['nightlife'],
        };
        const allowedTypes = categoryMap[category] || [category];
        filteredPlaces = filteredPlaces.filter(p => allowedTypes.includes(p.type));
      }

      // Add city to each place
      filteredPlaces = filteredPlaces.map(p => ({ ...p, city: city || p.city }));

      return NextResponse.json({ places: filteredPlaces, isMockData: true });
    }

    if (!city) {
      return NextResponse.json({ error: 'City is required', places: [] }, { status: 400 });
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

    // Use direct fetch like chat route (SDK may not work in Cloudflare Workers)
    const response = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    }, 60000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json(
        { error: `Claude API error: ${response.status}`, places: [] },
        { status: 500 }
      );
    }

    const message = await response.json();

    // Extract text content
    const textContent = message.content?.find((block: { type: string }) => block.type === 'text');
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
    const parsed = PlacesResponseSchema.safeParse(data);
    if (!parsed.success) {
      console.error('Invalid AI recommendations schema', parsed.error.flatten());
      return NextResponse.json(
        { error: 'Invalid AI response format', places: [] },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate recommendations: ${errorMessage}`, places: [] },
      { status: 500 }
    );
  }
}
