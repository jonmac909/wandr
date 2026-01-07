// Streaming chat API route for Claude chatbot

import { NextRequest, NextResponse } from 'next/server';
import { buildChatSystemPrompt } from '@/lib/ai/chat-prompts';
import { getToolsForAPI } from '@/lib/ai/chat-tools';
import type { Itinerary } from '@/types/itinerary';

// API key from environment variable (standard Anthropic API key, not OAuth)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

interface ChatRequestBody {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  tripId: string;
  itinerary: Itinerary;
  oauthToken?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, itinerary } = body;

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured on server.' },
        { status: 401 }
      );
    }

    // Build system prompt with current trip context
    const systemPrompt = buildChatSystemPrompt(itinerary);

    // Get tool definitions
    const tools = getToolsForAPI();

    // Make streaming request to Claude API with web search enabled
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
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        tools,
        stream: true,
      }),
    });

    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);

      // Parse error for user-friendly message
      let errorMessage = 'Failed to connect to Claude API';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch {
        // Keep default message
      }

      // Check for specific API errors
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check server configuration.';
      } else if (response.status === 403) {
        errorMessage = 'API key not authorized. Please check permissions.';
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }

    // Stream the response back to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle tool results - client sends tool execution results back
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, toolResults, itinerary } = body;

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured on server.' },
        { status: 401 }
      );
    }

    // Build messages with tool results
    const messagesWithToolResults = [
      ...messages,
      {
        role: 'user',
        content: toolResults.map((tr: { toolCallId: string; result: unknown }) => ({
          type: 'tool_result',
          tool_use_id: tr.toolCallId,
          content: JSON.stringify(tr.result),
        })),
      },
    ];

    const systemPrompt = buildChatSystemPrompt(itinerary);
    const tools = getToolsForAPI();

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
        max_tokens: 4096,
        system: systemPrompt,
        messages: messagesWithToolResults,
        tools,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to process tool results' },
        { status: response.status }
      );
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Tool result API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
