'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BrowsePlace, SavedPlace } from '@/types/saved-place';

interface ExploreMapProps {
  places: (BrowsePlace | SavedPlace)[];
  onPlaceClick?: (place: BrowsePlace | SavedPlace) => void;
  selectedPlaceId?: string;
}

// City coordinates for centering
const CITY_COORDS: Record<string, [number, number]> = {
  'tokyo': [35.6762, 139.6503],
  'kyoto': [35.0116, 135.7681],
  'osaka': [34.6937, 135.5023],
  'bangkok': [13.7563, 100.5018],
  'chiang mai': [18.7883, 98.9853],
  'singapore': [1.3521, 103.8198],
  'paris': [48.8566, 2.3522],
  'london': [51.5074, -0.1278],
  'new york': [40.7128, -74.0060],
  'default': [35.6762, 139.6503],
};

function getCityCoords(city: string): [number, number] {
  const normalizedCity = city.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalizedCity.includes(key)) return coords;
  }
  return CITY_COORDS['default'];
}

// Generate coordinates for places without them
function getPlaceCoords(place: BrowsePlace | SavedPlace, index: number): [number, number] {
  if (place.coordinates) {
    return [place.coordinates.lat, place.coordinates.lng];
  }

  const cityCoords = getCityCoords(place.city);
  const spread = 0.02;
  const angle = (index * 137.5) * (Math.PI / 180);
  const radius = spread * (0.3 + Math.random() * 0.7);

  return [
    cityCoords[0] + radius * Math.cos(angle),
    cityCoords[1] + radius * Math.sin(angle),
  ];
}

// Category colors
const TYPE_COLORS: Record<string, string> = {
  'attraction': '#f97316', // orange
  'restaurant': '#ef4444', // red
  'cafe': '#a16207', // amber/brown
  'activity': '#10b981', // green
  'nightlife': '#8b5cf6', // violet
};

export default function ExploreMap({ places, onPlaceClick, selectedPlaceId }: ExploreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    }

    // Get center from places or use default
    let center: [number, number] = CITY_COORDS['default'];
    if (places.length > 0) {
      const firstPlace = places[0];
      if (firstPlace.coordinates) {
        center = [firstPlace.coordinates.lat, firstPlace.coordinates.lng];
      } else {
        center = getCityCoords(firstPlace.city);
      }
    }

    // Initialize map
    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers
    places.forEach((place, idx) => {
      const coords = getPlaceCoords(place, idx);
      const color = TYPE_COLORS[place.type] || '#6b7280';
      const isSaved = 'isSaved' in place ? place.isSaved : true;

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 24px;
            height: 24px;
            background-color: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid ${isSaved ? '#fff' : 'transparent'};
          ">${isSaved ? '♥' : ''}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 120px;">
            <strong>${place.name}</strong>
            <br/><span style="color: #666; font-size: 12px;">${place.type} ${place.neighborhood ? '· ' + place.neighborhood : ''}</span>
          </div>
        `);

      marker.on('click', () => {
        if (onPlaceClick) {
          onPlaceClick(place);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple places
    if (places.length > 1) {
      const allCoords = places.map((p, i) => getPlaceCoords(p, i));
      const bounds = L.latLngBounds(allCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, [places, onPlaceClick]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Legend */}
      {places.length > 0 && (
        <div className="absolute bottom-24 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="text-xs font-medium text-gray-500 mb-2">Categories</div>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-2 text-sm">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-700 capitalize">{type}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
