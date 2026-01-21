'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import 'leaflet/dist/leaflet.css';

interface Region {
  id: string;
  name: string;
  lat: number;
  lng: number;
  color: string;
}

interface ThailandMapProps {
  selectedRegion: string;
  onRegionClick: (regionId: string) => void;
}

const REGIONS: Region[] = [
  { id: 'north', name: 'Northern', lat: 18.79, lng: 98.98, color: '#EF4444' },
  { id: 'central', name: 'Central', lat: 13.75, lng: 100.50, color: '#3B82F6' },
  { id: 'east', name: 'Eastern', lat: 12.45, lng: 102.0, color: '#F97316' }, // Moved east toward Chanthaburi/Koh Chang
  { id: 'gulf', name: 'Gulf Islands', lat: 9.51, lng: 100.01, color: '#10B981' },
  { id: 'andaman', name: 'Andaman', lat: 7.88, lng: 98.39, color: '#8B5CF6' },
];

const MAPTILER_KEY = 'ApW52vsbKHpERF6XOM5x';

// Thailand border style
const borderStyle = {
  color: '#E8967A',
  weight: 3,
  fillColor: '#FEF3C7',
  fillOpacity: 0.2,
  dashArray: '5, 5',
};

function createRegionIcon(color: string, isSelected: boolean) {
  const size = isSelected ? 36 : 28;
  
  return L.divIcon({
    className: 'region-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: all 0.2s;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Component to fetch and display Thailand border
function ThailandBorder() {
  const [boundary, setBoundary] = useState<GeoJsonObject | null>(null);
  
  useEffect(() => {
    // Fetch Thailand boundary from Nominatim
    fetch('https://nominatim.openstreetmap.org/search?q=Thailand&format=json&polygon_geojson=1&limit=1', {
      headers: { 'User-Agent': 'Wandr Travel App' }
    })
      .then(res => res.json())
      .then(data => {
        if (data[0]?.geojson) {
          setBoundary(data[0].geojson);
        }
      })
      .catch(() => {});
  }, []);
  
  if (!boundary) return null;
  
  return <GeoJSON data={boundary} style={borderStyle} />;
}

export default function ThailandMap({ selectedRegion, onRegionClick }: ThailandMapProps) {
  const [mapReady, setMapReady] = useState(false);
  
  // Center of Thailand - adjusted for better vertical view
  const thailandCenter: [number, number] = [13.5, 101.0];

  useEffect(() => {
    setMapReady(true);
  }, []);

  if (!mapReady) {
    return <div className="w-full h-full bg-blue-50 rounded-xl" />;
  }

  return (
    <MapContainer
      center={thailandCenter}
      zoom={5}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      touchZoom={false}
      attributionControl={false}
      className="w-full h-full rounded-xl"
      style={{ background: '#B3D1F0' }}
    >
      <TileLayer
        url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}&language=en`}
      />
      
      {/* Thailand border */}
      <ThailandBorder />
      
      {/* Region markers */}
      {REGIONS.map((region) => (
        <Marker
          key={region.id}
          position={[region.lat, region.lng]}
          icon={createRegionIcon(region.color, selectedRegion === region.id)}
          eventHandlers={{
            click: () => onRegionClick(region.id),
          }}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold">{region.name}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
