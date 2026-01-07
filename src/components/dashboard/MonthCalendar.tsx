'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StoredTrip } from '@/lib/db/indexed-db';
import type { Itinerary, DayPlan } from '@/types/itinerary';
import { getTripDateRanges, isDateInTrip, TripDateRange } from '@/hooks/useTripStats';
import { cn } from '@/lib/utils';

/**
 * STYLE GUIDE - Font Sizes (Tailwind classes):
 *
 * Dashboard (non-compact):
 * - Section titles (e.g. "Hotels"): text-base font-semibold (16px)
 * - Card headers (e.g. "January 2026"): text-sm font-semibold (14px)
 * - Labels/meta: text-xs (12px)
 * - Small text: text-[11px] or text-[10px]
 *
 * Trip Page (compact mode):
 * - Headers: text-xs font-semibold (12px)
 * - Labels: text-[10px]
 * - Small: text-[9px] or text-[8px]
 *
 * Always use font-medium or font-semibold for headers, not font-bold
 */

interface MonthCalendarProps {
  trips: StoredTrip[];
  onDateClick?: (date: Date, trip?: TripDateRange) => void;
  compact?: boolean;
  itinerary?: Itinerary;
  contentFilter?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Get days in month grid (including padding days from prev/next month)
 * Always returns 42 cells (6 rows) for consistent height
 */
function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week (0 = Sunday, which is already correct for Sunday start)
  const startDayOfWeek = firstDay.getDay();

  const days: (Date | null)[] = [];

  // Add padding for days before first of month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  // Pad to always have 42 cells (6 rows) for consistent height
  while (days.length < 42) {
    days.push(null);
  }

  return days;
}

export function MonthCalendar({ trips, onDateClick, compact = false, itinerary, contentFilter }: MonthCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const tripRanges = useMemo(() => getTripDateRanges(trips), [trips]);

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Build a map of dates to their activity categories (for colored dots)
  const dateActivities = useMemo(() => {
    if (!itinerary) return {};
    const map: Record<string, Set<string>> = {};

    itinerary.days?.forEach((day: DayPlan) => {
      if (!day.date) return;
      const dateKey = day.date;
      if (!map[dateKey]) map[dateKey] = new Set();

      day.blocks?.forEach(block => {
        const cat = block.activity?.category?.toLowerCase();
        if (cat) {
          if (cat === 'flight' || cat === 'transit') {
            map[dateKey].add('transport');
          } else if (cat === 'food' || cat === 'restaurant') {
            map[dateKey].add('food');
          } else if (cat === 'accommodation' || cat === 'hotel') {
            map[dateKey].add('hotel');
          } else {
            map[dateKey].add('activity');
          }
        }
      });
    });

    // Add hotel check-in dates from bases
    itinerary.route?.bases?.forEach(base => {
      if (base.checkIn) {
        const dateKey = base.checkIn.split('T')[0];
        if (!map[dateKey]) map[dateKey] = new Set();
        map[dateKey].add('hotel');
      }
    });

    return map;
  }, [itinerary]);

  // Filter which categories to show based on contentFilter
  const getVisibleCategories = (dateKey: string): string[] => {
    const cats = dateActivities[dateKey];
    if (!cats) return [];

    const allCats = Array.from(cats);

    switch (contentFilter) {
      case 'transport':
        return allCats.filter(c => c === 'transport');
      case 'hotels':
        return allCats.filter(c => c === 'hotel');
      case 'restaurants':
        return allCats.filter(c => c === 'food');
      case 'experiences':
        return allCats.filter(c => c === 'activity');
      default:
        return allCats; // Show all for overview/schedule
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'transport': return 'bg-blue-500';
      case 'hotel': return 'bg-purple-500';
      case 'food': return 'bg-orange-500';
      case 'activity': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isWeekend = (date: Date | null) => {
    if (!date) return false;
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <Card className="py-0">
      <CardContent className={compact ? "p-2" : "p-3"}>
        {/* Month/Year Header */}
        <div className={cn("flex items-center justify-between", compact ? "mb-2" : "mb-3")}>
          <h3 className={cn("font-semibold", compact ? "text-xs" : "text-sm")}>
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <div className="flex gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={compact ? "h-5 w-5" : "h-6 w-6"}
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={compact ? "h-5 w-5" : "h-6 w-6"}
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Day of week headers */}
        <div className={cn("grid grid-cols-7 gap-0.5", compact ? "mb-1" : "mb-1.5")}>
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                "text-center font-medium",
                compact ? "text-[9px]" : "text-[10px]",
                (i === 0 || i === 6) ? "text-primary" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className={compact ? "h-6" : "h-7"} />;
            }

            const tripRange = isDateInTrip(date, tripRanges);
            const todayClass = isToday(date);
            const weekendClass = isWeekend(date);
            const dateKey = formatDateKey(date);
            const visibleCats = itinerary ? getVisibleCategories(dateKey) : [];

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateClick?.(date, tripRange || undefined)}
                className={cn(
                  "w-full rounded-md font-medium transition-colors relative flex flex-col items-center justify-center",
                  compact ? "h-6 text-[10px]" : "h-7 text-xs",
                  "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  todayClass && "bg-primary text-primary-foreground hover:bg-primary/90",
                  !todayClass && tripRange && "bg-muted text-foreground",
                  !todayClass && !tripRange && weekendClass && "text-primary",
                  !todayClass && !tripRange && !weekendClass && "text-foreground"
                )}
                title={tripRange?.tripTitle}
              >
                <span>{date.getDate()}</span>
                {/* Activity dots */}
                {visibleCats.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {visibleCats.slice(0, 3).map((cat, i) => (
                      <span
                        key={i}
                        className={cn("w-1 h-1 rounded-full", getCategoryColor(cat))}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Dot legend - only show when itinerary is provided */}
        {itinerary && (
          <div className={cn("flex items-center justify-center gap-3 border-t pt-1.5", compact ? "mt-1.5" : "mt-2")}>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className={cn("text-muted-foreground", compact ? "text-[8px]" : "text-[9px]")}>Transport</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span className={cn("text-muted-foreground", compact ? "text-[8px]" : "text-[9px]")}>Hotels</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <span className={cn("text-muted-foreground", compact ? "text-[8px]" : "text-[9px]")}>Activities</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className={cn("text-muted-foreground", compact ? "text-[8px]" : "text-[9px]")}>Food</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
