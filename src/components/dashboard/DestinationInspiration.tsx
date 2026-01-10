'use client';

import Link from 'next/link';
import type { StoredTrip } from '@/lib/db/indexed-db';

interface DestinationInspirationProps {
  trips: StoredTrip[];
}

interface SeasonalDestination {
  id: string;
  destination: string;
  country: string;
  season: string;
  months: string;
  why: string;
  imageUrl: string;
  gradient: string;
}

const SEASONAL_DESTINATIONS: SeasonalDestination[] = [
  {
    id: 'japan-spring',
    destination: 'Kyoto',
    country: 'Japan',
    season: 'Spring',
    months: 'Mar-Apr',
    why: 'Cherry blossom season',
    imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=400&fit=crop',
    gradient: 'from-pink-400/80 to-rose-500/80',
  },
  {
    id: 'santorini-summer',
    destination: 'Santorini',
    country: 'Greece',
    season: 'Summer',
    months: 'Jun-Aug',
    why: 'Perfect beach weather',
    imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=400&h=400&fit=crop',
    gradient: 'from-blue-400/80 to-cyan-500/80',
  },
  {
    id: 'munich-fall',
    destination: 'Munich',
    country: 'Germany',
    season: 'Fall',
    months: 'Sep-Oct',
    why: 'Oktoberfest celebrations',
    imageUrl: 'https://images.unsplash.com/photo-1599982890963-3aba55f01fd4?w=400&h=400&fit=crop',
    gradient: 'from-amber-400/80 to-orange-500/80',
  },
  {
    id: 'tromso-winter',
    destination: 'Tromso',
    country: 'Norway',
    season: 'Winter',
    months: 'Dec-Feb',
    why: 'Northern lights season',
    imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=400&fit=crop',
    gradient: 'from-indigo-400/80 to-purple-500/80',
  },
];

export function DestinationInspiration({ trips }: DestinationInspirationProps) {
  // Filter out places already visited
  const visitedPlaces = new Set<string>();
  trips.forEach(trip => {
    const bases = trip.itinerary?.route?.bases || [];
    bases.forEach(base => {
      const city = (base.location || '').split(',')[0].trim().toLowerCase();
      visitedPlaces.add(city);
    });
  });

  const suggestions = SEASONAL_DESTINATIONS.filter(dest => {
    const destCity = dest.destination.toLowerCase();
    return !visitedPlaces.has(destCity);
  });

  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">You&apos;ve explored so many places!</p>
        <p className="text-xs">Keep the adventure going</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {suggestions.map((dest) => (
        <Link
          key={dest.id}
          href="/plan"
          className="group relative aspect-square rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        >
          {/* Background Image */}
          <img
            src={dest.imageUrl}
            alt={dest.destination}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient Overlay */}
          <div className={`absolute inset-0 bg-gradient-to-t ${dest.gradient} opacity-70`} />

          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
            {/* Season Badge */}
            <div className="self-start">
              <span className="text-xs font-medium bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full">
                {dest.months}
              </span>
            </div>

            {/* Destination Info */}
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {dest.destination}
              </h3>
              <p className="text-sm opacity-90">{dest.country}</p>
              <p className="text-xs mt-1 opacity-80 font-medium">
                {dest.why}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
