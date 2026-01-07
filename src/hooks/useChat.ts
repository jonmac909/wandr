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
        let currentToolInputJson = '';

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

              // Handle tool use start
              if (event.type === 'content_block_start' && event.content_block?.type === 'tool_use') {
                currentToolCall = {
                  id: event.content_block.id,
                  name: event.content_block.name,
                  input: {},
                };
                currentToolInputJson = '';
              }

              // Accumulate tool input JSON chunks
              if (event.type === 'content_block_delta' && event.delta?.type === 'input_json_delta') {
                if (currentToolCall && event.delta.partial_json) {
                  currentToolInputJson += event.delta.partial_json;
                }
              }

              // Tool block complete - parse accumulated JSON
              if (event.type === 'content_block_stop' && currentToolCall) {
                try {
                  if (currentToolInputJson) {
                    currentToolCall.input = JSON.parse(currentToolInputJson);
                  }
                } catch {
                  console.error('Failed to parse tool input JSON:', currentToolInputJson);
                }
                toolCalls.push(currentToolCall as ToolCall);
                currentToolCall = null;
                currentToolInputJson = '';
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

        // Execute tool calls if any and get continuation from Claude
        if (toolCalls.length > 0) {
          const toolResults: Array<{ toolCallId: string; result: unknown }> = [];

          for (const toolCall of toolCalls) {
            const result = await executeToolCall(
              toolCall.name as ToolName,
              toolCall.input,
              { itinerary: currentItinerary.current, tripId }
            );

            toolResults.push({
              toolCallId: toolCall.id,
              result: result.result,
            });

            // Update itinerary if modified
            if (result.updatedItinerary) {
              currentItinerary.current = result.updatedItinerary;
              onItineraryUpdate?.(result.updatedItinerary);
            }
          }

          // Send tool results back to Claude for continuation
          const continuationResponse = await fetch('/api/chat', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                ...apiMessages,
                {
                  role: 'assistant',
                  content: [
                    ...(assistantContent ? [{ type: 'text', text: assistantContent }] : []),
                    ...toolCalls.map((tc) => ({
                      type: 'tool_use',
                      id: tc.id,
                      name: tc.name,
                      input: tc.input,
                    })),
                  ],
                },
              ],
              toolResults,
              itinerary: currentItinerary.current,
            }),
          });

          if (continuationResponse.ok) {
            const contReader = continuationResponse.body?.getReader();
            if (contReader) {
              let contBuffer = '';
              let contContent = '';

              while (true) {
                const { done, value } = await contReader.read();
                if (done) break;

                contBuffer += decoder.decode(value, { stream: true });
                const contLines = contBuffer.split('\n');
                contBuffer = contLines.pop() || '';

                for (const line of contLines) {
                  if (!line.startsWith('data: ')) continue;
                  const data = line.slice(6);
                  if (data === '[DONE]') continue;

                  try {
                    const event = JSON.parse(data);
                    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                      contContent += event.delta.text || '';
                      setMessages((prev) =>
                        prev.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: assistantContent + '\n\n' + contContent }
                            : m
                        )
                      );
                    }
                  } catch {
                    // Ignore parse errors
                  }
                }
              }
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
