'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, ToolCall } from '@/types/chat';
import type { Itinerary } from '@/types/itinerary';
import { executeToolCall } from '@/lib/ai/tool-handlers';
import type { ToolName } from '@/types/chat';

interface UseChatOptions {
  tripId: string;
  itinerary: Itinerary;
  onItineraryUpdate?: (itinerary: Itinerary) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  hasToken: boolean;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChat({
  tripId,
  itinerary,
  onItineraryUpdate,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Token is now hardcoded on server, always available
  const hasToken = true;

  const currentItinerary = useRef(itinerary);

  // Keep itinerary ref updated
  useEffect(() => {
    currentItinerary.current = itinerary;
  }, [itinerary]);

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);
      setIsLoading(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Prepare messages for API
      const apiMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            tripId,
            itinerary: currentItinerary.current,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream');
        }

        let assistantContent = '';
        const toolCalls: ToolCall[] = [];
        let currentToolCall: Partial<ToolCall> | null = null;

        const decoder = new TextDecoder();
        let buffer = '';

        // Create placeholder assistant message
        const assistantMessageId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);

            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);

              // Handle different event types
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                assistantContent += event.delta.text || '';
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId ? { ...m, content: assistantContent } : m
                  )
                );
              }

              // Handle tool use
              if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
                currentToolCall = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: {},
                };
              }

              if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
                // Accumulate tool input JSON
                if (currentToolCall) {
                  // This is simplified - in practice you'd need to parse the partial JSON
                }
              }

              if (event.type === 'content_block_stop' && currentToolCall) {
                toolCalls.push(currentToolCall as ToolCall);
                currentToolCall = null;
              }
            } catch {
              // Ignore JSON parse errors from partial data
            }
          }
        }

        // Update message with final content and tool calls
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: assistantContent, toolCalls: toolCalls.length > 0 ? toolCalls : undefined }
              : m
          )
        );

        // Execute tool calls if any
        if (toolCalls.length > 0) {
          for (const toolCall of toolCalls) {
            const result = await executeToolCall(
              toolCall.name as ToolName,
              toolCall.input,
              { itinerary: currentItinerary.current, tripId }
            );

            // Update itinerary if modified
            if (result.updatedItinerary) {
              currentItinerary.current = result.updatedItinerary;
              onItineraryUpdate?.(result.updatedItinerary);
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, tripId, onItineraryUpdate]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    hasToken,
    sendMessage,
    clearMessages,
  };
}
