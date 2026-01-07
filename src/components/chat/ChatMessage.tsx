'use client';

import { Bot, User, Wrench, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType, ToolCall } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-3 p-3 rounded-lg',
        isUser ? 'bg-primary/5 ml-8' : 'bg-muted/50 mr-8'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary/10' : 'bg-primary/20'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-primary" />
        ) : (
          <Bot className="h-4 w-4 text-primary" />
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.content}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse" />
          )}
        </div>

        {message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCallIndicators calls={message.toolCalls} />
        )}
      </div>
    </div>
  );
}

interface ToolCallIndicatorsProps {
  calls: ToolCall[];
}

function ToolCallIndicators({ calls }: ToolCallIndicatorsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {calls.map((call) => (
        <div
          key={call.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded text-xs"
        >
          <Wrench className="h-3 w-3" />
          {formatToolName(call.name)}
        </div>
      ))}
    </div>
  );
}

function formatToolName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Loading message for when assistant is thinking
export function LoadingMessage() {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-muted/50 mr-8">
      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Thinking...
      </div>
    </div>
  );
}

// Welcome message when chat is empty
export function WelcomeMessage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Bot className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-medium mb-2">Trip Assistant</h3>
      <p className="text-sm text-muted-foreground max-w-[250px]">
        Ask me to find restaurants, update your schedule, or modify your trip plans.
      </p>
    </div>
  );
}
