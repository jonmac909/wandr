'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SelectableCardProps {
  selected: boolean;
  onSelect: () => void;
  icon?: ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function SelectableCard({
  selected,
  onSelect,
  icon,
  label,
  description,
  disabled = false,
}: SelectableCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 transition-all',
        'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-muted bg-card hover:bg-accent/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              'text-2xl',
              selected ? 'opacity-100' : 'opacity-70'
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div
            className={cn(
              'font-medium',
              selected ? 'text-primary' : 'text-foreground'
            )}
          >
            {label}
          </div>
          {description && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {description}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            selected ? 'border-primary bg-primary' : 'border-muted'
          )}
        >
          {selected && (
            <svg
              className="w-3 h-3 text-primary-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
}

// Multi-select version with ranking
interface RankedSelectableCardProps {
  selected: boolean;
  rank?: number;
  onSelect: () => void;
  icon?: ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
  maxSelections?: number;
  currentSelections?: number;
}

export function RankedSelectableCard({
  selected,
  rank,
  onSelect,
  icon,
  label,
  description,
  disabled = false,
  maxSelections,
  currentSelections = 0,
}: RankedSelectableCardProps) {
  const isDisabled = disabled || (!selected && maxSelections !== undefined && currentSelections >= maxSelections);

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isDisabled}
      className={cn(
        'w-full text-left p-4 rounded-xl border-2 transition-all',
        'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-muted bg-card hover:bg-accent/50',
        isDisabled && !selected && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn(
              'text-2xl',
              selected ? 'opacity-100' : 'opacity-70'
            )}
          >
            {icon}
          </div>
        )}
        <div className="flex-1">
          <div
            className={cn(
              'font-medium',
              selected ? 'text-primary' : 'text-foreground'
            )}
          >
            {label}
          </div>
          {description && (
            <div className="text-sm text-muted-foreground mt-0.5">
              {description}
            </div>
          )}
        </div>
        {selected && rank !== undefined ? (
          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm">
            {rank}
          </div>
        ) : (
          <div
            className={cn(
              'w-5 h-5 rounded-full border-2',
              'border-muted'
            )}
          />
        )}
      </div>
    </button>
  );
}
