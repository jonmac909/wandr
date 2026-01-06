'use client';

import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import type { Base } from '@/types/itinerary';

interface TripRouteMapProps {
  bases: Base[];
  className?: string;
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
};

function getCityCoordinates(location: string): { lat: number; lng: number } | null {
  const cityName = location.split(',')[0].toLowerCase().trim();
  return CITY_COORDINATES[cityName] || null;
}

// Calculate bounds and center from bases
function calculateMapBounds(bases: Base[]) {
  const coords = bases
    .map(b => getCityCoordinates(b.location))
    .filter((c): c is { lat: number; lng: number } => c !== null);

  if (coords.length === 0) {
    return { center: { lat: 20, lng: 100 }, zoom: 3 }; // Default to Asia
  }

  const lats = coords.map(c => c.lat);
  const lngs = coords.map(c => c.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  // Calculate zoom based on span
  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  const span = Math.max(latSpan, lngSpan);

  let zoom = 4;
  if (span < 5) zoom = 6;
  else if (span < 15) zoom = 5;
  else if (span < 30) zoom = 4;
  else zoom = 3;

  return { center: { lat: centerLat, lng: centerLng }, zoom };
}

export function TripRouteMap({ bases, className }: TripRouteMapProps) {
  if (!bases || bases.length === 0) {
    return null;
  }

  const { center, zoom } = calculateMapBounds(bases);
  const coords = bases
    .map(b => ({ ...b, coords: getCityCoordinates(b.location) }))
    .filter(b => b.coords !== null);

  // Generate static map URL using Google Static Maps API
  const markers = coords
    .map((b, i) => `markers=color:red%7Clabel:${i + 1}%7C${b.coords!.lat},${b.coords!.lng}`)
    .join('&');

  const path = coords.length > 1
    ? `&path=color:0x4f46e5%7Cweight:2%7C${coords.map(b => `${b.coords!.lat},${b.coords!.lng}`).join('|')}`
    : '';

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=400x200&scale=2&maptype=roadmap&${markers}${path}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

  // Fallback if no API key - show a simple visual representation
  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <Card className={className}>
      <CardContent className="p-0 overflow-hidden">
        {hasApiKey ? (
          <img
            src={mapUrl}
            alt="Trip route map"
            className="w-full h-32 object-cover"
          />
        ) : (
          // Fallback visual representation
          <div className="h-32 bg-gradient-to-br from-blue-100 to-blue-200 relative">
            {/* Route line visualization */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 50">
              {/* Simple curved path between points */}
              {coords.length > 1 && (
                <path
                  d={`M ${10 + (0 / (coords.length - 1)) * 80} 25 ${coords.slice(1).map((_, i) => `L ${10 + ((i + 1) / (coords.length - 1)) * 80} ${20 + (i % 2) * 10}`).join(' ')}`}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="1.5"
                  strokeDasharray="3,2"
                />
              )}
              {/* City markers */}
              {coords.map((_, i) => {
                const x = coords.length === 1 ? 50 : 10 + (i / (coords.length - 1)) * 80;
                const y = coords.length === 1 ? 25 : 20 + (i % 2) * 10;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="#4f46e5" />
                    <circle cx={x} cy={y} r="2" fill="white" />
                  </g>
                );
              })}
            </svg>

            {/* City labels */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between">
              {bases.slice(0, 3).map((base, i) => (
                <div key={base.id} className="flex items-center gap-1 bg-white/80 rounded px-1.5 py-0.5">
                  <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-medium">
                    {i + 1}
                  </span>
                  <span className="text-[10px] font-medium truncate max-w-[60px]">
                    {base.location.split(',')[0]}
                  </span>
                </div>
              ))}
              {bases.length > 3 && (
                <div className="bg-white/80 rounded px-1.5 py-0.5">
                  <span className="text-[10px] text-muted-foreground">+{bases.length - 3} more</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
