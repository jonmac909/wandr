'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { Base } from '@/types/itinerary';

interface TripRouteMapProps {
  bases: Base[];
  className?: string;
  singleLocation?: string; // If provided, show only this location (for daily view)
}

// Simple coordinate lookup for common destinations
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'bangkok': { lat: 13.7563, lng: 100.5018 },
  'singapore': { lat: 1.3521, lng: 103.8198 },
  'hong kong': { lat: 22.3193, lng: 114.1694 },
  'seoul': { lat: 37.5665, lng: 126.9780 },
  'taipei': { lat: 25.0330, lng: 121.5654 },
  'osaka': { lat: 34.6937, lng: 135.5023 },
  'kyoto': { lat: 35.0116, lng: 135.7681 },
  'bali': { lat: -8.3405, lng: 115.0920 },
  'phuket': { lat: 7.8804, lng: 98.3923 },
  'hanoi': { lat: 21.0278, lng: 105.8342 },
  'ho chi minh': { lat: 10.8231, lng: 106.6297 },
  'kuala lumpur': { lat: 3.1390, lng: 101.6869 },
  'manila': { lat: 14.5995, lng: 120.9842 },
  'jakarta': { lat: -6.2088, lng: 106.8456 },
  'paris': { lat: 48.8566, lng: 2.3522 },
  'london': { lat: 51.5074, lng: -0.1278 },
  'new york': { lat: 40.7128, lng: -74.0060 },
  'los angeles': { lat: 34.0522, lng: -118.2437 },
  'san francisco': { lat: 37.7749, lng: -122.4194 },
  'vancouver': { lat: 49.2827, lng: -123.1207 },
  'sydney': { lat: -33.8688, lng: 151.2093 },
  'melbourne': { lat: -37.8136, lng: 144.9631 },
  'auckland': { lat: -36.8509, lng: 174.7645 },
  'dubai': { lat: 25.2048, lng: 55.2708 },
  'rome': { lat: 41.9028, lng: 12.4964 },
  'barcelona': { lat: 41.3851, lng: 2.1734 },
  'amsterdam': { lat: 52.3676, lng: 4.9041 },
  'berlin': { lat: 52.5200, lng: 13.4050 },
  'narita': { lat: 35.7720, lng: 140.3929 },
  'kelowna': { lat: 49.8880, lng: -119.4960 },
  'chiang mai': { lat: 18.7883, lng: 98.9853 },
  'siem reap': { lat: 13.3671, lng: 103.8448 },
  'da nang': { lat: 16.0544, lng: 108.2022 },
  'hoi an': { lat: 15.8801, lng: 108.3380 },
  'luang prabang': { lat: 19.8856, lng: 102.1347 },
};

function getCityCoordinates(location: string): { lat: number; lng: number } | null {
  const cityName = location.split(',')[0].toLowerCase().trim();
  return CITY_COORDINATES[cityName] || null;
}

export function TripRouteMap({ bases, className, singleLocation }: TripRouteMapProps) {
  // Determine effective bases
  const effectiveBases = singleLocation
    ? [{ id: 'single', location: singleLocation, nights: 1 }] as Base[]
    : bases;

  const coords = effectiveBases
    .map(b => ({ ...b, coords: getCityCoordinates(b.location) }))
    .filter(b => b.coords !== null);

  if (!bases || bases.length === 0) {
    return null;
  }

  // Use custom SVG map - clean, fast, no API issues
  return (
    <Card className={`${className} py-0`}>
      <CardContent className="p-1.5 overflow-hidden relative h-full">
        <div className="w-full h-full min-h-[180px] rounded-lg overflow-hidden bg-blue-50/50">
          {/* Custom SVG route map */}
          <svg viewBox="0 0 100 60" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Water background */}
            <rect x="0" y="0" width="100" height="60" fill="#e0f2fe" />

            {/* Simplified Asia landmass */}
            <path d="M 45 8 Q 70 5 85 12 L 90 30 Q 88 42 78 45 L 65 40 Q 50 35 48 25 L 45 8"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.5" />

            {/* Southeast Asia islands */}
            <path d="M 68 42 Q 78 44 85 48 L 88 54 Q 82 58 72 55 L 68 48 Q 66 44 68 42"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.5" />

            {/* Route line connecting destinations */}
            {coords.length > 1 && (
              <polyline
                points={coords.map((c) => {
                  // Map lat/lng to SVG coordinates (simplified)
                  const x = ((c.coords!.lng + 180) / 360) * 100;
                  const y = ((90 - c.coords!.lat) / 180) * 60;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="1.5"
                strokeDasharray="2,1"
                strokeLinecap="round"
              />
            )}

            {/* Destination markers */}
            {coords.map((c, i) => {
              const x = ((c.coords!.lng + 180) / 360) * 100;
              const y = ((90 - c.coords!.lat) / 180) * 60;
              return (
                <g key={c.id || i}>
                  <circle cx={x} cy={y} r="3" fill="#4f46e5" stroke="white" strokeWidth="1" />
                  {!singleLocation && (
                    <text x={x} y={y + 1} textAnchor="middle" fontSize="3" fill="white" fontWeight="bold">
                      {i + 1}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Location list overlay */}
          <div className="absolute bottom-2 left-2 right-2">
            <div className="bg-background/95 rounded-lg p-2 shadow-sm">
              <div className="flex flex-wrap gap-1">
                {coords.slice(0, 5).map((c, i) => (
                  <span key={c.id || i} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                    <span className="w-3.5 h-3.5 rounded-full bg-primary text-white text-[8px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    {c.location.split(',')[0]}
                  </span>
                ))}
                {coords.length > 5 && (
                  <span className="text-[10px] text-muted-foreground">+{coords.length - 5} more</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
