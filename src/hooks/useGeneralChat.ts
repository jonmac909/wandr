'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types/chat';

interface UseGeneralChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

export function useGeneralChat(): UseGeneralChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

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

      messagesRef.current = [...messagesRef.current, userMessage];
      setMessages((prev) => [...prev, userMessage]);

      // Prepare messages for API
      const apiMessages = [...messagesRef.current].map((m) => ({
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
        const response = await fetch('/api/chat/general', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream');
        }

        let buffer = '';
        let content = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                content += event.delta.text || '';
                setMessages((prev) =>
                  prev.map((m) => (m.id === assistantMessageId ? { ...m, content } : m))
                );
              }
            } catch {
              // Ignore JSON parse errors
            }
          }
        }

        if (!content) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: "I'm here to help with your travel planning! What would you like to know?" }
                : m
            )
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Chat error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
