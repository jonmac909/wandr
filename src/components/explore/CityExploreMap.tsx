'use client';

import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, ZoomControl, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

interface Place {
  id: string;
  name: string;
  emoji: string;
  pinType?: 'site' | 'food' | 'nature' | 'activity' | 'stay';
  lat?: number;
  lng?: number;
}

interface CityExploreMapProps {
  cityName: string;
  places: Place[];
  selectedPin: string | null;
  onPinClick: (id: string | null) => void;
}

// City coordinates lookup
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // Thailand
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Phuket': { lat: 7.8804, lng: 98.3923 },
  'Chiang Rai': { lat: 19.9105, lng: 99.8406 },
  'Pai': { lat: 19.3590, lng: 98.4409 },
  'Krabi': { lat: 8.0863, lng: 98.9063 },
  'Koh Samui': { lat: 9.5120, lng: 100.0136 },
  'Ayutthaya': { lat: 14.3532, lng: 100.5689 },
  'Sukhothai': { lat: 17.0078, lng: 99.8265 },
  'Kanchanaburi': { lat: 14.0227, lng: 99.5328 },
  'Hua Hin': { lat: 12.5684, lng: 99.9577 },
  'Koh Phi Phi': { lat: 7.7407, lng: 98.7784 },
  'Koh Lanta': { lat: 7.6500, lng: 99.0500 },
  'Koh Tao': { lat: 10.0956, lng: 99.8403 },
  'Koh Phangan': { lat: 9.7500, lng: 100.0333 },
  'Pattaya': { lat: 12.9236, lng: 100.8825 },
  // Japan
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  // Vietnam
  'Hanoi': { lat: 21.0285, lng: 105.8542 },
  'Ho Chi Minh': { lat: 10.8231, lng: 106.6297 },
  // Other
  'Bali': { lat: -8.3405, lng: 115.0920 },
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Paris': { lat: 48.8566, lng: 2.3522 },
};

// Pin colors by type - max 5 types
const PIN_COLORS: Record<string, string> = {
  site: '#E8967A',     // Coral - temples, landmarks, museums, attractions
  food: '#FA7B17',     // Orange - restaurants, cafes, markets
  nature: '#34A853',   // Google green - parks, scenic, animals
  activity: '#A142F4', // Purple - nightlife, theme parks
  stay: '#4285F4',     // Google blue - hotels, hostels
};

function createPinIcon(pinType: string = 'site', isSelected: boolean) {
  const scale = isSelected ? 1.15 : 1;
  const width = Math.round(16 * scale);
  const height = Math.round(22 * scale);
  const color = PIN_COLORS[pinType] || PIN_COLORS.site;
  
  return L.divIcon({
    className: 'custom-pin-marker',
    html: `
      <svg width="${width}" height="${height}" viewBox="0 0 16 22" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 5.5 8 14 8 14s8-8.5 8-14c0-4.42-3.58-8-8-8z" fill="${color}"/>
        <circle cx="8" cy="8" r="3" fill="white"/>
      </svg>
    `,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
  });
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  // Only set view on initial load, not when places change
  return null;
}

export default function CityExploreMap({ cityName, places, selectedPin, onPinClick }: CityExploreMapProps) {
  const cityCenter = useMemo(() => {
    return CITY_COORDS[cityName] || { lat: 13.7563, lng: 100.5018 }; // Default to Bangkok
  }, [cityName]);

  // Use real coordinates from Google Places - skip places without them
  const placesWithCoords = useMemo(() => {
    return places.filter(place => place.lat && place.lng);
  }, [places]);

  // Start zoomed in on the city, zoom in more when places are added
  const initialZoom = places.length > 0 ? 14 : 12;

  return (
    <MapContainer
      center={[cityCenter.lat, cityCenter.lng]}
      zoom={initialZoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      zoomControl={false}
      attributionControl={false}
    >
      <ZoomControl position="topright" />
      {/* MapTiler - English labels at all zoom levels */}
      <TileLayer
        attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
        url="https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=ApW52vsbKHpERF6XOM5x&language=en"
        className="map-tiles-warm"
      />
      <style jsx global>{`
        .map-tiles-warm {
          filter: sepia(20%) saturate(110%) hue-rotate(-5deg) brightness(1.02);
        }
        .leaflet-container {
          background: #9BAEC2;
          z-index: 0 !important;
        }
        .leaflet-pane {
          z-index: 1 !important;
        }
        .leaflet-top, .leaflet-bottom {
          z-index: 2 !important;
        }
      `}</style>



      {/* Saved place markers */}
      {placesWithCoords.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat!, place.lng!]}
          icon={createPinIcon(place.pinType || 'site', selectedPin === place.id)}
          eventHandlers={{
            click: () => onPinClick(selectedPin === place.id ? null : place.id),
          }}
        />
      ))}

      <MapController center={[cityCenter.lat, cityCenter.lng]} zoom={initialZoom} />
    </MapContainer>
  );
}

// Country center coordinates for mini map - zoomed out to show full country
const COUNTRY_CENTERS: Record<string, { lat: number; lng: number; zoom: number }> = {
  'Thailand': { lat: 13.0, lng: 101.5, zoom: 3 },
  'Japan': { lat: 36.5, lng: 138.0, zoom: 3 },
  'Vietnam': { lat: 16.0, lng: 107.0, zoom: 3 },
  'Indonesia': { lat: -2.5, lng: 118.0, zoom: 2 },
  'Italy': { lat: 42.5, lng: 12.5, zoom: 3 },
  'France': { lat: 46.5, lng: 2.5, zoom: 3 },
};

// Mini locator map component
export function MiniLocatorMap({ lat, lng, countryName }: { lat: number; lng: number; countryName?: string }) {
  const [countryBoundary, setCountryBoundary] = useState<GeoJsonObject | null>(null);
  const countryCenter = COUNTRY_CENTERS[countryName || ''] || { lat, lng, zoom: 5 };

  // Fetch country boundary
  useEffect(() => {
    if (!countryName) return;
    const fetchCountryBoundary = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(countryName)}&format=json&polygon_geojson=1&limit=1`,
          { headers: { 'User-Agent': 'Wandr Travel App' } }
        );
        const data = await res.json();
        if (data[0]?.geojson) {
          setCountryBoundary(data[0].geojson);
        }
      } catch (err) {
        console.error('Failed to fetch country boundary:', err);
      }
    };
    fetchCountryBoundary();
  }, [countryName]);

  return (
    <MapContainer
      center={[countryCenter.lat, countryCenter.lng]}
      zoom={countryCenter.zoom}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
      />
      {/* Country highlight - coral filled shape */}
      {countryBoundary && (
        <GeoJSON 
          key="country-boundary"
          data={countryBoundary} 
          style={{
            color: '#E8967A',
            weight: 2,
            fillColor: '#E8967A',
            fillOpacity: 0.5,
          }}
        />
      )}
      {/* City dot - prominent red dot */}
      <Marker
        position={[lat, lng]}
        icon={L.divIcon({
          className: 'mini-map-marker',
          html: '<div style="width:12px;height:12px;background:#dc2626;border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.5);"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        })}
      />
    </MapContainer>
  );
}
