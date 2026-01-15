// Chat types for Claude AI chatbot integration

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  isError: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ChatSession {
  id: string;
  tripId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// API request/response types
export interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  tripId: string;
  itinerary: unknown; // Itinerary type from itinerary.ts
  oauthToken: string;
}

export interface StreamEvent {
  type: 'content_block_delta' | 'content_block_stop' | 'message_stop' | 'tool_use';
  delta?: {
    type: string;
    text?: string;
  };
  content_block?: {
    type: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  };
}

// Tool definitions for Claude
export type ToolName =
  | 'get_itinerary'
  | 'search_restaurants'
  | 'add_activity'
  | 'update_activity'
  | 'delete_activity'
  | 'move_activity'
  | 'add_restaurant'
  | 'get_booking_link'
  | 'add_base'
  | 'update_base'
  | 'delete_base'
  | 'delete_day'
  | 'update_trip_dates';

export interface ToolDefinition {
  name: ToolName;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
