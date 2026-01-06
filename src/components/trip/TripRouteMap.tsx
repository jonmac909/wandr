'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
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
};

function getCityCoordinates(location: string): { lat: number; lng: number } | null {
  const cityName = location.split(',')[0].toLowerCase().trim();
  return CITY_COORDINATES[cityName] || null;
}

export function TripRouteMap({ bases, className, singleLocation }: TripRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine effective bases
  const effectiveBases = singleLocation
    ? [{ id: 'single', location: singleLocation, nights: 1 }] as Base[]
    : bases;

  const coords = effectiveBases
    .map(b => ({ ...b, coords: getCityCoordinates(b.location) }))
    .filter(b => b.coords !== null);

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('No API key');
      return;
    }

    setOptions({
      key: apiKey,
      v: 'weekly',
    });

    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ]).then(() => {
      setIsLoaded(true);
    }).catch((err: Error) => {
      console.error('Google Maps failed to load:', err);
      setError('Failed to load map');
    });
  }, []);

  // Create/update map when loaded or bases change
  useEffect(() => {
    if (!isLoaded || !mapRef.current || coords.length === 0) return;

    // Calculate bounds
    const bounds = new google.maps.LatLngBounds();
    coords.forEach(c => {
      if (c.coords) {
        bounds.extend(c.coords);
      }
    });

    // Create map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        mapId: 'wandr-trip-map',
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(m => m.map = null);
    markersRef.current = [];

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Add markers with numbered labels
    coords.forEach((base, index) => {
      if (!base.coords) return;

      // Create custom marker element
      const markerContent = document.createElement('div');
      markerContent.className = 'flex items-center justify-center';
      markerContent.innerHTML = `
        <div style="
          background: #4f46e5;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 12px;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        ">${singleLocation ? '📍' : index + 1}</div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: base.coords,
        content: markerContent,
        title: base.location,
      });

      // Add info window on click
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 120px;">
            <strong style="font-size: 14px;">${base.location}</strong>
            ${!singleLocation && base.nights ? `<br><span style="color: #666; font-size: 12px;">${base.nights} night${base.nights > 1 ? 's' : ''}</span>` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Draw route polyline (only for multi-location overview)
    if (!singleLocation && coords.length > 1) {
      const path = coords.map(c => c.coords!);
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#4f46e5',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map,
      });
    }

    // Fit bounds
    if (singleLocation && coords[0]?.coords) {
      map.setCenter(coords[0].coords);
      map.setZoom(13);
    } else {
      map.fitBounds(bounds, { top: 20, right: 20, bottom: 20, left: 20 });
    }

  }, [isLoaded, coords.length, singleLocation, JSON.stringify(coords.map(c => c.location))]);

  if (!bases || bases.length === 0) {
    return null;
  }

  // Fallback to static map if no API key or error
  if (error || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    const markerString = coords
      .map((b) => `${b.coords!.lat},${b.coords!.lng},red-pushpin`)
      .join('|');
    const staticMapUrl = coords.length > 0
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${coords[0]?.coords?.lat || 20},${coords[0]?.coords?.lng || 100}&zoom=${singleLocation ? 12 : 4}&size=600x600&maptype=osmarenderer&markers=${encodeURIComponent(markerString)}`
      : '';

    return (
      <Card className={className}>
        <CardContent className="p-1 overflow-hidden relative h-full">
          <div className="w-full h-full min-h-[180px] rounded-lg overflow-hidden">
            <img
              src={staticMapUrl}
              alt="Trip route map"
              className="w-full h-full object-cover"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-1 overflow-hidden relative h-full">
        <div
          ref={mapRef}
          className="w-full h-full min-h-[180px] rounded-lg overflow-hidden"
        />
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-sm text-muted-foreground">Loading map...</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
