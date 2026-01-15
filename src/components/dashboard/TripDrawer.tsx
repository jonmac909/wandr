'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Calendar, ChevronRight, LayoutList, Archive, RotateCcw, MoreVertical, Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { tripDb, type StoredTrip } from '@/lib/db/indexed-db';
import { getDestinationImage } from '@/lib/dashboard/image-utils';
import { parseIsoDate } from '@/lib/dates';

interface TripDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trips: StoredTrip[];
  onRefresh?: () => void;
}

export function TripDrawer({ open, onOpenChange, trips, onRefresh }: TripDrawerProps) {
  const [showArchived, setShowArchived] = useState(false);

  // Separate active and archived trips
  const activeTrips = trips.filter(t => t.status !== 'archived');
  const archivedTrips = trips.filter(t => t.status === 'archived');

  // Sort trips by most recent update, show max 5 for active
  const displayTrips = showArchived ? archivedTrips : activeTrips;
  const sortedTrips = [...displayTrips]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, showArchived ? 10 : 5);

  const handleArchive = async (tripId: string) => {
    await tripDb.updateStatus(tripId, 'archived');
    onRefresh?.();
  };

  const handleRestore = async (tripId: string) => {
    await tripDb.updateStatus(tripId, 'completed');
    onRefresh?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>{showArchived ? 'Archived Trips' : 'My Trips'}</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {showArchived ? archivedTrips.length : activeTrips.length}
              </Badge>
              {archivedTrips.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-xs gap-1"
                >
                  <Archive className="w-3 h-3" />
                  {showArchived ? 'Active' : 'Archived'}
                </Button>
              )}
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3 max-h-[calc(100vh-200px)] overflow-auto">
          {sortedTrips.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">{showArchived ? '📦' : '✈️'}</div>
              <p className="text-muted-foreground mb-4">
                {showArchived ? 'No archived trips' : 'No trips yet'}
              </p>
              {!showArchived && (
                <Link href="/plan">
                  <Button className="gap-2">
                    Start Planning
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            sortedTrips.map((trip) => (
              <DrawerTripCard
                key={trip.id}
                trip={trip}
                onOpenChange={onOpenChange}
                onArchive={() => handleArchive(trip.id)}
                onRestore={() => handleRestore(trip.id)}
                isArchived={trip.status === 'archived'}
              />
            ))
          )}
        </div>

        {activeTrips.length > 0 && !showArchived && (
          <div className="mt-6 pt-4 border-t">
            <Link href="/my-trips" className="block" onClick={() => onOpenChange(false)}>
              <Button variant="outline" className="w-full gap-2">
                <LayoutList className="w-4 h-4" />
                All Trips
                {activeTrips.length > 5 && (
                  <Badge variant="secondary" className="ml-auto">{activeTrips.length}</Badge>
                )}
              </Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerTripCard({
  trip,
  onOpenChange,
  onArchive,
  onRestore,
  isArchived,
}: {
  trip: StoredTrip;
  onOpenChange: (open: boolean) => void;
  onArchive: () => void;
  onRestore: () => void;
  isArchived: boolean;
}) {
  const router = useRouter();
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
    <div className={`group flex items-center gap-3 p-3 rounded-lg border hover:border-primary/30 hover:bg-muted/30 transition-all ${isArchived ? 'opacity-70' : ''}`}>
      {/* Thumbnail - clickable */}
      <Link href={`/trip/${trip.id}`} onClick={() => onOpenChange(false)} className="flex-shrink-0">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Info - clickable */}
      <Link href={`/trip/${trip.id}`} onClick={() => onOpenChange(false)} className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-sm truncate">{title}</h4>
          {isDraft && !isArchived && (
            <Badge variant="outline" className="text-xs">Draft</Badge>
          )}
          {isArchived && (
            <Badge variant="secondary" className="text-xs">Archived</Badge>
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
              {parseIsoDate(trip.itinerary.meta.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </Link>

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isArchived && (
            <DropdownMenuItem onClick={() => {
              onOpenChange(false);
              router.push(`/questionnaire?edit=${trip.id}`);
            }}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}
          {isArchived ? (
            <DropdownMenuItem onClick={onRestore}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={onArchive}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
