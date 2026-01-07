'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { extractCountryFromLocation } from '@/lib/dashboard/country-utils';

interface WorldMapProps {
  trips: StoredTrip[];
  onCountryClick?: (countryCode: string) => void;
}

// Simple SVG paths for major regions (approximate)
const REGION_PATHS: Record<string, { path: string; countries: string[] }> = {
  'asia-east': {
    path: 'M 75 30 L 85 30 L 90 40 L 85 50 L 75 50 L 70 40 Z',
    countries: ['Japan', 'South Korea', 'China', 'Taiwan', 'Hong Kong'],
  },
  'asia-southeast': {
    path: 'M 70 45 L 85 45 L 90 60 L 75 65 L 65 55 Z',
    countries: ['Thailand', 'Vietnam', 'Singapore', 'Malaysia', 'Indonesia', 'Philippines', 'Cambodia'],
  },
  'europe': {
    path: 'M 45 20 L 55 18 L 58 30 L 50 35 L 42 30 Z',
    countries: ['France', 'Germany', 'Italy', 'Spain', 'UK', 'Netherlands', 'Portugal', 'Greece'],
  },
  'north-america': {
    path: 'M 10 20 L 30 15 L 35 40 L 20 45 L 5 35 Z',
    countries: ['USA', 'Canada', 'Mexico'],
  },
  'oceania': {
    path: 'M 80 65 L 95 60 L 98 75 L 85 80 L 75 70 Z',
    countries: ['Australia', 'New Zealand'],
  },
};

export function WorldMap({ trips }: WorldMapProps) {
  const tripCount = trips.length;

  // Extract visited countries from trips
  const visitedCountries = useMemo(() => {
    const countries = new Set<string>();
    trips.forEach(trip => {
      trip.itinerary?.route?.bases?.forEach(base => {
        const country = extractCountryFromLocation(base.location);
        if (country) countries.add(country);
      });
    });
    return countries;
  }, [trips]);

  // Determine which regions are highlighted
  const highlightedRegions = useMemo(() => {
    const regions: string[] = [];
    Object.entries(REGION_PATHS).forEach(([regionId, { countries }]) => {
      if (countries.some(c => visitedCountries.has(c))) {
        regions.push(regionId);
      }
    });
    return regions;
  }, [visitedCountries]);

  return (
    <Card className="overflow-hidden flex-shrink-0 py-0">
      <CardContent className="p-1 relative h-[100px]">
        {/* Simple SVG world map with highlighted regions */}
        <svg viewBox="0 0 100 80" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          {/* Background map outline */}
          <rect x="0" y="0" width="100" height="80" fill="none" />

          {/* Simplified continent shapes */}
          {/* North America */}
          <path d="M 5 15 Q 15 10 25 12 L 30 25 Q 25 35 20 40 L 10 35 Q 5 25 5 15"
                className={highlightedRegions.includes('north-america') ? 'fill-primary/40' : 'fill-muted'}
                stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.3" />

          {/* South America */}
          <path d="M 20 42 Q 25 45 28 55 L 25 70 Q 20 75 18 70 L 15 55 Q 18 45 20 42"
                className="fill-muted"
                stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.3" />

          {/* Europe */}
          <path d="M 42 12 Q 50 10 55 15 L 55 25 Q 50 30 45 28 L 42 20 Q 40 15 42 12"
                className={highlightedRegions.includes('europe') ? 'fill-primary/40' : 'fill-muted'}
                stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.3" />

          {/* Africa */}
          <path d="M 45 30 Q 55 28 58 35 L 55 55 Q 50 60 45 55 L 42 40 Q 43 32 45 30"
                className="fill-muted"
                stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.3" />

          {/* Asia */}
          <path d="M 55 12 Q 75 8 85 15 L 88 35 Q 85 45 75 48 L 60 40 Q 55 30 55 20 L 55 12"
                className={highlightedRegions.includes('asia-east') || highlightedRegions.includes('asia-southeast') ? 'fill-primary/40' : 'fill-muted'}
                stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.3" />

          {/* Southeast Asia / Indonesia */}
          <path d="M 70 48 Q 80 50 88 52 L 90 58 Q 85 62 75 60 L 70 55 Q 68 50 70 48"
                className={highlightedRegions.includes('asia-southeast') ? 'fill-primary/40' : 'fill-muted'}
                stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.3" />

          {/* Australia */}
          <path d="M 78 58 Q 88 55 93 60 L 92 70 Q 85 75 80 72 L 78 65 Q 76 60 78 58"
                className={highlightedRegions.includes('oceania') ? 'fill-primary/40' : 'fill-muted'}
                stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.3" />
        </svg>

        {/* Overlay with trip count */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-background/90 rounded-lg px-2 py-1">
            <div className="text-lg font-bold text-primary">{visitedCountries.size}</div>
            <div className="text-[9px] text-muted-foreground">
              {visitedCountries.size === 1 ? 'Country' : 'Countries'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
