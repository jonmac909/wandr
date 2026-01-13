import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { placeName, city, type } = await request.json();

    if (!placeName) {
      return NextResponse.json({ error: 'Place name required' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `Write a 2-3 sentence historical/cultural description of "${placeName}"${city ? ` in ${city}` : ''}.

Include:
- When it was founded/built and by whom
- Its historical significance or cultural importance
- One interesting fact visitors would appreciate

Be specific with dates and facts. Write in an informative travel guide style.
Return ONLY the description text, no quotes or labels.`
        }
      ]
    });

    const history = (message.content[0] as { type: 'text'; text: string }).text;

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching place history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
