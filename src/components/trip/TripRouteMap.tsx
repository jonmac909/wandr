'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import type { Base } from '@/types/itinerary';
import { cn } from '@/lib/utils';

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
  'hakone': { lat: 35.2324, lng: 139.1069 },
  'nara': { lat: 34.6851, lng: 135.8048 },
  'hiroshima': { lat: 34.3853, lng: 132.4553 },
  'fukuoka': { lat: 33.5904, lng: 130.4017 },
  'sapporo': { lat: 43.0618, lng: 141.3545 },
  'okinawa': { lat: 26.2124, lng: 127.6809 },
  'nagoya': { lat: 35.1815, lng: 136.9066 },
  'yokohama': { lat: 35.4437, lng: 139.6380 },
  'bali': { lat: -8.3405, lng: 115.0920 },
  'phuket': { lat: 7.8804, lng: 98.3923 },
  'hanoi': { lat: 21.0278, lng: 105.8342 },
  'ho chi minh': { lat: 10.8231, lng: 106.6297 },
  'saigon': { lat: 10.8231, lng: 106.6297 },
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
  'chiang rai': { lat: 19.9105, lng: 99.8406 },
  'siem reap': { lat: 13.3671, lng: 103.8448 },
  'da nang': { lat: 16.0544, lng: 108.2022 },
  'hoi an': { lat: 15.8801, lng: 108.3380 },
  'luang prabang': { lat: 19.8856, lng: 102.1347 },
  'honolulu': { lat: 21.3069, lng: -157.8583 },
  'hawaii': { lat: 21.3069, lng: -157.8583 },
  'oahu': { lat: 21.4389, lng: -158.0001 },
  'maui': { lat: 20.7984, lng: -156.3319 },
  'kona': { lat: 19.6400, lng: -155.9969 },
  'hilo': { lat: 19.7074, lng: -155.0847 },
  'kauai': { lat: 22.0964, lng: -159.5261 },
  'nha trang': { lat: 12.2388, lng: 109.1967 },
  'phnom penh': { lat: 11.5564, lng: 104.9282 },
  'vientiane': { lat: 17.9757, lng: 102.6331 },
  'yangon': { lat: 16.8661, lng: 96.1951 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.7041, lng: 77.1025 },
  'kathmandu': { lat: 27.7172, lng: 85.3240 },
  'colombo': { lat: 6.9271, lng: 79.8612 },
  'maldives': { lat: 3.2028, lng: 73.2207 },
  'male': { lat: 4.1755, lng: 73.5093 },
  'krabi': { lat: 8.0863, lng: 98.9063 },
  'koh samui': { lat: 9.5120, lng: 100.0136 },
  'koh phangan': { lat: 9.7500, lng: 100.0333 },
  'koh tao': { lat: 10.0956, lng: 99.8403 },
  'phi phi': { lat: 7.7407, lng: 98.7784 },
  'railay': { lat: 8.0128, lng: 98.8389 },
  'ao nang': { lat: 8.0363, lng: 98.8225 },
};

function getCityCoordinates(location: string): { lat: number; lng: number } | null {
  const cityName = location.split(',')[0].toLowerCase().trim();
  return CITY_COORDINATES[cityName] || null;
}

