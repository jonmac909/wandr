'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Car, Plane, Train } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// City coordinates
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  // Thailand
  'Bangkok': { lat: 13.7563, lng: 100.5018 },
  'Chiang Mai': { lat: 18.7883, lng: 98.9853 },
  'Phuket': { lat: 7.8804, lng: 98.3923 },
  'Krabi': { lat: 8.0863, lng: 98.9063 },
  'Koh Samui': { lat: 9.5120, lng: 100.0134 },
  'Ayutthaya': { lat: 14.3532, lng: 100.5685 },
  'Pai': { lat: 19.3622, lng: 98.4411 },
  'Chiang Rai': { lat: 19.9105, lng: 99.8406 },
  'Koh Phi Phi': { lat: 7.7407, lng: 98.7784 },
  'Koh Lanta': { lat: 7.6500, lng: 99.0833 },
  'Koh Tao': { lat: 10.0956, lng: 99.8374 },
  'Hua Hin': { lat: 12.5684, lng: 99.9577 },
  'Koh Chang': { lat: 12.0559, lng: 102.3426 },
  'Sukhothai': { lat: 17.0074, lng: 99.8226 },
  'Kanchanaburi': { lat: 14.0041, lng: 99.5483 },
  'Koh Phangan': { lat: 9.7500, lng: 100.0333 },
  // Vietnam
  'Hanoi': { lat: 21.0285, lng: 105.8542 },
  'Ho Chi Minh City': { lat: 10.8231, lng: 106.6297 },
  'Hoi An': { lat: 15.8801, lng: 108.3380 },
  'Da Nang': { lat: 16.0544, lng: 108.2022 },
  'Hue': { lat: 16.4637, lng: 107.5909 },
  'Nha Trang': { lat: 12.2388, lng: 109.1967 },
  'Ha Long Bay': { lat: 20.9101, lng: 107.1839 },
  'Sapa': { lat: 22.3364, lng: 103.8438 },
  'Ninh Binh': { lat: 20.2539, lng: 105.9750 },
  // Japan
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  'Hiroshima': { lat: 34.3853, lng: 132.4553 },
  'Nara': { lat: 34.6851, lng: 135.8050 },
  'Hakone': { lat: 35.2324, lng: 139.1069 },
  'Nikko': { lat: 36.7198, lng: 139.6982 },
  'Fukuoka': { lat: 33.5904, lng: 130.4017 },
  // Hawaii
  'Honolulu': { lat: 21.3069, lng: -157.8583 },
  'Maui': { lat: 20.7984, lng: -156.3319 },
  'Kauai': { lat: 22.0964, lng: -159.5261 },
  'Big Island': { lat: 19.5429, lng: -155.6659 },
  'Waikiki': { lat: 21.2793, lng: -157.8292 },
  // Turkey
  'Istanbul': { lat: 41.0082, lng: 28.9784 },
  'Cappadocia': { lat: 38.6431, lng: 34.8289 },
  'Antalya': { lat: 36.8969, lng: 30.7133 },
  'Bodrum': { lat: 37.0344, lng: 27.4305 },
  'Ephesus': { lat: 37.9411, lng: 27.3420 },
  'Pamukkale': { lat: 37.9137, lng: 29.1187 },
  'Izmir': { lat: 38.4237, lng: 27.1428 },
  // Spain
  'Barcelona': { lat: 41.3874, lng: 2.1686 },
  'Madrid': { lat: 40.4168, lng: -3.7038 },
  'Seville': { lat: 37.3891, lng: -5.9845 },
  'Granada': { lat: 37.1773, lng: -3.5986 },
  'Valencia': { lat: 39.4699, lng: -0.3763 },
  'San Sebastian': { lat: 43.3183, lng: -1.9812 },
  'Bilbao': { lat: 43.2630, lng: -2.9350 },
  'Malaga': { lat: 36.7213, lng: -4.4214 },
  // Portugal
  'Lisbon': { lat: 38.7223, lng: -9.1393 },
  'Porto': { lat: 41.1579, lng: -8.6291 },
  'Lagos': { lat: 37.1028, lng: -8.6730 },
  'Faro': { lat: 37.0194, lng: -7.9322 },
  'Sintra': { lat: 38.8029, lng: -9.3817 },
  // France
  'Paris': { lat: 48.8566, lng: 2.3522 },
  'Nice': { lat: 43.7102, lng: 7.2620 },
  'Lyon': { lat: 45.7640, lng: 4.8357 },
  'Marseille': { lat: 43.2965, lng: 5.3698 },
  // Italy
  'Rome': { lat: 41.9028, lng: 12.4964 },
  'Florence': { lat: 43.7696, lng: 11.2558 },
  'Venice': { lat: 45.4408, lng: 12.3155 },
  'Milan': { lat: 45.4642, lng: 9.1900 },
  'Naples': { lat: 40.8518, lng: 14.2681 },
  'Amalfi': { lat: 40.6340, lng: 14.6027 },
  // Greece
  'Athens': { lat: 37.9838, lng: 23.7275 },
  'Santorini': { lat: 36.3932, lng: 25.4615 },
  'Mykonos': { lat: 37.4467, lng: 25.3289 },
  // Canada (home)
  'Kelowna': { lat: 49.8880, lng: -119.4960 },
  'Vancouver': { lat: 49.2827, lng: -123.1207 },
};

