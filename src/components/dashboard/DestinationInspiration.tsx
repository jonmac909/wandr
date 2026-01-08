'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, Heart } from 'lucide-react';
import Link from 'next/link';
import type { StoredTrip } from '@/lib/db/indexed-db';

interface DestinationInspirationProps {
  trips: StoredTrip[];
}

// Suggested destinations based on travel patterns
const INSPIRATION_DESTINATIONS = [
  { name: 'Bali, Indonesia', emoji: '🏝️', vibe: 'Beaches & Culture', image: '/destinations/bali.jpg' },
  { name: 'Kyoto, Japan', emoji: '⛩️', vibe: 'Temples & Gardens', image: '/destinations/kyoto.jpg' },
  { name: 'Barcelona, Spain', emoji: '🏛️', vibe: 'Art & Architecture', image: '/destinations/barcelona.jpg' },
  { name: 'Iceland', emoji: '🌋', vibe: 'Nature & Adventure', image: '/destinations/iceland.jpg' },
  { name: 'Lisbon, Portugal', emoji: '🚃', vibe: 'History & Food', image: '/destinations/lisbon.jpg' },
  { name: 'New Zealand', emoji: '🏔️', vibe: 'Adventure & Scenery', image: '/destinations/nz.jpg' },
];

export function DestinationInspiration({ trips }: DestinationInspirationProps) {
  // Get places already visited to filter suggestions
  const visitedPlaces = new Set<string>();
  trips.forEach(trip => {
    const bases = trip.itinerary?.route?.bases || [];
    bases.forEach(base => {
      const city = (base.location || '').split(',')[0].trim().toLowerCase();
      visitedPlaces.add(city);
    });
  });

  // Filter out already visited places
  const suggestions = INSPIRATION_DESTINATIONS.filter(dest => {
    const destCity = dest.name.split(',')[0].trim().toLowerCase();
    return !visitedPlaces.has(destCity);
  }).slice(0, 4);

  return (
    <Card className="py-0 h-full flex flex-col">
      <CardContent className="p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <h3 className="text-xs font-semibold text-muted-foreground">Where to Next?</h3>
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1">
          {suggestions.map((dest) => (
            <Link
              key={dest.name}
              href="/questionnaire"
              className="group relative bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 hover:from-primary/10 hover:to-primary/20 transition-all border border-transparent hover:border-primary/20"
            >
              <div className="text-2xl mb-1">{dest.emoji}</div>
              <p className="text-sm font-medium">{dest.name}</p>
              <p className="text-[10px] text-muted-foreground">{dest.vibe}</p>
            </Link>
          ))}
        </div>

        {suggestions.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
            <div>
              <Heart className="w-8 h-8 mx-auto mb-2 text-pink-400" />
              <p className="text-sm">You've explored so many places!</p>
              <p className="text-xs">Keep the adventure going</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
