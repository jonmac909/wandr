'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sun, MapPin } from 'lucide-react';

interface TripInfoDisplayProps {
  destination: string;
  duration: number;
  startMonth?: number; // 0-11
  startYear?: number;
  flexibleDates?: boolean;
  partyType?: string;
  budgetLevel?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function TripInfoDisplay({
  destination,
  duration,
  startMonth,
  startYear,
  flexibleDates = true,
  partyType,
  budgetLevel,
}: TripInfoDisplayProps) {
  // Format the date display
  const getDateDisplay = () => {
    if (startMonth !== undefined && startMonth !== null && startYear) {
      const monthName = MONTH_NAMES[startMonth];
      if (flexibleDates) {
        return `Flexible in ${monthName} ${startYear}`;
      }
      return `${monthName} ${startYear}`;
    }
    return 'Dates not set';
  };

  return (
    <div className="space-y-4">
      {/* Trip Header Info */}
      <Card>
        <CardContent className="p-4">
          {/* Destination & Date */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">{destination}</h2>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{getDateDisplay()}</span>
                </div>
              </div>
            </div>
            {budgetLevel && (
              <Badge variant="outline" className="text-xs">
                {budgetLevel}
              </Badge>
            )}
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Sun className="w-4 h-4" />
              <span>{duration} days</span>
            </div>
            {partyType && (
              <div className="text-muted-foreground capitalize">
                {partyType}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Day Blocks */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Your Trip Days</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {Array.from({ length: duration }, (_, i) => (
            <DayBlock
              key={i}
              dayNumber={i + 1}
              label={i === 0 ? 'Arrive' : i === duration - 1 ? 'Depart' : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayBlock({
  dayNumber,
  label,
}: {
  dayNumber: number;
  label?: string;
}) {
  return (
    <div className="flex-shrink-0 w-14 h-16 rounded-xl bg-muted/50 border border-border flex flex-col items-center justify-center">
      <span className="text-xs text-muted-foreground">Day</span>
      <span className="text-lg font-bold">{dayNumber}</span>
      {label && (
        <span className="text-[10px] text-muted-foreground">{label}</span>
      )}
    </div>
  );
}
