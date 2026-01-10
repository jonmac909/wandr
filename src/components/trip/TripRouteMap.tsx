'use client';

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { Base } from '@/types/itinerary';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

interface TripRouteMapProps {
  bases: Base[];
  className?: string;
  singleLocation?: string;
}

// Simple coordinate lookup for common destinations
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'tokyo': { lat: 35.6762, lng: 139.6503 },
  'tokyo narita': { lat: 35.6762, lng: 139.6503 },
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
  'seattle': { lat: 47.6062, lng: -122.3321 },
  'portland': { lat: 45.5152, lng: -122.6784 },
  'koh yao noi': { lat: 8.1167, lng: 98.6167 },
  'koh yao': { lat: 8.1167, lng: 98.6167 },
  'samui': { lat: 9.5120, lng: 100.0136 },
};

function getCityCoordinates(location: string): { lat: number; lng: number } | null {
  const cityName = location.split(',')[0].toLowerCase().trim();
  return CITY_COORDINATES[cityName] || null;
}

// Dynamically import the map component to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-[120px] rounded-lg overflow-hidden bg-blue-50/50 flex items-center justify-center">
      <span className="text-xs text-muted-foreground">Loading map...</span>
    </div>
  ),
});

export function TripRouteMap({ bases, className, singleLocation }: TripRouteMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);

  // Determine effective bases
  const effectiveBases = singleLocation
    ? [{ id: 'single', location: singleLocation, nights: 1 }] as Base[]
    : bases;

  const coords = useMemo(() => {
    const mapped = effectiveBases.map(b => {
      const coords = getCityCoordinates(b.location);
      return { ...b, coords };
    });
    return mapped.filter(b => b.coords !== null);
  }, [effectiveBases]);

  if (!bases || bases.length === 0) {
    return null;
  }

  const handleLocationClick = (index: number) => {
    setSelectedLocation(selectedLocation === index ? null : index);
  };

  return (
    <Card className={`${className} py-0`}>
      <CardContent className="p-1.5 overflow-hidden relative h-full flex flex-col">
        {/* Map area */}
        <LeafletMap
          coords={coords}
          selectedLocation={selectedLocation}
          onLocationClick={handleLocationClick}
          singleLocation={singleLocation}
        />

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
