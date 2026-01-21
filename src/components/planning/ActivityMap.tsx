'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeneratedActivity, GeneratedDay } from '@/lib/planning/itinerary-generator';

interface ActivityMapProps {
  days: GeneratedDay[];
  selectedActivityId?: string;
  onActivitySelect?: (activity: GeneratedActivity, dayNumber: number) => void;
}

// City coordinates for fallback
const CITY_COORDS: Record<string, [number, number]> = {
  'tokyo': [35.6762, 139.6503],
  'kyoto': [35.0116, 135.7681],
  'osaka': [34.6937, 135.5023],
  'bangkok': [13.7563, 100.5018],
  'chiang mai': [18.7883, 98.9853],
  'chiang rai': [19.9071, 99.8310],
  'phuket': [7.8804, 98.3923],
  'krabi': [8.0863, 98.9063],
  'bali': [-8.4095, 115.1889],
  'ubud': [-8.5069, 115.2625],
  'singapore': [1.3521, 103.8198],
  'ho chi minh': [10.8231, 106.6297],
  'hanoi': [21.0285, 105.8542],
  'da nang': [16.0544, 108.2022],
  'hoi an': [15.8801, 108.3380],
  'seoul': [37.5665, 126.9780],
  'busan': [35.1796, 129.0756],
  'hakone': [35.2324, 139.1069],
  'paris': [48.8566, 2.3522],
  'london': [51.5074, -0.1278],
  'new york': [40.7128, -74.0060],
  'rome': [41.9028, 12.4964],
  'barcelona': [41.3851, 2.1734],
  'amsterdam': [52.3676, 4.9041],
  'lisbon': [38.7223, -9.1393],
  'honolulu': [21.3069, -157.8583],
  'default': [35.6762, 139.6503],
};

function getCityCoords(city: string): [number, number] {
  const normalizedCity = city.toLowerCase();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalizedCity.includes(key)) return coords;
  }
  return CITY_COORDS['default'];
}

// Generate coordinates for activities based on city and index
function getActivityCoords(activity: GeneratedActivity, city: string, index: number): [number, number] {
  if (activity.coordinates) {
    return [activity.coordinates.lat, activity.coordinates.lng];
  }

  // Generate spread around city center
  const cityCoords = getCityCoords(city);
  const spread = 0.02; // ~2km spread
  const angle = (index * 137.5) * (Math.PI / 180); // Golden angle for nice distribution
  const radius = spread * (0.3 + Math.random() * 0.7);

  return [
    cityCoords[0] + radius * Math.cos(angle),
    cityCoords[1] + radius * Math.sin(angle),
  ];
}

// Coral color for pins and route line (matching Chiang Mai explore page)
const CORAL_COLOR = '#E8967A';

export default function ActivityMap({ days, selectedActivityId, onActivitySelect }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Create a key from days to detect changes
  const daysKey = days.map(d => `${d.dayNumber}-${d.activities.length}`).join(',');
  const cityFromDays = days[0]?.city || 'tokyo';

  useEffect(() => {
    if (!mapRef.current) return;

    // Clean up existing map if it exists (needed when days change)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    }

    // Get all activities to find center
    const allActivities = days.flatMap((day, dayIdx) =>
      day.activities.map((activity, actIdx) => ({
        activity,
        dayNumber: day.dayNumber,
        dayIdx,
        coords: getActivityCoords(activity, day.city, dayIdx * 10 + actIdx),
      }))
    );

    const defaultCenter = getCityCoords(cityFromDays);

    // Calculate center (use default center if no activities)
    const avgLat = allActivities.length > 0
      ? allActivities.reduce((sum, a) => sum + a.coords[0], 0) / allActivities.length
      : defaultCenter[0];
    const avgLng = allActivities.length > 0
      ? allActivities.reduce((sum, a) => sum + a.coords[1], 0) / allActivities.length
      : defaultCenter[1];

    // Initialize map - no attribution
    const map = L.map(mapRef.current, {
      center: [avgLat, avgLng],
      zoom: allActivities.length > 0 ? 13 : 12,
      zoomControl: false,
      attributionControl: false,
    });

    // Add zoom control to top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add MapTiler tiles with English labels (matching Chiang Mai explore page)
    L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=ApW52vsbKHpERF6XOM5x&language=en', {
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers with coral teardrop pins (matching Chiang Mai explore page)
    allActivities.forEach(({ activity, dayNumber, coords }, globalIdx) => {
      const isTransport = ['flight', 'train', 'bus', 'drive', 'transit'].includes(activity.type);
      
      // Create teardrop pin icon with number (like Google Maps)
      const icon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <svg width="24" height="32" viewBox="0 0 16 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 5.5 8 14 8 14s8-8.5 8-14c0-4.42-3.58-8-8-8z" fill="${isTransport ? '#3b82f6' : CORAL_COLOR}"/>
            <text x="8" y="11" text-anchor="middle" fill="white" font-size="8" font-weight="bold">${globalIdx + 1}</text>
          </svg>
        `,
        iconSize: [24, 32],
        iconAnchor: [12, 32],
      });

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${activity.name}</strong>
            <br/><span style="color: #666; font-size: 12px;">Day ${dayNumber} • ${activity.neighborhood || activity.type}</span>
          </div>
        `);

      marker.on('click', () => {
        if (onActivitySelect) {
          onActivitySelect(activity, dayNumber);
        }
      });

      markersRef.current.push(marker);
    });

    // Draw route line connecting all activities in order (coral dashed)
    if (allActivities.length > 1) {
      const routeCoords = allActivities.map(a => a.coords);
      L.polyline(routeCoords, {
        color: CORAL_COLOR,
        weight: 2,
        opacity: 0.6,
        dashArray: '6, 6',
      }).addTo(map);
    }

    // Fit bounds to show all markers
    if (allActivities.length > 1) {
      const bounds = L.latLngBounds(allActivities.map(a => a.coords));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [daysKey, cityFromDays, onActivitySelect]);

  return (
    <div className="relative w-full h-full">
      <style jsx global>{`
        .custom-pin-marker {
          background: transparent !important;
          border: none !important;
        }
        .map-tiles-warm {
          filter: sepia(20%) saturate(110%) hue-rotate(-5deg) brightness(1.02);
        }
      `}</style>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
