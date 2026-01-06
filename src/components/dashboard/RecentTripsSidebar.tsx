'use client';

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

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3 text-sm">Upcoming Trips</h3>
        <div className="space-y-1">
          {upcomingTrips.map((trip) => (
            <RecentTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
