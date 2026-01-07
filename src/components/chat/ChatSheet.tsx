'use client';

import { useRef, useEffect } from 'react';
import { Bot, Settings, Trash2, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChatMessage, LoadingMessage, WelcomeMessage } from './ChatMessage';
import { ChatInput, SuggestedPrompts } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import type { Itinerary } from '@/types/itinerary';

interface ChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  itinerary: Itinerary;
  onItineraryUpdate: (itinerary: Itinerary) => void;
  onOpenSettings?: () => void;
}

export function ChatSheet({
  open,
  onOpenChange,
  tripId,
  itinerary,
  onItineraryUpdate,
  onOpenSettings,
}: ChatSheetProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    hasToken,
    sendMessage,
    clearMessages,
  } = useChat({
    tripId,
    itinerary,
    onItineraryUpdate,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[400px] sm:max-w-[400px] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-base">Trip Assistant</SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="h-8 w-8"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {onOpenSettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenSettings();
                  }}
                  className="h-8 w-8"
                  title="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col">
              <WelcomeMessage />
              <div className="mt-auto">
                <SuggestedPrompts
                  onSelect={sendMessage}
                  tripDestination={itinerary.meta.destination}
                />
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isStreaming={isLoading && message === messages[messages.length - 1]}
                />
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <LoadingMessage />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          isLoading={isLoading}
          disabled={!hasToken}
          placeholder={
            hasToken
              ? 'Ask about your trip...'
              : 'Add Claude token in Settings to chat'
          }
        />
      </SheetContent>
    </Sheet>
  );
}
