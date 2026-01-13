'use client';

import { useEffect, useRef, useState } from 'react';
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
  'phuket': [7.8804, 98.3923],
  'bali': [-8.4095, 115.1889],
  'ubud': [-8.5069, 115.2625],
  'singapore': [1.3521, 103.8198],
  'ho chi minh': [10.8231, 106.6297],
  'hanoi': [21.0285, 105.8542],
  'seoul': [37.5665, 126.9780],
  'paris': [48.8566, 2.3522],
  'london': [51.5074, -0.1278],
  'new york': [40.7128, -74.0060],
  'rome': [41.9028, 12.4964],
  'barcelona': [41.3851, 2.1734],
  'amsterdam': [52.3676, 4.9041],
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

// Day colors matching the main view
const DAY_COLORS = [
  '#f97316', // orange
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#8b5cf6', // violet
  '#10b981', // green
  '#3b82f6', // blue
  '#ef4444', // red
];

export default function ActivityMap({ days, selectedActivityId, onActivitySelect }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Get all activities to find center
    const allActivities = days.flatMap((day, dayIdx) =>
      day.activities.map((activity, actIdx) => ({
        activity,
        dayNumber: day.dayNumber,
        dayIdx,
        coords: getActivityCoords(activity, day.city, dayIdx * 10 + actIdx),
      }))
    );

    if (allActivities.length === 0) return;

    // Calculate center
    const avgLat = allActivities.reduce((sum, a) => sum + a.coords[0], 0) / allActivities.length;
    const avgLng = allActivities.reduce((sum, a) => sum + a.coords[1], 0) / allActivities.length;

    // Initialize map
    const map = L.map(mapRef.current, {
      center: [avgLat, avgLng],
      zoom: 13,
      zoomControl: false,
    });

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add tile layer (using CartoDB Voyager for clean look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add markers
    allActivities.forEach(({ activity, dayNumber, dayIdx, coords }, globalIdx) => {
      const color = DAY_COLORS[dayIdx % DAY_COLORS.length];

      // Create custom div icon with number
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background-color: ${color};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">${globalIdx + 1}</div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 150px;">
            <strong>${activity.name}</strong>
            <br/><span style="color: #666; font-size: 12px;">Day ${dayNumber} • ${activity.neighborhood || activity.type}</span>
            ${activity.openingHours ? `<br/><span style="color: #888; font-size: 11px;">🕐 ${activity.openingHours}</span>` : ''}
          </div>
        `);

      marker.on('click', () => {
        if (onActivitySelect) {
          onActivitySelect(activity, dayNumber);
        }
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (allActivities.length > 1) {
      const bounds = L.latLngBounds(allActivities.map(a => a.coords));
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, [days, onActivitySelect]);

  // Filter markers by selected day
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    let globalIdx = 0;
    days.forEach((day, dayIdx) => {
      day.activities.forEach(() => {
        const marker = markersRef.current[globalIdx];
        if (marker) {
          if (selectedDay === null || selectedDay === dayIdx) {
            marker.setOpacity(1);
          } else {
            marker.setOpacity(0.3);
          }
        }
        globalIdx++;
      });
    });
  }, [selectedDay, days]);

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Day filter chips */}
      <div className="absolute top-4 left-4 right-4 flex gap-2 flex-wrap z-[1000]">
        <button
          onClick={() => setSelectedDay(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-md transition-colors ${
            selectedDay === null
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Days
        </button>
        {days.map((day, idx) => (
          <button
            key={day.dayNumber}
            onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium shadow-md transition-colors ${
              selectedDay === idx
                ? 'text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
            style={selectedDay === idx ? { backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] } : {}}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-24 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs font-medium text-gray-500 mb-2">Activities</div>
        {days.map((day, idx) => (
          <div key={day.dayNumber} className="flex items-center gap-2 text-sm">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: DAY_COLORS[idx % DAY_COLORS.length] }}
            />
            <span className="text-gray-700">Day {day.dayNumber}: {day.city}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
