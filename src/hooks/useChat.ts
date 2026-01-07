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

// Server-managed tools that Claude handles automatically
const SERVER_MANAGED_TOOLS = ['web_search'];

// Parse SSE stream and extract content + tool calls
interface StreamResult {
  content: string;
  toolCalls: ToolCall[];
}

async function parseStreamResponse(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  decoder: TextDecoder,
  onContentUpdate: (content: string) => void,
  timeoutMs: number = 60000
): Promise<StreamResult> {
  let buffer = '';
  let content = '';
  const toolCalls: ToolCall[] = [];
  let currentToolCall: Partial<ToolCall> | null = null;
  let currentToolInputJson = '';
  let chunkCount = 0;

  console.log('parseStreamResponse: Starting to read stream...');

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Stream read timeout')), timeoutMs);
  });

  try {
    while (true) {
      const readPromise = reader.read();
      const { done, value } = await Promise.race([readPromise, timeoutPromise]);

      if (done) {
        console.log(`parseStreamResponse: Stream done after ${chunkCount} chunks`);
        break;
      }
      chunkCount++;

      if (chunkCount % 10 === 0) {
        console.log(`parseStreamResponse: Read ${chunkCount} chunks so far...`);
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          // Handle text content
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            content += event.delta.text || '';
            onContentUpdate(content);
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
  } catch (err) {
    console.error('parseStreamResponse: Error during stream read:', err);
    // Return what we have so far
  }

  console.log(`parseStreamResponse: Finished. Content length: ${content.length}, Tool calls: ${toolCalls.length}`);
  if (toolCalls.length > 0) {
    console.log('parseStreamResponse: Tool calls found:', toolCalls.map(tc => tc.name));
  }

  return { content, toolCalls };
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

      const decoder = new TextDecoder();
      const assistantMessageId = crypto.randomUUID();

      // Create placeholder assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        },
      ]);

      try {
        // Initial request
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

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream');
        }

        // Track accumulated content across all turns
        let accumulatedContent = '';

        // Parse initial response
        const initialResult = await parseStreamResponse(reader, decoder, (newContent) => {
          accumulatedContent = newContent;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMessageId ? { ...m, content: newContent } : m))
          );
        });

        accumulatedContent = initialResult.content;
        let allToolCalls = initialResult.toolCalls;

        // Update message with tool calls
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: accumulatedContent, toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined }
              : m
          )
        );

        // Process tool calls in a loop (Claude might need multiple turns)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let conversationMessages: Array<{ role: string; content: any }> = [...apiMessages];
        const maxIterations = 5; // Safety limit
        let iteration = 0;

        while (allToolCalls.length > 0 && iteration < maxIterations) {
          iteration++;
          console.log(`Tool execution iteration ${iteration}, tools:`, allToolCalls.map(tc => tc.name));

          // Filter out server-managed tools
          const clientToolCalls = allToolCalls.filter(tc => !SERVER_MANAGED_TOOLS.includes(tc.name));

          if (clientToolCalls.length === 0) {
            console.log('No client-side tools to execute');
            break;
          }

          // Execute client-side tools
          const toolResults: Array<{ toolCallId: string; result: unknown }> = [];

          for (const toolCall of clientToolCalls) {
            console.log('Executing tool:', toolCall.name, toolCall.input);
            const result = await executeToolCall(
              toolCall.name as ToolName,
              toolCall.input,
              { itinerary: currentItinerary.current, tripId }
            );
            console.log('Tool result:', result);

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

          // Build assistant message with ONLY client-side tool calls for continuation
          // (server-managed tools like web_search are handled automatically by Claude)
          const assistantTurnContent = [
            ...(accumulatedContent ? [{ type: 'text', text: accumulatedContent }] : []),
            ...clientToolCalls.map((tc) => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input,
            })),
          ];

          // Update conversation messages for next turn
          conversationMessages = [
            ...conversationMessages,
            { role: 'assistant', content: assistantTurnContent },
          ];

          console.log('Assistant turn content:', JSON.stringify(assistantTurnContent, null, 2));
          console.log('Tool results being sent:', JSON.stringify(toolResults, null, 2));

          // Send tool results back to Claude
          console.log('Sending tool results to API...');
          const continuationResponse = await fetch('/api/chat', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: conversationMessages,
              toolResults,
              itinerary: currentItinerary.current,
            }),
          });

          console.log('Continuation response status:', continuationResponse.status);
          console.log('Continuation response content-type:', continuationResponse.headers.get('content-type'));

          if (!continuationResponse.ok) {
            const errorText = await continuationResponse.text();
            console.error('Continuation failed:', errorText);
            throw new Error(`Failed to get continuation from Claude: ${errorText}`);
          }

          // Check if response is JSON error instead of SSE stream
          const contentType = continuationResponse.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await continuationResponse.json();
            console.error('Continuation returned JSON error:', errorData);
            throw new Error(errorData.error || 'Unexpected JSON response from continuation');
          }

          const contReader = continuationResponse.body?.getReader();
          if (!contReader) {
            throw new Error('No continuation stream');
          }

          // Parse continuation response
          const baseContent = accumulatedContent;
          const contResult = await parseStreamResponse(contReader, decoder, (newContent) => {
            const fullContent = baseContent + (baseContent && newContent ? '\n\n' : '') + newContent;
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantMessageId ? { ...m, content: fullContent } : m))
            );
          });

          // Update accumulated content
          if (contResult.content) {
            accumulatedContent = baseContent + (baseContent && contResult.content ? '\n\n' : '') + contResult.content;
          }

          // Check for more tool calls
          allToolCalls = contResult.toolCalls;

          // Update message with new tool calls
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: accumulatedContent,
                    toolCalls: allToolCalls.length > 0 ? allToolCalls : m.toolCalls,
                  }
                : m
            )
          );
        }

        console.log(`Exited tool loop after ${iteration} iterations. Final content length: ${accumulatedContent.length}`);

        // Final message update
        if (!accumulatedContent) {
          console.warn('No content received from Claude');
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: "I've processed your request. Is there anything else you'd like me to help with?" }
                : m
            )
          );
        }

        if (iteration >= maxIterations) {
          console.warn('Max tool iterations reached');
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
