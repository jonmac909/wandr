'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, Home, Car, Sparkles, Check, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { getDestinationImage } from '@/lib/dashboard/image-utils';

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
  const photoQuery = destination.split(',')[0]?.trim() || 'travel';
  const imageUrl = getDestinationImage(photoQuery, 400, 400);

  // Status calculations
  const hasHousing = itinerary.route?.bases?.some(b => b.accommodation?.name);
  const hasTransport = itinerary.route?.movements?.length > 0 ||
    itinerary.days?.some(d => d.blocks?.some(b => b.activity?.category === 'flight'));
  const activityCount = itinerary.days?.reduce((acc, d) =>
    acc + (d.blocks?.filter(b => b.activity && b.activity.category !== 'flight' && b.activity.category !== 'transit').length || 0), 0) || 0;

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="group overflow-hidden hover:border-primary/30 transition-all cursor-pointer">
        <div className="flex h-[280px]">
          {/* Large Square Photo - Left side */}
          <div className="relative w-[280px] h-full flex-shrink-0 overflow-hidden bg-muted">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Image carousel dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white shadow" />
              <div className="w-2 h-2 rounded-full bg-white/50" />
              <div className="w-2 h-2 rounded-full bg-white/50" />
            </div>
          </div>

          {/* Trip Details - Right side */}
          <CardContent className="flex-1 p-4">
            {/* Title */}
            <h2 className="text-2xl font-bold mb-3">{title}</h2>

            {/* Destination */}
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <MapPin className="w-4 h-4" />
              <span>{destination}</span>
            </div>

            {/* Dates */}
            <div className="flex items-center gap-2 text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span>{formatDateRange(itinerary.meta?.startDate, itinerary.meta?.endDate)}</span>
            </div>

            {/* Companion */}
            {trip.tripDna?.travelerProfile?.partyType && (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm text-muted-foreground">Companion</span>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium capitalize">
                    {trip.tripDna.travelerProfile.partyType === 'solo' ? 'Solo' : trip.tripDna.travelerProfile.partyType}
                  </span>
                </div>
              </div>
            )}

            {/* Status rows */}
            <div className="space-y-2.5 border-t pt-4">
              {/* Housing */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Housing</span>
                <StatusBadge
                  status={hasHousing ? 'booked' : 'pending'}
                  icon={<Home className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Transport */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Transport</span>
                <StatusBadge
                  status={hasTransport ? 'booked' : 'pending'}
                  icon={<Car className="w-3.5 h-3.5" />}
                />
              </div>

              {/* Activities */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Activities</span>
                <StatusBadge
                  status={activityCount > 0 ? 'partial' : 'find'}
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                  label={activityCount > 0 ? `${activityCount} planned` : 'Find Activity'}
                />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

interface StatusBadgeProps {
  status: 'booked' | 'pending' | 'partial' | 'find';
  icon: React.ReactNode;
  label?: string;
}

function StatusBadge({ status, icon, label }: StatusBadgeProps) {
  if (status === 'booked') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
        <Check className="w-3 h-3" />
        Booked
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
        {icon}
        Pending
      </span>
    );
  }

  if (status === 'partial') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        {icon}
        {label}
      </span>
    );
  }

  // find
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors">
      <Search className="w-3 h-3" />
      {label || 'Find Activity'}
    </span>
  );
}

function formatDateRange(start?: string, end?: string): string {
  if (!start) return '';

  const startDate = new Date(start);
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

  if (!end) {
    return startDate.toLocaleDateString('en-US', options);
  }

  const endDate = new Date(end);

  // Same month and year
  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
  }

  return `${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })} - ${endDate.toLocaleDateString('en-US', options)}`;
}
