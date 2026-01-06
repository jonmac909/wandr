'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { getTripDateRanges, isDateInTrip, TripDateRange } from '@/hooks/useTripStats';
import { cn } from '@/lib/utils';

interface MonthCalendarProps {
  trips: StoredTrip[];
  onDateClick?: (date: Date, trip?: TripDateRange) => void;
}

const DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Get days in month grid (including padding days from prev/next month)
 */
function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Get day of week (0 = Sunday, adjust for Monday start)
  let startDayOfWeek = firstDay.getDay();
  startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1; // Convert to Monday = 0

  const days: (Date | null)[] = [];

  // Add padding for days before first of month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export function MonthCalendar({ trips, onDateClick }: MonthCalendarProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const tripRanges = useMemo(() => getTripDateRanges(trips), [trips]);

  const days = useMemo(
    () => getMonthDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

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
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {MONTHS[currentMonth]} {currentYear}
          </h3>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-medium py-1",
                i >= 5 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="h-8" />;
            }

            const tripRange = isDateInTrip(date, tripRanges);
            const todayClass = isToday(date);
            const weekendClass = isWeekend(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateClick?.(date, tripRange || undefined)}
                className={cn(
                  "h-8 w-full rounded-md text-sm font-medium transition-colors",
                  "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                  todayClass && "bg-primary text-primary-foreground hover:bg-primary/90",
                  !todayClass && tripRange && "bg-primary/20 text-primary",
                  !todayClass && !tripRange && weekendClass && "text-primary",
                  !todayClass && !tripRange && !weekendClass && "text-foreground"
                )}
                title={tripRange?.tripTitle}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
