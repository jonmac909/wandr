'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CityImage } from '@/components/ui/city-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  MapPin,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Coffee,
  Hotel,
  Ticket,
  Heart,
  GripVertical,
  Footprints,
  Plus,
  Lock,
  Unlock,
  Users,
  Calendar,
  Zap,
  Pencil,
  X,
  Users2,
  Image,
  Route,
  ArrowRight,
  ArrowDown,
  Plane,
  Landmark,
  ScrollText,
  Building,
  ShoppingBag,
  Utensils,
  TreePine,
  Settings,
  AlertCircle,
} from 'lucide-react';
import type { TripDNA } from '@/types/trip-dna';
import type { Itinerary } from '@/types/itinerary';
import type { PlanningItem } from './PlanningTripToggle';
import {
  itineraryToPlanningItems,
  extractCitiesFromItinerary,
  getItineraryDuration,
} from '@/lib/planning/itinerary-to-planning';
// City/site images now fetched dynamically from Pexels API
import { POPULAR_CITY_INFO, type CityInfo, type CityHighlight } from '@/lib/ai/city-info-generator';
import { planningDb } from '@/lib/db/indexed-db';
import dynamic from 'next/dynamic';
import { debug, debugWarn } from '@/lib/logger';

// Throttle concurrent API requests to prevent browser resource exhaustion
async function throttledFetchAll<T>(
  items: T[],
  fetchFn: (item: T) => Promise<void>,
  maxConcurrent: number = 3
): Promise<void> {
  const results: Promise<void>[] = [];
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    await Promise.all(batch.map(fetchFn));
  }
}

// Dynamically import RouteMap to avoid SSR issues with Leaflet
const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false });

// Dynamically import HotelPicker
const HotelPicker = dynamic(() => import('./HotelPicker'), { ssr: false });

// Dynamically import AutoItineraryView
const AutoItineraryView = dynamic(() => import('./AutoItineraryView'), { ssr: false });

import type { HotelInfo } from '@/lib/planning/hotel-generator';
import { getTransportOptions, estimateTransportOptions, getRome2RioUrl, get12GoUrl, TRANSPORT_ICONS, type TransportOption } from '@/lib/planning/transport-options';

// City region info for geography context
const CITY_REGIONS: Record<string, { region: string; tip?: string }> = {
  // Thailand
  'Bangkok': { region: 'Central Thailand', tip: 'Main hub - good starting point' },
  'Chiang Mai': { region: 'Northern Thailand', tip: 'Pair with Chiang Rai & Pai (all north)' },
  'Chiang Rai': { region: 'Northern Thailand', tip: '3hr drive from Chiang Mai' },
  'Pai': { region: 'Northern Thailand', tip: '3hr drive from Chiang Mai' },
  'Sukhothai': { region: 'Northern Thailand', tip: 'Between Bangkok & Chiang Mai' },
  'Ayutthaya': { region: 'Central Thailand', tip: '1hr from Bangkok - easy day trip' },
  'Kanchanaburi': { region: 'Central Thailand', tip: '2hr from Bangkok' },
  'Hua Hin': { region: 'Central Thailand', tip: '3hr south of Bangkok' },
  'Phuket': { region: 'Southern Thailand', tip: 'Pair with Krabi & islands (all south)' },
  'Krabi': { region: 'Southern Thailand', tip: '2hr from Phuket' },
  'Koh Phi Phi': { region: 'Southern Thailand', tip: 'Ferry from Phuket or Krabi' },
  'Koh Lanta': { region: 'Southern Thailand', tip: 'Ferry from Krabi' },
  'Koh Samui': { region: 'Gulf Coast', tip: 'Fly from Bangkok (1hr) or ferry' },
  'Koh Tao': { region: 'Gulf Coast', tip: 'Ferry from Koh Samui' },
  'Koh Phangan': { region: 'Gulf Coast', tip: 'Ferry from Koh Samui' },
  'Koh Chang': { region: 'Eastern Thailand', tip: '5hr from Bangkok, near Cambodia' },
  // Vietnam
  'Hanoi': { region: 'Northern Vietnam', tip: 'Pair with Ha Long Bay & Sapa' },
  'Ha Long Bay': { region: 'Northern Vietnam', tip: '3hr from Hanoi' },
  'Sapa': { region: 'Northern Vietnam', tip: '6hr from Hanoi' },
  'Hoi An': { region: 'Central Vietnam', tip: 'Pair with Da Nang & Hue' },
  'Da Nang': { region: 'Central Vietnam', tip: '30min from Hoi An' },
  'Hue': { region: 'Central Vietnam', tip: '2hr from Hoi An' },
  'Ho Chi Minh City': { region: 'Southern Vietnam', tip: 'Pair with Mekong Delta' },
  'Nha Trang': { region: 'South-Central', tip: 'Beach between HCMC & Hoi An' },
  // Japan
  'Tokyo': { region: 'Kanto', tip: 'Main hub - pair with Hakone & Nikko' },
  'Hakone': { region: 'Kanto', tip: '1.5hr from Tokyo' },
  'Nikko': { region: 'Kanto', tip: '2hr from Tokyo' },
  'Kyoto': { region: 'Kansai', tip: 'Pair with Osaka & Nara (all close)' },
  'Osaka': { region: 'Kansai', tip: '15min train from Kyoto' },
  'Nara': { region: 'Kansai', tip: '45min from Kyoto or Osaka' },
  'Hiroshima': { region: 'Western Japan', tip: '2hr shinkansen from Osaka' },
  // Hawaii
  'Honolulu': { region: 'Oahu', tip: 'Main island - Waikiki is here' },
  'Waikiki': { region: 'Oahu', tip: 'Part of Honolulu' },
  'Maui': { region: 'Maui Island', tip: 'Flight from Honolulu' },
  'Kauai': { region: 'Kauai Island', tip: 'Flight from Honolulu' },
  'Big Island': { region: 'Hawaii Island', tip: 'Volcanoes - flight from Honolulu' },
};

// Get region for a city
function getCityRegion(cityName: string): string | undefined {
  return CITY_REGIONS[cityName]?.region;
}

// Get route tip for a city
function getCityRouteTip(cityName: string): string | undefined {
  return CITY_REGIONS[cityName]?.tip;
}

// City coordinates for distance calculation
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
  // Japan
  'Tokyo': { lat: 35.6762, lng: 139.6503 },
  'Kyoto': { lat: 35.0116, lng: 135.7681 },
  'Osaka': { lat: 34.6937, lng: 135.5023 },
  'Hiroshima': { lat: 34.3853, lng: 132.4553 },
  'Nara': { lat: 34.6851, lng: 135.8050 },
  'Hakone': { lat: 35.2324, lng: 139.1069 },
  'Nikko': { lat: 36.7198, lng: 139.6982 },
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
  'Seville': { lat: 37.3886, lng: -5.9823 },
  'Valencia': { lat: 39.4699, lng: -0.3763 },
  'Granada': { lat: 37.1773, lng: -3.5986 },
  'San Sebastian': { lat: 43.3183, lng: -1.9812 },
  'Bilbao': { lat: 43.2630, lng: -2.9350 },
  'Malaga': { lat: 36.7213, lng: -4.4214 },
  // Switzerland
  'Zurich': { lat: 47.3769, lng: 8.5417 },
  'Lucerne': { lat: 47.0502, lng: 8.3093 },
  'Interlaken': { lat: 46.6863, lng: 7.8632 },
  'Zermatt': { lat: 46.0207, lng: 7.7491 },
  'Geneva': { lat: 46.2044, lng: 6.1432 },
  'Bern': { lat: 46.9480, lng: 7.4474 },
};

// Calculate distance between two cities (Haversine formula)
function calculateDistance(city1: string, city2: string): number | null {
  const coord1 = CITY_COORDINATES[city1];
  const coord2 = CITY_COORDINATES[city2];
  if (!coord1 || !coord2) return null;

  const R = 6371; // Earth's radius in km
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Get travel mode based on distance (no fake flight times)
function getTravelMode(distance: number): string {
  if (distance < 100) return 'by car/bus';
  if (distance < 300) return 'by train/bus';
  if (distance < 500) return 'by train';
  return 'flight'; // Over 500km needs a flight - don't estimate times
}

// City to airport code mapping for Google Flights links
const CITY_AIRPORTS: Record<string, string> = {
  // Home airports (Canada)
  'Kelowna': 'YLW',
  'Vancouver': 'YVR',
  // Thailand
  'Bangkok': 'BKK',
  'Chiang Mai': 'CNX',
  'Chiang Rai': 'CEI',
  'Phuket': 'HKT',
  'Krabi': 'KBV',
  'Koh Samui': 'USM',
  // Vietnam
  'Ho Chi Minh City': 'SGN',
  'Hanoi': 'HAN',
  'Da Nang': 'DAD',
  'Hoi An': 'DAD', // Use Da Nang airport
  'Nha Trang': 'CXR',
  // Japan
  'Tokyo': 'NRT',
  'Osaka': 'KIX',
  'Kyoto': 'KIX', // Use Osaka
  'Hiroshima': 'HIJ',
  'Fukuoka': 'FUK',
  // Hawaii
  'Honolulu': 'HNL',
  'Maui': 'OGG',
  'Kauai': 'LIH',
};

// City coordinates for geographic routing [lat, lng]
const CITY_COORDS: Record<string, [number, number]> = {
  // Japan
  'Tokyo': [35.7, 139.7], 'Hakone': [35.2, 139.0], 'Kyoto': [35.0, 135.8],
  'Nara': [34.7, 135.8], 'Osaka': [34.7, 135.5], 'Hiroshima': [34.4, 132.5], 'Fukuoka': [33.6, 130.4],
  // Thailand
  'Chiang Rai': [19.9, 99.8], 'Chiang Mai': [18.8, 99.0], 'Sukhothai': [17.0, 99.8],
  'Ayutthaya': [14.4, 100.6], 'Bangkok': [13.8, 100.5], 'Koh Samui': [9.5, 100.0],
  'Koh Phangan': [9.7, 100.1], 'Phuket': [7.9, 98.4], 'Krabi': [8.1, 98.9],
  // Vietnam
  'Hanoi': [21.0, 105.8], 'Ha Long Bay': [20.9, 107.0], 'Ninh Binh': [20.3, 105.9],
  'Hue': [16.5, 107.6], 'Da Nang': [16.1, 108.2], 'Hoi An': [15.9, 108.3],
  'Nha Trang': [12.2, 109.2], 'Ho Chi Minh City': [10.8, 106.6],
  // Hawaii
  'Honolulu': [21.3, -157.8], 'Maui': [20.8, -156.3], 'Kauai': [22.1, -159.5],
  // Spain
  'Barcelona': [41.4, 2.2], 'Valencia': [39.5, -0.4], 'Madrid': [40.4, -3.7],
  'Granada': [37.2, -3.6], 'Seville': [37.4, -6.0], 'Malaga': [36.7, -4.4],
  'Cordoba': [37.9, -4.8], 'Toledo': [39.9, -4.0], 'San Sebastian': [43.3, -2.0],
  'Bilbao': [43.3, -2.9],
  // Portugal
  'Lisbon': [38.7, -9.1], 'Porto': [41.2, -8.6], 'Lagos': [37.1, -8.7],
  'Faro': [37.0, -7.9], 'Sintra': [38.8, -9.4], 'Cascais': [38.7, -9.4],
  // France
  'Paris': [48.9, 2.4], 'Nice': [43.7, 7.3], 'Lyon': [45.8, 4.8], 'Marseille': [43.3, 5.4],
  // Italy
  'Rome': [41.9, 12.5], 'Florence': [43.8, 11.3], 'Venice': [45.4, 12.3],
  'Milan': [45.5, 9.2], 'Naples': [40.9, 14.3], 'Amalfi': [40.6, 14.6],
  // Greece
  'Athens': [38.0, 23.7], 'Santorini': [36.4, 25.4], 'Mykonos': [37.4, 25.3],
  // Turkey
  'Istanbul': [41.0, 29.0], 'Cappadocia': [38.6, 34.8], 'Antalya': [36.9, 30.7],
  // Additional Thai islands
  'Koh Phi Phi': [7.74, 98.78], 'Koh Lanta': [7.65, 99.03], 'Koh Tao': [10.1, 99.84],
  'Pai': [19.36, 98.44], 'Hua Hin': [12.57, 99.96], 'Kanchanaburi': [14.0, 99.55],
};

// City to Country mapping - used to group cities by destination
const CITY_TO_COUNTRY: Record<string, string> = {
  // Canada (home)
  'Kelowna': 'Canada', 'Vancouver': 'Canada',
  // Japan
  'Tokyo': 'Japan', 'Hakone': 'Japan', 'Kyoto': 'Japan', 'Nara': 'Japan',
  'Osaka': 'Japan', 'Hiroshima': 'Japan', 'Fukuoka': 'Japan',
  // Thailand
  'Bangkok': 'Thailand', 'Chiang Mai': 'Thailand', 'Chiang Rai': 'Thailand',
  'Phuket': 'Thailand', 'Krabi': 'Thailand', 'Koh Samui': 'Thailand',
  'Koh Phangan': 'Thailand', 'Sukhothai': 'Thailand', 'Ayutthaya': 'Thailand',
  'Kanchanaburi': 'Thailand', 'Pai': 'Thailand', 'Hua Hin': 'Thailand',
  'Koh Chang': 'Thailand', 'Koh Phi Phi': 'Thailand', 'Koh Lanta': 'Thailand', 'Koh Tao': 'Thailand',
  // Vietnam
  'Hanoi': 'Vietnam', 'Ho Chi Minh City': 'Vietnam', 'Da Nang': 'Vietnam',
  'Hoi An': 'Vietnam', 'Hue': 'Vietnam', 'Nha Trang': 'Vietnam',
  'Ha Long Bay': 'Vietnam', 'Ninh Binh': 'Vietnam', 'Sapa': 'Vietnam',
  // Hawaii
  'Honolulu': 'Hawaii', 'Maui': 'Hawaii', 'Kauai': 'Hawaii',
  'Big Island': 'Hawaii', 'Waikiki': 'Hawaii', 'Oahu': 'Hawaii',
  // Spain
  'Barcelona': 'Spain', 'Madrid': 'Spain', 'Valencia': 'Spain',
  'Seville': 'Spain', 'Granada': 'Spain', 'Malaga': 'Spain',
  'San Sebastian': 'Spain', 'Bilbao': 'Spain', 'Toledo': 'Spain', 'Cordoba': 'Spain',
  // Portugal
  'Lisbon': 'Portugal', 'Porto': 'Portugal', 'Lagos': 'Portugal',
  'Faro': 'Portugal', 'Sintra': 'Portugal', 'Cascais': 'Portugal',
  // France
  'Paris': 'France', 'Nice': 'France', 'Lyon': 'France', 'Marseille': 'France',
  // Italy
  'Rome': 'Italy', 'Florence': 'Italy', 'Venice': 'Italy',
  'Milan': 'Italy', 'Naples': 'Italy', 'Amalfi': 'Italy',
  // Greece
  'Athens': 'Greece', 'Santorini': 'Greece', 'Mykonos': 'Greece',
  // Turkey
  'Istanbul': 'Turkey', 'Cappadocia': 'Turkey', 'Antalya': 'Turkey',
};

// Country bounds for zoomed-out country view with city marker
const COUNTRY_BOUNDS: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number; zoom: number }> = {
  'Thailand': { minLat: 5.5, maxLat: 20.5, minLng: 97.5, maxLng: 105.5, zoom: 5 },
  'Japan': { minLat: 30.5, maxLat: 45.5, minLng: 128.5, maxLng: 145.5, zoom: 5 },
  'Vietnam': { minLat: 8.5, maxLat: 23.5, minLng: 102.0, maxLng: 109.5, zoom: 5 },
  'Hawaii': { minLat: 18.5, maxLat: 22.5, minLng: -160.5, maxLng: -154.5, zoom: 6 },
  'Spain': { minLat: 35.5, maxLat: 43.8, minLng: -9.5, maxLng: 4.5, zoom: 5 },
  'Portugal': { minLat: 36.5, maxLat: 42.0, minLng: -9.5, maxLng: -6.0, zoom: 6 },
  'France': { minLat: 41.5, maxLat: 51.0, minLng: -5.0, maxLng: 9.5, zoom: 5 },
  'Italy': { minLat: 36.5, maxLat: 47.0, minLng: 6.5, maxLng: 18.5, zoom: 5 },
  'Greece': { minLat: 34.5, maxLat: 41.5, minLng: 19.5, maxLng: 29.5, zoom: 6 },
  'Turkey': { minLat: 35.5, maxLat: 42.0, minLng: 26.0, maxLng: 44.5, zoom: 5 },
  'Canada': { minLat: 41.5, maxLat: 55.0, minLng: -141.0, maxLng: -52.0, zoom: 3 },
};

// Simple map embed component for city modal - shows country view with city marker
const CityMapEmbed = ({ cityName }: { cityName: string }) => {
  const coords = CITY_COORDS[cityName] || [13.8, 100.5]; // Default to Bangkok
  const [lat, lng] = coords;

  // Get country for this city to determine zoom level
  const country = CITY_TO_COUNTRY[cityName] || 'Thailand';
  const bounds = COUNTRY_BOUNDS[country];

  // Use country bounds if available, otherwise use wider bounds around the city
  const bbox = bounds
    ? `${bounds.minLng}%2C${bounds.minLat}%2C${bounds.maxLng}%2C${bounds.maxLat}`
    : `${lng - 5}%2C${lat - 5}%2C${lng + 5}%2C${lat + 5}`;

  const zoom = bounds?.zoom || 5;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`;

  return (
    <div className="h-full flex flex-col">
      <iframe
        src={mapUrl}
        className="w-full flex-1 min-h-[300px] border-0"
        loading="lazy"
        title={`Map of ${cityName} in ${country}`}
      />
      <a
        href={fullMapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-center py-2 text-xs text-primary hover:underline"
      >
        View larger map →
      </a>
    </div>
  );
};

// Recommended nights per city (based on typical travel patterns)
const RECOMMENDED_NIGHTS: Record<string, number> = {
  // Japan - major cities need more time
  'Tokyo': 4, 'Kyoto': 3, 'Osaka': 2, 'Hakone': 2, 'Nara': 1, 'Hiroshima': 2, 'Fukuoka': 2,
  // Thailand
  'Bangkok': 3, 'Chiang Mai': 3, 'Chiang Rai': 2, 'Phuket': 4, 'Krabi': 3,
  'Koh Samui': 4, 'Koh Phangan': 3, 'Sukhothai': 1, 'Ayutthaya': 1,
  // Vietnam
  'Hanoi': 3, 'Ho Chi Minh City': 3, 'Da Nang': 2, 'Hoi An': 3, 'Hue': 2,
  'Nha Trang': 3, 'Ha Long Bay': 2, 'Ninh Binh': 2,
  // Hawaii
  'Honolulu': 4, 'Maui': 4, 'Kauai': 3, 'Big Island': 3,
  // Spain
  'Barcelona': 4, 'Madrid': 3, 'Seville': 3, 'Valencia': 2, 'Granada': 2,
  'San Sebastian': 2, 'Bilbao': 2, 'Malaga': 2, 'Toledo': 1, 'Cordoba': 1,
  // Portugal
  'Lisbon': 4, 'Porto': 3, 'Lagos': 3, 'Sintra': 1, 'Cascais': 1, 'Faro': 2,
  // France
  'Paris': 4, 'Nice': 3, 'Lyon': 2, 'Marseille': 2,
  // Italy
  'Rome': 4, 'Florence': 3, 'Venice': 2, 'Milan': 2, 'Naples': 2, 'Amalfi': 3,
  // Greece
  'Athens': 3, 'Santorini': 3, 'Mykonos': 3,
  // Turkey
  'Istanbul': 4, 'Cappadocia': 3, 'Antalya': 4,
};

// Generate Google Flights URL for checking real prices
function getGoogleFlightsUrl(fromCity: string, toCity: string): string {
  const fromAirport = CITY_AIRPORTS[fromCity] || fromCity.substring(0, 3).toUpperCase();
  const toAirport = CITY_AIRPORTS[toCity] || toCity.substring(0, 3).toUpperCase();
  return `https://www.google.com/travel/flights?q=flights%20from%20${fromAirport}%20to%20${toAirport}`;
}

// Flight info: time and whether it's direct or has stops
// Format: { time: string, stops: number } - 0 = direct, 1+ = number of connections
interface FlightInfo {
  time: string;
  stops: number; // 0 = direct, 1 = 1 stop, 2 = 2 stops
}

