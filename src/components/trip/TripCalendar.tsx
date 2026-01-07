'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Itinerary, DayPlan } from '@/types/itinerary';

interface TripCalendarProps {
  itinerary: Itinerary;
  contentFilter: string;
  onDateClick?: (date: string) => void;
  selectedDate?: string;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Category to color mapping
const CATEGORY_COLORS: Record<string, string> = {
  flight: 'bg-blue-500',
  transit: 'bg-blue-400',
  hotel: 'bg-purple-500',
  accommodation: 'bg-purple-500',
  food: 'bg-orange-500',
  restaurant: 'bg-orange-500',
  activity: 'bg-yellow-500',
  experience: 'bg-yellow-500',
  sightseeing: 'bg-green-500',
};

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();
  const days: (Date | null)[] = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  return days;
}

export function TripCalendar({ itinerary, contentFilter, onDateClick, selectedDate }: TripCalendarProps) {
  // Determine which month to show based on trip dates
  const tripStartDate = useMemo(() => {
    const start = itinerary.meta?.startDate;
    if (start) {
      const [y, m, d] = start.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [itinerary.meta?.startDate]);

  const currentMonth = tripStartDate.getMonth();
  const currentYear = tripStartDate.getFullYear();

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Build a map of dates to their activity categories
  const dateActivities = useMemo(() => {
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

  // Get trip date range for highlighting
  const tripDates = useMemo(() => {
    const dates = new Set<string>();
    itinerary.days?.forEach(day => {
      if (day.date) dates.add(day.date);
    });
    return dates;
  }, [itinerary.days]);

  const formatDateKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

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

  return (
    <div className="bg-muted/30 rounded-lg p-2 mb-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-sm">
          {MONTHS[currentMonth]} {currentYear}
        </h3>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Flights</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Hotels</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Activities</span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS.map((day, i) => (
          <div
            key={day}
            className={cn(
              "text-center font-medium text-[9px] py-0.5",
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
            return <div key={`empty-${index}`} className="h-7" />;
          }

          const dateKey = formatDateKey(date);
          const isInTrip = tripDates.has(dateKey);
          const isSelected = selectedDate === dateKey;
          const visibleCats = getVisibleCategories(dateKey);

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateClick?.(dateKey)}
              className={cn(
                "h-7 w-full rounded text-[10px] font-medium transition-colors relative flex flex-col items-center justify-center",
                "hover:bg-muted focus:outline-none",
                isSelected && "ring-2 ring-primary",
                isInTrip && !isSelected && "bg-primary/10",
                !isInTrip && "text-muted-foreground/50"
              )}
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
    </div>
  );
}
