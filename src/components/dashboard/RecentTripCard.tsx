'use client';

import Link from 'next/link';
import { MapPin, ChevronRight } from 'lucide-react';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { cn } from '@/lib/utils';

interface RecentTripCardProps {
  trip: StoredTrip;
  className?: string;
}

export function RecentTripCard({ trip, className }: RecentTripCardProps) {
  const title = trip.itinerary?.meta?.title || trip.tripDna?.interests?.destination || 'Untitled Trip';
  const destination = trip.itinerary?.meta?.destination ||
    trip.itinerary?.route?.bases?.[0]?.location ||
    trip.tripDna?.interests?.destination ||
    '';

  const dates = trip.itinerary?.meta?.startDate
    ? formatDateRange(trip.itinerary.meta.startDate, trip.itinerary.meta.endDate)
    : '';

  // Use destination for thumbnail
  const photoQuery = destination.split(',')[0]?.trim().toLowerCase() || 'travel';

  return (
    <Link href={`/trip/${trip.id}`}>
      <div
        className={cn(
          "group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
          className
        )}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={`https://source.unsplash.com/100x100/?${encodeURIComponent(photoQuery)},landmark`}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{destination || 'No destination'}</span>
          </div>
          {dates && (
            <p className="text-xs text-muted-foreground mt-0.5">{dates}</p>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </Link>
  );
}

function formatDateRange(start: string, end?: string): string {
  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };

  if (!end) {
    return startDate.toLocaleDateString('en-US', options);
  }

  const endDate = new Date(end);

  // Same month and year
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  }

  // Different months
  return `${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-US', options)}`;
}
