// Transport options generator - Rome2Rio style data for route planning

export interface TransportOption {
  mode: 'bus' | 'train' | 'flight' | 'drive' | 'taxi' | 'ferry' | 'private';
  duration: string;        // e.g., "3h 45min"
  durationMinutes: number; // for sorting
  priceRange: string;      // e.g., "CA$8-25" or "$15-30"
  currency: string;
  badge?: 'best' | 'fastest' | 'cheapest';
  operator?: string;       // e.g., "Thai Airways", "Green Bus"
  frequency?: string;      // e.g., "Every 2 hours"
  bookingUrl?: string;
  notes?: string;          // e.g., "scenic route", "night bus available"
}

export interface RouteTransport {
  from: string;
  to: string;
  distance: number;  // km
  options: TransportOption[];
}

// Icons for each transport mode
export const TRANSPORT_ICONS: Record<TransportOption['mode'], string> = {
  bus: '🚌',
  train: '🚄',
  flight: '✈️',
  drive: '🚗',
  taxi: '🚕',
  ferry: '⛴️',
  private: '🚐',
};

// Static transport data for popular routes
// This provides realistic options without API calls
const ROUTE_TRANSPORT: Record<string, Record<string, TransportOption[]>> = {
  // Thailand internal routes
  'Chiang Mai': {
    'Chiang Rai': [
      { mode: 'bus', duration: '3h 45min', durationMinutes: 225, priceRange: '$8-15', currency: 'USD', badge: 'best', operator: 'Green Bus', frequency: 'Every hour' },
      { mode: 'drive', duration: '2h 50min', durationMinutes: 170, priceRange: '$25-40', currency: 'USD', notes: '184 km via Route 118' },
      { mode: 'taxi', duration: '2h 50min', durationMinutes: 170, priceRange: '$80-100', currency: 'USD', badge: 'fastest' },
      { mode: 'private', duration: '3h', durationMinutes: 180, priceRange: '$120-150', currency: 'USD', notes: 'Door-to-door' },
    ],
    'Bangkok': [
      { mode: 'flight', duration: '1h 15min', durationMinutes: 75, priceRange: '$40-100', currency: 'USD', badge: 'fastest', operator: 'Thai Airways, AirAsia', frequency: '20+ daily' },
      { mode: 'train', duration: '12-14hr', durationMinutes: 780, priceRange: '$20-60', currency: 'USD', notes: 'Sleeper train, scenic route', operator: 'Thai Railways' },
      { mode: 'bus', duration: '10-11hr', durationMinutes: 660, priceRange: '$15-35', currency: 'USD', badge: 'cheapest', operator: 'NCA, Sombat Tour' },
    ],
    'Phuket': [
      { mode: 'flight', duration: '2hr', durationMinutes: 120, priceRange: '$50-120', currency: 'USD', badge: 'fastest', operator: 'Bangkok Airways, Thai Smile' },
      { mode: 'bus', duration: '18-20hr', durationMinutes: 1140, priceRange: '$30-50', currency: 'USD', notes: 'Overnight bus' },
    ],
    'Pai': [
      { mode: 'bus', duration: '3-4hr', durationMinutes: 210, priceRange: '$5-10', currency: 'USD', badge: 'best', notes: '762 curves!', frequency: 'Every 2 hours' },
      { mode: 'private', duration: '2.5hr', durationMinutes: 150, priceRange: '$60-80', currency: 'USD', badge: 'fastest' },
    ],
  },
  'Bangkok': {
    'Chiang Mai': [
      { mode: 'flight', duration: '1h 15min', durationMinutes: 75, priceRange: '$40-100', currency: 'USD', badge: 'fastest', operator: 'Thai Airways, AirAsia', frequency: '20+ daily' },
      { mode: 'train', duration: '12-14hr', durationMinutes: 780, priceRange: '$20-60', currency: 'USD', notes: 'Sleeper train, scenic', operator: 'Thai Railways' },
      { mode: 'bus', duration: '10-11hr', durationMinutes: 660, priceRange: '$15-35', currency: 'USD', badge: 'cheapest', operator: 'NCA, Sombat Tour' },
    ],
    'Phuket': [
      { mode: 'flight', duration: '1h 20min', durationMinutes: 80, priceRange: '$35-90', currency: 'USD', badge: 'fastest', operator: 'Thai Airways, AirAsia', frequency: '30+ daily' },
      { mode: 'bus', duration: '12-13hr', durationMinutes: 750, priceRange: '$20-40', currency: 'USD', notes: 'Overnight bus', operator: 'Sombat Tour' },
    ],
    'Krabi': [
      { mode: 'flight', duration: '1h 20min', durationMinutes: 80, priceRange: '$40-100', currency: 'USD', badge: 'fastest', operator: 'AirAsia, Thai Smile' },
      { mode: 'bus', duration: '11-12hr', durationMinutes: 690, priceRange: '$20-35', currency: 'USD', notes: 'Overnight' },
    ],
    'Koh Samui': [
      { mode: 'flight', duration: '1hr', durationMinutes: 60, priceRange: '$80-200', currency: 'USD', badge: 'fastest', operator: 'Bangkok Airways (monopoly)' },
      { mode: 'bus', duration: '12hr + ferry', durationMinutes: 780, priceRange: '$25-40', currency: 'USD', badge: 'cheapest', notes: 'Bus to Surat Thani + ferry' },
    ],
    'Ayutthaya': [
      { mode: 'train', duration: '1.5-2hr', durationMinutes: 105, priceRange: '$1-5', currency: 'USD', badge: 'best', frequency: 'Every hour', operator: 'Thai Railways' },
      { mode: 'bus', duration: '1.5hr', durationMinutes: 90, priceRange: '$3-5', currency: 'USD', frequency: 'Every 30 min' },
      { mode: 'taxi', duration: '1hr', durationMinutes: 60, priceRange: '$35-50', currency: 'USD', badge: 'fastest' },
    ],
    'Sukhothai': [
      { mode: 'flight', duration: '1h 20min', durationMinutes: 80, priceRange: '$60-120', currency: 'USD', badge: 'fastest', operator: 'Bangkok Airways' },
      { mode: 'bus', duration: '6-7hr', durationMinutes: 390, priceRange: '$15-25', currency: 'USD', notes: 'Direct from Mo Chit' },
    ],
  },
  'Phuket': {
    'Krabi': [
      { mode: 'bus', duration: '3hr', durationMinutes: 180, priceRange: '$8-15', currency: 'USD', badge: 'best', frequency: 'Every 2 hours' },
      { mode: 'taxi', duration: '2.5hr', durationMinutes: 150, priceRange: '$70-90', currency: 'USD', badge: 'fastest' },
      { mode: 'ferry', duration: '2hr', durationMinutes: 120, priceRange: '$25-40', currency: 'USD', notes: 'Scenic coastal route' },
    ],
    'Koh Phi Phi': [
      { mode: 'ferry', duration: '2hr', durationMinutes: 120, priceRange: '$15-30', currency: 'USD', badge: 'best', frequency: '3-4 daily', operator: 'Phi Phi Cruiser' },
    ],
    'Bangkok': [
      { mode: 'flight', duration: '1h 20min', durationMinutes: 80, priceRange: '$35-90', currency: 'USD', badge: 'fastest', operator: 'AirAsia, Thai Lion', frequency: '30+ daily' },
      { mode: 'bus', duration: '12-13hr', durationMinutes: 750, priceRange: '$20-40', currency: 'USD', badge: 'cheapest', notes: 'Overnight' },
    ],
  },
  // Vietnam routes
  'Hanoi': {
    'Ha Long Bay': [
      { mode: 'bus', duration: '3.5-4hr', durationMinutes: 225, priceRange: '$10-20', currency: 'USD', badge: 'best', notes: 'Most tours include transport' },
      { mode: 'private', duration: '2.5hr', durationMinutes: 150, priceRange: '$50-80', currency: 'USD', badge: 'fastest' },
    ],
    'Hoi An': [
      { mode: 'flight', duration: '1h 15min', durationMinutes: 75, priceRange: '$50-100', currency: 'USD', badge: 'fastest', notes: 'Fly to Da Nang + 30min taxi', operator: 'Vietnam Airlines, VietJet' },
      { mode: 'train', duration: '15-17hr', durationMinutes: 960, priceRange: '$30-60', currency: 'USD', notes: 'Sleeper train to Da Nang', operator: 'Vietnam Railways' },
      { mode: 'bus', duration: '17-18hr', durationMinutes: 1050, priceRange: '$25-40', currency: 'USD', badge: 'cheapest', notes: 'Sleeper bus' },
    ],
    'Ho Chi Minh City': [
      { mode: 'flight', duration: '2hr', durationMinutes: 120, priceRange: '$50-120', currency: 'USD', badge: 'fastest', frequency: '40+ daily', operator: 'Vietnam Airlines, VietJet' },
      { mode: 'train', duration: '30-34hr', durationMinutes: 1920, priceRange: '$50-120', currency: 'USD', notes: 'Reunification Express - epic journey', operator: 'Vietnam Railways' },
    ],
    'Sapa': [
      { mode: 'bus', duration: '5-6hr', durationMinutes: 330, priceRange: '$15-25', currency: 'USD', badge: 'best', notes: 'Sleeper bus or regular', frequency: 'Many daily' },
      { mode: 'train', duration: '8hr + bus', durationMinutes: 540, priceRange: '$30-60', currency: 'USD', notes: 'Night train to Lao Cai + bus' },
    ],
  },
  'Ho Chi Minh City': {
    'Hanoi': [
      { mode: 'flight', duration: '2hr', durationMinutes: 120, priceRange: '$50-120', currency: 'USD', badge: 'fastest', frequency: '40+ daily' },
      { mode: 'train', duration: '30-34hr', durationMinutes: 1920, priceRange: '$50-120', currency: 'USD', notes: 'Reunification Express' },
    ],
    'Da Nang': [
      { mode: 'flight', duration: '1h 20min', durationMinutes: 80, priceRange: '$40-90', currency: 'USD', badge: 'fastest', frequency: '20+ daily' },
      { mode: 'train', duration: '15-17hr', durationMinutes: 960, priceRange: '$30-60', currency: 'USD', notes: 'Sleeper train' },
    ],
    'Nha Trang': [
      { mode: 'flight', duration: '1hr', durationMinutes: 60, priceRange: '$40-80', currency: 'USD', badge: 'fastest' },
      { mode: 'train', duration: '6-8hr', durationMinutes: 420, priceRange: '$20-40', currency: 'USD', notes: 'Scenic coastal route' },
      { mode: 'bus', duration: '8-9hr', durationMinutes: 510, priceRange: '$12-20', currency: 'USD', badge: 'cheapest' },
    ],
  },
  'Da Nang': {
    'Hoi An': [
      { mode: 'taxi', duration: '30min', durationMinutes: 30, priceRange: '$15-20', currency: 'USD', badge: 'fastest' },
      { mode: 'bus', duration: '45min', durationMinutes: 45, priceRange: '$1-2', currency: 'USD', badge: 'cheapest', frequency: 'Every 20 min' },
      { mode: 'drive', duration: '30min', durationMinutes: 30, priceRange: '$5-10', currency: 'USD', notes: 'Motorbike rental' },
    ],
    'Hue': [
      { mode: 'train', duration: '2.5hr', durationMinutes: 150, priceRange: '$8-15', currency: 'USD', badge: 'best', notes: 'Scenic Hai Van Pass views' },
      { mode: 'bus', duration: '3hr', durationMinutes: 180, priceRange: '$5-10', currency: 'USD', badge: 'cheapest' },
      { mode: 'private', duration: '2hr', durationMinutes: 120, priceRange: '$40-60', currency: 'USD', badge: 'fastest', notes: 'Stop at Hai Van Pass' },
    ],
  },
  // Japan routes
  'Tokyo': {
    'Kyoto': [
      { mode: 'train', duration: '2h 15min', durationMinutes: 135, priceRange: '$120-150', currency: 'USD', badge: 'best', operator: 'Shinkansen Nozomi', notes: 'JR Pass valid on Hikari' },
      { mode: 'bus', duration: '7-8hr', durationMinutes: 450, priceRange: '$30-60', currency: 'USD', badge: 'cheapest', notes: 'Night bus available' },
      { mode: 'flight', duration: '1h 15min', durationMinutes: 75, priceRange: '$80-150', currency: 'USD', notes: 'Fly to Osaka/Itami' },
    ],
    'Osaka': [
      { mode: 'train', duration: '2h 30min', durationMinutes: 150, priceRange: '$120-150', currency: 'USD', badge: 'best', operator: 'Shinkansen', notes: 'JR Pass valid' },
      { mode: 'flight', duration: '1h 10min', durationMinutes: 70, priceRange: '$80-150', currency: 'USD', badge: 'fastest' },
      { mode: 'bus', duration: '8-9hr', durationMinutes: 510, priceRange: '$40-70', currency: 'USD', badge: 'cheapest', notes: 'Night bus' },
    ],
    'Hakone': [
      { mode: 'train', duration: '1h 30min', durationMinutes: 90, priceRange: '$25-40', currency: 'USD', badge: 'best', operator: 'Odakyu Romance Car' },
      { mode: 'bus', duration: '2hr', durationMinutes: 120, priceRange: '$15-25', currency: 'USD' },
    ],
    'Nikko': [
      { mode: 'train', duration: '2hr', durationMinutes: 120, priceRange: '$25-40', currency: 'USD', badge: 'best', operator: 'Tobu Railway', notes: 'Get the Nikko Pass' },
    ],
    'Hiroshima': [
      { mode: 'train', duration: '4hr', durationMinutes: 240, priceRange: '$170-200', currency: 'USD', badge: 'best', operator: 'Shinkansen', notes: 'JR Pass makes this affordable' },
      { mode: 'flight', duration: '1h 25min', durationMinutes: 85, priceRange: '$100-200', currency: 'USD', badge: 'fastest' },
    ],
  },
  'Kyoto': {
    'Osaka': [
      { mode: 'train', duration: '15-30min', durationMinutes: 22, priceRange: '$5-15', currency: 'USD', badge: 'best', operator: 'JR, Hankyu, Keihan', frequency: 'Every few minutes' },
    ],
    'Nara': [
      { mode: 'train', duration: '45min', durationMinutes: 45, priceRange: '$6-10', currency: 'USD', badge: 'best', operator: 'JR or Kintetsu' },
    ],
    'Tokyo': [
      { mode: 'train', duration: '2h 15min', durationMinutes: 135, priceRange: '$120-150', currency: 'USD', badge: 'best', operator: 'Shinkansen' },
      { mode: 'bus', duration: '7-8hr', durationMinutes: 450, priceRange: '$30-60', currency: 'USD', badge: 'cheapest', notes: 'Night bus' },
    ],
  },
  'Osaka': {
    'Hiroshima': [
      { mode: 'train', duration: '1h 25min', durationMinutes: 85, priceRange: '$90-110', currency: 'USD', badge: 'best', operator: 'Shinkansen Nozomi/Mizuho', notes: 'JR Pass valid on Sakura (1h 32min)' },
      { mode: 'bus', duration: '5-6hr', durationMinutes: 330, priceRange: '$30-50', currency: 'USD', badge: 'cheapest' },
    ],
    'Kyoto': [
      { mode: 'train', duration: '15-30min', durationMinutes: 22, priceRange: '$5-15', currency: 'USD', badge: 'best', operator: 'JR, Hankyu, Keihan', frequency: 'Every few minutes' },
    ],
    'Nara': [
      { mode: 'train', duration: '30-50min', durationMinutes: 40, priceRange: '$5-10', currency: 'USD', badge: 'best', operator: 'JR or Kintetsu' },
    ],
  },
  // Europe routes
  'Paris': {
    'Barcelona': [
      { mode: 'train', duration: '6h 30min', durationMinutes: 390, priceRange: '$80-200', currency: 'USD', badge: 'best', operator: 'TGV', notes: 'High-speed direct' },
      { mode: 'flight', duration: '1h 50min', durationMinutes: 110, priceRange: '$50-150', currency: 'USD', badge: 'fastest' },
      { mode: 'bus', duration: '14-15hr', durationMinutes: 870, priceRange: '$30-60', currency: 'USD', badge: 'cheapest', operator: 'FlixBus' },
    ],
    'Amsterdam': [
      { mode: 'train', duration: '3h 20min', durationMinutes: 200, priceRange: '$60-150', currency: 'USD', badge: 'best', operator: 'Thalys' },
      { mode: 'flight', duration: '1h 15min', durationMinutes: 75, priceRange: '$50-120', currency: 'USD', badge: 'fastest' },
      { mode: 'bus', duration: '7-8hr', durationMinutes: 450, priceRange: '$25-50', currency: 'USD', badge: 'cheapest' },
    ],
    'London': [
      { mode: 'train', duration: '2h 15min', durationMinutes: 135, priceRange: '$80-200', currency: 'USD', badge: 'best', operator: 'Eurostar', notes: 'City center to city center' },
      { mode: 'flight', duration: '1h 15min', durationMinutes: 75, priceRange: '$50-150', currency: 'USD', notes: 'Add airport time' },
    ],
  },
  'Rome': {
    'Florence': [
      { mode: 'train', duration: '1h 30min', durationMinutes: 90, priceRange: '$30-60', currency: 'USD', badge: 'best', operator: 'Frecciarossa', frequency: 'Every 30 min' },
      { mode: 'bus', duration: '3-4hr', durationMinutes: 210, priceRange: '$15-30', currency: 'USD', badge: 'cheapest' },
    ],
    'Venice': [
      { mode: 'train', duration: '3h 45min', durationMinutes: 225, priceRange: '$50-100', currency: 'USD', badge: 'best', operator: 'Frecciarossa' },
      { mode: 'flight', duration: '1hr', durationMinutes: 60, priceRange: '$60-120', currency: 'USD', badge: 'fastest' },
    ],
    'Naples': [
      { mode: 'train', duration: '1h 10min', durationMinutes: 70, priceRange: '$20-50', currency: 'USD', badge: 'best', operator: 'Frecciarossa', frequency: 'Every 30 min' },
    ],
    'Amalfi': [
      { mode: 'train', duration: '3-4hr', durationMinutes: 210, priceRange: '$20-40', currency: 'USD', notes: 'Train to Salerno + bus/ferry' },
      { mode: 'private', duration: '3hr', durationMinutes: 180, priceRange: '$150-250', currency: 'USD', badge: 'fastest' },
    ],
  },
  'Barcelona': {
    'Madrid': [
      { mode: 'train', duration: '2h 30min', durationMinutes: 150, priceRange: '$50-120', currency: 'USD', badge: 'best', operator: 'AVE' },
      { mode: 'flight', duration: '1h 15min', durationMinutes: 75, priceRange: '$40-100', currency: 'USD', badge: 'fastest' },
      { mode: 'bus', duration: '7-8hr', durationMinutes: 450, priceRange: '$25-50', currency: 'USD', badge: 'cheapest' },
    ],
  },
  // Hawaii inter-island and Japan connections
  'Honolulu': {
    'Maui': [
      { mode: 'flight', duration: '30-40min', durationMinutes: 35, priceRange: '$80-150', currency: 'USD', badge: 'best', operator: 'Hawaiian, Southwest', frequency: 'Many daily' },
    ],
    'Kauai': [
      { mode: 'flight', duration: '30-40min', durationMinutes: 35, priceRange: '$80-150', currency: 'USD', badge: 'best', operator: 'Hawaiian, Southwest' },
    ],
    'Big Island': [
      { mode: 'flight', duration: '45min', durationMinutes: 45, priceRange: '$80-150', currency: 'USD', badge: 'best', operator: 'Hawaiian, Southwest' },
    ],
    'Tokyo': [
      { mode: 'flight', duration: '7hr', durationMinutes: 420, priceRange: '$500-900', currency: 'USD', badge: 'best', operator: 'Hawaiian, Delta, JAL, Alaska', frequency: 'Multiple daily', notes: 'Nonstop flights available' },
    ],
    'Osaka': [
      { mode: 'flight', duration: '8hr', durationMinutes: 480, priceRange: '$500-900', currency: 'USD', badge: 'best', operator: 'Hawaiian, JAL', frequency: 'Daily', notes: 'Nonstop flights available' },
    ],
  },
  // International flights from Canada (Kelowna)
  'Kelowna': {
    // Japan (via Vancouver)
    'Tokyo': [
      { mode: 'flight', duration: '12-14hr', durationMinutes: 780, priceRange: '$800-1500', currency: 'USD', badge: 'best', operator: 'Air Canada, ANA, JAL', notes: '1 stop via Vancouver' },
    ],
    'Osaka': [
      { mode: 'flight', duration: '13-15hr', durationMinutes: 840, priceRange: '$850-1600', currency: 'USD', badge: 'best', operator: 'Air Canada, ANA', notes: '1 stop via Vancouver' },
    ],
    'Kyoto': [
      { mode: 'flight', duration: '13-15hr', durationMinutes: 840, priceRange: '$850-1600', currency: 'USD', badge: 'best', operator: 'Air Canada, ANA', notes: '1 stop via Vancouver, fly to Osaka/KIX' },
    ],
    // Thailand (via Vancouver + hub)
    'Bangkok': [
      { mode: 'flight', duration: '18-22hr', durationMinutes: 1200, priceRange: '$900-1800', currency: 'USD', badge: 'best', operator: 'Air Canada, Thai Airways', notes: '2 stops via Vancouver + hub' },
    ],
    'Chiang Mai': [
      { mode: 'flight', duration: '20-24hr', durationMinutes: 1320, priceRange: '$950-1900', currency: 'USD', badge: 'best', operator: 'Air Canada, Thai Airways', notes: '2 stops via Vancouver + Bangkok' },
    ],
    'Chiang Rai': [
      { mode: 'flight', duration: '22-26hr', durationMinutes: 1440, priceRange: '$1000-2000', currency: 'USD', badge: 'best', operator: 'Air Canada, Thai Airways', notes: '2 stops via Vancouver + Bangkok' },
    ],
    'Phuket': [
      { mode: 'flight', duration: '20-24hr', durationMinutes: 1320, priceRange: '$950-1900', currency: 'USD', badge: 'best', operator: 'Air Canada, Thai Airways', notes: '2 stops via Vancouver + Bangkok' },
    ],
    'Krabi': [
      { mode: 'flight', duration: '22-26hr', durationMinutes: 1440, priceRange: '$1000-2000', currency: 'USD', badge: 'best', operator: 'Air Canada, Thai Airways', notes: '2 stops via Vancouver + Bangkok' },
    ],
    // Vietnam
    'Ho Chi Minh City': [
      { mode: 'flight', duration: '18-22hr', durationMinutes: 1200, priceRange: '$900-1700', currency: 'USD', badge: 'best', operator: 'Air Canada, Vietnam Airlines', notes: '2 stops via Vancouver + hub' },
    ],
    'Hanoi': [
      { mode: 'flight', duration: '18-22hr', durationMinutes: 1200, priceRange: '$900-1700', currency: 'USD', badge: 'best', operator: 'Air Canada, Vietnam Airlines', notes: '2 stops via Vancouver + hub' },
    ],
    'Da Nang': [
      { mode: 'flight', duration: '20-24hr', durationMinutes: 1320, priceRange: '$950-1800', currency: 'USD', badge: 'best', operator: 'Air Canada, Vietnam Airlines', notes: '2 stops' },
    ],
    // Hawaii
    'Honolulu': [
      { mode: 'flight', duration: '8-10hr', durationMinutes: 540, priceRange: '$400-900', currency: 'USD', badge: 'best', operator: 'WestJet, Air Canada', notes: '1 stop via Vancouver or Seattle' },
    ],
    'Maui': [
      { mode: 'flight', duration: '9-11hr', durationMinutes: 600, priceRange: '$450-950', currency: 'USD', badge: 'best', operator: 'WestJet, Air Canada', notes: '1 stop via Vancouver' },
    ],
    'Kauai': [
      { mode: 'flight', duration: '10-12hr', durationMinutes: 660, priceRange: '$500-1000', currency: 'USD', badge: 'best', operator: 'Air Canada, Hawaiian', notes: '2 stops' },
    ],
  },
};