const FLIGHT_DATA: Record<string, Record<string, FlightInfo>> = {
  // From Canada - all require connections to Asia
  'Kelowna': {
    'Bangkok': { time: '18-22hr', stops: 2 }, 'Chiang Mai': { time: '20-24hr', stops: 2 }, 'Chiang Rai': { time: '22-26hr', stops: 2 },
    'Phuket': { time: '20-24hr', stops: 2 }, 'Krabi': { time: '22-26hr', stops: 2 }, 'Koh Samui': { time: '22-26hr', stops: 2 },
    'Ho Chi Minh City': { time: '18-22hr', stops: 2 }, 'Hanoi': { time: '18-22hr', stops: 2 }, 'Da Nang': { time: '20-24hr', stops: 2 },
    'Hoi An': { time: '20-24hr', stops: 2 }, 'Nha Trang': { time: '22-26hr', stops: 2 },
    'Tokyo': { time: '12-14hr', stops: 1 }, 'Osaka': { time: '13-15hr', stops: 1 }, 'Kyoto': { time: '13-15hr', stops: 1 }, 'Hiroshima': { time: '15-18hr', stops: 2 },
    'Honolulu': { time: '8-10hr', stops: 1 }, 'Maui': { time: '9-11hr', stops: 1 }, 'Kauai': { time: '10-12hr', stops: 2 },
  },
  'Vancouver': {
    'Bangkok': { time: '14-17hr', stops: 1 }, 'Chiang Mai': { time: '16-19hr', stops: 2 }, 'Phuket': { time: '16-19hr', stops: 2 },
    'Ho Chi Minh City': { time: '15-18hr', stops: 1 }, 'Hanoi': { time: '15-18hr', stops: 1 }, 'Da Nang': { time: '17-20hr', stops: 2 },
    'Tokyo': { time: '10hr', stops: 0 }, 'Osaka': { time: '11hr', stops: 0 },
    'Honolulu': { time: '6hr', stops: 0 }, 'Maui': { time: '6.5hr', stops: 0 },
  },
  // Within/between Thailand - all direct
  'Bangkok': {
    'Chiang Mai': { time: '1.5hr', stops: 0 }, 'Chiang Rai': { time: '1.5hr', stops: 0 }, 'Phuket': { time: '1.5hr', stops: 0 },
    'Krabi': { time: '1.5hr', stops: 0 }, 'Koh Samui': { time: '1hr', stops: 0 },
    'Ho Chi Minh City': { time: '1.5hr', stops: 0 }, 'Hanoi': { time: '2hr', stops: 0 }, 'Da Nang': { time: '2hr', stops: 0 },
    'Tokyo': { time: '6hr', stops: 0 }, 'Osaka': { time: '5.5hr', stops: 0 }, 'Honolulu': { time: '18-20hr', stops: 2 },
  },
  'Chiang Mai': {
    'Bangkok': { time: '1.5hr', stops: 0 }, 'Chiang Rai': { time: '30min', stops: 0 }, 'Phuket': { time: '2hr', stops: 0 }, 'Koh Samui': { time: '2hr', stops: 1 },
    'Da Nang': { time: '2hr', stops: 0 }, 'Hanoi': { time: '2hr', stops: 0 },
  },
  'Chiang Rai': {
    'Bangkok': { time: '1.5hr', stops: 0 }, 'Chiang Mai': { time: '30min', stops: 0 }, 'Da Nang': { time: '3-4hr', stops: 1 }, 'Hanoi': { time: '2hr', stops: 0 },
  },
  'Phuket': {
    'Bangkok': { time: '1.5hr', stops: 0 }, 'Chiang Mai': { time: '2hr', stops: 0 }, 'Koh Samui': { time: '1hr', stops: 0 }, 'Krabi': { time: '30min', stops: 0 },
    'Ho Chi Minh City': { time: '3-4hr', stops: 1 }, 'Hanoi': { time: '4-5hr', stops: 1 }, 'Da Nang': { time: '4-5hr', stops: 1 }, 'Hoi An': { time: '4-5hr', stops: 1 },
  },
  'Koh Samui': {
    'Bangkok': { time: '1hr', stops: 0 }, 'Phuket': { time: '1hr', stops: 0 },
    'Ho Chi Minh City': { time: '3-4hr', stops: 1 }, 'Da Nang': { time: '4-5hr', stops: 1 }, 'Hoi An': { time: '4-5hr', stops: 1 },
  },
  'Krabi': {
    'Bangkok': { time: '1.5hr', stops: 0 }, 'Phuket': { time: '30min', stops: 0 },
    'Ho Chi Minh City': { time: '3-4hr', stops: 1 }, 'Da Nang': { time: '4-5hr', stops: 1 }, 'Hoi An': { time: '4-5hr', stops: 1 },
  },
  // Within/between Vietnam - mostly direct
  'Ho Chi Minh City': {
    'Hanoi': { time: '2hr', stops: 0 }, 'Da Nang': { time: '1.5hr', stops: 0 }, 'Hoi An': { time: '1.5hr', stops: 0 }, 'Nha Trang': { time: '1hr', stops: 0 },
    'Bangkok': { time: '1.5hr', stops: 0 }, 'Tokyo': { time: '5.5hr', stops: 0 }, 'Osaka': { time: '5hr', stops: 0 },
  },
  'Hanoi': {
    'Ho Chi Minh City': { time: '2hr', stops: 0 }, 'Da Nang': { time: '1.5hr', stops: 0 }, 'Hoi An': { time: '1.5hr', stops: 0 },
    'Bangkok': { time: '2hr', stops: 0 }, 'Tokyo': { time: '4.5hr', stops: 0 },
  },
  'Da Nang': {
    'Hanoi': { time: '1.5hr', stops: 0 }, 'Ho Chi Minh City': { time: '1.5hr', stops: 0 },
    'Bangkok': { time: '2hr', stops: 0 }, 'Osaka': { time: '4hr', stops: 0 }, 'Tokyo': { time: '5hr', stops: 0 },
  },
  // Within/between Japan - mostly direct or train
  'Tokyo': {
    'Osaka': { time: '1.5hr', stops: 0 }, 'Kyoto': { time: '2hr train', stops: 0 }, 'Hiroshima': { time: '1.5hr', stops: 0 }, 'Fukuoka': { time: '2hr', stops: 0 },
    'Bangkok': { time: '6hr', stops: 0 }, 'Ho Chi Minh City': { time: '5.5hr', stops: 0 }, 'Hanoi': { time: '4.5hr', stops: 0 },
    'Chiang Mai': { time: '8-9hr', stops: 1 }, 'Chiang Rai': { time: '9-10hr', stops: 1 }, 'Phuket': { time: '8-9hr', stops: 1 },
    'Honolulu': { time: '7hr', stops: 0 },
  },
  'Osaka': {
    'Tokyo': { time: '1.5hr', stops: 0 }, 'Kyoto': { time: '15min train', stops: 0 }, 'Hiroshima': { time: '1.5hr', stops: 0 }, 'Fukuoka': { time: '1hr', stops: 0 },
    'Bangkok': { time: '5.5hr', stops: 0 }, 'Ho Chi Minh City': { time: '5hr', stops: 0 }, 'Da Nang': { time: '4hr', stops: 0 },
    'Honolulu': { time: '8hr', stops: 0 },
  },
  // Hawaii - mostly direct to Japan
  'Honolulu': {
    'Maui': { time: '30min', stops: 0 }, 'Kauai': { time: '30min', stops: 0 },
    'Tokyo': { time: '7hr', stops: 0 }, 'Osaka': { time: '8hr', stops: 0 },
    'Kelowna': { time: '8-10hr', stops: 1 }, 'Vancouver': { time: '6hr', stops: 0 },
  },
};

// Hub connections - when a flight requires a stop, shows which hubs you can connect through
const HUB_CONNECTIONS: Record<string, Record<string, string[]>> = {
  'Tokyo': {
    'Chiang Mai': ['Bangkok', 'Shanghai'],
    'Chiang Rai': ['Bangkok', 'Shanghai'],
    'Phuket': ['Bangkok', 'Shanghai'],
    'Krabi': ['Bangkok'],
    'Koh Samui': ['Bangkok'],
  },
  'Osaka': {
    'Chiang Mai': ['Bangkok', 'Shanghai'],
    'Chiang Rai': ['Bangkok', 'Shanghai'],
    'Phuket': ['Bangkok'],
  },
  'Honolulu': {
    'Bangkok': ['Tokyo'],
    'Chiang Mai': ['Tokyo'],
    'Ho Chi Minh City': ['Tokyo'],
  },
};

// Get hub connections for a route (returns array of hub options)
function getHubConnections(fromCity: string, toCity: string): string[] {
  return HUB_CONNECTIONS[fromCity]?.[toCity] || HUB_CONNECTIONS[toCity]?.[fromCity] || [];
}

// Get primary hub connection for display
function getHubConnection(fromCity: string, toCity: string): string | null {
  const hubs = getHubConnections(fromCity, toCity);
  return hubs.length > 0 ? hubs[0] : null;
}

// Legacy function for backward compatibility
const FLIGHT_TIMES: Record<string, Record<string, string>> = Object.fromEntries(
  Object.entries(FLIGHT_DATA).map(([from, destinations]) => [
    from,
    Object.fromEntries(
      Object.entries(destinations).map(([to, info]) => [to, info.time])
    )
  ])
);

// Get full flight data between two cities
function getFlightData(fromCity: string, toCity: string): FlightInfo | null {
  // Direct lookup
  if (FLIGHT_DATA[fromCity]?.[toCity]) {
    return FLIGHT_DATA[fromCity][toCity];
  }
  // Reverse lookup
  if (FLIGHT_DATA[toCity]?.[fromCity]) {
    return FLIGHT_DATA[toCity][fromCity];
  }
  return null;
}

// Get estimated flight time between two cities (legacy)
function getFlightTime(fromCity: string, toCity: string): string | null {
  const data = getFlightData(fromCity, toCity);
  return data?.time || null;
}

// Format stops info for display
function formatStops(stops: number): string {
  if (stops === 0) return 'direct';
  if (stops === 1) return '1 stop';
  return `${stops} stops`;
}

// Get flight info with time estimate and stops
function getFlightInfo(fromCity: string, toCity: string): { time: string | null; stops: number | null; url: string } {
  const url = getGoogleFlightsUrl(fromCity, toCity);
  const data = getFlightData(fromCity, toCity);
  return { time: data?.time || null, stops: data?.stops ?? null, url };
}

// Detailed routing options from Kelowna to various destinations
// Each route includes connection cities that can be added as stopovers
interface RouteOption {
  id: string;
  label: string;
  connections: string[];  // Cities where you connect (can add as stopovers)
  totalTime: string;
  stops: number;
  segments: { from: string; to: string; time: string }[];
  recommended?: boolean;
}

interface DestinationRoutes {
  destination: string;
  country: string;
  options: RouteOption[];
}

// Common routing options from Kelowna to popular destinations
const KELOWNA_ROUTES: Record<string, DestinationRoutes> = {
  'Thailand': {
    destination: 'Thailand',
    country: 'Thailand',
    options: [
      {
        id: 'ylw-yvr-nrt-bkk',
        label: 'Via Vancouver & Tokyo',
        connections: ['Vancouver', 'Tokyo'],
        totalTime: '20-24hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Tokyo', time: '10hr' },
          { from: 'Tokyo', to: 'Bangkok', time: '6hr' },
        ],
        recommended: true,
      },
      {
        id: 'ylw-yvr-hkg-bkk',
        label: 'Via Vancouver & Hong Kong',
        connections: ['Vancouver', 'Hong Kong'],
        totalTime: '22-26hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Hong Kong', time: '12hr' },
          { from: 'Hong Kong', to: 'Bangkok', time: '3hr' },
        ],
      },
      {
        id: 'ylw-sea-nrt-bkk',
        label: 'Via Seattle & Tokyo',
        connections: ['Seattle', 'Tokyo'],
        totalTime: '21-25hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Seattle', time: '1.5hr' },
          { from: 'Seattle', to: 'Tokyo', time: '10hr' },
          { from: 'Tokyo', to: 'Bangkok', time: '6hr' },
        ],
      },
    ],
  },
  'Vietnam': {
    destination: 'Vietnam',
    country: 'Vietnam',
    options: [
      {
        id: 'ylw-yvr-nrt-sgn',
        label: 'Via Vancouver & Tokyo',
        connections: ['Vancouver', 'Tokyo'],
        totalTime: '22-26hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Tokyo', time: '10hr' },
          { from: 'Tokyo', to: 'Ho Chi Minh City', time: '6hr' },
        ],
        recommended: true,
      },
      {
        id: 'ylw-yvr-tpe-sgn',
        label: 'Via Vancouver & Taipei',
        connections: ['Vancouver', 'Taipei'],
        totalTime: '21-25hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Taipei', time: '11hr' },
          { from: 'Taipei', to: 'Ho Chi Minh City', time: '3.5hr' },
        ],
      },
    ],
  },
  'Japan': {
    destination: 'Japan',
    country: 'Japan',
    options: [
      {
        id: 'ylw-yvr-nrt',
        label: 'Via Vancouver',
        connections: ['Vancouver'],
        totalTime: '12-14hr',
        stops: 1,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Tokyo', time: '10hr' },
        ],
        recommended: true,
      },
      {
        id: 'ylw-sea-nrt',
        label: 'Via Seattle',
        connections: ['Seattle'],
        totalTime: '13-15hr',
        stops: 1,
        segments: [
          { from: 'Kelowna', to: 'Seattle', time: '1.5hr' },
          { from: 'Seattle', to: 'Tokyo', time: '10hr' },
        ],
      },
    ],
  },
  'Hawaii': {
    destination: 'Hawaii',
    country: 'Hawaii',
    options: [
      {
        id: 'ylw-yvr-hnl',
        label: 'Via Vancouver',
        connections: ['Vancouver'],
        totalTime: '8-10hr',
        stops: 1,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Honolulu', time: '6hr' },
        ],
        recommended: true,
      },
      {
        id: 'ylw-sea-hnl',
        label: 'Via Seattle',
        connections: ['Seattle'],
        totalTime: '9-11hr',
        stops: 1,
        segments: [
          { from: 'Kelowna', to: 'Seattle', time: '1.5hr' },
          { from: 'Seattle', to: 'Honolulu', time: '6hr' },
        ],
      },
    ],
  },
  'Spain': {
    destination: 'Spain',
    country: 'Spain',
    options: [
      {
        id: 'ylw-yvr-lhr-bcn',
        label: 'Via Vancouver & London',
        connections: ['Vancouver', 'London'],
        totalTime: '18-22hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'London', time: '9hr' },
          { from: 'London', to: 'Barcelona', time: '2hr' },
        ],
        recommended: true,
      },
      {
        id: 'ylw-yvr-fra-bcn',
        label: 'Via Vancouver & Frankfurt',
        connections: ['Vancouver', 'Frankfurt'],
        totalTime: '17-21hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Frankfurt', time: '10hr' },
          { from: 'Frankfurt', to: 'Barcelona', time: '2hr' },
        ],
      },
    ],
  },
  'Portugal': {
    destination: 'Portugal',
    country: 'Portugal',
    options: [
      {
        id: 'ylw-yvr-lhr-lis',
        label: 'Via Vancouver & London',
        connections: ['Vancouver', 'London'],
        totalTime: '18-22hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'London', time: '9hr' },
          { from: 'London', to: 'Lisbon', time: '2.5hr' },
        ],
        recommended: true,
      },
    ],
  },
  'Italy': {
    destination: 'Italy',
    country: 'Italy',
    options: [
      {
        id: 'ylw-yvr-lhr-fco',
        label: 'Via Vancouver & London',
        connections: ['Vancouver', 'London'],
        totalTime: '18-22hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'London', time: '9hr' },
          { from: 'London', to: 'Rome', time: '2.5hr' },
        ],
        recommended: true,
      },
    ],
  },
  'Greece': {
    destination: 'Greece',
    country: 'Greece',
    options: [
      {
        id: 'ylw-yvr-lhr-ath',
        label: 'Via Vancouver & London',
        connections: ['Vancouver', 'London'],
        totalTime: '20-24hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'London', time: '9hr' },
          { from: 'London', to: 'Athens', time: '4hr' },
        ],
        recommended: true,
      },
    ],
  },
  'Turkey': {
    destination: 'Turkey',
    country: 'Turkey',
    options: [
      {
        id: 'ylw-yvr-ist',
        label: 'Via Vancouver & Frankfurt',
        connections: ['Vancouver', 'Frankfurt'],
        totalTime: '18-22hr',
        stops: 2,
        segments: [
          { from: 'Kelowna', to: 'Vancouver', time: '1hr' },
          { from: 'Vancouver', to: 'Frankfurt', time: '10hr' },
          { from: 'Frankfurt', to: 'Istanbul', time: '3hr' },
        ],
        recommended: true,
      },
    ],
  },
};

// Get routing options for a destination country
function getRoutingOptions(destinationCountry: string): RouteOption[] {
  const routes = KELOWNA_ROUTES[destinationCountry];
  return routes?.options || [];
}

// Get the recommended route for a destination
function getRecommendedRoute(destinationCountry: string): RouteOption | null {
  const options = getRoutingOptions(destinationCountry);
  return options.find(o => o.recommended) || options[0] || null;
}

// Legacy function - kept for backward compatibility
function getEntryFlightInfo(homeAirport: string, firstCity: string, firstCountry: string): { route: string; time: string } {
  const recommended = getRecommendedRoute(firstCountry);
  if (recommended) {
    return {
      route: recommended.label,
      time: recommended.totalTime,
    };
  }
  return { route: `${homeAirport} → ${firstCountry}`, time: '~15-20hr' };
}

interface SwipeablePlanningViewProps {
  tripDna: TripDNA;
  tripId?: string; // For persistence
  itinerary?: Itinerary | null; // Existing itinerary (for imported trips)
  items: PlanningItem[];
  onItemsChange: (items: PlanningItem[]) => void;
  onSearchAI?: (query: string, category: string) => void;
  duration?: number; // Trip duration in days
  startDate?: string; // Trip start date (explicit prop to avoid remount issues)
  endDate?: string; // Trip end date (explicit prop to avoid remount issues)
  isTripLocked?: boolean; // When Trip View is locked, only allow adding (not removing/editing)
  controlledPhase?: PlanningPhase; // When provided, parent controls the phase
  onPhaseChange?: (phase: PlanningPhase) => void; // Callback when phase changes internally
  onDatesChange?: (startDate: string, totalDays: number) => void; // Callback to sync dates back to parent
  onSave?: () => void; // Callback when Save is clicked in controlled mode
}

interface CategoryStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gridSize: number;
}

