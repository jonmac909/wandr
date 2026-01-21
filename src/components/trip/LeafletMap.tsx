'use client';

import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Base } from '@/types/itinerary';

interface CoordBase extends Base {
  coords: { lat: number; lng: number } | null;
}

interface LeafletMapProps {
  coords: CoordBase[];
  selectedLocation: number | null;
  onLocationClick: (index: number) => void;
  singleLocation?: string;
}

// Create numbered marker icons
function createNumberedIcon(number: number, isSelected: boolean) {
  const color = isSelected ? '#dc2626' : '#4f46e5';
  const size = isSelected ? 28 : 24;

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${isSelected ? 14 : 12}px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">${number}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Component to handle map view changes
function MapController({ coords, selectedLocation }: { coords: CoordBase[]; selectedLocation: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (coords.length === 0) return;

    if (selectedLocation !== null && coords[selectedLocation]?.coords) {
      const c = coords[selectedLocation].coords!;
      map.setView([c.lat, c.lng], 8, { animate: true });
    } else {
      // Fit bounds to all markers
      const bounds = L.latLngBounds(
        coords.filter(c => c.coords).map(c => [c.coords!.lat, c.coords!.lng])
      );
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 5 });
    }
  }, [map, coords, selectedLocation]);

  return null;
}

export default function LeafletMap({ coords, selectedLocation, onLocationClick, singleLocation }: LeafletMapProps) {
  // Calculate initial center - prefer Pacific-centered for trips spanning Asia to Americas
  const initialCenter = useMemo(() => {
    if (coords.length === 0) return { lat: 20, lng: 180 };

    // Check if we have both Asian (positive lng) and American (negative lng) destinations
    const hasAsian = coords.some(c => c.coords && c.coords.lng > 0);
    const hasAmerican = coords.some(c => c.coords && c.coords.lng < 0);

    if (hasAsian && hasAmerican) {
      // Pacific-centered view
      return { lat: 25, lng: 180 };
    }

    // Otherwise center on mean of coordinates
    const validCoords = coords.filter(c => c.coords);
    const avgLat = validCoords.reduce((sum, c) => sum + c.coords!.lat, 0) / validCoords.length;
    const avgLng = validCoords.reduce((sum, c) => sum + c.coords!.lng, 0) / validCoords.length;
    return { lat: avgLat, lng: avgLng };
  }, [coords]);

  // Build route segments for polyline - handle antimeridian crossing
  const routeSegments = useMemo(() => {
    if (coords.length < 2) return [];

    const segments: [number, number][][] = [];
    let currentSegment: [number, number][] = [];

    coords.forEach((c, i) => {
      if (!c.coords) return;

      // For Pacific-centered view, shift negative longitudes
      let lng = c.coords.lng;
      if (lng < 0) lng += 360; // Shift -157 to 203

      if (i > 0 && coords[i - 1]?.coords) {
        let prevLng = coords[i - 1].coords!.lng;
        if (prevLng < 0) prevLng += 360;

        // Check for large longitude gap (crossing the display boundary)
        if (Math.abs(lng - prevLng) > 180) {
          if (currentSegment.length > 0) {
            segments.push(currentSegment);
          }
          currentSegment = [];
        }
      }

      currentSegment.push([c.coords.lat, lng]);
    });

    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }

    return segments;
  }, [coords]);

  // Markers with shifted longitude for Pacific view
  const markers = useMemo(() => {
    return coords.map((c, i) => {
      if (!c.coords) return null;
      let lng = c.coords.lng;
      // Shift negative longitudes for Pacific-centered view
      if (lng < 0) lng += 360;
      return {
        ...c,
        displayLng: lng,
        index: i,
      };
    }).filter(Boolean);
  }, [coords]);

  if (coords.length === 0) {
    return (
      <div className="flex-1 min-h-[120px] rounded-lg overflow-hidden bg-blue-50/50 flex items-center justify-center">
        <span className="text-xs text-muted-foreground">No coordinates available</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[120px] rounded-lg overflow-hidden">
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        worldCopyJump={false}
        maxBounds={[[-90, -180], [90, 540]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=ApW52vsbKHpERF6XOM5x&language=en"
        />

        {/* Route lines */}
        {routeSegments.map((segment, idx) => (
          <Polyline
            key={idx}
            positions={segment}
            pathOptions={{
              color: '#4f46e5',
              weight: 3,
              opacity: 0.8,
              dashArray: '10, 5',
            }}
          />
        ))}

        {/* Destination markers */}
        {markers.map((m) => m && (
          <Marker
            key={m.id || m.index}
            position={[m.coords!.lat, m.displayLng]}
            icon={createNumberedIcon(m.index + 1, selectedLocation === m.index)}
            eventHandlers={{
              click: () => onLocationClick(m.index),
            }}
          />
        ))}

        <MapController coords={coords} selectedLocation={selectedLocation} />
      </MapContainer>
    </div>
  );
}