// Get transport options between two cities
export function getTransportOptions(fromCity: string, toCity: string): TransportOption[] | null {
  // Direct lookup
  if (ROUTE_TRANSPORT[fromCity]?.[toCity]) {
    return ROUTE_TRANSPORT[fromCity][toCity];
  }
  // Reverse lookup
  if (ROUTE_TRANSPORT[toCity]?.[fromCity]) {
    return ROUTE_TRANSPORT[toCity][fromCity];
  }
  return null;
}

// Get Rome2Rio URL for checking options
export function getRome2RioUrl(fromCity: string, toCity: string): string {
  const from = encodeURIComponent(fromCity);
  const to = encodeURIComponent(toCity);
  return `https://www.rome2rio.com/s/${from}/${to}`;
}

// Get 12Go Asia URL (good for SE Asia bookings)
export function get12GoUrl(fromCity: string, toCity: string): string {
  const from = encodeURIComponent(fromCity);
  const to = encodeURIComponent(toCity);
  return `https://12go.asia/en/travel/${from}/${to}`;
}

// Estimate transport options based on distance if no data exists
export function estimateTransportOptions(distance: number, isCrossCountry: boolean): TransportOption[] {
  const options: TransportOption[] = [];

  if (isCrossCountry || distance > 500) {
    // Long distance - flight is primary
    options.push({
      mode: 'flight',
      duration: `${Math.round(distance / 800 + 1)}hr`,
      durationMinutes: Math.round((distance / 800 + 1) * 60),
      priceRange: `$${Math.round(distance * 0.08)}-${Math.round(distance * 0.15)}`,
      currency: 'USD',
      badge: 'fastest',
    });
  }

  if (distance <= 800 && !isCrossCountry) {
    // Train option for medium distances
    options.push({
      mode: 'train',
      duration: `${Math.round(distance / 100)}hr`,
      durationMinutes: Math.round(distance / 100 * 60),
      priceRange: `$${Math.round(distance * 0.05)}-${Math.round(distance * 0.1)}`,
      currency: 'USD',
      badge: distance <= 400 ? 'best' : undefined,
    });
  }

  if (distance <= 400) {
    // Bus option for shorter distances
    options.push({
      mode: 'bus',
      duration: `${Math.round(distance / 50)}hr`,
      durationMinutes: Math.round(distance / 50 * 60),
      priceRange: `$${Math.round(distance * 0.03)}-${Math.round(distance * 0.06)}`,
      currency: 'USD',
      badge: 'cheapest',
    });
  }

  if (distance <= 300) {
    // Taxi/private for short distances
    options.push({
      mode: 'taxi',
      duration: `${Math.round(distance / 60)}hr`,
      durationMinutes: Math.round(distance / 60 * 60),
      priceRange: `$${Math.round(distance * 0.4)}-${Math.round(distance * 0.6)}`,
      currency: 'USD',
      badge: distance <= 200 ? 'fastest' : undefined,
    });
  }

  return options;
}