// Day colors for timeline (matching Trip.com style)
const DAY_COLORS = [
  { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50', border: 'border-pink-200', dot: 'bg-pink-500' },
  { bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
];

// Default city info for cities not in database (while loading from AI)
const DEFAULT_CITY_INFO: CityInfo = {
  bestFor: ['Exploration'],
  crowdLevel: 'Moderate',
  bestTime: 'Varies by season',
  topSites: ['Loading...'],
  localTip: 'Loading local insights...',
  avgDays: '2-3 days',
  pros: ['Discover something new'],
  cons: ['More research needed'],
};

// Get city info from the database, or return default while AI fetches
function getCityInfo(cityName: string): CityInfo {
  return POPULAR_CITY_INFO[cityName] || DEFAULT_CITY_INFO;
}

// Known big/major cities that should be penalized when "avoid big cities" is selected
const BIG_CITIES = [
  'Bangkok', 'Tokyo', 'Beijing', 'Shanghai', 'Hong Kong', 'Singapore',
  'Seoul', 'Manila', 'Jakarta', 'Mumbai', 'Delhi', 'Kuala Lumpur',
  'New York', 'Los Angeles', 'Chicago', 'London', 'Paris', 'Rome',
  'Barcelona', 'Madrid', 'Berlin', 'Istanbul', 'Cairo', 'Dubai',
  'Sydney', 'Melbourne', 'Toronto', 'Mexico City', 'São Paulo', 'Rio de Janeiro'
];

// Heavily touristed cities
const TOURIST_TRAP_CITIES = [
  'Bangkok', 'Phuket', 'Bali', 'Cancun', 'Venice', 'Florence',
  'Barcelona', 'Amsterdam', 'Paris', 'Prague', 'Dubrovnik'
];

// Generate personalized recommendation based on TripDNA preferences
function getPersonalizedRecommendation(cityInfo: CityInfo, tripDna: TripDNA, cityName?: string): { match: 'great' | 'good' | 'neutral' | 'consider'; reasons: string[]; concerns: string[] } {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const { travelerProfile, vibeAndPace, interests, constraints } = tripDna;
  const travelIdentities = travelerProfile?.travelIdentities || [];
  // Also check tripTypes from interests (where plan page stores them)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tripTypes = (interests as any)?.tripTypes || [];

  // Parse avoidances from preferences or constraints
  const extendedDna = tripDna as unknown as { preferences?: { avoidances?: string }; constraints?: { avoidances?: string } };
  const avoidancesStr = extendedDna.preferences?.avoidances || extendedDna.constraints?.avoidances || '';
  const avoidances = avoidancesStr.split(',').map(a => a.trim()).filter(Boolean);

  // Check avoidances and add concerns
  if (avoidances.includes('big-cities') && cityName && BIG_CITIES.includes(cityName)) {
    concerns.push('This is a major city - you wanted to avoid big cities');
  }
  if (avoidances.includes('crowds') && (cityInfo.crowdLevel === 'High' || cityInfo.crowdLevel === 'Very High')) {
    concerns.push(`${cityInfo.crowdLevel} crowd levels - you prefer avoiding crowds`);
  }
  if (avoidances.includes('tourist-traps') && cityName && TOURIST_TRAP_CITIES.includes(cityName)) {
    concerns.push('Very touristy - you wanted to avoid tourist traps');
  }

  // Check food preferences
  if (interests?.food?.importance === 'food-focused' && cityInfo.bestFor.some(b => b.toLowerCase().includes('food'))) {
    reasons.push('Amazing food scene matches your foodie preferences');
  }

  // Check pace preferences
  if (vibeAndPace?.tripPace === 'relaxed' && cityInfo.crowdLevel === 'Very High') {
    concerns.push('Very crowded - might feel rushed for your relaxed pace');
  }
  if (vibeAndPace?.tripPace === 'fast' && cityInfo.crowdLevel === 'Low') {
    reasons.push('Fewer crowds means you can see more in less time');
  }

  // Check adventure/nature preferences
  if (interests?.hobbies?.includes('hiking') && cityInfo.bestFor.some(b => b.toLowerCase().includes('nature') || b.toLowerCase().includes('hiking'))) {
    reasons.push('Great hiking and nature experiences');
  }

  // Check culture/history preferences - be specific about what they selected
  const hasHistory = tripTypes.includes('history') || travelIdentities.includes('history');
  if (hasHistory && cityInfo.bestFor.some(b => b.toLowerCase().includes('history'))) {
    if (cityInfo.highlights?.history?.length) {
      reasons.push(`Explore ${cityInfo.highlights.history[0].name} and other historic sites`);
    } else {
      reasons.push(`Rich history - perfect for your history interest`);
    }
  }
  const hasMuseums = tripTypes.includes('museums') || travelIdentities.includes('art');
  if (hasMuseums && cityInfo.bestFor.some(b => b.toLowerCase().includes('culture') || b.toLowerCase().includes('art'))) {
    if (cityInfo.highlights?.museums?.length) {
      reasons.push(`Visit ${cityInfo.highlights.museums[0].name}`);
    } else {
      reasons.push(`Great museums and cultural institutions`);
    }
  }

  // Check beach preferences
  const hasBeach = tripTypes.includes('beach') || travelIdentities.includes('relaxation');
  if (hasBeach && cityInfo.bestFor.some(b => b.toLowerCase().includes('beach'))) {
    reasons.push('Beautiful beaches for the relaxation you want');
  }

  // Check nightlife preferences
  const hasNightlife = tripTypes.includes('nightlife') || travelIdentities.includes('nightlife');
  if (hasNightlife && cityInfo.bestFor.some(b => b.toLowerCase().includes('nightlife'))) {
    reasons.push('Great nightlife scene for your evening plans');
  }

  // Check photography hobby
  const hasPhotography = tripTypes.includes('photography') || interests?.hobbies?.includes('photography');
  if (hasPhotography && cityInfo.bestFor.some(b => b.toLowerCase().includes('photography') || b.toLowerCase().includes('scenery'))) {
    reasons.push('Stunning photo opportunities everywhere');
  }

  // Check street food / food tours selected
  const hasFood = tripTypes.includes('street-food') || tripTypes.includes('food-tours') || tripTypes.includes('fine-dining');
  if (hasFood && cityInfo.bestFor.some(b => b.toLowerCase().includes('food'))) {
    if (cityInfo.highlights?.food?.length) {
      reasons.push(`Try the local ${cityInfo.highlights.food[0].name}`);
    } else {
      reasons.push('Amazing food scene to explore');
    }
  }

  // Check local markets interest
  const hasShopping = tripTypes.includes('shopping') || travelIdentities.includes('shopping');
  if (hasShopping && cityInfo.highlights?.markets?.length) {
    reasons.push(`Shop at ${cityInfo.highlights.markets[0].name}`);
  }

  // Check temples/local culture interest
  const hasLocalCulture = tripTypes.includes('local-traditions') || travelIdentities.includes('local-culture');
  if (hasLocalCulture && cityInfo.bestFor.some(b => b.toLowerCase().includes('culture'))) {
    reasons.push('Authentic local traditions to experience');
  }

  // Check spa/wellness interest
  const hasSpa = tripTypes.includes('spa');
  if (hasSpa && cityInfo.bestFor.some(b => b.toLowerCase().includes('wellness') || b.toLowerCase().includes('relaxation'))) {
    reasons.push('Great wellness and spa options');
  }

  // Check hiking interest
  const hasHiking = tripTypes.includes('hiking') || interests?.hobbies?.includes('hiking');
  if (hasHiking && cityInfo.bestFor.some(b => b.toLowerCase().includes('nature') || b.toLowerCase().includes('hiking'))) {
    reasons.push('Excellent hiking and nature trails');
  }

  // Check family travel
  if (travelerProfile?.partyType === 'family' && cityInfo.crowdLevel === 'Very High') {
    concerns.push('Very crowded areas can be challenging with family');
  }

  // Check budget
  const budgetLevel = constraints?.budget?.dailySpend?.max;
  if (budgetLevel && budgetLevel < 100 && cityInfo.cons.some(c => c.toLowerCase().includes('expensive'))) {
    concerns.push('Can be pricey - look for budget options');
  }

  // Determine match level - concerns from explicit avoidances should weigh heavily
  let match: 'great' | 'good' | 'neutral' | 'consider' = 'good';
  if (concerns.length >= 2) {
    // Multiple concerns from user avoidances = consider, regardless of positives
    match = 'consider';
  } else if (concerns.length >= 1) {
    // Any concern from user avoidances = neutral at best
    match = 'neutral';
  } else if (reasons.length >= 2) {
    // No concerns and multiple matching reasons = great
    match = 'great';
  }
  // Default stays 'good' if no concerns and 0-1 reasons

  // Add default reasons if none found
  if (reasons.length === 0) {
    reasons.push(`Known for ${cityInfo.bestFor.slice(0, 2).join(' and ')}`);
  }

  return { match, reasons: reasons.slice(0, 3), concerns: concerns.slice(0, 2) };
}

// Calculate match score for sorting cities based on preferences and avoidances
function getCityMatchScore(cityInfo: CityInfo, tripDna: TripDNA, cityName?: string): number {
  let score = 0;
  const { vibeAndPace, interests, travelerProfile } = tripDna;
  const travelIdentities = travelerProfile?.travelIdentities || [];
  // Also check tripTypes from interests (where plan page stores selected interests)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tripTypes: string[] = (interests as any)?.tripTypes || [];

  // Parse avoidances from preferences or constraints (stored as comma-separated string)
  const extendedDna = tripDna as unknown as { preferences?: { avoidances?: string }; constraints?: { avoidances?: string } };
  const avoidancesStr = extendedDna.preferences?.avoidances || extendedDna.constraints?.avoidances || '';
  const avoidances = avoidancesStr.split(',').map(a => a.trim()).filter(Boolean);

  // HEAVY PENALTIES FOR AVOIDANCES - these should override positive scores

  // Avoid big cities
  if (avoidances.includes('big-cities') && cityName && BIG_CITIES.includes(cityName)) {
    score -= 100; // Major penalty - should push to bottom
  }

  // Avoid crowds
  if (avoidances.includes('crowds')) {
    if (cityInfo.crowdLevel === 'Very High') score -= 80;
    else if (cityInfo.crowdLevel === 'High') score -= 50;
    else if (cityInfo.crowdLevel === 'Moderate') score -= 10;
  }

  // Avoid tourist traps
  if (avoidances.includes('tourist-traps') && cityName && TOURIST_TRAP_CITIES.includes(cityName)) {
    score -= 60;
  }

  // Boost for matching trip types (from plan page) - check both old and new storage
  // Beach / relaxation
  if ((tripTypes.includes('beach') || travelIdentities.includes('relaxation')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('beach'))) score += 25;

  // History
  if ((tripTypes.includes('history') || travelIdentities.includes('history')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('history'))) score += 20;

  // Culture / Local traditions
  if ((tripTypes.includes('local-traditions') || travelIdentities.includes('local-culture')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('culture'))) score += 20;

  // Museums / Art
  if ((tripTypes.includes('museums') || travelIdentities.includes('art')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('culture') || b.toLowerCase().includes('art'))) score += 20;

  // Nature / Gardens
  if ((tripTypes.includes('gardens') || tripTypes.includes('countryside') || tripTypes.includes('mountains') || travelIdentities.includes('nature')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('nature') || b.toLowerCase().includes('scenery'))) score += 20;

  // Nightlife
  if ((tripTypes.includes('nightlife') || travelIdentities.includes('nightlife')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('nightlife'))) score += 20;

  // Food
  if ((tripTypes.includes('street-food') || tripTypes.includes('food-tours') || tripTypes.includes('fine-dining')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('food'))) score += 20;

  // Spa / Wellness
  if ((tripTypes.includes('spa') || tripTypes.includes('lounges')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('wellness') || b.toLowerCase().includes('relaxation'))) score += 20;

  // Adventure / Hiking
  if ((tripTypes.includes('hiking') || tripTypes.includes('water-sports') || tripTypes.includes('wildlife') || travelIdentities.includes('adventure')) &&
      cityInfo.bestFor.some(b => b.toLowerCase().includes('adventure') || b.toLowerCase().includes('nature') || b.toLowerCase().includes('hiking'))) score += 20;

  // Boost for matching hobbies
  if (interests?.hobbies?.includes('hiking') && cityInfo.bestFor.some(b => b.toLowerCase().includes('nature') || b.toLowerCase().includes('hiking'))) score += 15;
  if (interests?.hobbies?.includes('photography') && cityInfo.bestFor.some(b => b.toLowerCase().includes('photography') || b.toLowerCase().includes('scenery'))) score += 15;
  if (interests?.hobbies?.includes('diving') && cityInfo.bestFor.some(b => b.toLowerCase().includes('beach') || b.toLowerCase().includes('snorkeling'))) score += 15;

  // Boost for food match
  if (interests?.food?.importance === 'food-focused' && cityInfo.bestFor.some(b => b.toLowerCase().includes('food'))) score += 15;

  // Penalty for crowd level vs pace (lighter since we handle crowds above)
  if (vibeAndPace?.tripPace === 'relaxed' && cityInfo.crowdLevel === 'Very High') score -= 10;
  if (vibeAndPace?.tripPace === 'fast' && cityInfo.crowdLevel === 'Low') score += 10;

  return score;
}

// Planning flow steps: cities → hotels → restaurants → activities
const PLANNING_STEPS: CategoryStep[] = [
  {
    id: 'cities',
    title: 'Pick your cities',
    subtitle: 'Which cities do you want to explore?',
    icon: Building2,
    gridSize: 18,
  },
  {
    id: 'hotels',
    title: 'Best hotels',
    subtitle: 'Where to stay with prices',
    icon: Hotel,
    gridSize: 18,
  },
  {
    id: 'restaurants',
    title: 'Where to eat',
    subtitle: 'Top restaurants and cafes',
    icon: UtensilsCrossed,
    gridSize: 18,
  },
  {
    id: 'activities',
    title: 'Things to do',
    subtitle: 'Activities and experiences',
    icon: Ticket,
    gridSize: 18,
  },
];

export type PlanningPhase = 'picking' | 'route-planning' | 'auto-itinerary' | 'favorites-library' | 'day-planning';

export function SwipeablePlanningView({
  tripDna,
  tripId,
  itinerary,
  items,
  onItemsChange,
  onSearchAI,
  duration: propDuration,
  startDate: propStartDate,
  endDate: propEndDate,
  isTripLocked = false,
  controlledPhase,
  onPhaseChange,
  onDatesChange,
  onSave,
}: SwipeablePlanningViewProps) {
  // Calculate duration from itinerary or props
  const duration = propDuration || getItineraryDuration(itinerary) || 7;

  // Determine if this is an imported trip (has existing itinerary)
  const hasExistingItinerary = Boolean(itinerary && itinerary.days.length > 0);

  // For imported trips, start in auto-itinerary phase to show AI-generated itinerary
  const [internalPhase, setInternalPhase] = useState<PlanningPhase>(hasExistingItinerary ? 'auto-itinerary' : 'picking');

  // Use controlled phase if provided, otherwise use internal state
  const phase = controlledPhase ?? internalPhase;
  const setPhase = (newPhase: PlanningPhase) => {
    if (controlledPhase === undefined) {
      setInternalPhase(newPhase);
    }
    onPhaseChange?.(newPhase);
  };
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [detailItem, setDetailItem] = useState<PlanningItem | null>(null);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);
  const [persistenceLoaded, setPersistenceLoaded] = useState(false);
  const [routeOrder, setRouteOrder] = useState<string[]>([]); // Ordered list of city names (moved here for persistence)
  const [parkedCities, setParkedCities] = useState<string[]>([]); // Cities saved but not in route
  const [countryOrder, setCountryOrder] = useState<string[]>([]); // Order of countries to visit
  const [savedAllocations, setSavedAllocations] = useState<Array<{ city: string; nights: number; startDay: number; endDay: number; startDate?: string; endDate?: string }>>([]); // Persisted city night allocations
  const [savedGeneratedDays, setSavedGeneratedDays] = useState<Array<{ dayNumber: number; date: string; city: string; theme?: string; activities: Array<{ id: string; name: string; type: 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife' | 'flight' | 'train' | 'bus' | 'drive' | 'transit'; description?: string; imageUrl?: string | null; suggestedTime?: string; duration?: number; openingHours?: string; neighborhood?: string; matchScore?: number; matchReasons?: string[]; priceRange?: string; tags?: string[]; walkingTimeToNext?: number; transportDetails?: { from: string; to: string; departureTime?: string; arrivalTime?: string; operator?: string; bookingRef?: string; distance?: number } }> }>>([]); // Persisted generated days with activities

  // Load persisted planning state on mount
  useEffect(() => {
    if (!tripId || persistenceLoaded) return;

    const loadPersistedState = async () => {
      try {
        const saved = await planningDb.get(tripId);
        debug('[SwipeablePlanning] Loaded from IndexedDB:', saved);
        debug('[SwipeablePlanning] Allocations in DB:', (saved as { allocations?: unknown })?.allocations);

        if (saved) {
          // Always load allocations if we have them
          if ((saved as { allocations?: typeof savedAllocations }).allocations?.length) {
            debug('[SwipeablePlanning] Setting savedAllocations from DB');
            setSavedAllocations((saved as { allocations: typeof savedAllocations }).allocations);
          }

          // Load generated days if we have them
          if ((saved as { generatedDays?: typeof savedGeneratedDays }).generatedDays?.length) {
            debug('[SwipeablePlanning] Setting savedGeneratedDays from DB');
            setSavedGeneratedDays((saved as { generatedDays: typeof savedGeneratedDays }).generatedDays);
          }

          // Always load routeOrder and countryOrder if we have them (these should persist regardless of selectedIds)
          if (saved.routeOrder?.length) {
            debug('[SwipeablePlanning] Setting routeOrder from DB:', saved.routeOrder);
            setRouteOrder(saved.routeOrder);
          }
          if (saved.countryOrder?.length) {
            debug('[SwipeablePlanning] Setting countryOrder from DB:', saved.countryOrder);
            setCountryOrder(saved.countryOrder);
          }

          // Load selectedIds/Cities if we have saved data AND no current selections
          if (saved.selectedIds.length > 0 && selectedIds.size === 0) {
            setSelectedIds(new Set(saved.selectedIds));
            setSelectedCities(saved.selectedCities);

            // Also update items' isFavorited status
            if (items.length > 0) {
              const savedSet = new Set(saved.selectedIds);
              const updatedItems = items.map(item => ({
                ...item,
                isFavorited: savedSet.has(item.id)
              }));
              onItemsChange(updatedItems);
            }
          }
        }
      } catch (error) {
        debugWarn('Failed to load planning state:', error);
      }
      setPersistenceLoaded(true);
    };

    loadPersistedState();
  }, [tripId, persistenceLoaded, items.length, onItemsChange, selectedIds.size]);

  // Save planning state when it changes
  useEffect(() => {
    if (!tripId || !persistenceLoaded) return;

    const saveState = async () => {
      try {
        await planningDb.update(tripId, {
          selectedIds: Array.from(selectedIds),
          selectedCities,
          routeOrder,
          countryOrder,
          phase,
          currentStepIndex,
          allocations: savedAllocations,
          generatedDays: savedGeneratedDays,
        });
      } catch (error) {
        debugWarn('Failed to save planning state:', error);
      }
    };

    // Debounce saves
    const timer = setTimeout(() => {
      debug('[SwipeablePlanning] Saving to IndexedDB, allocations:', savedAllocations, 'generatedDays:', savedGeneratedDays.length);
      saveState();
    }, 500);

    // On unmount or when deps change, save immediately (don't lose pending changes)
    return () => {
      clearTimeout(timer);
      // Save immediately on unmount to prevent data loss when section closes
      saveState();
    };
  }, [tripId, selectedIds, selectedCities, routeOrder, countryOrder, phase, currentStepIndex, persistenceLoaded, savedAllocations, savedGeneratedDays]);

  const [activeDestinationFilter, setActiveDestinationFilter] = useState<string>('');
  const [cityDetailItem, setCityDetailItem] = useState<PlanningItem | null>(null);
  const [cityImageIndex, setCityImageIndex] = useState(0);
  const [highlightTab, setHighlightTab] = useState<string>(''); // Active accordion category for city highlights (empty = all closed)
  const [modalMainTab, setModalMainTab] = useState<'overview' | 'explore' | 'map'>('overview'); // Main modal tab
  const [showCityDetails, setShowCityDetails] = useState(false); // Collapsible Explore section
  const [showWhyLove, setShowWhyLove] = useState(false); // Expanded "Why you'll love it"
  const [showWatchOut, setShowWatchOut] = useState(false); // Expanded "Watch out for"
  const [showLocalTip, setShowLocalTip] = useState(false); // Expanded local tip
  const [enrichedCityInfo, setEnrichedCityInfo] = useState<CityInfo | null>(null); // AI-generated city data for current modal
  const [cityInfoCache, setCityInfoCache] = useState<Record<string, CityInfo>>({}); // Preloaded city info for all cities
  const [isLoadingCityInfo, setIsLoadingCityInfo] = useState(false); // Loading state for city info
  const [siteImages, setSiteImages] = useState<Record<string, string>>({}); // Dynamic Pexels images for sites
  const [gridOffset, setGridOffset] = useState(0); // For "more options" pagination
  const [favoriteCityModal, setFavoriteCityModal] = useState<string | null>(null); // City modal in favorites view
  const [favoriteCityTab, setFavoriteCityTab] = useState<'hotels' | 'restaurants' | 'cafes' | 'activities'>('hotels');
  // Route preferences
  const [routePrefs, setRoutePrefs] = useState({
    shortestFlights: true,    // Optimize for shortest total flight time
    maxStops: 1,              // Maximum stops per flight (0=direct only, 1=up to 1 stop, 2=any)
    maxFlightsPerDay: 2,      // Maximum flights in a single day
    maxFlightHours: 12,       // Maximum single flight duration in hours
  });
  const [draggedCityIndex, setDraggedCityIndex] = useState<number | null>(null); // For drag-and-drop cities
  const [insertAtIndex, setInsertAtIndex] = useState<number | null>(null); // For inserting city at specific position
  const [draggedCountryIndex, setDraggedCountryIndex] = useState<number | null>(null); // For drag-and-drop countries
  const [expandedTransport, setExpandedTransport] = useState<number | null>(null); // Which transport segment is expanded
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null); // Selected flight route option
  const [selectedTransport, setSelectedTransport] = useState<Record<number, { mode: string; hub?: string }>>({});  // Selected transport for each leg

  // Initialize from existing itinerary
  useEffect(() => {
    if (hasExistingItinerary && !initialized) {
      // Convert itinerary to planning items
      const existingItems = itineraryToPlanningItems(itinerary);
      if (existingItems.length > 0 && items.length === 0) {
        onItemsChange(existingItems);
      }

      // Pre-populate selected IDs and cities from favorited items
      const ids = new Set<string>();
      const favoritedCities: string[] = [];
      existingItems.forEach(item => {
        if (item.isFavorited) {
          ids.add(item.id);
          // If it's a city item, add to selectedCities
          if (item.tags?.includes('cities')) {
            favoritedCities.push(item.name);
          }
        }
      });
      setSelectedIds(ids);
      
      // Use favorited cities if any, otherwise extract from itinerary
      if (favoritedCities.length > 0) {
        setSelectedCities(favoritedCities);
      } else {
        const cities = extractCitiesFromItinerary(itinerary);
        setSelectedCities(cities);
      }

      setInitialized(true);
    }
  }, [hasExistingItinerary, itinerary, items.length, onItemsChange, initialized]);

  // Get all destinations from TripDNA
  const destinations = useMemo(() => {
    // Parse "Turkey → Spain" into ["Turkey", "Spain"]
    const parseDestinations = (dest: string): string[] => {
      if (dest.includes('→')) return dest.split('→').map(d => d.trim());
      if (dest.includes('->')) return dest.split('->').map(d => d.trim());
      if (dest.includes(' - ')) return dest.split(' - ').map(d => d.trim());
      return [dest];
    };

    if (tripDna.interests.destinations && tripDna.interests.destinations.length > 0) {
      return tripDna.interests.destinations;
    } else if (tripDna.interests.destination) {
      return parseDestinations(tripDna.interests.destination);
    }
    return ['Your destination'];
  }, [tripDna.interests.destinations, tripDna.interests.destination]);

  // Set default destination filter to first destination
  useEffect(() => {
    if (destinations.length > 0 && !activeDestinationFilter) {
      setActiveDestinationFilter(destinations[0]);
    }
  }, [destinations, activeDestinationFilter]);

  const currentStep = PLANNING_STEPS[currentStepIndex];

  // Get items for current step/category
  const getStepItems = (stepId: string) => {
    return items.filter((item) => item.tags?.includes(stepId));
  };

  const allStepItems = getStepItems(currentStep.id);

  // Filter by active destination when viewing cities
  const stepItems = useMemo(() => {
    if (currentStep.id !== 'cities' || !activeDestinationFilter) {
      return allStepItems;
    }
    return allStepItems.filter(item => item.tags?.includes(activeDestinationFilter));
  }, [allStepItems, currentStep.id, activeDestinationFilter]);

  // Auto-load items when entering a step with no items
  useEffect(() => {
    if (phase === 'picking' && stepItems.length === 0 && onSearchAI) {
      // Auto-trigger load for current step
      if (currentStep.id === 'cities') {
        const query = destinations.length > 1
          ? `top cities to visit in ${destinations.join(' and ')}`
          : `top 10 cities to visit in ${destinations[0]}`;
        onSearchAI(query, 'cities');
      } else if (selectedCities.length > 0) {
        const citiesQuery = selectedCities.join(', ');
        onSearchAI(`best ${currentStep.id} in ${citiesQuery}`, currentStep.id);
      }
    }
  }, [phase, currentStepIndex, stepItems.length, onSearchAI, currentStep.id, destinations, selectedCities]);

  // Use cached city info when modal opens, or fetch if not cached
  useEffect(() => {
    if (!cityDetailItem) {
      setEnrichedCityInfo(null);
      return;
    }

    const cityName = cityDetailItem.name;
    
    // Use cached info if available
    if (cityInfoCache[cityName]) {
      setEnrichedCityInfo(cityInfoCache[cityName]);
      setIsLoadingCityInfo(false);
      return;
    }

    const basicInfo = getCityInfo(cityName);
    // If city already has highlights and ratings, use it directly
    if (basicInfo.highlights && basicInfo.ratings) {
      setEnrichedCityInfo(basicInfo);
      return;
    }

    // Otherwise fetch from API (fallback if preload didn't complete)
    setIsLoadingCityInfo(true);
    const country = cityDetailItem.tags?.find(t => destinations.includes(t)) || destinations[0];

    fetch(`/api/city-info?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country || '')}`)
      .then(res => res.json())
      .then(data => {
        setEnrichedCityInfo(data);
        setCityInfoCache(prev => ({ ...prev, [cityName]: data }));
        setIsLoadingCityInfo(false);
      })
      .catch(err => {
        console.error('Error fetching city info:', err);
        setEnrichedCityInfo(basicInfo);
        setIsLoadingCityInfo(false);
      });
  }, [cityDetailItem, destinations, cityInfoCache]);

  // Track previous city to know when to clear images
  const prevCityRef = useRef<string | null>(null);
  // Track which city images have been fetched in modal
  const fetchedModalCityRef = useRef<Set<string>>(new Set());

  // Fetch city image when modal opens (independent of topSites)
  useEffect(() => {
    // Clear images only when switching to a different city
    if (cityDetailItem?.name !== prevCityRef.current) {
      setSiteImages({});
      prevCityRef.current = cityDetailItem?.name || null;
    }

    if (!cityDetailItem) {
      return;
    }

    const cityName = cityDetailItem.name;
    const country = cityDetailItem.tags?.find(t => destinations.includes(t)) || destinations[0];

    // Always fetch city image when modal opens (use ref to prevent duplicate requests)
    if (!fetchedModalCityRef.current.has(cityName)) {
      fetchedModalCityRef.current.add(cityName);
      fetch(`/api/city-image?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country || '')}`)
        .then(res => res.json())
        .then(data => {
          if (data.imageUrl) {
            setSiteImages(prev => ({ ...prev, [cityName]: data.imageUrl }));
          }
        })
        .catch(() => {});
    }
  }, [cityDetailItem, destinations]); // Removed siteImages from deps

  // Fetch site images when city info is available
  useEffect(() => {
    if (!cityDetailItem) {
      return;
    }

    // Use enriched city info if available, otherwise fallback to basic city info
    const cityInfo = enrichedCityInfo || getCityInfo(cityDetailItem.name);

    if (!cityInfo?.topSites || cityInfo.topSites[0] === 'Loading...') {
      return;
    }

    const cityName = cityDetailItem.name;
    const sites = cityInfo.topSites.slice(0, 4);

    // Fetch site images with throttling to prevent resource exhaustion
    throttledFetchAll(sites, async (site) => {
      // Use functional update to check current state without deps
      setSiteImages(prev => {
        if (prev[site]) return prev; // Skip if already loaded
        // Fetch in next tick to avoid state update during render
        fetch(`/api/site-image?site=${encodeURIComponent(site)}&city=${encodeURIComponent(cityName)}`)
          .then(res => res.json())
          .then(data => {
            if (data.imageUrl) {
              setSiteImages(p => ({ ...p, [site]: data.imageUrl }));
            }
          })
          .catch(() => {});
        return prev;
      });
    });
  }, [cityDetailItem, enrichedCityInfo]); // Removed siteImages from deps

  // Track which cities have been fetched to prevent duplicate requests
  const fetchedCitiesRef = useRef<Set<string>>(new Set());

  // Preload city info and images whenever items change (including AI search results)
  useEffect(() => {
    const cityItems = items.filter(item => item.tags?.includes('cities'));
    if (cityItems.length === 0) return;

    // Throttle city info and image fetching to prevent resource exhaustion
    const fetchCityData = async () => {
      await throttledFetchAll(cityItems, async (item) => {
        const cityName = item.name;
        // Skip if already fetched (use ref to avoid stale closure)
        if (fetchedCitiesRef.current.has(cityName)) return;
        fetchedCitiesRef.current.add(cityName);

        const country = item.tags?.find(t => destinations.includes(t)) || destinations[0];
        const basicInfo = getCityInfo(cityName);

        // If not in hardcoded list, fetch from API
        if (!basicInfo.highlights || !basicInfo.ratings) {
          try {
            const res = await fetch(`/api/city-info?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country || '')}`);
            const data = await res.json();
            setCityInfoCache(prev => ({ ...prev, [cityName]: data }));

            // Also fetch images for the sites (throttled)
            const sites = (data.topSites?.slice(0, 4) || []).filter((s: string) => s && s !== 'Loading...');
            await throttledFetchAll(sites, async (site: string) => {
              try {
                const imgRes = await fetch(`/api/site-image?site=${encodeURIComponent(site)}&city=${encodeURIComponent(cityName)}`);
                const imgData = await imgRes.json();
                setSiteImages(prev => ({ ...prev, [site]: imgData.imageUrl }));
              } catch (error) {
                // Silently fail
              }
            }, 2); // Limit to 2 concurrent site image requests per city
          } catch (error) {
            // Silently fail
          }
        } else {
          setCityInfoCache(prev => ({ ...prev, [cityName]: basicInfo }));
        }

        // Fetch city image
        try {
          const res = await fetch(`/api/city-image?city=${encodeURIComponent(cityName)}&country=${encodeURIComponent(country || '')}`);
          const data = await res.json();
          setSiteImages(prev => ({ ...prev, [cityName]: data.imageUrl }));
        } catch (error) {
          // Silently fail
        }
      }, 2); // Limit to 2 concurrent cities at a time
    };

    fetchCityData();
  }, [items, destinations]); // Removed cityInfoCache and siteImages from deps to prevent infinite loop

  // Get selected/favorited items
  const selectedItems = useMemo(() => {
    return items.filter((i) => i.isFavorited);
  }, [items]);

  // Sync selectedCities from selectedIds when items or selectedIds change
  // This handles cases where selectedIds is set from persistence but items don't have isFavorited
  const selectedIdsArray = Array.from(selectedIds);
  useEffect(() => {
    if (items.length === 0) return;
    
    // Extract city names that are both in items (with cities tag) and in selectedIds
    const selectedCityNames = items
      .filter(item => selectedIds.has(item.id) && item.tags?.includes('cities'))
      .map(item => item.name);
    
    // Debug logging
    const cityItems = items.filter(item => item.tags?.includes('cities'));
    debug('[SyncCities] items:', items.length, 'cityItems:', cityItems.length, 'selectedIds:', selectedIds.size, 'selectedCityNames:', selectedCityNames.length);
    if (cityItems.length > 0) {
      debug('[SyncCities] First city item:', cityItems[0].id, cityItems[0].name, 'tags:', cityItems[0].tags);
      debug('[SyncCities] Is first city in selectedIds?', selectedIds.has(cityItems[0].id));
    }
    
    // Only update if different to avoid loops
    if (selectedCityNames.length > 0) {
      const currentCities = new Set(selectedCities);
      const isDifferent = selectedCityNames.length !== selectedCities.length ||
        selectedCityNames.some(c => !currentCities.has(c));
      
      if (isDifferent) {
        debug('[SyncCities] Updating selectedCities to:', selectedCityNames);
        setSelectedCities(selectedCityNames);
      }
    }
  }, [items, selectedIdsArray.join(',')]); // Trigger when items or selectedIds change

  // Compute country groups for route style options
  const countryGroups = useMemo(() => {
    const groups: Record<string, { city: string; country: string }[]> = {};
    selectedCities.forEach(city => {
      // Use CITY_TO_COUNTRY mapping first, then fall back to tags
      let country = CITY_TO_COUNTRY[city];
      if (!country) {
        const cityItem = items.find(i => i.name === city);
        country = cityItem?.tags?.find(t => destinations.includes(t)) || 'Unknown';
      }
      if (!groups[country]) groups[country] = [];
      groups[country].push({ city, country });
    });
    return groups;
  }, [selectedCities, items, destinations]);

  // Initialize countryOrder when phase is route-planning but countryOrder is empty (e.g., on page refresh)
  useEffect(() => {
    if (phase === 'route-planning' && countryOrder.length === 0 && selectedCities.length > 0) {
      // Extract unique countries from selected cities
      const countriesFromCities = new Set<string>();
      selectedCities.forEach(city => {
        const country = CITY_TO_COUNTRY[city];
        if (country) countriesFromCities.add(country);
        else {
          const cityItem = items.find(i => i.name === city);
          const countryFromTag = cityItem?.tags?.find(t => destinations.includes(t))
            || cityItem?.tags?.find(t => !['cities', 'hotels', 'restaurants', 'activities'].includes(t));
          if (countryFromTag) countriesFromCities.add(countryFromTag);
        }
      });

      const uniqueCountries = Array.from(countriesFromCities);

      if (uniqueCountries.length > 0) {
        // Sort by geographic order from Canada
        const COUNTRY_ORDER_FROM_CANADA: Record<string, number> = {
          'Japan': 1, 'South Korea': 2, 'Taiwan': 3, 'Vietnam': 4, 'Thailand': 5,
          'Cambodia': 6, 'Malaysia': 7, 'Singapore': 8, 'Indonesia': 9, 'Philippines': 10,
          'Australia': 11, 'New Zealand': 12, 'Hawaii': 20,
          'UK': 30, 'France': 31, 'Spain': 32, 'Portugal': 33, 'Italy': 34,
          'Greece': 35, 'Turkey': 36, 'Switzerland': 37, 'Germany': 38,
        };
        const sortedCountries = [...uniqueCountries].sort((a, b) => {
          const orderA = COUNTRY_ORDER_FROM_CANADA[a] ?? 50;
          const orderB = COUNTRY_ORDER_FROM_CANADA[b] ?? 50;
          return orderA - orderB;
        });
        setCountryOrder(sortedCountries);
      }
    }
  }, [phase, countryOrder.length, selectedCities, items, destinations]);

  // Get unassigned selected items (for day planning)
  const unassignedItems = useMemo(() => {
    return selectedItems.filter((i) => i.dayAssigned === undefined);
  }, [selectedItems]);

  // Get items for a specific day
  const getDayItems = (dayIndex: number) => {
    return selectedItems
      .filter((item) => item.dayAssigned === dayIndex)
      .sort((a, b) => (a.orderInDay || 0) - (b.orderInDay || 0));
  };

  const getDayColors = (dayIndex: number) => DAY_COLORS[dayIndex % DAY_COLORS.length];

  // Toggle selection
  const toggleSelect = (itemId: string, itemName: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      if (currentStep.id === 'cities') {
        setSelectedCities((prev) => prev.filter((c) => c !== itemName));
      }
    } else {
      newSelected.add(itemId);
      if (currentStep.id === 'cities') {
        setSelectedCities((prev) => [...prev, itemName]);
      }
    }
    setSelectedIds(newSelected);

    onItemsChange(
      items.map((item) =>
        item.id === itemId ? { ...item, isFavorited: newSelected.has(itemId) } : item
      )
    );
  };

  // Add item to day
  const addToDay = (itemId: string, dayIndex: number) => {
    const dayItems = getDayItems(dayIndex);
    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? { ...item, dayAssigned: dayIndex, orderInDay: dayItems.length }
          : item
      )
    );
  };

  // Remove from day
  const removeFromDay = (itemId: string) => {
    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? { ...item, dayAssigned: undefined, orderInDay: undefined }
          : item
      )
    );
  };

  // Go to next step
  const goToNextStep = () => {
    // After cities step, go to route planning
    if (currentStep.id === 'cities' && selectedCities.length > 0) {
      // Smart multi-country route optimization
      // Considers: geographic order from Canada, optimal city sequences, logical connections

      const updatedParked = parkedCities.filter(city => selectedCities.includes(city));

      // Group cities by country
      const countryGroups: Record<string, string[]> = {};
      destinations.forEach(dest => { countryGroups[dest] = []; });
      selectedCities.forEach(city => {
        const cityItem = items.find(i => i.name === city && i.tags?.includes('cities'));
        const country = cityItem?.tags?.find(t => destinations.includes(t)) || destinations[0];
        if (!countryGroups[country]) countryGroups[country] = [];
        countryGroups[country].push(city);
      });

      // SMART GEOGRAPHIC LOOP ROUTING
      // Create loops that minimize backtracking - 3hr max between stops when possible
      // Examples:
      // - Pacific: Kelowna → Tokyo → Chiang Mai → Phuket → Da Nang → Osaka → Hawaii
      // - Europe: Barcelona → Valencia → Granada → Seville → Lagos → Lisbon → Porto

      // Calculate distance between two cities (km) - uses module-level CITY_COORDS
      const calcDist = (city1: string, city2: string): number => {
        const c1 = CITY_COORDS[city1];
        const c2 = CITY_COORDS[city2];
        if (!c1 || !c2) return 9999;
        const R = 6371;
        const dLat = (c2[0] - c1[0]) * Math.PI / 180;
        const dLng = (c2[1] - c1[1]) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(c1[0]*Math.PI/180) * Math.cos(c2[0]*Math.PI/180) * Math.sin(dLng/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      // PACIFIC ROUTE: SE Asia FIRST, Japan on the WAY BACK, Hawaii last
      // Route: Canada → Thailand/Vietnam → Japan (enjoy on return) → Hawaii → Canada
      // This is the optimal Pacific loop for someone from Western Canada

      const hasJapan = countryGroups['Japan']?.length > 0;
      const hasHawaii = countryGroups['Hawaii']?.length > 0;
      const hasSEAsia = (countryGroups['Thailand']?.length || 0) + (countryGroups['Vietnam']?.length || 0) > 0;
      const hasEurope = ['Spain', 'Portugal', 'France', 'Italy', 'Greece', 'Turkey'].some(c => countryGroups[c]?.length > 0);

      let updatedRoute: string[] = [];

      if (hasSEAsia && hasJapan) {
        // JAPAN SANDWICH: Use Japan as stopover BOTH ways to break up long flights
        // Route: Canada → Japan (entry stop) → SE Asia → Japan (exit stop) → Hawaii
        // Example: Kelowna → Tokyo → Chiang Mai → Phuket → Da Nang → Osaka → Kyoto → Honolulu
        const thaiCities = countryGroups['Thailand'] || [];
        const vietCities = countryGroups['Vietnam'] || [];
        const japanCities = countryGroups['Japan'] || [];
        const hawaiiCities = countryGroups['Hawaii'] || [];

        // Split Japan: Tokyo area for ENTRY (from Canada), Osaka area for EXIT (to Hawaii)
        const japanEntry = japanCities.filter(c => ['Tokyo', 'Hakone'].includes(c));
        const japanExit = japanCities.filter(c => ['Osaka', 'Kyoto', 'Nara', 'Hiroshima', 'Fukuoka'].includes(c));
        const japanOther = japanCities.filter(c => !japanEntry.includes(c) && !japanExit.includes(c));

        // If only one Japan city, use it as entry stopover
        let entryStop: string[] = [];
        let exitStop: string[] = [];
        if (japanCities.length === 1) {
          entryStop = japanCities;
        } else if (japanEntry.length > 0 && japanExit.length > 0) {
          entryStop = japanEntry;
          exitStop = [...japanExit, ...japanOther].sort((a, b) => {
            const order = ['Fukuoka', 'Hiroshima', 'Osaka', 'Kyoto', 'Nara'];
            return order.indexOf(a) - order.indexOf(b);
          });
        } else {
          // All cities in one area - split them
          const half = Math.ceil(japanCities.length / 2);
          entryStop = japanCities.slice(0, 1); // First city as entry
          exitStop = japanCities.slice(1);      // Rest on exit
        }

        // SE Asia: Thailand north→south, then Vietnam south→north (toward Japan exit)
        const thaiSorted = [...thaiCities].sort((a, b) =>
          (CITY_COORDS[b]?.[0] ?? 15) - (CITY_COORDS[a]?.[0] ?? 15)
        );
        const vietSouthToNorth = [...vietCities].sort((a, b) =>
          (CITY_COORDS[a]?.[0] ?? 15) - (CITY_COORDS[b]?.[0] ?? 15)
        );
        const seAsiaRoute = [...thaiSorted, ...vietSouthToNorth];

        // Build route: Japan entry → SE Asia → Japan exit → Hawaii
        updatedRoute = [...entryStop, ...seAsiaRoute, ...exitStop, ...hawaiiCities];

      } else if (hasSEAsia) {
        // SE Asia only (no Japan): Thailand N→S, Vietnam S→N
        const thaiCities = countryGroups['Thailand'] || [];
        const vietCities = countryGroups['Vietnam'] || [];
        const hawaiiCities = countryGroups['Hawaii'] || [];

        const thaiSorted = [...thaiCities].sort((a, b) =>
          (CITY_COORDS[b]?.[0] ?? 15) - (CITY_COORDS[a]?.[0] ?? 15)
        );
        const vietSorted = [...vietCities].sort((a, b) =>
          (CITY_COORDS[b]?.[0] ?? 15) - (CITY_COORDS[a]?.[0] ?? 15)
        );

        updatedRoute = [...thaiSorted, ...vietSorted, ...hawaiiCities];

      } else if (hasEurope) {
        // EUROPEAN LOOP: Nearest-neighbor starting from entry city
        const allCities = selectedCities.filter(c => CITY_COORDS[c]);
        const europeStart = ['Barcelona', 'Rome', 'Paris', 'Athens', 'Istanbul'].find(c => allCities.includes(c));
        const startCity = europeStart || allCities[0];

        const remaining = allCities.filter(c => c !== startCity);
        const loopRoute: string[] = [startCity];

        while (remaining.length > 0) {
          const lastCity = loopRoute[loopRoute.length - 1];
          let nearestIdx = 0;
          let nearestDist = Infinity;
          remaining.forEach((city, idx) => {
            const dist = calcDist(lastCity, city);
            if (dist < nearestDist) { nearestDist = dist; nearestIdx = idx; }
          });
          loopRoute.push(remaining.splice(nearestIdx, 1)[0]);
        }
        updatedRoute = loopRoute;

      } else {
        // Other trips: nearest-neighbor, Hawaii always last
        const allCities = selectedCities.filter(c => CITY_COORDS[c]);
        const hawaiiCities = countryGroups['Hawaii'] || [];
        const mainCities = allCities.filter(c => !hawaiiCities.includes(c));

        if (mainCities.length > 0) {
          const remaining = [...mainCities];
          const startCity = remaining.shift()!;
          const loopRoute: string[] = [startCity];

          while (remaining.length > 0) {
            const lastCity = loopRoute[loopRoute.length - 1];
            let nearestIdx = 0;
            let nearestDist = Infinity;
            remaining.forEach((city, idx) => {
              const dist = calcDist(lastCity, city);
              if (dist < nearestDist) { nearestDist = dist; nearestIdx = idx; }
            });
            loopRoute.push(remaining.splice(nearestIdx, 1)[0]);
          }
          updatedRoute = [...loopRoute, ...hawaiiCities];
        } else {
          updatedRoute = [...(countryGroups['Hawaii'] || [])];
        }
      }

      setRouteOrder(updatedRoute);
      setParkedCities(updatedParked);

      // Extract unique countries from selected cities (not just from destinations)
      const countriesFromCities = new Set<string>();
      updatedRoute.forEach(city => {
        const cityItem = items.find(i => i.name === city);
        // Get country from city tags - check against destinations first, then use any country-like tag
        const country = cityItem?.tags?.find(t => destinations.includes(t))
          || cityItem?.tags?.find(t => !['cities', 'hotels', 'restaurants', 'activities'].includes(t));
        if (country) countriesFromCities.add(country);
      });
      const uniqueCountries = Array.from(countriesFromCities);

      // Initialize country order geographically from Canada (Pacific route)
      // Order: Japan first (closest), then SE Asia, Hawaii last (on way home)
      if (uniqueCountries.length > 1 && countryOrder.length === 0) {
        const COUNTRY_ORDER_FROM_CANADA: Record<string, number> = {
          // Pacific route (flying west from Canada)
          'Japan': 1,      // First stop - 10hr from Vancouver
          'South Korea': 2,
          'Taiwan': 3,
          'Vietnam': 4,    // Further into SE Asia
          'Thailand': 5,
          'Cambodia': 6,
          'Malaysia': 7,
          'Singapore': 8,
          'Indonesia': 9,
          'Philippines': 10,
          'Australia': 11,
          'New Zealand': 12,
          'Hawaii': 20,    // On the way back to Canada
          // Atlantic route (flying east)
          'UK': 30,
          'France': 31,
          'Spain': 32,
          'Portugal': 33,
          'Italy': 34,
          'Greece': 35,
          'Turkey': 36,
          'Switzerland': 37,
          'Germany': 38,
        };
        const sortedCountries = [...uniqueCountries].sort((a, b) => {
          const orderA = COUNTRY_ORDER_FROM_CANADA[a] ?? 50;
          const orderB = COUNTRY_ORDER_FROM_CANADA[b] ?? 50;
          return orderA - orderB;
        });
        setCountryOrder(sortedCountries);
        // Also reorder the route by the geographic country order
        setTimeout(() => {
          const citiesByCountry: Record<string, string[]> = {};
          sortedCountries.forEach(c => { citiesByCountry[c] = []; });
          updatedRoute.forEach(city => {
            const cityItem = items.find(i => i.name === city);
            const country = cityItem?.tags?.find(t => sortedCountries.includes(t));
            if (country) citiesByCountry[country].push(city);
          });
          const geoOrderedRoute = sortedCountries.flatMap(c => citiesByCountry[c] || []);
          setRouteOrder(geoOrderedRoute);
        }, 0);
      } else if (countryOrder.length === 0) {
        // Use unique countries from cities, or fallback to destinations
        setCountryOrder(uniqueCountries.length > 0 ? uniqueCountries : [...destinations]);
      }
      // In controlled mode, save and notify parent instead of changing phase
      if (controlledPhase !== undefined) {
        onSave?.();
        return;
      }
      setPhase('route-planning');
      return;
    }

    if (currentStepIndex < PLANNING_STEPS.length - 1) {
      const nextStep = PLANNING_STEPS[currentStepIndex + 1];
      if (onSearchAI && selectedCities.length > 0) {
        const citiesQuery = routeOrder.length > 0 ? routeOrder.join(', ') : selectedCities.join(', ');
        onSearchAI(`best ${nextStep.id} in ${citiesQuery}`, nextStep.id);
      }
      setCurrentStepIndex(currentStepIndex + 1);
      setGridOffset(0); // Reset pagination
    } else {
      // Finished all steps, go to auto-generated itinerary
      setPhase('auto-itinerary');
    }
  };

  // Show more items in grid
  const showMoreItems = () => {
    const newOffset = gridOffset + currentStep.gridSize;
    if (newOffset < stepItems.length) {
      setGridOffset(newOffset);
    }
  };

  // Show previous items in grid
  const showPrevItems = () => {
    const newOffset = gridOffset - currentStep.gridSize;
    setGridOffset(Math.max(0, newOffset));
  };

  // Go to previous step
  const goToPrevStep = () => {
    if (phase === 'day-planning') {
      setPhase('auto-itinerary');
    } else if (phase === 'favorites-library') {
      setPhase('auto-itinerary');
    } else if (phase === 'auto-itinerary') {
      setPhase('route-planning');
    } else if (phase === 'route-planning') {
      setPhase('picking');
      setCurrentStepIndex(0); // Go back to cities step
      setGridOffset(0);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setGridOffset(0);
    }
  };

  // Confirm route and proceed to auto-generated itinerary
  const confirmRoute = () => {
    // Update selectedCities to match the route order
    const citiesToUse = routeOrder.length > 0 ? routeOrder : selectedCities;
    setSelectedCities([...citiesToUse]);
    if (routeOrder.length === 0 && selectedCities.length > 0) {
      setRouteOrder([...selectedCities]);
    }
    // In controlled mode (Trip Hub), don't navigate - just save and notify parent
    if (controlledPhase !== undefined) {
      onSave?.();
      return;
    }
    // Move to auto-itinerary phase (AI-generated itinerary)
    setPhase('auto-itinerary');
  };

  // Move city up in route order
  const moveCityUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...routeOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setRouteOrder(newOrder);
  };

  // Move city down in route order
  const moveCityDown = (index: number) => {
    if (index >= routeOrder.length - 1) return;
    const newOrder = [...routeOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setRouteOrder(newOrder);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCityIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCityIndex === null || draggedCityIndex === index) return;

    // Reorder in real-time as user drags
    const newOrder = [...routeOrder];
    const [draggedCity] = newOrder.splice(draggedCityIndex, 1);
    newOrder.splice(index, 0, draggedCity);
    setRouteOrder(newOrder);
    setDraggedCityIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedCityIndex(null);
  };

  // Reorder cities based on a specific country order
  const reorderByCountryOrder = (newCountryOrder: string[]) => {
    const citiesByCountry: Record<string, string[]> = {};
    newCountryOrder.forEach(c => { citiesByCountry[c] = []; });
    routeOrder.forEach(city => {
      // Use CITY_TO_COUNTRY mapping first, then fall back to tags
      let country: string | undefined = CITY_TO_COUNTRY[city];
      if (!country) {
        const cityItem = items.find(i => i.name === city);
        country = cityItem?.tags?.find(t => newCountryOrder.includes(t));
      }
      if (country && citiesByCountry[country]) {
        citiesByCountry[country].push(city);
      }
    });
    const newOrder = newCountryOrder.flatMap(country => citiesByCountry[country] || []);
    if (newOrder.length > 0) {
      setRouteOrder(newOrder);
    }
  };

  // Get country for a city - use CITY_TO_COUNTRY mapping first, then fall back to tags
  const getCityCountry = (cityName: string): string | undefined => {
    // First check the static mapping with exact name
    if (CITY_TO_COUNTRY[cityName]) {
      return CITY_TO_COUNTRY[cityName];
    }
    // Try with just the city part (before comma) for names like "Bangkok, Thailand"
    const cityOnly = cityName.split(',')[0].trim();
    if (cityOnly !== cityName && CITY_TO_COUNTRY[cityOnly]) {
      return CITY_TO_COUNTRY[cityOnly];
    }
    // Fall back to tags
    const cityItem = items.find(i => i.name === cityName || i.name === cityOnly);
    return cityItem?.tags?.find(t => destinations.includes(t));
  };

  // Add a stopover city to the route (defined at component level to avoid closure issues)
  const addStopoverCity = (city: string) => {
    setRouteOrder(prev => {
      // Allow duplicates for stopovers (e.g., Tokyo → Kyoto → Tokyo)
      if (prev.length === 0) return [city];
      return [prev[0], city, ...prev.slice(1)];
    });
    // selectedCities stays unique - just tracks which cities are in the trip
    setSelectedCities(prev => prev.includes(city) ? prev : [...prev, city]);
  };

  // Start day planning
  const startDayPlanning = () => {
    setPhase('day-planning');
  };

  // Request AI to load items
  const loadStepItems = () => {
    if (onSearchAI) {
      if (currentStep.id === 'cities') {
        // For cities, load from all destinations
        const query = destinations.length > 1
          ? `top cities to visit in ${destinations.join(' and ')}`
          : `top 10 cities to visit in ${destinations[0]}`;
        onSearchAI(query, 'cities');
      } else if (selectedCities.length > 0) {
        const citiesQuery = selectedCities.join(', ');
        onSearchAI(`best ${currentStep.id} in ${citiesQuery}`, currentStep.id);
      }
    }
  };

  // Check if item is a city
  const isCity = (item: PlanningItem) => item.tags?.includes('cities');

  // Get favorites organized by city, then category within each city
  const getFavoritesByCity = () => {
    // First, identify all cities from selected items or route
    const cities = routeOrder.length > 0 ? routeOrder : selectedCities;

    // Structure: { cityName: { hotels: [], restaurants: [], cafes: [], activities: [] } }
    const byCity: Record<string, {
      hotels: PlanningItem[];
      restaurants: PlanningItem[];
      cafes: PlanningItem[];
      activities: PlanningItem[];
    }> = {};

    // Initialize each city
    cities.forEach(city => {
      byCity[city] = { hotels: [], restaurants: [], cafes: [], activities: [] };
    });

    // Categorize non-city items by their city
    selectedItems.forEach(item => {
      // Skip city items
      if (item.tags?.includes('cities')) return;

      // Find which city this item belongs to (from tags or neighborhood)
      const itemCity = cities.find(city =>
        item.tags?.includes(city) || item.neighborhood === city
      );

      if (!itemCity) return; // Skip if no matching city

      // Add to appropriate category within the city
      if (item.tags?.includes('hotels') || item.category === 'hotels') {
        byCity[itemCity].hotels.push(item);
      } else if (item.tags?.includes('restaurants') || item.category === 'restaurants') {
        byCity[itemCity].restaurants.push(item);
      } else if (item.tags?.includes('cafes') || item.category === 'cafes') {
        byCity[itemCity].cafes.push(item);
      } else {
        byCity[itemCity].activities.push(item);
      }
    });

    return { cities, byCity };
  };

  // Calculate main planning stage for progress indicator (used across all phases)
  const getMainStage = () => {
    if (phase === 'route-planning') return 2;
    if (phase === 'auto-itinerary' || phase === 'favorites-library' || phase === 'day-planning') return 3;
    if (phase === 'picking' && currentStepIndex > 0) return 3;
    return 1; // Cities step
  };
  const mainStage = getMainStage();

  // Progress Stepper component - reusable across phases
  const ProgressStepper = ({ onCitiesClick, onRouteClick, onFavoritesClick }: {
    onCitiesClick: () => void;
    onRouteClick: () => void;
    onFavoritesClick: () => void;
  }) => (
    <div className="mb-3">
      <div className="flex items-center justify-center gap-0">
        {/* Step 1: Cities */}
        <button onClick={onCitiesClick} className="flex flex-col items-center w-20">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-0.5 transition-colors ${
            mainStage >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          } ${mainStage === 1 ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            1
          </div>
          <span className={`text-[10px] font-medium text-center transition-colors ${
            mainStage >= 1 ? 'text-primary' : 'text-muted-foreground'
          }`}>
            Cities
          </span>
        </button>

        {/* Connector 1-2 */}
        <div className={`h-0.5 w-8 -mx-1 rounded transition-colors ${
          mainStage > 1 ? 'bg-primary' : 'bg-muted'
        }`} />

        {/* Step 2: Route */}
        <button
          onClick={onRouteClick}
          disabled={selectedCities.length === 0}
          className="flex flex-col items-center w-20"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-0.5 transition-colors ${
            mainStage >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          } ${selectedCities.length === 0 ? 'opacity-50' : ''} ${mainStage === 2 ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            2
          </div>
          <span className={`text-[10px] font-medium text-center transition-colors ${
            mainStage >= 2 ? 'text-primary' : 'text-muted-foreground'
          } ${selectedCities.length === 0 ? 'opacity-50' : ''}`}>
            Route
          </span>
        </button>

        {/* Connector 2-3 */}
        <div className={`h-0.5 w-8 -mx-1 rounded transition-colors ${
          mainStage > 2 ? 'bg-primary' : 'bg-muted'
        }`} />

        {/* Step 3: Favorites */}
        <button
          onClick={onFavoritesClick}
          disabled={selectedCities.length === 0}
          className="flex flex-col items-center w-20"
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold mb-0.5 transition-colors ${
            mainStage >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          } ${selectedCities.length === 0 ? 'opacity-50' : ''} ${mainStage === 3 ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
            3
          </div>
          <span className={`text-[10px] font-medium text-center transition-colors ${
            mainStage >= 3 ? 'text-primary' : 'text-muted-foreground'
          } ${selectedCities.length === 0 ? 'opacity-50' : ''}`}>
            Favorites
          </span>
        </button>
      </div>
    </div>
  );

  // ============ AUTO ITINERARY PHASE ============
  if (phase === 'auto-itinerary') {
    // CRITICAL: Wait for IndexedDB to load before rendering AutoItineraryView
    // Otherwise it will generate defaults before savedAllocations arrives
    if (!persistenceLoaded) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      );
    }

    const citiesToUse = routeOrder.length > 0 ? routeOrder : selectedCities;

    return (
      <AutoItineraryView
        cities={citiesToUse}
        tripDna={tripDna}
        duration={duration}
        startDate={propStartDate}
        endDate={propEndDate}
        onBack={() => setPhase('route-planning')}
        getCityCountry={getCityCountry}
        onDatesChange={onDatesChange}
        initialAllocations={savedAllocations}
        onAllocationsChange={(newAllocations) => {
          // CRITICAL: Don't overwrite saved allocations with empty array
          if (newAllocations.length === 0) {
            debug('[SwipeablePlanning] Ignoring empty allocations from child');
            return;
          }
          debug('[SwipeablePlanning] Accepting allocations from child:', newAllocations.map(a => `${a.city}:${a.nights}`));
          setSavedAllocations(newAllocations);
        }}
        initialGeneratedDays={savedGeneratedDays}
        onGeneratedDaysChange={(newDays) => {
          debug('[SwipeablePlanning] Accepting generatedDays from child:', newDays.length, 'days');
          setSavedGeneratedDays(newDays);
        }}
        parentLoadComplete={persistenceLoaded}
        onSave={onSave}
      />
    );
  }

  // ============ FAVORITES LIBRARY PHASE ============
  if (phase === 'favorites-library') {
    const { cities: favCities, byCity } = getFavoritesByCity();

    // Count total favorites (excluding city items)
    const totalFavorites = selectedItems.filter(i => !i.tags?.includes('cities')).length;

    // Get all items for a city (for the modal)
    const getCityAllItems = (cityName: string, category: 'hotels' | 'restaurants' | 'cafes' | 'activities') => {
      return items.filter(item => {
        const matchesCity = item.tags?.includes(cityName) || item.neighborhood === cityName;
        const matchesCategory = category === 'hotels' ? (item.tags?.includes('hotels') || item.category === 'hotels') :
                               category === 'restaurants' ? (item.tags?.includes('restaurants') || item.category === 'restaurants') :
                               category === 'cafes' ? (item.tags?.includes('cafes') || item.category === 'cafes') :
                               (!item.tags?.includes('cities') && !item.tags?.includes('hotels') && !item.tags?.includes('restaurants') && !item.tags?.includes('cafes'));
        return matchesCity && matchesCategory;
      });
    };

    // Modal city data
    const modalCity = favoriteCityModal;
    const modalCityItem = modalCity ? items.find(i => i.name === modalCity && i.tags?.includes('cities')) : null;
    const modalCityCountry = modalCity ? getCityCountry(modalCity) : null;
    const modalCityFavs = modalCity ? byCity[modalCity] : null;

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-lg font-bold">{destinations.length === 1 ? destinations[0] : 'Trip'} Overview</h2>
            <p className="text-sm text-muted-foreground">
              {totalFavorites} favorites across {favCities.length} {favCities.length === 1 ? 'city' : 'cities'}
            </p>
          </div>
        </div>

        {/* Cities organized by country */}
        <div className="space-y-4">
          {(() => {
            // Group cities by country
            const citiesByCountry: Record<string, string[]> = {};
            favCities.forEach(city => {
              const country = getCityCountry(city) || 'Other';
              if (!citiesByCountry[country]) citiesByCountry[country] = [];
              citiesByCountry[country].push(city);
            });

            // Sort countries by destination order
            const sortedCountries = Object.keys(citiesByCountry).sort((a, b) => {
              const idxA = destinations.indexOf(a);
              const idxB = destinations.indexOf(b);
              if (idxA === -1 && idxB === -1) return 0;
              if (idxA === -1) return 1;
              if (idxB === -1) return -1;
              return idxA - idxB;
            });

            return sortedCountries.map((country) => {
              const countryCities = citiesByCountry[country];
              const totalCountryNights = countryCities.reduce((sum, city) => sum + (RECOMMENDED_NIGHTS[city] || 2), 0);

              return (
                <div key={country} className="bg-muted/20 rounded-xl overflow-hidden">
                  {/* Country header */}
                  <div className="bg-primary/10 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-semibold">{country}</span>
                      <span className="text-xs text-muted-foreground">({countryCities.length} {countryCities.length === 1 ? 'city' : 'cities'})</span>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                      ~{totalCountryNights} nights
                    </span>
                  </div>

                  {/* Cities in this country */}
                  <div className="p-2 space-y-2">
                    {countryCities.map((city) => {
                      const cityFavs = byCity[city];
                      const cityItem = items.find(i => i.name === city && i.tags?.includes('cities'));
                      const recommendedNights = RECOMMENDED_NIGHTS[city] || 2;
                      const totalCityFavs = cityFavs.hotels.length + cityFavs.restaurants.length +
                                            cityFavs.cafes.length + cityFavs.activities.length;

                      return (
                        <div
                          key={city}
                          className="bg-background rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors active:scale-[0.99]"
                          onClick={() => {
                            setFavoriteCityModal(city);
                            setFavoriteCityTab('hotels');
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* City image */}
                            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                              {cityItem?.imageUrl ? (
                                <CityImage src={cityItem.imageUrl} alt={city} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                                  <Building2 className="w-5 h-5 text-primary" />
                                </div>
                              )}
                            </div>

                            {/* City info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-sm">{city}</h3>
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                                  {recommendedNights} {recommendedNights === 1 ? 'night' : 'nights'}
                                </span>
                              </div>

                              {/* Favorites summary chips */}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {cityFavs.hotels.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">
                                    <Hotel className="w-2.5 h-2.5" /> {cityFavs.hotels.length}
                                  </span>
                                )}
                                {cityFavs.restaurants.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-medium">
                                    <UtensilsCrossed className="w-2.5 h-2.5" /> {cityFavs.restaurants.length}
                                  </span>
                                )}
                                {cityFavs.cafes.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">
                                    <Coffee className="w-2.5 h-2.5" /> {cityFavs.cafes.length}
                                  </span>
                                )}
                                {cityFavs.activities.length > 0 && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                                    <Ticket className="w-2.5 h-2.5" /> {cityFavs.activities.length}
                                  </span>
                                )}
                                {totalCityFavs === 0 && (
                                  <span className="text-[10px] text-muted-foreground">Tap to add favorites</span>
                                )}
                              </div>
                            </div>

                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            });
          })()}
        </div>

        {/* Empty state */}
        {favCities.length === 0 && (
          <div className="py-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No cities selected yet</p>
            <p className="text-xs text-muted-foreground mt-1">Go back to pick your cities</p>
          </div>
        )}

        {/* Start Day Planning button */}
        {totalFavorites > 0 && (
          <Button className="w-full" size="lg" onClick={startDayPlanning}>
            <Calendar className="w-4 h-4 mr-2" />
            Plan Your {duration} Days
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {/* City Favorites Modal */}
        <Dialog open={!!favoriteCityModal} onOpenChange={(open) => !open && setFavoriteCityModal(null)}>
          <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                  {modalCityItem?.imageUrl ? (
                    <CityImage src={modalCityItem.imageUrl} alt={modalCity || ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <DialogTitle>{modalCity}</DialogTitle>
                  {modalCityCountry && (
                    <p className="text-sm text-muted-foreground">{modalCityCountry}</p>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Category tabs */}
            <div className="flex gap-1 border-b pb-2 flex-shrink-0">
              {[
                { id: 'hotels' as const, icon: Hotel, label: 'Hotels', activeBg: 'bg-purple-100', activeText: 'text-purple-700', countBg: 'bg-purple-200' },
                { id: 'restaurants' as const, icon: UtensilsCrossed, label: 'Food', activeBg: 'bg-orange-100', activeText: 'text-orange-700', countBg: 'bg-orange-200' },
                { id: 'cafes' as const, icon: Coffee, label: 'Cafes', activeBg: 'bg-amber-100', activeText: 'text-amber-700', countBg: 'bg-amber-200' },
                { id: 'activities' as const, icon: Ticket, label: 'Activities', activeBg: 'bg-green-100', activeText: 'text-green-700', countBg: 'bg-green-200' },
              ].map(tab => {
                const count = modalCityFavs ? modalCityFavs[tab.id].length : 0;
                const isActive = favoriteCityTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFavoriteCityTab(tab.id)}
                    className={`flex-1 flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-colors ${
                      isActive ? `${tab.activeBg} ${tab.activeText}` : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="text-[10px] font-medium">{tab.label}</span>
                    {count > 0 && (
                      <span className={`text-[9px] px-1.5 rounded-full ${isActive ? tab.countBg : 'bg-muted'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Items grid */}
            <div className="flex-1 overflow-y-auto py-2 min-h-[200px]">
              {modalCity && (() => {
                const allItems = getCityAllItems(modalCity, favoriteCityTab);
                const favoriteIds = new Set(selectedItems.map(i => i.id));
                const hotelFavoriteIds = new Set(
                  items.filter(i => i.tags?.includes('hotels')).map(i => i.id)
                );

                // Show HotelPicker for hotels tab when no hotels loaded
                if (allItems.length === 0 && favoriteCityTab === 'hotels') {
                  // Build hotel preferences from tripDna
                  const hotelPreferences = {
                    partyType: tripDna.travelerProfile.partyType as 'solo' | 'couple' | 'family' | 'friends',
                    accommodationStyle: tripDna.constraints.accommodation.style as 'luxury' | 'boutique' | 'practical' | 'budget',
                    accommodationPriority: tripDna.constraints.accommodation.priority as 'location' | 'comfort' | 'value',
                    budgetPerNight: tripDna.constraints.budget.accommodationRange,
                    interests: tripDna.interests.hobbies,
                  };

                  // Get favorited activities in this city for proximity matching
                  const cityActivities = modalCityFavs?.activities.map(a => a.name) || [];

                  return (
                    <HotelPicker
                      city={modalCity}
                      country={modalCityCountry || undefined}
                      favoriteHotelIds={hotelFavoriteIds}
                      preferences={hotelPreferences}
                      nearbyActivities={cityActivities.length > 0 ? cityActivities : undefined}
                      onSelectHotel={(hotel: HotelInfo) => {
                        // Convert hotel to PlanningItem and add to items
                        const hotelItem: PlanningItem = {
                          id: hotel.id,
                          name: hotel.name,
                          description: hotel.description,
                          imageUrl: hotel.imageUrl,
                          category: 'hotels',
                          priceInfo: hotel.pricePerNight,
                          rating: hotel.rating,
                          neighborhood: hotel.neighborhood,
                          tags: ['hotels', modalCity],
                          isFavorited: true,
                        };
                        // Add hotel to items (already marked as favorited)
                        onItemsChange([...items, hotelItem]);
                        // Add to selectedIds set so it appears in favorites
                        setSelectedIds(prev => new Set([...prev, hotelItem.id]));
                      }}
                    />
                  );
                }

                if (allItems.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No {favoriteCityTab} loaded for {modalCity}</p>
                      <p className="text-xs mt-1">Go back to the picking phase to load options</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 gap-2">
                    {allItems.map(item => {
                      const isFavorited = favoriteIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                            isFavorited ? 'ring-2 ring-primary ring-offset-1' : 'hover:opacity-90'
                          }`}
                          onClick={() => toggleSelect(item.id, item.name)}
                        >
                          <div className="aspect-square">
                            <CityImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-1.5">
                            <p className="text-[10px] font-medium text-white line-clamp-2">{item.name}</p>
                            {item.priceInfo && (
                              <p className="text-[9px] text-white/80">{item.priceInfo}</p>
                            )}
                          </div>
                          {isFavorited && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal footer */}
            <div className="flex-shrink-0 pt-2 border-t">
              <Button className="w-full" onClick={() => setFavoriteCityModal(null)}>
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ============ ROUTE PLANNING PHASE ============
  if (phase === 'route-planning') {
    // Group cities by country
    const citiesByCountry: Record<string, { city: string; item?: PlanningItem }[]> = {};
    destinations.forEach(dest => { citiesByCountry[dest] = []; });
    routeOrder.forEach(city => {
      const cityItem = items.find(i => i.name === city && i.tags?.includes('cities'));
      const country = cityItem?.tags?.find(t => destinations.includes(t)) || destinations[0];
      if (!citiesByCountry[country]) citiesByCountry[country] = [];
      citiesByCountry[country].push({ city, item: cityItem });
    });

    // Calculate total distance and check for inefficient routes
    let totalDistance = 0;
    let hasInefficiency = false;
    const routeDistances: { from: string; to: string; distance: number | null; isLong: boolean }[] = [];

    for (let i = 0; i < routeOrder.length - 1; i++) {
      const from = routeOrder[i];
      const to = routeOrder[i + 1];
      const distance = calculateDistance(from, to);
      const isLong = distance !== null && distance > 400;
      routeDistances.push({ from, to, distance, isLong });
      if (distance) totalDistance += distance;

      // Check for backtracking within same country
      if (i < routeOrder.length - 2) {
        const nextCity = routeOrder[i + 2];
        const fromCountry = getCityCountry(from);
        const toCountry = getCityCountry(to);
        const nextCountry = getCityCountry(nextCity);

        // If we go A → B → C where A and C are close but B is far
        if (fromCountry === toCountry && toCountry === nextCountry) {
          const distAtoC = calculateDistance(from, nextCity);
          const distAtoB = calculateDistance(from, to);
          if (distAtoC && distAtoB && distAtoC < distAtoB * 0.5) {
            hasInefficiency = true;
          }
        }
      }
    }

    // Optimize route function - nearest neighbor algorithm within each country
    const optimizeRoute = () => {
      console.log('[OptimizeRoute] Starting optimization...');
      console.log('[OptimizeRoute] routeOrder:', routeOrder);
      console.log('[OptimizeRoute] selectedCities:', selectedCities);
      console.log('[OptimizeRoute] countryOrder:', countryOrder);
      console.log('[OptimizeRoute] destinations:', destinations);

      // Use routeOrder if available, otherwise fall back to selectedCities
      const citiesToOptimize = routeOrder.length > 0 ? routeOrder : selectedCities;
      console.log('[OptimizeRoute] citiesToOptimize:', citiesToOptimize);

      if (citiesToOptimize.length === 0) {
        console.log('[OptimizeRoute] No cities to optimize - aborting');
        return;
      }

      const optimizedOrder: string[] = [];
      const countryGroups: Record<string, string[]> = {};
      const countryNameMap: Record<string, string> = {}; // lowercase -> actual name
      const processedCountries = new Set<string>();

      // Group cities by country (case-insensitive key storage)
      citiesToOptimize.forEach(city => {
        const country = getCityCountry(city) || 'Unknown';
        const countryLower = country.toLowerCase();
        debug(`[OptimizeRoute] City "${city}" -> Country "${country}"`);
        if (!countryGroups[countryLower]) {
          countryGroups[countryLower] = [];
          countryNameMap[countryLower] = country;
        }
        countryGroups[countryLower].push(city);
      });

      debug('[OptimizeRoute] countryGroups:', countryGroups);

      // Helper to optimize cities within a group using nearest neighbor
      const optimizeCityGroup = (cities: string[]): string[] => {
        if (cities.length <= 1) return cities;

        const remaining = [...cities];
        const optimized: string[] = [remaining.shift()!];

        while (remaining.length > 0) {
          const lastCity = optimized[optimized.length - 1];
          let nearestIdx = 0;
          let nearestDist = Infinity;

          remaining.forEach((city, idx) => {
            const dist = calculateDistance(lastCity, city);
            if (dist !== null && dist < nearestDist) {
              nearestDist = dist;
              nearestIdx = idx;
            }
          });

          optimized.push(remaining.splice(nearestIdx, 1)[0]);
        }
        return optimized;
      };

      // For each country in countryOrder, optimize the cities within (case-insensitive)
      const orderedCountries = countryOrder.length > 0 ? countryOrder : destinations;
      debug('[OptimizeRoute] orderedCountries:', orderedCountries);

      orderedCountries.forEach(country => {
        const countryLower = country.toLowerCase();
        const cities = countryGroups[countryLower] || [];
        debug(`[OptimizeRoute] Processing "${country}" (${countryLower}) -> cities:`, cities);
        if (cities.length > 0) {
          const optimized = optimizeCityGroup(cities);
          debug(`[OptimizeRoute] Optimized "${country}":`, optimized);
          optimizedOrder.push(...optimized);
          processedCountries.add(countryLower);
        }
      });

      // Include any cities from countries not in orderedCountries (prevent losing cities)
      debug('[OptimizeRoute] processedCountries:', Array.from(processedCountries));
      debug('[OptimizeRoute] countryGroups keys:', Object.keys(countryGroups));

      Object.keys(countryGroups).forEach(countryLower => {
        if (!processedCountries.has(countryLower)) {
          debug(`[OptimizeRoute] Unprocessed country "${countryLower}" - adding cities:`, countryGroups[countryLower]);
          optimizedOrder.push(...optimizeCityGroup(countryGroups[countryLower]));
        }
      });

      console.log('[OptimizeRoute] Final optimizedOrder:', optimizedOrder);
      console.log('[OptimizeRoute] Original order was:', citiesToOptimize);

      // Only update if we have cities (prevent clearing the route)
      if (optimizedOrder.length > 0) {
        console.log('[OptimizeRoute] Setting new route order');
        setRouteOrder(optimizedOrder);
      } else {
        console.log('[OptimizeRoute] No cities to set - skipping');
      }
    };

    return (
      <div className="space-y-4">
        {/* Backdrop to close dropdown when clicking outside */}
        {insertAtIndex !== null && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setInsertAtIndex(null)}
          />
        )}

        {/* Progress Stepper: Cities → Route → Favorites (hide when externally controlled) */}
        {controlledPhase === undefined && (
          <ProgressStepper
            onCitiesClick={() => { setPhase('picking'); setCurrentStepIndex(0); setGridOffset(0); }}
            onRouteClick={() => {}}
            onFavoritesClick={confirmRoute}
          />
        )}

        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              Plan Your Route
            </h2>
            <p className="text-sm text-muted-foreground">
              Drag to reorder your travel path
            </p>
          </div>
        </div>

        {/* Route Map */}
        {routeOrder.length > 0 && (
          <RouteMap
            cities={['Kelowna', ...routeOrder]}
            getCityCountry={getCityCountry}
            calculateDistance={calculateDistance}
          />
        )}

        {/* Route efficiency warning */}
        {hasInefficiency && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
            <div className="text-amber-600 text-sm flex-1">
              Your route has some backtracking. Nearby cities are separated.
            </div>
            <Button size="sm" variant="outline" onClick={optimizeRoute} className="text-amber-700 border-amber-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Optimize
            </Button>
          </div>
        )}

        {/* Route Preferences */}
        <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-600" />
            Route Options
          </h3>
          <div className="space-y-3">
            {/* Country order - drag and drop */}
            {countryOrder.length > 1 && (
              <div className="pb-3 border-b">
                <div className="text-xs text-muted-foreground mb-2">Country order (drag to reorder)</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {countryOrder.map((country, idx) => (
                    <div key={country} className="flex items-center gap-1">
                      <div
                        draggable
                        onDragStart={() => setDraggedCountryIndex(idx)}
                        onDragEnd={() => {
                          // Reorder cities based on the new country order
                          if (draggedCountryIndex !== null) {
                            reorderByCountryOrder(countryOrder);
                          }
                          setDraggedCountryIndex(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedCountryIndex !== null && draggedCountryIndex !== idx) {
                            const newOrder = [...countryOrder];
                            const [dragged] = newOrder.splice(draggedCountryIndex, 1);
                            newOrder.splice(idx, 0, dragged);
                            setCountryOrder(newOrder);
                            setDraggedCountryIndex(idx);
                          }
                        }}
                        className={`px-3 py-1.5 bg-white rounded-lg font-medium text-xs border cursor-grab active:cursor-grabbing flex items-center gap-1.5 transition-all ${
                          draggedCountryIndex === idx ? 'opacity-50 scale-95 border-primary' : 'hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        <GripVertical className="w-3 h-3 text-muted-foreground" />
                        {country}
                        {idx === 0 && <span className="text-[10px] text-primary">(1st)</span>}
                      </div>
                      {idx < countryOrder.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shortest flights toggle */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs">Shortest flight routes</span>
              <button
                onClick={() => setRoutePrefs(p => ({ ...p, shortestFlights: !p.shortestFlights }))}
                className={`w-10 h-5 rounded-full transition-colors ${routePrefs.shortestFlights ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${routePrefs.shortestFlights ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </label>

            {/* Max stops */}
            <div className="flex items-center justify-between">
              <span className="text-xs">Max stops per flight</span>
              <div className="flex gap-1">
                {[0, 1, 2].map(n => (
                  <button
                    key={n}
                    onClick={() => setRoutePrefs(p => ({ ...p, maxStops: n }))}
                    className={`px-2 py-1 text-xs rounded ${routePrefs.maxStops === n ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {n === 0 ? 'Direct' : n === 1 ? '1 stop' : 'Any'}
                  </button>
                ))}
              </div>
            </div>

            {/* Max flights per day */}
            <div className="flex items-center justify-between">
              <span className="text-xs">Max flights per day</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(n => (
                  <button
                    key={n}
                    onClick={() => setRoutePrefs(p => ({ ...p, maxFlightsPerDay: n }))}
                    className={`px-2 py-1 text-xs rounded ${routePrefs.maxFlightsPerDay === n ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Max flight duration - slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs">Max flight duration</span>
                <span className="text-xs font-medium">{routePrefs.maxFlightHours}hr</span>
              </div>
              <input
                type="range"
                min="4"
                max="24"
                step="1"
                value={routePrefs.maxFlightHours}
                onChange={(e) => setRoutePrefs(p => ({ ...p, maxFlightHours: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>4hr</span>
                <span>24hr</span>
              </div>
            </div>
          </div>

          {/* Warning if preferences conflict */}
          {routePrefs.maxStops === 0 && routeOrder.some(city => {
            const flight = getFlightData('Kelowna', city);
            return flight && flight.stops > 0;
          }) && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Some routes require connections - no direct flights available
            </p>
          )}
        </div>

        {/* Optimize Route Button - after options */}
        <Button
          variant="outline"
          size="sm"
          onClick={optimizeRoute}
          className="w-full"
        >
          <Zap className="w-3.5 h-3.5 mr-1.5" />
          Optimize Route
        </Button>

        {/* Route visualization */}
        <div className="space-y-2">
          {/* Home airport - starting point */}
          {routeOrder.length > 0 && (
            <>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-200">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                  <Plane className="w-4 h-4" />
                </div>
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-orange-100 flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-orange-800">Kelowna (YLW)</div>
                  <div className="text-xs text-orange-600">Your home base</div>
                </div>
              </div>
              {/* Flight connector to first city */}
              {(() => {
                const firstCity = routeOrder[0];
                const firstCountry = getCityCountry(firstCity) || '';
                const routingOptions = getRoutingOptions(firstCountry);
                const recommendedRoute = getRecommendedRoute(firstCountry);
                const flightInfo = getFlightInfo('Kelowna', firstCity);
                const isExpanded = expandedTransport === -1; // Use -1 for home connector

                // Use routing data if available, otherwise fall back to flightInfo
                const displayStops = recommendedRoute?.stops ?? flightInfo.stops ?? 2;
                const displayTime = recommendedRoute?.totalTime || flightInfo.time || '20-24hr';
                const exceedsMaxStops = displayStops > (routePrefs.maxStops || 1);

                const transportColor = displayStops === 0 ? 'text-green-600' : displayStops === 1 ? 'text-amber-600' : 'text-red-600';
                const barColor = displayStops === 0 ? 'bg-green-400' : displayStops === 1 ? 'bg-amber-400' : 'bg-red-400';

                return (
                  <div className="pl-[1.25rem]">
                    <div className="flex items-start gap-2">
                      <div className={`w-0.5 ${isExpanded ? 'h-auto min-h-[4rem]' : 'h-8'} ${barColor}`} />
                      <div className="flex-1 py-1">
                        {/* Clickable transport summary */}
                        <button
                          onClick={() => setExpandedTransport(isExpanded ? null : -1)}
                          className={`flex items-center gap-1.5 text-xs ${transportColor} hover:opacity-80 transition-opacity`}
                        >
                          <Plane className="w-3.5 h-3.5" />
                          <span className="font-medium">
                            Flight to {firstCity} · {displayTime}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            displayStops === 0 ? 'bg-green-100 text-green-700' :
                            displayStops === 1 ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {displayStops === 0 ? 'direct' : `${displayStops} stops`}
                          </span>
                          {exceedsMaxStops && (
                            <span className="text-amber-500">⚠️</span>
                          )}
                          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Expanded details dropdown */}
                        {isExpanded && (
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs space-y-3">
                            {/* Warning if exceeds max stops */}
                            {exceedsMaxStops && (
                              <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                                <span className="text-base">⚠️</span>
                                <span>Exceeds your max {routePrefs.maxStops || 1} stop preference</span>
                              </div>
                            )}

                            {/* Route options */}
                            {routingOptions.length > 0 ? (
                              <div className="space-y-2">
                                <div className="text-muted-foreground font-medium">Route Options:</div>
                                {routingOptions.map((route) => {
                                  // Check if this route is selected (explicit selection or default to recommended)
                                  const isSelected = selectedRouteId
                                    ? selectedRouteId === route.id
                                    : route.recommended;

                                  return (
                                    <button
                                      key={route.id}
                                      onClick={() => {
                                        // Just select this route option - user clicks the badge to add stopovers
                                        setSelectedRouteId(route.id);
                                      }}
                                      className={`w-full text-left p-2 rounded-lg border transition-all ${
                                        isSelected
                                          ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                                          : 'border-muted hover:border-primary/30 hover:bg-primary/5'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium flex items-center gap-1">
                                          {route.recommended && <span className="text-primary">★</span>}
                                          {route.label}
                                        </span>
                                        <span className="text-muted-foreground">{route.totalTime}</span>
                                      </div>

                                      {/* Segment breakdown - use actual firstCity as final destination */}
                                      <div className="text-[10px] text-muted-foreground mb-2">
                                        {route.segments.map((seg, i) => {
                                          // Replace the final segment's destination with the actual first city
                                          const isLastSegment = i === route.segments.length - 1;
                                          const to = isLastSegment ? firstCity : seg.to;
                                          return (
                                            <span key={i}>
                                              {seg.from} → {to} ({seg.time})
                                              {i < route.segments.length - 1 && ' · '}
                                            </span>
                                          );
                                        })}
                                      </div>

                                      {/* Connection cities - clickable to add as stopover */}
                                      <div className="flex flex-wrap gap-1">
                                        {route.connections.filter(c => c !== 'Vancouver' && c !== 'Seattle').map((city) => (
                                          <button
                                            key={city}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              // Add city as #1 stop (first position in route)
                                              // Don't remove existing instances - user may want to visit twice
                                              setRouteOrder(prev => [city, ...prev]);
                                              setSelectedCities(prev =>
                                                prev.includes(city) ? prev : [...prev, city]
                                              );
                                            }}
                                            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer transition-colors"
                                          >
                                            + Add {city} stopover
                                          </button>
                                        ))}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Route</span>
                                  <span className="font-medium">Kelowna → {firstCity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Est. time</span>
                                  <span className="font-medium">{displayTime}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Connections</span>
                                  <span className={`font-medium ${transportColor}`}>
                                    {displayStops === 0 ? 'Direct flight' :
                                     displayStops === 1 ? '1 connection' :
                                     `${displayStops} connections`}
                                  </span>
                                </div>
                              </>
                            )}

                            <a
                              href={flightInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1 mt-2 py-2 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
                            >
                              Search flights on Google
                              <ArrowRight className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          {routeOrder.map((city, index) => {
            const cityItem = items.find(i => i.name === city && i.tags?.includes('cities'));
            const country = getCityCountry(city);
            const isLastInCountry = index < routeOrder.length - 1 && getCityCountry(routeOrder[index + 1]) !== country;
            const routeInfo = routeDistances[index];

            // Get available cities to insert - include cities from routeOrder for stopovers (allow duplicates like Tokyo → Kyoto → Tokyo)
            const uniqueRouteCities = [...new Set(routeOrder)];
            const availableCities = [
              ...parkedCities,
              ...uniqueRouteCities.filter(c => !parkedCities.includes(c)),
              ...selectedCities.filter(c => !parkedCities.includes(c) && !uniqueRouteCities.includes(c))
            ];

            return (
              <div key={`${city}-${index}`}>
                {/* Insert button before first city */}
                {index === 0 && (
                  <div className="group relative py-1">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setInsertAtIndex(insertAtIndex === 0 ? null : 0)}
                        className="w-6 h-6 rounded-full bg-muted hover:bg-primary hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-muted-foreground"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {/* Dropdown for inserting city at position 0 */}
                    {insertAtIndex === 0 && availableCities.length > 0 && (
                      <div className="absolute left-1/2 -translate-x-1/2 top-8 z-50 bg-background border rounded-lg shadow-lg p-2 min-w-[200px]">
                        <div className="text-xs text-muted-foreground mb-2">Add city here:</div>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {availableCities.map((c, i) => (
                            <button
                              key={`${c}-${i}`}
                              onClick={() => {
                                setRouteOrder(prev => [c, ...prev]);
                                setParkedCities(prev => prev.filter(p => p !== c));
                                setInsertAtIndex(null);
                              }}
                              className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded"
                            >
                              {c} {routeOrder.includes(c) && <span className="text-xs text-muted-foreground">(return)</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* City card - Draggable */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => { e.preventDefault(); handleDragEnd(); }}
                  onMouseUp={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-background rounded-xl border cursor-grab active:cursor-grabbing transition-all ${
                    draggedCityIndex === index ? 'opacity-50 scale-95 shadow-lg' : ''
                  }`}
                >
                  {/* Drag handle */}
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                  {/* Order number */}
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* City image */}
                  {cityItem?.imageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <CityImage src={cityItem.imageUrl} alt={city} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* City info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{city}</div>
                    <div className="text-xs text-muted-foreground">
                      {getCityRegion(city) || country}
                      {getCityRouteTip(city) && (
                        <span className="text-primary/70 ml-1">· {getCityRouteTip(city)}</span>
                      )}
                    </div>
                  </div>

                  {/* Remove from route button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Move to parked cities (only if not already there)
                      setParkedCities(prev => prev.includes(city) ? prev : [...prev, city]);
                      // Remove only THIS instance (by index), not all instances of the city
                      setRouteOrder(prev => [...prev.slice(0, index), ...prev.slice(index + 1)]);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Connector with distance/flight time */}
                {index < routeOrder.length - 1 && (() => {
                  const nextCity = routeOrder[index + 1];
                  const flightInfo = getFlightInfo(city, nextCity);
                  const distance = routeInfo?.distance || 0;
                  const isExpanded = expandedTransport === index;
                  const isCrossCountry = isLastInCountry;

                  // Get transport options (Rome2Rio style)
                  const transportOpts = getTransportOptions(city, nextCity) ||
                    estimateTransportOptions(distance, isCrossCountry);

                  // Get the "best" option (has badge or first one)
                  const bestOption = transportOpts.find(o => o.badge === 'best') ||
                    transportOpts.find(o => o.badge === 'fastest') ||
                    transportOpts[0];

                  // Determine transport type based on distance and country
                  const isFlight = isCrossCountry || distance > 400;
                  const isTrain = !isCrossCountry && distance > 150 && distance <= 400;

                  // Transport mode label and icon color
                  const transportMode = bestOption?.mode || (isFlight ? 'flight' : isTrain ? 'train' : 'bus');
                  const transportTime = bestOption?.duration || flightInfo.time;
                  const transportColor = isFlight
                    ? (flightInfo.stops === 0 ? 'text-green-600' : flightInfo.stops === 1 ? 'text-amber-600' : 'text-red-600')
                    : 'text-blue-600';
                  const barColor = isFlight
                    ? (flightInfo.stops === 0 ? 'bg-green-400' : flightInfo.stops === 1 ? 'bg-amber-400' : 'bg-red-400')
                    : 'bg-blue-400';

                  return (
                    <div className="group/connector relative">
                      {/* Insert city button - centered, shows on hover */}
                      <div className="absolute -top-1 left-0 right-0 flex justify-center z-10">
                        <button
                          onClick={() => setInsertAtIndex(insertAtIndex === index + 1 ? null : index + 1)}
                          className="w-6 h-6 rounded-full bg-muted hover:bg-primary hover:text-white flex items-center justify-center opacity-0 group-hover/connector:opacity-100 transition-all text-muted-foreground"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="pl-[1.25rem]">
                      {/* Insert dropdown */}
                      {insertAtIndex === index + 1 && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-6 z-50 bg-background border rounded-lg shadow-lg p-2 min-w-[200px]">
                          <div className="text-xs text-muted-foreground mb-2">Add city here:</div>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {/* Show all cities in route - allow duplicates for stopovers (e.g., Tokyo → Kyoto → Tokyo) */}
                            {availableCities.map((c, i) => (
                              <button
                                key={`${c}-${i}`}
                                onClick={() => {
                                  setRouteOrder(prev => [...prev.slice(0, index + 1), c, ...prev.slice(index + 1)]);
                                  setParkedCities(prev => prev.filter(p => p !== c));
                                  setInsertAtIndex(null);
                                }}
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted rounded"
                              >
                                {c} {routeOrder.includes(c) && <span className="text-xs text-muted-foreground">(return)</span>}
                              </button>
                            ))}
                            {availableCities.length === 0 && (
                              <div className="text-xs text-muted-foreground py-2 text-center">No cities available</div>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <div className={`w-0.5 ${isExpanded ? 'h-auto min-h-[6rem]' : 'h-8'} ${barColor}`} />
                        <div className="flex-1 py-1">
                          {/* Clickable transport summary */}
                          <button
                            onClick={() => setExpandedTransport(isExpanded ? null : index)}
                            className={`flex items-center gap-1.5 text-xs ${transportColor} hover:opacity-80 transition-opacity`}
                          >
                            <span className="text-sm">{TRANSPORT_ICONS[transportMode] || '🚌'}</span>
                            <span className="font-medium">
                              {distance > 0 ? `${distance} km` : ''} · {transportTime || 'See options'}
                              {flightInfo.stops && flightInfo.stops > 0 && (() => {
                                const hubs = getHubConnections(city, nextCity);
                                if (hubs.length > 1) return ` via ${hubs.join(' or ')}`;
                                if (hubs.length === 1) return ` via ${hubs[0]}`;
                                return ` · ${flightInfo.stops} stop${flightInfo.stops > 1 ? 's' : ''}`;
                              })()}
                            </span>
                            {bestOption?.badge && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                bestOption.badge === 'best' ? 'bg-green-100 text-green-700' :
                                bestOption.badge === 'fastest' ? 'bg-blue-100 text-blue-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {bestOption.badge.toUpperCase()}
                              </span>
                            )}
                            {transportOpts.length > 1 && (
                              <span className="text-muted-foreground">+{transportOpts.length - 1} more</span>
                            )}
                            <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Expanded details dropdown - Rome2Rio style */}
                          {isExpanded && (() => {
                            // Get transport options from our data or estimate
                            const transportOptions = getTransportOptions(city, nextCity) ||
                              estimateTransportOptions(distance, isCrossCountry);

                            // Determine if this is SE Asia (for 12Go link)
                            const seAsiaCountries = ['Thailand', 'Vietnam', 'Cambodia', 'Laos', 'Myanmar', 'Malaysia', 'Indonesia'];
                            const isSEAsia = seAsiaCountries.includes(getCityCountry(city) || '') ||
                                            seAsiaCountries.includes(getCityCountry(nextCity) || '');

                            return (
                              <div className="mt-2 space-y-2">
                                {/* Header */}
                                <div className="px-3 py-2 bg-muted/30 rounded-t-lg border-b">
                                  <div className="font-medium text-sm">{transportOptions.length} ways to travel</div>
                                  <div className="text-xs text-muted-foreground">{city} → {nextCity} · {distance > 0 ? `${distance} km` : ''}</div>
                                </div>

                                {/* Transport options list - clickable to select */}
                                <div className="space-y-1.5">
                                  {transportOptions.map((option, optIdx) => {
                                    const isSelected = selectedTransport[index]?.mode === option.mode;
                                    return (
                                    <button
                                      key={optIdx}
                                      onClick={() => setSelectedTransport(prev => ({
                                        ...prev,
                                        [index]: { mode: option.mode }
                                      }))}
                                      className={`w-full flex items-center justify-between p-3 bg-background border rounded-lg transition-colors text-left ${
                                        isSelected
                                          ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                          : 'hover:border-primary/30'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        {isSelected && (
                                          <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3" />
                                          </div>
                                        )}
                                        <span className="text-xl">{TRANSPORT_ICONS[option.mode]}</span>
                                        <div>
                                          <div className="font-medium text-sm capitalize flex items-center gap-2">
                                            {option.mode === 'private' ? 'Private Transfer' : option.mode}
                                            {option.badge && (
                                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                                option.badge === 'best' ? 'bg-green-100 text-green-700' :
                                                option.badge === 'fastest' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                              }`}>
                                                {option.badge.toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                                            <span>{option.duration}</span>
                                            {option.operator && <span>· {option.operator}</span>}
                                          </div>
                                          {option.notes && (
                                            <div className="text-[10px] text-muted-foreground mt-0.5">{option.notes}</div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className={`font-medium text-sm ${
                                          option.badge === 'cheapest' ? 'text-green-600' :
                                          option.priceRange.includes('$1') && !option.priceRange.includes('$10') ? 'text-green-600' :
                                          'text-foreground'
                                        }`}>
                                          {option.priceRange}
                                        </div>
                                        {option.frequency && (
                                          <div className="text-[10px] text-muted-foreground">{option.frequency}</div>
                                        )}
                                      </div>
                                    </button>
                                  );
                                  })}
                                </div>

                                {/* Flight route options - show connection hubs */}
                                {(() => {
                                  const hubs = getHubConnections(city, nextCity);
                                  if (hubs.length === 0) return null;
                                  return (
                                    <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                      <div className="text-xs text-blue-800 mb-2 font-medium">
                                        Flight routes (2 flights each):
                                      </div>
                                      <div className="space-y-1.5">
                                        {hubs.map(hub => {
                                          const isHubSelected = selectedTransport[index]?.mode === 'flight' && selectedTransport[index]?.hub === hub;
                                          return (
                                          <button
                                            key={hub}
                                            onClick={() => setSelectedTransport(prev => ({
                                              ...prev,
                                              [index]: { mode: 'flight', hub }
                                            }))}
                                            className={`w-full flex items-center justify-between text-xs p-2 rounded border transition-colors ${
                                              isHubSelected
                                                ? 'bg-primary/10 border-primary ring-1 ring-primary/30'
                                                : 'bg-white hover:border-primary/30'
                                            }`}
                                          >
                                            <span className="text-muted-foreground flex items-center gap-2">
                                              {isHubSelected && <Check className="w-3 h-3 text-primary" />}
                                              {city} → <strong className="text-foreground">{hub}</strong> → {nextCity}
                                            </span>
                                            <a
                                              href={`https://www.google.com/travel/flights?q=flights%20from%20${encodeURIComponent(city)}%20to%20${encodeURIComponent(nextCity)}%20via%20${encodeURIComponent(hub)}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="text-blue-600 hover:underline"
                                            >
                                              Search →
                                            </a>
                                          </button>
                                        );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })()}

                                {/* Booking links */}
                                <div className="flex gap-2 pt-2">
                                  {isFlight && (
                                    <a
                                      href={flightInfo.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-xs font-medium"
                                    >
                                      ✈️ Google Flights
                                    </a>
                                  )}
                                  <a
                                    href={getRome2RioUrl(city, nextCity)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 flex items-center justify-center gap-1 py-2 bg-orange-50 text-orange-600 rounded-md hover:bg-orange-100 transition-colors text-xs font-medium"
                                  >
                                    🗺️ Rome2Rio
                                  </a>
                                  {isSEAsia && (
                                    <a
                                      href={get12GoUrl(city, nextCity)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors text-xs font-medium"
                                    >
                                      🎫 12Go Asia
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Saved for later - parked cities */}
        {parkedCities.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Saved for later
            </h4>
            <div className="flex flex-wrap gap-2">
              {parkedCities.map(city => {
                const cityItem = items.find(i => i.name === city && i.tags?.includes('cities'));
                return (
                  <div
                    key={city}
                    className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 border cursor-pointer hover:border-primary transition-colors"
                    onClick={() => {
                      // Add back to route at the end of its country's cities
                      const cityCountry = getCityCountry(city);
                      const lastIdxOfCountry = routeOrder.map(c => getCityCountry(c)).lastIndexOf(cityCountry);
                      if (lastIdxOfCountry >= 0) {
                        const newOrder = [...routeOrder];
                        newOrder.splice(lastIdxOfCountry + 1, 0, city);
                        setRouteOrder(newOrder);
                      } else {
                        setRouteOrder(prev => [...prev, city]);
                      }
                      setParkedCities(prev => prev.filter(c => c !== city));
                    }}
                  >
                    {cityItem?.imageUrl && (
                      <CityImage src={cityItem.imageUrl} alt={city} className="w-8 h-8 rounded object-cover" />
                    )}
                    <div className="text-sm">
                      <div className="font-medium">{city}</div>
                      <div className="text-xs text-muted-foreground">{getCityRegion(city)}</div>
                    </div>
                    <Plus className="w-4 h-4 text-primary ml-1" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Route summary */}
        <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>
                {routeOrder.length} cities · {destinations.length > 1 ? `${destinations.length} countries` : destinations[0]}
              </span>
            </div>
            {totalDistance > 0 && (
              <span className="text-xs">~{totalDistance.toLocaleString()} km total</span>
            )}
          </div>
        </div>

        {/* Confirm button - only enabled when all countries have at least one city */}
        {(() => {
          const allCountriesHaveCities = destinations.every(dest => {
            return routeOrder.some(city => getCityCountry(city) === dest);
          });
          const missingCountries = destinations.filter(dest =>
            !routeOrder.some(city => getCityCountry(city) === dest)
          );

          return (
            <div className="space-y-2">
              {!allCountriesHaveCities && missingCountries.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Pick cities in {missingCountries.join(' & ')} to continue
                </p>
              )}
              <Button
                className="w-full"
                size="lg"
                onClick={confirmRoute}
                disabled={!allCountriesHaveCities}
              >
                {controlledPhase !== undefined ? (
                  'Save'
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Confirm Route & Find Hotels
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          );
        })()}
      </div>
    );
  }

  // ============ DAY PLANNING PHASE ============
  if (phase === 'day-planning') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Plan Your Days</h2>
            <p className="text-sm text-muted-foreground">
              Drag your picks to each day
            </p>
          </div>
        </div>

        {/* Unassigned items pool */}
        {unassignedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              Your Picks ({unassignedItems.length} to assign)
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {unassignedItems.map((item) => (
                <div
                  key={item.id}
                  className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('itemId', item.id);
                  }}
                >
                  <CityImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                  <GripVertical className="absolute top-1 right-1 w-3 h-3 text-white/70" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day timeline (Trip.com style) */}
        <div className="space-y-3">
          {Array.from({ length: duration }, (_, dayIndex) => {
            const colors = getDayColors(dayIndex);
            const dayItems = getDayItems(dayIndex);
            const isExpanded = expandedDay === dayIndex;

            return (
              <div
                key={dayIndex}
                className={`rounded-xl border-2 transition-all ${
                  isExpanded ? `${colors.border} ${colors.light}` : 'border-muted'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const itemId = e.dataTransfer.getData('itemId');
                  if (itemId) addToDay(itemId, dayIndex);
                }}
              >
                {/* Day header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? -1 : dayIndex)}
                  className="w-full flex items-center gap-3 p-3"
                >
                  <div className={`w-8 h-8 rounded-full ${colors.dot} flex items-center justify-center text-white font-bold text-sm`}>
                    {dayIndex + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">Day {dayIndex + 1}</div>
                    <div className="text-xs text-muted-foreground">
                      {dayItems.length > 0
                        ? `${dayItems.length} activities`
                        : 'Drop activities here'}
                    </div>
                  </div>
                  {dayItems.length > 0 && (
                    <div className="flex -space-x-2">
                      {dayItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="w-8 h-8 rounded-full overflow-hidden border-2 border-background">
                          <CityImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                          +{dayItems.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded day timeline */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 space-y-0">
                    {dayItems.length === 0 ? (
                      <div className={`text-center py-6 rounded-lg border-2 border-dashed ${colors.border}`}>
                        <p className="text-sm text-muted-foreground">
                          Drag activities here
                        </p>
                      </div>
                    ) : (
                      dayItems.map((item, index) => (
                        <div key={item.id}>
                          {/* Activity card */}
                          <div className="flex gap-3">
                            {/* Timeline */}
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${colors.dot} ring-4 ring-background z-10`} />
                              {index < dayItems.length - 1 && (
                                <div className={`w-0.5 flex-1 ${colors.dot} opacity-30`} />
                              )}
                            </div>

                            {/* Card */}
                            <div className="flex-1 mb-2 p-3 rounded-xl bg-background border shadow-sm">
                              <div className="flex gap-3">
                                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                  <CityImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                                  {item.duration && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {item.duration} min
                                    </p>
                                  )}
                                  {item.priceInfo && (
                                    <p className="text-xs mt-0.5">
                                      <span className="bg-muted px-1.5 py-0.5 rounded">{item.priceInfo}</span>
                                    </p>
                                  )}
                                </div>
                                {!isTripLocked && (
                                  <button
                                    onClick={() => removeFromDay(item.id)}
                                    className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Travel time connector */}
                          {index < dayItems.length - 1 && (
                            <div className="flex gap-3 py-0.5">
                              <div className="flex flex-col items-center w-3">
                                <div className={`w-0.5 h-6 ${colors.dot} opacity-30`} />
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Footprints className="w-3 h-3" />
                                <span>~10 min walk</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Complete button */}
        {unassignedItems.length === 0 && selectedItems.length > 0 && (
          <Button className="w-full" onClick={() => onSave?.()}>
            {controlledPhase !== undefined ? (
              'Save'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Planning
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // Helper to format TripDNA values for display
  const formatPartyType = (type: string) => {
    const labels: Record<string, string> = {
      solo: 'Solo', couple: 'Couple', family: 'Family', friends: 'Friends'
    };
    return labels[type] || type;
  };

  const formatPace = (pace: string) => {
    const labels: Record<string, string> = {
      relaxed: 'Relaxed', balanced: 'Balanced', fast: 'Action-packed'
    };
    return labels[pace] || pace;
  };

  const formatIdentity = (id: string) => {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // ============ PICKING PHASE ============

  // Navigation functions for progress stepper
  const goToCities = () => {
    setPhase('picking');
    setCurrentStepIndex(0);
    setGridOffset(0);
  };

  const goToRoute = () => {
    if (selectedCities.length > 0) {
      // Copy selectedCities to routeOrder if not already set
      if (routeOrder.length === 0) {
        setRouteOrder([...selectedCities]);
      }
      setPhase('route-planning');
    }
  };

  const goToFavorites = () => {
    if (selectedCities.length > 0) {
      setPhase('picking');
      setCurrentStepIndex(1);
      setGridOffset(0);
      if (onSearchAI) {
        onSearchAI(`best hotels in ${selectedCities.join(', ')}`, 'hotels');
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Progress Stepper: Cities → Route → Favorites (hide when externally controlled) */}
      {controlledPhase === undefined && (
        <ProgressStepper
          onCitiesClick={goToCities}
          onRouteClick={goToRoute}
          onFavoritesClick={goToFavorites}
        />
      )}

      {/* Sub-step indicator for Favorites phase */}
      {mainStage === 3 && phase === 'picking' && (
        <div className="flex justify-center gap-2 -mt-2 mb-2">
          {PLANNING_STEPS.slice(1).map((step, idx) => (
            <button
              key={step.id}
              onClick={() => {
                setCurrentStepIndex(idx + 1);
                setGridOffset(0);
                if (onSearchAI && selectedCities.length > 0) {
                  onSearchAI(`best ${step.id} in ${selectedCities.join(', ')}`, step.id);
                }
              }}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                currentStepIndex === idx + 1
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {step.title.replace('Pick your ', '').replace('Find ', '')}
            </button>
          ))}
        </div>
      )}

      {/* Header row - consistent with Route and Favorites */}
      <div className="flex items-center gap-3">
        {currentStepIndex > 0 && (
          <Button variant="ghost" size="sm" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-bold">{currentStep.title}</h2>
          {currentStep.id === 'cities' && (
            <p className="text-sm text-muted-foreground">Tap to explore, heart to add</p>
          )}
        </div>
        {/* Favs count */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
            <span className="text-sm font-medium">{selectedItems.length}</span>
          </div>
        )}
      </div>

      {/* Destination filter tabs (for cities step with multiple countries) */}
      {currentStep.id === 'cities' && destinations.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {destinations.map((dest) => {
            // Count selected cities for this country
            const countrySelectedCount = selectedCities.filter(city => {
              const cityCountry = getCityCountry(city);
              return cityCountry === dest;
            }).length;

            return (
              <button
                key={dest}
                onClick={() => { setActiveDestinationFilter(dest); setGridOffset(0); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeDestinationFilter === dest
                    ? 'bg-primary text-primary-foreground'
                    : countrySelectedCount === 0
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {dest}
                {countrySelectedCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeDestinationFilter === dest
                      ? 'bg-white text-primary'
                      : 'bg-pink-500 text-white'
                  }`}>
                    {countrySelectedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}


      {/* Selected cities reminder (for non-cities steps) */}
      {currentStep.id !== 'cities' && selectedCities.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{selectedCities.join(', ')}</span>
        </div>
      )}

      {/* Top Picks for You - only show on cities step with items */}
      {currentStep.id === 'cities' && stepItems.length > 3 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Top Picks for You</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {stepItems
              .map(item => ({
                item,
                score: getCityMatchScore(getCityInfo(item.name), tripDna, item.name)
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 4)
              .map(({ item }) => {
                const isSelected = selectedIds.has(item.id);
                const cityInfo = getCityInfo(item.name);
                const recommendation = getPersonalizedRecommendation(cityInfo, tripDna, item.name);
                return (
                  <div
                    key={`top-${item.id}`}
                    className="rounded-xl overflow-hidden border bg-card cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => setCityDetailItem(item)}
                  >
                    <div className="relative aspect-square">
                      <CityImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        recommendation.match === 'great' ? 'bg-green-500 text-white' :
                        recommendation.match === 'neutral' ? 'bg-gray-400 text-white' : recommendation.match === 'consider' ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {recommendation.match === 'great' ? 'Great' : recommendation.match === 'good' ? 'Good' : recommendation.match === 'neutral' ? 'Neutral' : 'Consider'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id, item.name);
                        }}
                        className={`absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-white' : 'bg-black/40 backdrop-blur-sm'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSelected ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                      </button>
                    </div>
                    <div className="p-2">
                      <div className="font-semibold text-sm truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{cityInfo.bestFor.slice(0, 2).join(' · ')}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Items grid (3x3 = 9 squares) */}
      {stepItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {stepItems.slice(gridOffset, gridOffset + currentStep.gridSize).map((item) => {
            const itemIsCity = isCity(item);
            const itemIsSelected = selectedIds.has(item.id);
            const cityMatchInfo = itemIsCity ? getPersonalizedRecommendation(getCityInfo(item.name), tripDna, item.name) : null;

            return (
              <div
                key={item.id}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                onClick={() => {
                  if (itemIsCity) {
                    setCityDetailItem(item);
                  } else {
                    setDetailItem(item);
                  }
                }}
              >
                <CityImage src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Match label for cities */}
                {itemIsCity && cityMatchInfo && (
                  <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                    cityMatchInfo.match === 'great' ? 'bg-green-500 text-white' :
                    cityMatchInfo.match === 'neutral' ? 'bg-gray-400 text-white' :
                    cityMatchInfo.match === 'consider' ? 'bg-amber-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
                    {cityMatchInfo.match === 'great' ? 'Great Choice' :
                     cityMatchInfo.match === 'good' ? 'Good Choice' :
                     cityMatchInfo.match === 'neutral' ? 'Neutral' : 'Consider'}
                  </div>
                )}

                {/* Rating for non-cities */}
                {!itemIsCity && item.rating && (
                  <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] text-white font-medium">{item.rating}</span>
                  </div>
                )}

                {/* Heart button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSelect(item.id, item.name); }}
                  className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    itemIsSelected ? 'bg-white scale-100' : 'bg-black/40 backdrop-blur-sm hover:bg-black/60 scale-90 group-hover:scale-100'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${itemIsSelected ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                </button>

                {/* Name */}
                <div className="absolute bottom-0 left-0 right-10 p-2">
                  <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">{item.name}</p>
                  {item.priceInfo && <p className="text-[10px] text-white/70 mt-0.5">{item.priceInfo}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium mb-2">Loading recommendations...</p>
          <p className="text-xs text-muted-foreground mb-4">
            Claude is finding the best {currentStep.title.toLowerCase()}
          </p>
          <Button variant="outline" size="sm" onClick={loadStepItems}>
            <Sparkles className="w-4 h-4 mr-2" />
            Load with AI
          </Button>
        </div>
      )}

      {/* Pagination controls */}
      {stepItems.length > currentStep.gridSize && (
        <div className="flex items-center justify-center gap-2">
          {gridOffset > 0 && (
            <Button variant="ghost" size="sm" onClick={showPrevItems} className="text-xs">
              <ChevronLeft className="w-3 h-3 mr-1" />
              Previous
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {Math.floor(gridOffset / currentStep.gridSize) + 1} / {Math.ceil(stepItems.length / currentStep.gridSize)}
          </span>
          {gridOffset + currentStep.gridSize < stepItems.length && (
            <Button variant="ghost" size="sm" onClick={showMoreItems} className="text-xs">
              More
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Continue/Save button */}
      {(selectedIds.size > 0 || selectedCities.length > 0) && (currentStep.id === 'cities' || stepItems.length > 0) && (
        <Button className="w-full" onClick={goToNextStep}>
          {controlledPhase !== undefined ? (
            // In Trip Hub context, just show "Save"
            'Save'
          ) : currentStepIndex === PLANNING_STEPS.length - 1 ? (
            <>
              Plan Your Days
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : currentStep.id === 'cities' ? (
            <>
              <Route className="w-4 h-4 mr-2" />
              Plan your route
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : currentStep.id === 'hotels' ? (
            <>
              Best restaurants in {selectedCities.length > 0 ? selectedCities[0] : 'your cities'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : currentStep.id === 'restaurants' ? (
            <>
              Things to do & activities
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next: {PLANNING_STEPS[currentStepIndex + 1]?.title || 'Continue'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      )}

      {/* Item detail modal - matching city modal style */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 max-h-[85vh] overflow-hidden [&>button]:hidden">
          {detailItem && (
            <div className="flex flex-col max-h-[85vh]">
              {/* Hero Image with Overlay */}
              <div className="relative h-48 flex-shrink-0">
                <CityImage src={detailItem.imageUrl} alt={detailItem.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Close button */}
                <button
                  onClick={() => setDetailItem(null)}
                  className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Rating badge */}
                {detailItem.rating && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-white font-medium">{detailItem.rating}</span>
                  </div>
                )}

                {/* Name overlay at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h2 className="text-2xl font-bold">{detailItem.name}</h2>
                  {detailItem.tags && detailItem.tags.length > 0 && (
                    <p className="text-white/80 text-sm">{detailItem.tags.slice(0, 3).join(' · ')}</p>
                  )}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Quick Info Row */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {detailItem.neighborhood && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {detailItem.neighborhood}
                      </span>
                    )}
                    {detailItem.priceInfo && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {detailItem.priceInfo}
                      </span>
                    )}
                    {detailItem.hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {detailItem.hours}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {detailItem.description && (
                    <p className="text-sm text-muted-foreground">{detailItem.description}</p>
                  )}

                  {/* Tips */}
                  {detailItem.tips && detailItem.tips.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Tips
                      </div>
                      <ul className="text-sm text-amber-800 space-y-1">
                        {detailItem.tips.map((tip, i) => (
                          <li key={i}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Action Button */}
              <div className="p-4 border-t bg-background flex-shrink-0">
                <Button
                  className="w-full"
                  variant={selectedIds.has(detailItem.id) ? 'outline' : 'default'}
                  onClick={() => {
                    toggleSelect(detailItem.id, detailItem.name);
                    setDetailItem(null);
                  }}
                >
                  {selectedIds.has(detailItem.id) ? (
                    <><Check className="w-4 h-4 mr-2" /> Added to Trip</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" /> Add to Trip</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* City Detail Modal */}
      <Dialog open={!!cityDetailItem} onOpenChange={() => { setCityDetailItem(null); setCityImageIndex(0); setHighlightTab(''); setModalMainTab('overview'); setShowCityDetails(false); setShowWhyLove(false); setShowWatchOut(false); setShowLocalTip(false); }}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 h-[95vh] max-h-[800px] overflow-hidden [&>button]:hidden">
          {cityDetailItem && (() => {
            // Use enriched city info if available, or cached info, otherwise fallback to basic
            const cityInfo = enrichedCityInfo || cityInfoCache[cityDetailItem.name] || getCityInfo(cityDetailItem.name);
            const isSelected = selectedIds.has(cityDetailItem.id);
            const recommendation = getPersonalizedRecommendation(cityInfo, tripDna, cityDetailItem.name);

            // Create image slides: city overview + top sites
            // Use null for loading state instead of Cappadocia fallback
            const imageSlides = [
              { label: cityDetailItem.name, url: siteImages[cityDetailItem.name] || null },
              ...cityInfo.topSites.slice(0, 4).map((site) => ({
                label: site,
                url: siteImages[site] || null
              }))
            ];

            // Touch swipe handlers
            let touchStartX = 0;
            const handleTouchStart = (e: React.TouchEvent) => {
              touchStartX = e.touches[0].clientX;
            };
            const handleTouchEnd = (e: React.TouchEvent) => {
              const touchEndX = e.changedTouches[0].clientX;
              const diff = touchStartX - touchEndX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && cityImageIndex < imageSlides.length - 1) {
                  setCityImageIndex(i => i + 1);
                } else if (diff < 0 && cityImageIndex > 0) {
                  setCityImageIndex(i => i - 1);
                }
              }
            };

            // Dot rating component - compact and black/white
            const DotRating = ({ label, value }: { label: string; value: number }) => (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-medium w-12">{label}</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                      key={dot}
                      className={`w-1.5 h-1.5 rounded-full ${dot <= value ? 'bg-foreground' : 'bg-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            );

            // Accordion section component
            const AccordionSection = ({
              id,
              label,
              icon,
              items
            }: {
              id: string;
              label: string;
              icon: React.ReactNode;
              items: { name: string; description: string }[]
            }) => {
              const isOpen = highlightTab === id;
              return (
                <div className="border-b last:border-b-0">
                  <button
                    onClick={() => setHighlightTab(isOpen ? '' : id)}
                    className="w-full flex items-center justify-between py-3 text-sm font-medium"
                  >
                    <span className="flex items-center gap-2">
                      {icon}
                      {label}
                      <span className="text-xs text-muted-foreground">({items.length})</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="pb-3 space-y-2">
                      {items.map((item) => (
                        <div key={item.name} className="text-sm pl-6">
                          <span className="font-medium">{item.name}</span>
                          <p className="text-muted-foreground text-xs mt-0.5">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="flex flex-col h-full">
                {/* Hero Image with Overlay Info */}
                <div
                  className="relative h-48 flex-shrink-0"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <CityImage
                    src={imageSlides[cityImageIndex].url}
                    alt={imageSlides[cityImageIndex].label}
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Close button */}
                  <button
                    onClick={() => { setCityDetailItem(null); setCityImageIndex(0); }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Image navigation arrows */}
                  {cityImageIndex > 0 && (
                    <button onClick={() => setCityImageIndex(i => i - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {cityImageIndex < imageSlides.length - 1 && (
                    <button onClick={() => setCityImageIndex(i => i + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* City info overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <div className="flex items-end justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">{cityDetailItem.name}</h2>
                        <p className="text-white/80 text-sm">{cityInfo.bestFor.join(' · ')}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        recommendation.match === 'great' ? 'bg-green-500 text-white' :
                        recommendation.match === 'neutral' ? 'bg-gray-400 text-white' : recommendation.match === 'consider' ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {recommendation.match === 'great' ? 'Great Match' :
                         recommendation.match === 'neutral' ? 'Neutral' : recommendation.match === 'consider' ? 'Consider' : 'Good Choice'}
                      </div>
                    </div>
                  </div>

                  {/* Dot indicators */}
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imageSlides.map((_, idx) => (
                      <button key={idx} onClick={() => setCityImageIndex(idx)} className={`w-1.5 h-1.5 rounded-full ${idx === cityImageIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                </div>

                {/* Main Tab Buttons */}
                <div className="flex border-b flex-shrink-0">
                  <button
                    onClick={() => setModalMainTab('overview')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      modalMainTab === 'overview'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => { setModalMainTab('explore'); if (!highlightTab) setHighlightTab('landmarks'); }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      modalMainTab === 'explore'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Explore
                  </button>
                  <button
                    onClick={() => setModalMainTab('map')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${
                      modalMainTab === 'map'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Map
                  </button>
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 overflow-y-auto">
                  {/* Overview Tab */}
                  {modalMainTab === 'overview' && (
                    <div className="p-4 space-y-4">
                      {/* Meta Info Row */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {cityInfo.avgDays}
                        </span>
                        <span>{cityInfo.crowdLevel} crowds</span>
                        <span>Best: {cityInfo.bestTime}</span>
                      </div>

                      {/* Why You'll Love It */}
                      {recommendation.reasons.length > 0 && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-green-700 mb-2">Why you&apos;ll love it</div>
                          <ul className="text-sm text-green-800 space-y-1">
                            {recommendation.reasons.map((reason, i) => (
                              <li key={i}>• {reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Good to Know (cons/concerns) */}
                      {(recommendation.concerns.length > 0 || cityInfo.cons?.length > 0) && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-xs font-semibold text-slate-700 mb-2">Good to know</div>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {recommendation.concerns.map((concern, i) => (
                              <li key={i}>• {concern}</li>
                            ))}
                            {cityInfo.cons?.filter(con => !recommendation.concerns.some(c => c.includes(con.substring(0, 20)))).slice(0, 2).map((con, i) => (
                              <li key={`con-${i}`}>• {con}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Must-See Sites */}
                      <div>
                        <div className="text-sm font-semibold mb-2">Must-See</div>
                        <div className="flex gap-2 flex-wrap">
                          {cityInfo.topSites.map((site, idx) => (
                            <button
                              key={site}
                              onClick={() => {
                                setCityImageIndex(idx + 1);
                              }}
                              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                                cityImageIndex === idx + 1 ? 'bg-primary text-primary-foreground border-primary' : 'hover:border-primary/50'
                              }`}
                            >
                              {site}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Local Tip */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-xs font-semibold text-amber-700 mb-0.5">Local Tip</div>
                          <p className="text-sm text-amber-800">{cityInfo.localTip}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Explore Tab */}
                  {modalMainTab === 'explore' && (
                    <div className="p-4">
                      {isLoadingCityInfo && !cityInfo.highlights ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          Loading highlights...
                        </div>
                      ) : cityInfo.highlights ? (
                        <div className="space-y-4">
                          {/* Category Tabs */}
                          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                            {[
                              ...(cityInfo.highlights.landmarks?.length ? [{ id: 'landmarks', label: 'Landmarks' }] : []),
                              ...(cityInfo.highlights.history?.length ? [{ id: 'history', label: 'History' }] : []),
                              ...(cityInfo.highlights.museums?.length ? [{ id: 'museums', label: 'Museums' }] : []),
                              ...(cityInfo.highlights.markets?.length ? [{ id: 'markets', label: 'Markets' }] : []),
                              ...(cityInfo.highlights.food?.length ? [{ id: 'food', label: 'Food' }] : []),
                            ].map((tab, idx) => (
                              <button
                                key={tab.id}
                                onClick={() => setHighlightTab(tab.id)}
                                className={`px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                                  highlightTab === tab.id || (!highlightTab && idx === 0)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                              >
                                {tab.label}
                              </button>
                            ))}
                          </div>

                          {/* Category Content */}
                          <div className="space-y-4">
                            {(highlightTab === 'landmarks' || !highlightTab) && cityInfo.highlights.landmarks && (
                              <div className="space-y-3">
                                {cityInfo.highlights.landmarks.map((item) => (
                                  <div key={item.name} className="bg-muted/50 rounded-lg p-3">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {highlightTab === 'history' && cityInfo.highlights.history && (
                              <div className="space-y-3">
                                {cityInfo.highlights.history.map((item) => (
                                  <div key={item.name} className="bg-muted/50 rounded-lg p-3">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {highlightTab === 'museums' && cityInfo.highlights.museums && (
                              <div className="space-y-3">
                                {cityInfo.highlights.museums.map((item) => (
                                  <div key={item.name} className="bg-muted/50 rounded-lg p-3">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {highlightTab === 'markets' && cityInfo.highlights.markets && (
                              <div className="space-y-3">
                                {cityInfo.highlights.markets.map((item) => (
                                  <div key={item.name} className="bg-muted/50 rounded-lg p-3">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {highlightTab === 'food' && cityInfo.highlights.food && (
                              <div className="space-y-3">
                                {cityInfo.highlights.food.map((item) => (
                                  <div key={item.name} className="bg-muted/50 rounded-lg p-3">
                                    <div className="font-medium text-sm">{item.name}</div>
                                    <p className="text-muted-foreground text-sm mt-1">{item.description}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground text-sm">
                          No detailed highlights available for this city yet.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Map Tab */}
                  {modalMainTab === 'map' && (
                    <div className="h-full">
                      <CityMapEmbed cityName={cityDetailItem.name} />
                    </div>
                  )}
                </div>

                {/* Sticky Action Bar */}
                <div className="p-4 border-t bg-background flex-shrink-0 shadow-lg">
                  <Button
                    className="w-full"
                    variant={isSelected ? 'outline' : 'default'}
                    onClick={() => {
                      toggleSelect(cityDetailItem.id, cityDetailItem.name);
                      setCityDetailItem(null);
                      setCityImageIndex(0);
                    }}
                  >
                    {isSelected ? (
                      <><Check className="w-4 h-4 mr-2" /> Added to Trip</>
                    ) : (
                      <><Plus className="w-4 h-4 mr-2" /> Add to Trip</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

    </div>
  );
}
