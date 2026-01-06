'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { RecentTripCard } from './RecentTripCard';

interface RecentTripsSidebarProps {
  trips: StoredTrip[];
  maxTrips?: number;
}

export function RecentTripsSidebar({ trips, maxTrips = 5 }: RecentTripsSidebarProps) {
  const recentTrips = trips.slice(0, maxTrips);

  if (recentTrips.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3">Recent Trips</h3>
          <p className="text-sm text-muted-foreground text-center py-4">
            No trips yet. Plan your first adventure!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-3">Recent Trips</h3>
        <div className="space-y-1">
          {recentTrips.map((trip) => (
            <RecentTripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
