'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { extractCountryFromLocation, getCountryCode } from '@/lib/dashboard/country-utils';

interface WorldMapProps {
  trips: StoredTrip[];
  onCountryClick?: (countryCode: string) => void;
}

// Simplified world map paths for major continents/regions
// Each path is associated with country codes that should highlight it
const MAP_REGIONS = [
  {
    name: 'North America',
    codes: ['US', 'CA', 'MX'],
    path: 'M80,60 Q130,40 180,60 L210,100 Q230,160 180,200 L110,180 Q50,160 60,100 Z',
  },
  {
    name: 'South America',
    codes: ['BR', 'AR', 'CL', 'PE', 'CO', 'EC', 'VE'],
    path: 'M150,220 Q190,210 210,240 L220,330 Q200,380 160,360 L130,280 Q120,240 150,220 Z',
  },
  {
    name: 'Europe',
    codes: ['FR', 'DE', 'IT', 'ES', 'PT', 'GB', 'IE', 'NL', 'BE', 'CH', 'AT', 'GR', 'HR', 'CZ', 'PL', 'SE', 'NO', 'DK', 'FI', 'IS', 'HU', 'RO'],
    path: 'M380,50 Q450,30 480,60 L490,100 Q470,130 410,120 L370,90 Q360,60 380,50 Z',
  },
  {
    name: 'Africa',
    codes: ['ZA', 'EG', 'MA', 'KE', 'TZ', 'ET', 'NG'],
    path: 'M400,140 Q450,130 480,160 L490,250 Q460,310 410,290 L370,230 Q360,170 400,140 Z',
  },
  {
    name: 'Middle East',
    codes: ['AE', 'QA', 'SA', 'IL', 'JO', 'LB', 'TR'],
    path: 'M490,90 Q530,80 550,100 L560,140 Q540,160 500,150 L480,120 Q480,95 490,90 Z',
  },
  {
    name: 'Asia',
    codes: ['CN', 'JP', 'KR', 'IN', 'TH', 'VN', 'ID', 'MY', 'SG', 'PH', 'TW', 'HK', 'KH', 'LA', 'MM', 'NP', 'LK', 'MV'],
    path: 'M510,40 Q630,20 720,60 L770,120 Q760,190 670,200 L580,180 Q510,150 500,90 Z',
  },
  {
    name: 'Australia',
    codes: ['AU', 'NZ', 'FJ'],
    path: 'M680,250 Q730,240 760,270 L770,310 Q750,340 700,330 L670,290 Q660,260 680,250 Z',
  },
];

export function WorldMap({ trips, onCountryClick }: WorldMapProps) {
  // Extract visited country codes from trips
  const visitedCodes = useMemo(() => {
    const codes = new Set<string>();
    trips.forEach(trip => {
      trip.itinerary?.route?.bases?.forEach(base => {
        const countryName = extractCountryFromLocation(base.location);
        if (countryName) {
          const code = getCountryCode(countryName);
          if (code) codes.add(code);
        }
      });
    });
    return codes;
  }, [trips]);

  // Check if region has any visited countries
  const isRegionVisited = (codes: string[]) => {
    return codes.some(code => visitedCodes.has(code));
  };

  return (
    <Card>
      <CardContent className="p-4">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-auto"
          style={{ background: 'linear-gradient(180deg, #e8f4f8 0%, #d4e8ec 100%)' }}
        >
          {/* Ocean background is handled by gradient */}

          {/* Grid lines for visual interest */}
          <g className="opacity-20">
            {[...Array(8)].map((_, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={i * 50}
                x2="800"
                y2={i * 50}
                stroke="#94a3b8"
                strokeWidth="0.5"
              />
            ))}
            {[...Array(16)].map((_, i) => (
              <line
                key={`v-${i}`}
                x1={i * 50}
                y1="0"
                x2={i * 50}
                y2="400"
                stroke="#94a3b8"
                strokeWidth="0.5"
              />
            ))}
          </g>

          {/* Continent shapes */}
          {MAP_REGIONS.map((region) => {
            const visited = isRegionVisited(region.codes);
            return (
              <path
                key={region.name}
                d={region.path}
                fill={visited ? '#3b82f6' : '#cbd5e1'}
                fillOpacity={visited ? 0.7 : 0.5}
                stroke={visited ? '#2563eb' : '#94a3b8'}
                strokeWidth="1"
                className="transition-colors cursor-pointer hover:fill-opacity-80"
                onClick={() => {
                  // Find a visited country in this region
                  const visitedInRegion = region.codes.find(c => visitedCodes.has(c));
                  if (visitedInRegion && onCountryClick) {
                    onCountryClick(visitedInRegion);
                  }
                }}
              >
                <title>{region.name}</title>
              </path>
            );
          })}

          {/* Trip markers for visited locations */}
          {trips.slice(0, 10).map((trip, i) => {
            const location = trip.itinerary?.route?.bases?.[0]?.location;
            if (!location) return null;

            // Simple pseudo-random positioning based on trip index
            const x = 100 + ((i * 127) % 600);
            const y = 80 + ((i * 89) % 240);

            return (
              <g key={trip.id}>
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill="#f97316"
                  stroke="#fff"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="12"
                  fill="#f97316"
                  fillOpacity="0.3"
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Visited</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Trip locations</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
