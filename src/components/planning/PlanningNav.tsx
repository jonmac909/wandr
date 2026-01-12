'use client';

import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlanningSection = 'where' | 'prefs' | 'cities' | 'route' | 'itinerary';

interface PlanningNavProps {
  currentSection: PlanningSection;
  onSectionChange: (section: PlanningSection) => void;
  completedSections: PlanningSection[];
}

const SECTIONS: { id: PlanningSection; label: string }[] = [
  { id: 'where', label: 'Where & When' },
  { id: 'prefs', label: 'Preferences' },
  { id: 'cities', label: 'Cities' },
  { id: 'route', label: 'Route' },
  { id: 'itinerary', label: 'Itinerary' },
];

export function PlanningNav({ currentSection, onSectionChange, completedSections }: PlanningNavProps) {
  const currentIndex = SECTIONS.findIndex(s => s.id === currentSection);

  const canNavigateTo = (sectionId: PlanningSection) => {
    const sectionIndex = SECTIONS.findIndex(s => s.id === sectionId);
    // Can navigate to completed sections
    if (completedSections.includes(sectionId)) return true;
    // Can go to current
    if (sectionId === currentSection) return true;
    // Can go to next section from current (one step forward)
    if (sectionIndex === currentIndex + 1) return true;
    // Can go to next if previous is completed
    const prevSection = SECTIONS[sectionIndex - 1];
    if (prevSection && completedSections.includes(prevSection.id)) return true;
    return false;
  };

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < SECTIONS.length - 1;

  const goBack = () => {
    if (canGoBack) {
      onSectionChange(SECTIONS[currentIndex - 1].id);
    }
  };

  const goForward = () => {
    if (canGoForward) {
      onSectionChange(SECTIONS[currentIndex + 1].id);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-center gap-2">
        {/* Back button */}
        <button
          onClick={goBack}
          disabled={!canGoBack}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
            canGoBack
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
          )}
          aria-label="Previous step"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {SECTIONS.map((section, index) => {
          const isCompleted = completedSections.includes(section.id);
          const isCurrent = section.id === currentSection;
          const isActive = isCompleted || isCurrent;
          const isClickable = canNavigateTo(section.id);

          return (
            <div key={section.id} className="flex items-center">
              {/* Section button */}
              <button
                onClick={() => isClickable && onSectionChange(section.id)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center w-16 sm:w-20 transition-opacity",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold mb-1 transition-colors",
                  isCurrent
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                      ? "bg-muted text-muted-foreground"
                      : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted && !isCurrent ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium text-center transition-colors leading-tight",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  {section.label}
                </span>
              </button>

              {/* Connector line (not after last) */}
              {index < SECTIONS.length - 1 && (
                <div className={cn(
                  "h-0.5 w-6 sm:w-10 -mx-1 rounded transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}

        {/* Forward button */}
        <button
          onClick={goForward}
          disabled={!canGoForward}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-all",
            canGoForward
              ? "bg-primary/10 text-primary hover:bg-primary/20"
              : "bg-muted/50 text-muted-foreground/40 cursor-not-allowed"
          )}
          aria-label="Next step"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
