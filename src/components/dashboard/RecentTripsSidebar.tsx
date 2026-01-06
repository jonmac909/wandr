'use client';

import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { RecentTripCard } from './RecentTripCard';

interface RecentTripsSidebarProps {
  trips: StoredTrip[];
  maxTrips?: number;
}

export function RecentTripsSidebar({ trips, maxTrips = 5 }: RecentTripsSidebarProps) {
  // Filter to upcoming trips (with start date in future) and sort by soonest first
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = trips
    .filter(trip => {
      const startDate = trip.itinerary?.meta?.startDate;
      if (!startDate) return false;
      return new Date(startDate) >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(a.itinerary?.meta?.startDate || 0);
      const dateB = new Date(b.itinerary?.meta?.startDate || 0);
      return dateA.getTime() - dateB.getTime(); // Soonest first
    })
    .slice(0, maxTrips);

  if (upcomingTrips.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 text-sm">Upcoming Trips</h3>
          <p className="text-xs text-muted-foreground text-center py-4">
            No upcoming trips. Plan your next adventure!
          </p>
        </CardContent>
      </Card>
    );
  }

  const [featuredTrip, ...otherTrips] = upcomingTrips;

  return (
    <Card className="h-full overflow-hidden">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="p-3 pb-2">
          <h3 className="font-semibold text-sm">Upcoming Trips</h3>
        </div>

        {/* Featured first trip with large photo */}
        <FeaturedUpcomingTrip trip={featuredTrip} />

        {/* Other trips listed smaller below */}
        {otherTrips.length > 0 && (
          <div className="px-2 pb-2 space-y-0.5">
            {otherTrips.map((trip) => (
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
  const photoQuery = destination.split(',')[0]?.trim().toLowerCase() || 'travel';
  const dates = trip.itinerary?.meta?.startDate
    ? formatDateRange(trip.itinerary.meta.startDate, trip.itinerary.meta.endDate)
    : '';

  return (
    <Link href={`/trip/${trip.id}`} className="block group">
      <div className="px-3 pb-3">
        {/* Large photo */}
        <div className="relative w-full h-24 rounded-lg overflow-hidden bg-muted mb-2">
          <img
            src={`https://source.unsplash.com/400x200/?${encodeURIComponent(photoQuery)},landmark,travel`}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Trip info */}
        <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{title}</h4>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
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
