'use client';

import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TripHubSectionProps {
  icon: ReactNode;
  title: string;
  status: string;
  buttonText: string;
  onButtonClick: () => void;
  expanded?: boolean;
  onToggle?: () => void;
  children?: ReactNode;
}

export function TripHubSection({
  icon,
  title,
  status,
  buttonText,
  onButtonClick,
  expanded = false,
  onToggle,
  children,
}: TripHubSectionProps) {
  return (
    <Card className={cn(
      "transition-all duration-200",
      expanded && "ring-1 ring-primary/20"
    )}>
      <CardContent className="p-0">
        {/* Header - always visible */}
        <div
          className={cn(
            "flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors",
            expanded && "border-b"
          )}
          onClick={onToggle}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-muted-foreground shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{title}</div>
              <div className="text-xs text-muted-foreground truncate">{status}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={expanded ? "default" : "outline"}
              className="h-8 px-4"
              onClick={(e) => {
                e.stopPropagation();
                onButtonClick();
              }}
            >
              {buttonText}
            </Button>
            {onToggle && (
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  expanded && "rotate-180"
                )}
              />
            )}
          </div>
        </div>

        {/* Expandable content */}
        {expanded && children && (
          <div className="p-4 bg-muted/20">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