export function TripRouteMap({ bases, className, singleLocation }: TripRouteMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  // Determine effective bases
  const effectiveBases = singleLocation
    ? [{ id: 'single', location: singleLocation, nights: 1 }] as Base[]
    : bases;

  // DEBUG: Log what bases we receive
  console.log('TripRouteMap bases:', bases?.map(b => b.location));
  console.log('TripRouteMap effectiveBases:', effectiveBases?.map(b => b.location));

  const coords = useMemo(() => {
    const result = effectiveBases
      .map(b => ({ ...b, coords: getCityCoordinates(b.location) }))
      .filter(b => b.coords !== null);
    console.log('TripRouteMap coords (after filter):', result.map(c => c.location));
    return result;
  }, [effectiveBases]);

  // Calculate viewBox based on selected location or all points
  const viewBox = useMemo(() => {
    if (coords.length === 0) return { x: 0, y: 0, width: 100, height: 60 };

    if (selectedLocation !== null && coords[selectedLocation]) {
      // Zoom in on selected location
      const c = coords[selectedLocation];
      const x = ((c.coords!.lng + 180) / 360) * 100;
      const y = ((90 - c.coords!.lat) / 180) * 60;
      // Smaller viewBox = more zoom
      const zoomWidth = 20;
      const zoomHeight = 12;
      return {
        x: Math.max(0, Math.min(100 - zoomWidth, x - zoomWidth / 2)),
        y: Math.max(0, Math.min(60 - zoomHeight, y - zoomHeight / 2)),
        width: zoomWidth,
        height: zoomHeight,
      };
    }

    // Default: show all points with padding
    const points = coords.map(c => ({
      x: ((c.coords!.lng + 180) / 360) * 100,
      y: ((90 - c.coords!.lat) / 180) * 60,
    }));

    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    const padding = 10;
    const width = Math.max(30, maxX - minX + padding * 2);
    const height = Math.max(18, maxY - minY + padding * 2);

    return {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
      width: Math.min(100, width),
      height: Math.min(60, height),
    };
  }, [coords, selectedLocation]);

  if (!bases || bases.length === 0) {
    return null;
  }

  const handleLocationClick = (index: number) => {
    setSelectedLocation(selectedLocation === index ? null : index);
  };

  const handleResetZoom = () => {
    setSelectedLocation(null);
  };

  // Use custom SVG map - clean, fast, no API issues
  return (
    <Card className={`${className} py-0`}>
      <CardContent className="p-1.5 overflow-hidden relative h-full flex flex-col">
        {/* Map area */}
        <div className="flex-1 min-h-[120px] rounded-lg overflow-hidden bg-blue-50/50 relative">
          {/* Zoom controls */}
          {selectedLocation !== null && (
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-1 right-1 z-10 h-6 w-6 bg-background/90"
              onClick={handleResetZoom}
            >
              <X className="w-3 h-3" />
            </Button>
          )}

          {/* Custom SVG route map */}
          <svg
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
            className="w-full h-full transition-all duration-500 ease-out"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Water background */}
            <rect x="0" y="0" width="100" height="60" fill="#e0f2fe" />

            {/* World landmasses - simplified */}
            {/* North America */}
            <path d="M 5 10 Q 15 8 25 12 L 30 20 Q 28 28 20 30 L 10 25 Q 5 18 5 10"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.3" />

            {/* South America */}
            <path d="M 18 32 Q 25 30 28 35 L 26 48 Q 22 55 18 50 L 16 40 Q 15 35 18 32"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.3" />

            {/* Europe */}
            <path d="M 42 10 Q 52 8 55 12 L 54 18 Q 50 22 45 20 L 42 15 Q 40 12 42 10"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.3" />

            {/* Africa */}
            <path d="M 45 22 Q 55 20 58 25 L 56 40 Q 50 48 45 42 L 44 30 Q 43 25 45 22"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.3" />

            {/* Asia */}
            <path d="M 55 8 Q 75 5 90 12 L 92 30 Q 88 42 78 45 L 65 40 Q 55 35 55 25 L 55 8"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.3" />

            {/* Southeast Asia islands */}
            <path d="M 68 42 Q 78 44 85 48 L 88 54 Q 82 58 72 55 L 68 48 Q 66 44 68 42"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.3" />

            {/* Australia */}
            <path d="M 78 38 Q 88 36 92 42 L 90 50 Q 84 54 78 50 L 76 44 Q 76 40 78 38"
                  fill="#d1fae5" stroke="#86efac" strokeWidth="0.3" />

            {/* Hawaii dots */}
            <circle cx="12" cy="22" r="0.8" fill="#d1fae5" stroke="#86efac" strokeWidth="0.2" />

            {/* Route line connecting destinations */}
            {coords.length > 1 && (
              <polyline
                points={coords.map((c) => {
                  const x = ((c.coords!.lng + 180) / 360) * 100;
                  const y = ((90 - c.coords!.lat) / 180) * 60;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#4f46e5"
                strokeWidth={selectedLocation !== null ? "0.3" : "1"}
                strokeDasharray={selectedLocation !== null ? "0.5,0.25" : "2,1"}
                strokeLinecap="round"
              />
            )}

            {/* Destination markers */}
            {coords.map((c, i) => {
              const x = ((c.coords!.lng + 180) / 360) * 100;
              const y = ((90 - c.coords!.lat) / 180) * 60;
              const isSelected = selectedLocation === i;
              const markerSize = selectedLocation !== null ? (isSelected ? 1.5 : 0.8) : 3;

              return (
                <g
                  key={c.id || i}
                  className="cursor-pointer"
                  onClick={() => handleLocationClick(i)}
                >
                  {/* Pulse animation for selected */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r={markerSize * 2}
                      fill="#4f46e5"
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={markerSize}
                    fill={isSelected ? "#dc2626" : "#4f46e5"}
                    stroke="white"
                    strokeWidth={selectedLocation !== null ? 0.2 : 1}
                    className="transition-all duration-300"
                  />
                  {!singleLocation && selectedLocation === null && (
                    <text
                      x={x}
                      y={y + 1}
                      textAnchor="middle"
                      fontSize="3"
                      fill="white"
                      fontWeight="bold"
                    >
                      {i + 1}
                    </text>
                  )}
                  {/* Show city name when zoomed */}
                  {isSelected && (
                    <text
                      x={x}
                      y={y + 3}
                      textAnchor="middle"
                      fontSize="1.5"
                      fill="#1f2937"
                      fontWeight="600"
                    >
                      {c.location.split(',')[0]}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Location list - scrollable */}
        <div className="mt-1.5 max-h-[80px] overflow-y-auto">
          <div className="flex flex-wrap gap-1">
            {coords.map((c, i) => (
              <button
                key={c.id || i}
                onClick={() => handleLocationClick(i)}
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full transition-all",
                  selectedLocation === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <span className={cn(
                  "w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-bold",
                  selectedLocation === i
                    ? "bg-primary-foreground text-primary"
                    : "bg-primary text-white"
                )}>
                  {i + 1}
                </span>
                {c.location.split(',')[0]}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
