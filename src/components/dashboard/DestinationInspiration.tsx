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
}

const SEASONAL_DESTINATIONS: SeasonalDestination[] = [
  {
    id: 'japan-spring',
    destination: 'Kyoto',
    country: 'Japan',
    season: 'Spring',
    months: 'Mar-Apr',
    why: 'Cherry blossoms peak, mild 18°C weather, before Golden Week crowds',
    imageUrl: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=600&q=80',
  },
  {
    id: 'iceland-summer',
    destination: 'Iceland',
    country: 'Nordic',
    season: 'Summer',
    months: 'Jun-Aug',
    why: 'Midnight sun, all highland roads open, waterfalls at peak flow',
    imageUrl: 'https://images.unsplash.com/photo-1529963183134-61a90db47eaf?w=600&q=80',
  },
  {
    id: 'marrakech-fall',
    destination: 'Marrakech',
    country: 'Morocco',
    season: 'Fall',
    months: 'Sep-Nov',
    why: 'Cooler 25°C after summer heat, shoulder season prices, perfect for souks',
    imageUrl: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=600&q=80',
  },
  {
    id: 'vienna-winter',
    destination: 'Vienna',
    country: 'Austria',
    season: 'Winter',
    months: 'Dec',
    why: 'Famous Christmas markets, imperial palaces in snow, fewer tourists',
    imageUrl: 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=600&q=80',
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

          {/* Subtle dark gradient at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
            {/* Season Badge */}
            <div className="self-start">
              <span className="text-xs font-medium bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
                {dest.months}
              </span>
            </div>

            {/* Destination Info */}
            <div>
              <h3 className="font-bold text-lg leading-tight drop-shadow-md">
                {dest.destination}
              </h3>
              <p className="text-sm opacity-90 drop-shadow-sm">{dest.country}</p>
              <p className="text-xs mt-1 opacity-80 font-medium drop-shadow-sm">
                {dest.why}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
