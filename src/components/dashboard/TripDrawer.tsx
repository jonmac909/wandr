'use client';

import Link from 'next/link';
import { MapPin, Calendar, ChevronRight, Plus } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StoredTrip } from '@/lib/db/indexed-db';

interface TripDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trips: StoredTrip[];
}

export function TripDrawer({ open, onOpenChange, trips }: TripDrawerProps) {
  // Filter to in-progress/planned trips
  const plannedTrips = trips.filter(t => {
    // Draft trips
    if (t.status === 'draft' || !t.itinerary) return true;

    // Upcoming trips (start date in future)
    if (t.itinerary?.meta?.startDate) {
      return new Date(t.itinerary.meta.startDate) > new Date();
    }
    return false;
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Planned Trips</span>
            <Badge variant="secondary">{plannedTrips.length}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {plannedTrips.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✈️</div>
              <p className="text-muted-foreground mb-4">No trips in progress</p>
              <Link href="/plan-mode">
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Start Planning
                </Button>
              </Link>
            </div>
          ) : (
            plannedTrips.map((trip) => (
              <DrawerTripCard key={trip.id} trip={trip} />
            ))
          )}
        </div>

        {plannedTrips.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Link href="/plan-mode" className="block">
              <Button variant="outline" className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Plan New Trip
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerTripCard({ trip }: { trip: StoredTrip }) {
  const title = trip.itinerary?.meta?.title ||
    trip.tripDna?.interests?.destination ||
    'Untitled Trip';

  const destination = trip.itinerary?.meta?.destination ||
    trip.itinerary?.route?.bases?.[0]?.location ||
    trip.tripDna?.interests?.destination ||
    '';

  const isDraft = trip.status === 'draft' || !trip.itinerary;
  const photoQuery = destination.split(',')[0]?.trim().toLowerCase() || 'travel';

  return (
    <Link href={`/trip/${trip.id}`}>
      <div className="group flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer">
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
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm truncate">{title}</h4>
            {isDraft && (
              <Badge variant="outline" className="text-xs">Draft</Badge>
            )}
          </div>

          {destination && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{destination}</span>
            </div>
          )}

          {trip.itinerary?.meta?.startDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(trip.itinerary.meta.startDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>
    </Link>
  );
}
