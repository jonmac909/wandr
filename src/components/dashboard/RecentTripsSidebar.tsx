'use client';

import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { RecentTripCard } from './RecentTripCard';
import { getDestinationImage } from '@/lib/dashboard/image-utils';

interface RecentTripsSidebarProps {
  trips: StoredTrip[];
  excludeTripId?: string;
  maxTrips?: number;
}

export function RecentTripsSidebar({ trips, excludeTripId, maxTrips = 5 }: RecentTripsSidebarProps) {
  // Filter to trips with itineraries, excluding the featured trip, sorted by most recent update
  const otherTrips = trips
    .filter(trip => {
      // Exclude the featured trip
      if (excludeTripId && trip.id === excludeTripId) return false;
      // Must have an itinerary
      return trip.itinerary !== null;
    })
    .sort((a, b) => {
      // Sort by most recently updated
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, maxTrips);

  if (otherTrips.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Other Trips</h3>
          <p className="text-xs text-muted-foreground text-center py-4">
            No other trips yet. Plan another adventure!
          </p>
        </CardContent>
      </Card>
    );
  }

  const [firstTrip, ...remainingTrips] = otherTrips;

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="p-3 pb-2">
          <h3 className="font-semibold text-sm">Other Trips</h3>
        </div>

        {/* First trip with large photo */}
        <FeaturedUpcomingTrip trip={firstTrip} />

        {/* Other trips listed smaller below */}
        {remainingTrips.length > 0 && (
          <div className="px-2 pb-2 space-y-0.5">
            {remainingTrips.map((trip) => (
              <RecentTripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FeaturedUpcomingTrip({ trip }: { trip: StoredTrip }) {
  const title = trip.itinerary?.meta?.title || trip.tripDna?.interests?.destination || 'Untitled Trip';
  const destination = trip.itinerary?.meta?.destination ||
    trip.itinerary?.route?.bases?.[0]?.location ||
    trip.tripDna?.interests?.destination ||
    '';
  const photoQuery = destination.split(',')[0]?.trim() || 'travel';
  const imageUrl = getDestinationImage(photoQuery, 160, 160);
  const dates = trip.itinerary?.meta?.startDate
    ? formatDateRange(trip.itinerary.meta.startDate, trip.itinerary.meta.endDate)
    : '';

  return (
    <Link href={`/trip/${trip.id}`} className="block group">
      <div className="px-3 pb-3">
        <div className="flex gap-3">
          {/* Square photo on left */}
          <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Trip info on right */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{title}</h4>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{destination || 'No destination'}</span>
            </div>
            {dates && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{dates}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function formatDateRange(start: string, end?: string): string {
  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

  if (!end) {
    return startDate.toLocaleDateString('en-US', options);
  }

  const endDate = new Date(end);

  // Same month
  if (startDate.getMonth() === endDate.getMonth()) {
    return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })}`;
  }

  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}