interface RouteMapProps {
  cities: string[];
  getCityCountry: (city: string) => string | undefined;
  calculateDistance: (from: string, to: string) => number | null;
}

// Calculate midpoint between two coordinates
function getMidpoint(lat1: number, lng1: number, lat2: number, lng2: number) {
  return {
    lat: (lat1 + lat2) / 2,
    lng: (lng1 + lng2) / 2,
  };
}

// Create pink pin marker
function createPinkMarker(cityName: string) {
  const html = `
    <div style="position: relative;">
      <div style="
        width: 12px;
        height: 12px;
        background: #ec4899;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    </div>
  `;

  return L.divIcon({
    className: 'route-map-marker',
    html,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// Create transport badge marker for route midpoints
function createTransportBadge(mode: 'car' | 'train' | 'flight', time: string) {
  const iconSvg = mode === 'flight'
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>'
    : mode === 'train'
    ? '<span style="font-size:12px;">🚄</span>'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>';

  const bgColor = mode === 'flight' ? '#f97316' : '#3b82f6';

  const html = `
    <div style="
      display: flex;
      align-items: center;
      gap: 4px;
      background: white;
      padding: 4px 8px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
      color: ${bgColor};
    ">
      ${iconSvg}
      <span>${time}</span>
    </div>
  `;

  return L.divIcon({
    className: 'transport-badge',
    html,
    iconSize: [80, 24],
    iconAnchor: [40, 12],
  });
}

// Map controller for auto-fitting bounds
function MapController({ cities }: { cities: string[] }) {
  const map = useMap();

  useEffect(() => {
    const coords = cities
      .map(city => CITY_COORDINATES[city])
      .filter(Boolean);

    if (coords.length === 0) return;

    const bounds = L.latLngBounds(
      coords.map(c => [c.lat, c.lng] as [number, number])
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 8 });
  }, [map, cities]);

  return null;
}

export default function RouteMap({ cities, getCityCountry, calculateDistance }: RouteMapProps) {
  // Get coordinates for all cities
  const cityCoords = useMemo(() => {
    return cities
      .map(city => ({
        city,
        coords: CITY_COORDINATES[city],
        country: getCityCountry(city),
      }))
      .filter(c => c.coords);
  }, [cities, getCityCountry]);

  // Build route segments with transport info
  const routeSegments = useMemo(() => {
    const segments: {
      from: { city: string; lat: number; lng: number };
      to: { city: string; lat: number; lng: number };
      distance: number;
      mode: 'car' | 'train' | 'flight';
      time: string;
      isCrossCountry: boolean;
    }[] = [];

    for (let i = 0; i < cityCoords.length - 1; i++) {
      const from = cityCoords[i];
      const to = cityCoords[i + 1];
      const distance = calculateDistance(from.city, to.city) || 0;
      const isCrossCountry = from.country !== to.country;

      // Determine transport mode
      const isFlight = isCrossCountry || distance > 400;
      const isTrain = !isCrossCountry && distance > 150 && distance <= 400;
      const mode: 'car' | 'train' | 'flight' = isFlight ? 'flight' : isTrain ? 'train' : 'car';

      // Calculate time estimate
      let time = '';
      if (distance > 0) {
        if (mode === 'flight') {
          const flightHours = Math.max(1, Math.round(distance / 800)); // ~800km/hr
          time = `${flightHours}h`;
        } else if (mode === 'train') {
          const trainHours = Math.round(distance / 80);
          time = `${trainHours}h`;
        } else {
          const carHours = Math.round(distance / 60);
          const carMins = Math.round((distance / 60 - carHours) * 60);
          time = carMins > 0 ? `${carHours}h ${carMins}min` : `${carHours}h`;
        }
      }

      segments.push({
        from: { city: from.city, lat: from.coords.lat, lng: from.coords.lng },
        to: { city: to.city, lat: to.coords.lat, lng: to.coords.lng },
        distance,
        mode,
        time,
        isCrossCountry,
      });
    }

    return segments;
  }, [cityCoords, calculateDistance]);

  // Initial center
  const initialCenter = useMemo(() => {
    if (cityCoords.length === 0) return { lat: 20, lng: 100 };
    const avgLat = cityCoords.reduce((sum, c) => sum + c.coords.lat, 0) / cityCoords.length;
    const avgLng = cityCoords.reduce((sum, c) => sum + c.coords.lng, 0) / cityCoords.length;
    return { lat: avgLat, lng: avgLng };
  }, [cityCoords]);

  if (cities.length === 0) {
    return (
      <div className="h-[200px] rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center">
        <span className="text-sm text-muted-foreground">Add cities to see the route map</span>
      </div>
    );
  }

  return (
    <div className="h-[200px] rounded-xl overflow-hidden border">
      <MapContainer
        center={[initialCenter.lat, initialCenter.lng]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        {/* Use a cleaner map style similar to Google Maps */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Orange route lines */}
        {routeSegments.map((segment, idx) => (
          <Polyline
            key={idx}
            positions={[
              [segment.from.lat, segment.from.lng],
              [segment.to.lat, segment.to.lng],
            ]}
            pathOptions={{
              color: '#f97316', // Orange
              weight: 4,
              opacity: 0.9,
            }}
          />
        ))}

        {/* City markers with pink pins */}
        {cityCoords.map((city, idx) => (
          <Marker
            key={city.city}
            position={[city.coords.lat, city.coords.lng]}
            icon={createPinkMarker(city.city)}
          >
            <Tooltip
              permanent
              direction="top"
              offset={[0, -8]}
              className="city-tooltip"
            >
              <div className="font-medium text-xs">{city.city}</div>
            </Tooltip>
          </Marker>
        ))}

        {/* Transport badges at midpoints */}
        {routeSegments.map((segment, idx) => {
          const midpoint = getMidpoint(
            segment.from.lat, segment.from.lng,
            segment.to.lat, segment.to.lng
          );
          return (
            <Marker
              key={`transport-${idx}`}
              position={[midpoint.lat, midpoint.lng]}
              icon={createTransportBadge(segment.mode, segment.time)}
              interactive={false}
            />
          );
        })}

        <MapController cities={cities} />
      </MapContainer>

      {/* Custom styles for tooltips */}
      <style jsx global>{`
        .city-tooltip {
          background: white !important;
          border: none !important;
          border-radius: 8px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          padding: 4px 8px !important;
          font-family: inherit !important;
        }
        .city-tooltip::before {
          display: none !important;
        }
        .route-map-marker {
          background: transparent !important;
          border: none !important;
        }
        .transport-badge {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
}
