// General chat API route for Claude - works without trip context

import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const GENERAL_SYSTEM_PROMPT = `You are a helpful travel planning assistant for the Trippified app. You help users plan trips and answer travel-related questions.

## Your Role
- Answer questions about travel destinations
- Help users brainstorm trip ideas
- Provide travel tips and recommendations
- Suggest itinerary structures
- Answer questions about the best times to visit places
- Help with budgeting and packing advice

## Guidelines
1. Be concise and helpful
2. Use web search when asked about current information, prices, or specific bookings
3. Provide practical, actionable advice
4. Be enthusiastic about travel!

## Important
- You don't have access to any specific trip - this is general travel assistance
- For trip-specific help (modifying itineraries, adding activities), users should open their trip first
- Focus on inspiration, planning advice, and general travel questions

## Response Style
- Keep responses conversational but informative
- Use bullet points for lists
- Suggest creating a trip in the app when users have a destination in mind`;

interface ChatRequestBody {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages } = body;

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured.' },
        { status: 401 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: GENERAL_SYSTEM_PROMPT,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools: [
          {
            type: 'web_search_20250305',
            name: 'web_search',
            max_uses: 3,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json({ error: 'Failed to connect to Claude API' }, { status: response.status });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('General chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
