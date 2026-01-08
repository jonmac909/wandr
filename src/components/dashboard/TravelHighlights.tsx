'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Globe, MapPin, Calendar, Plane } from 'lucide-react';
import type { StoredTrip } from '@/lib/db/indexed-db';
import type { TripStats } from '@/hooks/useTripStats';

interface TravelHighlightsProps {
  stats: TripStats;
  trips: StoredTrip[];
}

export function TravelHighlights({ stats, trips }: TravelHighlightsProps) {
  // Calculate unique countries from all trips
  const allCountries = new Set<string>();
  const allCities = new Set<string>();

  trips.forEach(trip => {
    const bases = trip.itinerary?.route?.bases || [];
    bases.forEach(base => {
      const location = base.location || '';
      const city = location.split(',')[0].trim();
      const country = location.split(',')[1]?.trim();
      if (city) allCities.add(city);
      if (country) allCountries.add(country);
    });
  });

  const highlights = [
    {
      icon: Globe,
      value: allCountries.size || 0,
      label: 'Countries',
      color: 'text-blue-600 bg-blue-100',
    },
    {
      icon: MapPin,
      value: allCities.size || 0,
      label: 'Cities',
      color: 'text-purple-600 bg-purple-100',
    },
    {
      icon: Calendar,
      value: stats.totalDays || 0,
      label: 'Days Traveled',
      color: 'text-green-600 bg-green-100',
    },
    {
      icon: Plane,
      value: trips.length || 0,
      label: 'Trips',
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  return (
    <Card className="py-0">
      <CardContent className="p-3">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">Your Travel Story</h3>
        <div className="grid grid-cols-4 gap-2">
          {highlights.map((item) => (
            <div key={item.label} className="text-center">
              <div className={`w-8 h-8 mx-auto rounded-full ${item.color} flex items-center justify-center mb-1`}>
                <item.icon className="w-4 h-4" />
              </div>
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-[10px] text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
