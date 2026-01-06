'use client';

import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Home, Car, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { StoredTrip } from '@/lib/db/indexed-db';

interface FeaturedTripCardProps {
  trip: StoredTrip | null;
}

export function FeaturedTripCard({ trip }: FeaturedTripCardProps) {
  if (!trip || !trip.itinerary) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="text-5xl mb-4">🌍</div>
          <h3 className="text-xl font-semibold mb-2">No upcoming trips</h3>
          <p className="text-muted-foreground">
            Start planning your next adventure!
          </p>
        </CardContent>
      </Card>
    );
  }

  const { itinerary } = trip;
  const title = itinerary.meta?.title || 'Untitled Trip';
  const destination = itinerary.meta?.destination ||
    itinerary.route?.bases?.[0]?.location ||
    '';
  const photoQuery = destination.split(',')[0]?.trim().toLowerCase() || 'travel';

  // Calculate days until trip
  const daysUntil = itinerary.meta?.startDate
    ? Math.ceil((new Date(itinerary.meta.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  // Status calculations
  const hasHousing = itinerary.route?.bases?.some(b => b.accommodation?.name);
  const hasTransport = itinerary.route?.movements?.length > 0 ||
    itinerary.days?.some(d => d.blocks?.some(b => b.activity?.category === 'flight'));
  const activityCount = itinerary.days?.reduce((acc, d) =>
    acc + (d.blocks?.filter(b => b.activity && b.activity.category !== 'flight' && b.activity.category !== 'transit').length || 0), 0) || 0;

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="group overflow-hidden hover:border-primary/30 transition-all cursor-pointer">
        {/* Photo header */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={`https://source.unsplash.com/800x400/?${encodeURIComponent(photoQuery)},landmark`}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Countdown badge */}
          {daysUntil !== null && daysUntil > 0 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
              {daysUntil} days to go
            </div>
          )}

          {/* Image carousel dots */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-white" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
            <div className="w-2 h-2 rounded-full bg-white/50" />
          </div>
        </div>

        {/* Trip info */}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Trip details */}
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2">{title}</h2>

              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                <span>{destination}</span>
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDateRange(itinerary.meta?.startDate, itinerary.meta?.endDate)}
                </span>
                {itinerary.meta?.totalDays && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {itinerary.meta.totalDays} days
                  </span>
                )}
              </div>

              {/* Companion (if available from tripDna) */}
              {trip.tripDna?.travelerProfile?.partyType && trip.tripDna.travelerProfile.partyType !== 'solo' && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground">Companion</span>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm font-medium capitalize">
                      {trip.tripDna.travelerProfile.partyType}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right side - Status badges */}
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Housing</span>
                <Badge variant={hasHousing ? 'default' : 'outline'} className="gap-1">
                  <Home className="w-3 h-3" />
                  {hasHousing ? 'Booked' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Transport</span>
                <Badge variant={hasTransport ? 'default' : 'outline'} className="gap-1">
                  <Car className="w-3 h-3" />
                  {hasTransport ? 'Booked' : 'Pending'}
                </Badge>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Activities</span>
                <Badge variant="outline" className="gap-1 text-primary border-primary">
                  <Sparkles className="w-3 h-3" />
                  {activityCount > 0 ? `${activityCount} planned` : 'Find Activity'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatDateRange(start?: string, end?: string): string {
  if (!start) return '';

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

  return `${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-US', options)}`;
}
