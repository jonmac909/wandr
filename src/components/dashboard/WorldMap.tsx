'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';

interface WorldMapProps {
  trips: StoredTrip[];
  onCountryClick?: (countryCode: string) => void;
}

export function WorldMap({ trips }: WorldMapProps) {
  const tripCount = trips.length;

  return (
    <Card className="overflow-hidden flex-shrink-0">
      <CardContent className="p-0 relative h-[120px]">
        {/* World map image placeholder */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/1280px-World_map_blank_without_borders.svg.png"
          alt="World Map"
          className="w-full h-full object-cover opacity-60"
        />

        {/* Overlay with trip count */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-background/80 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-primary">{tripCount}</div>
            <div className="text-xs text-muted-foreground">
              {tripCount === 1 ? 'Trip' : 'Trips'} planned
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
