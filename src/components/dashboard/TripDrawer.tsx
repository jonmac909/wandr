'use client';

import Link from 'next/link';
import { MapPin, Calendar, ChevronRight, LayoutList } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { getDestinationImage } from '@/lib/dashboard/image-utils';

interface TripDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trips: StoredTrip[];
}

export function TripDrawer({ open, onOpenChange, trips }: TripDrawerProps) {
  // Sort trips by most recent update, show max 5
  const sortedTrips = [...trips]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 5);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>My Trips</span>
            <Badge variant="secondary">{trips.length}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-auto">
          {sortedTrips.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✈️</div>
              <p className="text-muted-foreground mb-4">No trips yet</p>
              <Link href="/plan">
                <Button className="gap-2">
                  Start Planning
                </Button>
              </Link>
            </div>
          ) : (
            sortedTrips.map((trip) => (
              <DrawerTripCard key={trip.id} trip={trip} onOpenChange={onOpenChange} />
            ))
          )}
        </div>

        {trips.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Link href="/my-trips" className="block" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full gap-2">
                <LayoutList className="w-4 h-4" />
                All Trips
                {trips.length > 5 && (
                  <Badge variant="secondary" className="ml-auto">{trips.length}</Badge>
                )}
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerTripCard({ trip, onOpenChange }: { trip: StoredTrip; onOpenChange: (open: boolean) => void }) {
  const title = trip.itinerary?.meta?.title ||
    trip.tripDna?.interests?.destination ||
    'Untitled Trip';

  const destination = trip.itinerary?.meta?.destination ||
    trip.itinerary?.route?.bases?.[0]?.location ||
    trip.tripDna?.interests?.destination ||
    '';

  const isDraft = trip.status === 'draft' || !trip.itinerary;
  const photoQuery = destination.split(',')[0]?.trim() || 'travel';
  const imageUrl = getDestinationImage(photoQuery, 128, 128);

  return (
    <Link href={`/trip/${trip.id}`} onClick={() => onOpenChange(false)}>
      <div className="group flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <img
            src={imageUrl}
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
