'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { extractCountryFromLocation, getCountryCode } from '@/lib/dashboard/country-utils';

interface WorldMapProps {
  trips: StoredTrip[];
  onCountryClick?: (countryCode: string) => void;
}

// More realistic simplified world map paths
const MAP_REGIONS = [
  {
    name: 'North America',
    codes: ['US', 'CA', 'MX'],
    path: 'M45,85 L55,65 L85,55 L120,50 L150,55 L175,70 L185,85 L180,100 L165,115 L155,140 L140,155 L125,150 L110,160 L95,155 L80,145 L65,130 L50,115 L45,100 Z',
  },
  {
    name: 'Central America',
    codes: ['GT', 'BZ', 'HN', 'SV', 'NI', 'CR', 'PA', 'CU', 'JM', 'HT', 'DO'],
    path: 'M95,155 L110,160 L120,175 L115,185 L105,180 L95,170 Z',
  },
  {
    name: 'South America',
    codes: ['BR', 'AR', 'CL', 'PE', 'CO', 'EC', 'VE', 'BO', 'PY', 'UY', 'GY', 'SR'],
    path: 'M115,185 L135,180 L155,195 L165,220 L170,260 L165,300 L150,330 L135,345 L125,330 L120,290 L110,250 L105,215 L110,195 Z',
  },
  {
    name: 'Western Europe',
    codes: ['GB', 'IE', 'FR', 'ES', 'PT', 'BE', 'NL', 'LU'],
    path: 'M290,70 L300,55 L315,50 L325,55 L330,70 L325,90 L315,100 L300,95 L290,85 Z',
  },
  {
    name: 'Central Europe',
    codes: ['DE', 'CH', 'AT', 'CZ', 'PL', 'HU', 'SK'],
    path: 'M330,55 L355,50 L375,55 L380,70 L375,85 L355,90 L335,85 L330,70 Z',
  },
  {
    name: 'Northern Europe',
    codes: ['SE', 'NO', 'DK', 'FI', 'IS', 'EE', 'LV', 'LT'],
    path: 'M320,20 L345,15 L370,20 L385,35 L380,50 L355,50 L330,45 L315,35 Z',
  },
  {
    name: 'Southern Europe',
    codes: ['IT', 'GR', 'HR', 'SI', 'BA', 'RS', 'ME', 'AL', 'MK', 'BG', 'RO'],
    path: 'M335,85 L355,90 L375,85 L385,95 L380,115 L365,120 L345,115 L330,105 L325,90 Z',
  },
  {
    name: 'Eastern Europe',
    codes: ['RU', 'UA', 'BY', 'MD'],
    path: 'M380,35 L420,25 L470,30 L490,50 L485,80 L460,95 L420,90 L390,75 L385,50 Z',
  },
  {
    name: 'Middle East',
    codes: ['TR', 'IL', 'JO', 'LB', 'SY', 'IQ', 'SA', 'AE', 'QA', 'KW', 'OM', 'YE', 'IR'],
    path: 'M385,95 L420,90 L450,100 L465,120 L455,150 L430,165 L400,155 L380,135 L375,115 Z',
  },
  {
    name: 'North Africa',
    codes: ['MA', 'DZ', 'TN', 'LY', 'EG'],
    path: 'M290,105 L330,105 L380,115 L400,130 L395,150 L370,160 L330,155 L295,140 L285,120 Z',
  },
  {
    name: 'West Africa',
    codes: ['NG', 'GH', 'CI', 'SN', 'ML', 'BF', 'NE', 'CM', 'BJ', 'TG'],
    path: 'M295,155 L330,155 L355,165 L360,195 L345,220 L315,225 L290,210 L285,180 Z',
  },
  {
    name: 'East Africa',
    codes: ['KE', 'TZ', 'ET', 'UG', 'RW', 'SO', 'SD', 'SS', 'ER', 'DJ'],
    path: 'M395,155 L420,160 L435,185 L430,220 L410,245 L385,240 L370,210 L375,175 Z',
  },
  {
    name: 'Southern Africa',
    codes: ['ZA', 'NA', 'BW', 'ZW', 'MZ', 'ZM', 'AO', 'MW', 'LS', 'SZ'],
    path: 'M345,225 L385,240 L400,275 L390,310 L365,325 L340,310 L330,275 L335,245 Z',
  },
  {
    name: 'Central Asia',
    codes: ['KZ', 'UZ', 'TM', 'KG', 'TJ', 'AF', 'PK'],
    path: 'M465,55 L520,45 L555,55 L565,80 L545,105 L510,110 L475,100 L460,75 Z',
  },
  {
    name: 'South Asia',
    codes: ['IN', 'BD', 'NP', 'LK', 'BT', 'MV'],
    path: 'M510,110 L545,105 L565,125 L560,165 L535,195 L505,185 L490,155 L495,125 Z',
  },
  {
    name: 'Southeast Asia',
    codes: ['TH', 'VN', 'MY', 'SG', 'ID', 'PH', 'MM', 'KH', 'LA'],
    path: 'M560,125 L590,115 L620,130 L630,165 L615,200 L580,215 L555,195 L550,160 Z',
  },
  {
    name: 'East Asia',
    codes: ['CN', 'JP', 'KR', 'TW', 'HK', 'MN'],
    path: 'M555,45 L610,35 L660,45 L680,70 L670,100 L640,115 L595,110 L565,90 L555,65 Z',
  },
  {
    name: 'Australia',
    codes: ['AU'],
    path: 'M600,250 L660,240 L700,260 L710,300 L690,330 L640,340 L600,320 L590,285 Z',
  },
  {
    name: 'New Zealand',
    codes: ['NZ'],
    path: 'M720,320 L735,315 L745,330 L740,350 L725,355 L715,340 Z',
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
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <svg
          viewBox="0 0 800 400"
          className="w-full h-auto"
        >
          {/* Ocean background */}
          <rect x="0" y="0" width="800" height="400" fill="#e0f2fe" />

          {/* Subtle grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#bae6fd" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="800" height="400" fill="url(#grid)" />

          {/* Continent shapes */}
          {MAP_REGIONS.map((region) => {
            const visited = isRegionVisited(region.codes);
            return (
              <path
                key={region.name}
                d={region.path}
                fill={visited ? '#3b82f6' : '#94a3b8'}
                fillOpacity={visited ? 0.8 : 0.4}
                stroke={visited ? '#1d4ed8' : '#64748b'}
                strokeWidth="1"
                className="transition-all duration-300 cursor-pointer hover:fill-opacity-100"
                onClick={() => {
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

          {/* Trip location markers */}
          {trips.slice(0, 8).map((trip, i) => {
            const location = trip.itinerary?.route?.bases?.[0]?.location;
            if (!location) return null;

            // Position markers based on rough geographic location
            const countryName = extractCountryFromLocation(location);
            const code = countryName ? getCountryCode(countryName) : null;

            // Default positions, can be improved with actual geo data
            let x = 400, y = 200;

            // Rough positioning by region
            if (code) {
              if (['US', 'CA'].includes(code)) { x = 120; y = 90; }
              else if (['MX', 'GT', 'CR', 'PA'].includes(code)) { x = 105; y = 165; }
              else if (['BR', 'AR', 'CL', 'PE', 'CO'].includes(code)) { x = 140; y = 260; }
              else if (['GB', 'FR', 'ES', 'PT'].includes(code)) { x = 310; y = 75; }
              else if (['DE', 'IT', 'CH', 'AT'].includes(code)) { x = 355; y = 75; }
              else if (['JP', 'KR', 'TW'].includes(code)) { x = 650; y = 85; }
              else if (['CN', 'HK'].includes(code)) { x = 600; y = 95; }
              else if (['TH', 'VN', 'MY', 'SG', 'ID', 'PH'].includes(code)) { x = 590; y = 170; }
              else if (['IN', 'NP', 'LK'].includes(code)) { x = 525; y = 155; }
              else if (['AU'].includes(code)) { x = 650; y = 290; }
              else if (['NZ'].includes(code)) { x = 730; y = 335; }
              else if (['AE', 'SA', 'IL', 'JO'].includes(code)) { x = 430; y = 135; }
              else if (['EG', 'MA'].includes(code)) { x = 360; y = 135; }
              else if (['ZA', 'KE', 'TZ'].includes(code)) { x = 385; y = 270; }
            }

            // Add small offset to avoid overlapping
            x += (i % 3) * 15 - 15;
            y += (i % 2) * 10 - 5;

            return (
              <g key={trip.id}>
                {/* Outer pulse ring */}
                <circle
                  cx={x}
                  cy={y}
                  r="10"
                  fill="#f97316"
                  fillOpacity="0.2"
                  className="animate-ping"
                  style={{ animationDuration: '2s' }}
                />
                {/* Inner marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="5"
                  fill="#f97316"
                  stroke="#fff"
                  strokeWidth="2"
                />
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 py-3 bg-muted/30 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-blue-500" />
            <span>Visited regions</span>
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
