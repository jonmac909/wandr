'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

// Convert pixels to lat/lng offset based on zoom level
function pixelsToLatLng(pixelX: number, pixelY: number, zoom: number, mapSize: number) {
  // At zoom 0, the entire world is 256 pixels
  // Each zoom level doubles the pixels per degree
  const scale = Math.pow(2, zoom);
  const degreesPerPixel = 360 / (256 * scale);

  return {
    lat: -pixelY * degreesPerPixel * (mapSize / 300), // Negative because y increases downward
    lng: pixelX * degreesPerPixel * (mapSize / 300),
  };
}

export function TripRouteMap({ bases, className }: TripRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { center: initialCenter, zoom: baseZoom } = calculateMapBounds(bases);

  const [zoomLevel, setZoomLevel] = useState(0);
  const [center, setCenter] = useState(initialCenter);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastCenter, setLastCenter] = useState(initialCenter);

  const zoom = Math.max(1, Math.min(18, baseZoom + zoomLevel));

  const coords = bases
    .map(b => ({ ...b, coords: getCityCoordinates(b.location) }))
    .filter(b => b.coords !== null);

  // Generate static map URL
  const markers = coords
    .map((b, i) => `markers=color:red%7Clabel:${i + 1}%7C${b.coords!.lat},${b.coords!.lng}`)
    .join('&');

  const path = coords.length > 1
    ? `&path=color:0x4f46e5%7Cweight:2%7C${coords.map(b => `${b.coords!.lat},${b.coords!.lng}`).join('|')}`
    : '';

  const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=300x300&scale=2&maptype=roadmap&${markers}${path}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

  const hasApiKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Mouse/Touch handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setLastCenter(center);
  }, [center]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = dragStart.x - e.clientX;
    const deltaY = dragStart.y - e.clientY;

    const offset = pixelsToLatLng(deltaX, deltaY, zoom, 300);

    setCenter({
      lat: Math.max(-85, Math.min(85, lastCenter.lat + offset.lat)),
      lng: lastCenter.lng + offset.lng,
    });
  }, [isDragging, dragStart, lastCenter, zoom]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setLastCenter(center);
    }
  }, [center]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;

    const deltaX = dragStart.x - e.touches[0].clientX;
    const deltaY = dragStart.y - e.touches[0].clientY;

    const offset = pixelsToLatLng(deltaX, deltaY, zoom, 300);

    setCenter({
      lat: Math.max(-85, Math.min(85, lastCenter.lat + offset.lat)),
      lng: lastCenter.lng + offset.lng,
    });
  }, [isDragging, dragStart, lastCenter, zoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Double click to zoom in at that point
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Calculate offset from center (center is at mapSize/2)
    const mapSize = rect.width;
    const offsetX = clickX - mapSize / 2;
    const offsetY = clickY - mapSize / 2;

    // Convert click position to lat/lng offset
    const offset = pixelsToLatLng(offsetX, offsetY, zoom, mapSize);

    // Move center toward click point and zoom in
    setCenter(prev => ({
      lat: Math.max(-85, Math.min(85, prev.lat + offset.lat * 0.5)),
      lng: prev.lng + offset.lng * 0.5,
    }));
    setZoomLevel(prev => Math.min(prev + 1, 6));
  }, [zoom]);

  // Reset to initial view
  const handleReset = useCallback(() => {
    setCenter(initialCenter);
    setZoomLevel(0);
  }, [initialCenter]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 6));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, -2));

  // Add global mouse up listener to handle drag ending outside component
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  if (!bases || bases.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className="p-0 overflow-hidden relative">
        <div
          ref={containerRef}
          className={`aspect-square ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          {hasApiKey ? (
            <img
              src={mapUrl}
              alt="Trip route map"
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          ) : (
            // Fallback visual representation - square
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 relative">
              {/* Route line visualization */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                {/* Simple curved path between points */}
                {coords.length > 1 && (
                  <path
                    d={`M ${15 + (0 / (coords.length - 1)) * 70} 50 ${coords.slice(1).map((_, i) => `L ${15 + ((i + 1) / (coords.length - 1)) * 70} ${35 + (i % 2) * 30}`).join(' ')}`}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2"
                    strokeDasharray="4,3"
                  />
                )}
                {/* City markers */}
                {coords.map((_, i) => {
                  const x = coords.length === 1 ? 50 : 15 + (i / (coords.length - 1)) * 70;
                  const y = coords.length === 1 ? 50 : 35 + (i % 2) * 30;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="6" fill="#4f46e5" />
                      <circle cx={x} cy={y} r="3" fill="white" />
                      <text x={x} y={y + 1.5} textAnchor="middle" className="text-[8px] fill-primary font-bold">{i + 1}</text>
                    </g>
                  );
                })}
              </svg>

              {/* City labels */}
              <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 justify-center">
                {bases.slice(0, 4).map((base, i) => (
                  <div key={base.id} className="flex items-center gap-1 bg-white/90 rounded px-1.5 py-0.5 shadow-sm">
                    <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span className="text-[10px] font-medium truncate max-w-[50px]">
                      {base.location.split(',')[0]}
                    </span>
                  </div>
                ))}
                {bases.length > 4 && (
                  <div className="bg-white/90 rounded px-1.5 py-0.5 shadow-sm">
                    <span className="text-[10px] text-muted-foreground">+{bases.length - 4}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map controls */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
            onClick={handleZoomIn}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
            onClick={handleZoomOut}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
            onClick={handleReset}
            title="Reset view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Drag hint */}
        {!isDragging && (
          <div className="absolute bottom-2 left-2 text-[10px] text-white/80 bg-black/40 px-1.5 py-0.5 rounded pointer-events-none">
            Drag to pan • Double-click to zoom
          </div>
        )}
      </CardContent>
    </Card>
  );
}
