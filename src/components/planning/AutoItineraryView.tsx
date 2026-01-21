'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Hotel,
  MapPin,
  Clock,
  Star,
  Footprints,
  Sparkles,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
  GripVertical,
  DollarSign,
  Trash2,
  X,
  Check,
  Map,
  Image,
  List,
  Plane,
  AlertCircle,
  Paperclip,
  Link2,
  Car,
  Bus,
  Train,
  Bed,
  Utensils,
  MoreHorizontal,
  ClipboardList,
  Filter,
  Navigation,
} from 'lucide-react';
import type { TripDNA } from '@/types/trip-dna';
import type { GeneratedActivity, GeneratedDay } from '@/lib/planning/itinerary-generator';
import type { CityAllocation } from '@/lib/planning/itinerary-allocations';
import { allocateDays, RECOMMENDED_NIGHTS, DEFAULT_NIGHTS } from '@/lib/planning/itinerary-allocations';
import { getTransportOptions } from '@/lib/planning/transport-options';
import dynamic from 'next/dynamic';
import { debug, debugWarn } from '@/lib/logger';
import { DashboardHeader } from '@/components/dashboard';

// Dynamically import HotelPicker, RouteMap, and ActivityMap
const HotelPicker = dynamic(() => import('./HotelPicker'), { ssr: false });
const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false });
const ActivityMap = dynamic(() => import('./ActivityMap'), { ssr: false });

// Day colors for visual distinction
const DAY_COLORS = [
  { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600' },
  { bg: 'bg-amber-500', light: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-600' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-600' },
  { bg: 'bg-violet-500', light: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-600' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600' },
  { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600' },
];

// Day names for closure checking
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_ABBREVS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Check if a place is closed on a given date and return any warnings
function getActivityWarnings(activity: GeneratedActivity, dateStr: string): string | null {
  if (!activity.openingHours) return null;

  const hours = activity.openingHours.toLowerCase();
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const dayOfWeek = date.getDay();
  const dayName = DAY_NAMES[dayOfWeek].toLowerCase();
  const dayAbbrev = DAY_ABBREVS[dayOfWeek].toLowerCase();
  const dayNameFull = DAY_NAMES[dayOfWeek];

  // Check for "Closed [Day]" patterns
  if (hours.includes(`closed ${dayName}`) ||
      hours.includes(`closed on ${dayName}`) ||
      hours.includes(`closed ${dayAbbrev}`)) {
    return `Closed on ${dayNameFull}`;
  }

  // Check for "Closed Mondays" plural pattern
  if (hours.includes(`closed ${dayName}s`)) {
    return `Closed on ${dayNameFull}s`;
  }

  // Check for specific day patterns like "Mon-Fri only" (closed on weekends)
  if (hours.includes('mon-fri') && (dayOfWeek === 0 || dayOfWeek === 6)) {
    return `Closed on ${dayNameFull} (weekdays only)`;
  }

  // Check for weekend-only places
  if ((hours.includes('sat-sun') || hours.includes('weekends')) && dayOfWeek >= 1 && dayOfWeek <= 5) {
    return `Closed on ${dayNameFull} (weekends only)`;
  }

  // Check for "Saturday Market" or similar - only open on specific days
  if (activity.name.toLowerCase().includes('saturday') && dayOfWeek !== 6) {
    return `Only open on Saturdays`;
  }
  if (activity.name.toLowerCase().includes('sunday') && dayOfWeek !== 0) {
    return `Only open on Sundays`;
  }

  return null;
}

// Route segment from route planning
interface RouteSegment {
  from: string;
  to: string;
  time: string;
}

// Selected route data from route planning
interface SelectedRouteData {
  id: string;
  label: string;
  connections: string[];
  totalTime: string;
  stops: number;
  segments: RouteSegment[];
  recommended?: boolean;
}

interface AutoItineraryViewProps {
  cities: string[];
  tripDna: TripDNA;
  duration?: number; // Total trip days
  startDate?: string; // Explicit start date prop (avoids remount issues)
  endDate?: string; // Explicit end date prop (avoids remount issues)
  selectedRoute?: SelectedRouteData | null; // Selected flight route from route planning
  onBack: () => void;
  getCityCountry?: (city: string) => string | undefined;
  onDatesChange?: (startDate: string, totalDays: number) => void; // Callback to sync dates back to parent
  initialAllocations?: CityAllocation[]; // Persisted allocations from parent
  onAllocationsChange?: (allocations: CityAllocation[]) => void; // Callback to sync allocations to parent
  initialGeneratedDays?: GeneratedDay[]; // Persisted generated days from parent
  onGeneratedDaysChange?: (days: GeneratedDay[]) => void; // Callback to sync days to parent
  parentLoadComplete?: boolean; // Signal that parent has finished loading from IndexedDB
  onSave?: () => void; // Callback when Save is clicked (to close section in Trip Hub)
}

// City to airport code mapping
const CITY_AIRPORTS: Record<string, string> = {
  'Kelowna': 'YLW', 'Vancouver': 'YVR',
  'Bangkok': 'BKK', 'Chiang Mai': 'CNX', 'Chiang Rai': 'CEI', 'Phuket': 'HKT', 'Krabi': 'KBV', 'Koh Samui': 'USM',
  'Ho Chi Minh City': 'SGN', 'Hanoi': 'HAN', 'Da Nang': 'DAD', 'Hoi An': 'DAD', 'Nha Trang': 'CXR',
  'Tokyo': 'NRT', 'Osaka': 'KIX', 'Kyoto': 'KIX', 'Hiroshima': 'HIJ', 'Fukuoka': 'FUK',
  'Honolulu': 'HNL', 'Maui': 'OGG', 'Kauai': 'LIH',
  'Singapore': 'SIN', 'Bali': 'DPS', 'Ubud': 'DPS',
  'Seoul': 'ICN', 'Busan': 'PUS',
  'Paris': 'CDG', 'London': 'LHR', 'New York': 'JFK', 'Rome': 'FCO', 'Barcelona': 'BCN', 'Amsterdam': 'AMS', 'Lisbon': 'LIS',
};

// Get airport code for a city
function getAirportCode(city: string): string {
  return CITY_AIRPORTS[city] || city.substring(0, 3).toUpperCase();
}

// Estimated flight times from Kelowna (rough estimates)
const FLIGHT_TIMES: Record<string, string> = {
  'Tokyo': '12-14hr', 'Osaka': '13-15hr', 'Bangkok': '18-22hr', 'Chiang Mai': '20-24hr',
  'Ho Chi Minh City': '18-22hr', 'Hanoi': '18-22hr', 'Singapore': '16-20hr', 'Bali': '20-24hr',
  'Honolulu': '8-10hr', 'Paris': '12-14hr', 'London': '10-12hr', 'Seoul': '12-14hr',
};

// Generate EMPTY days (no activities) - like Wanderlog
// BUT auto-adds transport on transit days (flight, bus, train, etc. based on route)
function generateEmptyDays(allocations: CityAllocation[], cities?: string[], homeBase?: string, selectedRoute?: SelectedRouteData | null): GeneratedDay[] {
  const days: GeneratedDay[] = [];
  let dayNumber = 1;
  const home = homeBase || 'Kelowna';
  const destinationCities = cities || [];

  for (let allocIndex = 0; allocIndex < allocations.length; allocIndex++) {
    const allocation = allocations[allocIndex];

    for (let i = 0; i < allocation.nights; i++) {
      const isTransit = allocation.city.includes('Transit');
      let activities: GeneratedActivity[] = [];
      let theme: string | undefined;

      // Auto-add transport for transit days
      if (isTransit && i === 0) { // Only add transport on first day of transit
        // Find the city BEFORE this transit
        let fromCity = home;
        let explicitTransportMode: string | undefined;
        for (let j = allocIndex - 1; j >= 0; j--) {
          if (!allocations[j].city.includes('Transit')) {
            fromCity = allocations[j].city;
            // Check if user explicitly set transportToNext
            explicitTransportMode = allocations[j].transportToNext;
            break;
          }
        }

        // Find the city AFTER this transit
        let toCity = home;
        for (let j = allocIndex + 1; j < allocations.length; j++) {
          if (!allocations[j].city.includes('Transit')) {
            toCity = allocations[j].city;
            break;
          }
        }

        // If first transit and toCity is still home, use first destination
        if (toCity === home && allocIndex === 0 && destinationCities.length > 0) {
          toCity = destinationCities[0];
        }

        // Look up transport options from route data
        const routeOptions = getTransportOptions(fromCity, toCity);
        const bestOption = routeOptions?.find(opt => opt.badge === 'best') || routeOptions?.[0];

        // Determine transport mode: explicit setting > route data "best" option > flight fallback
        const transportMode = explicitTransportMode || bestOption?.mode || 'flight';

        // Create transport activity based on mode
        // Type must match GeneratedActivity types
        type TransportActivityType = 'flight' | 'train' | 'bus' | 'drive' | 'transit';
        let activityName: string;
        let activityType: TransportActivityType;
        let duration: number;
        let tags: string[];
        let description: string;
        let priceRange: string = '$$';

        // Use route data for duration if available
        const routeDuration = bestOption?.durationMinutes;
        const routeDurationStr = bestOption?.duration;
        const routeOperator = bestOption?.operator;
        const routePrice = bestOption?.priceRange;

        if (transportMode === 'flight') {
          // Use selected route data if this is the initial flight from home
          if (fromCity === home && selectedRoute && selectedRoute.segments.length > 0) {
            // Build flight description from route segments
            const segmentDescriptions = selectedRoute.segments.map(seg => {
              const segFromCode = getAirportCode(seg.from);
              const segToCode = getAirportCode(seg.to);
              return `${segFromCode}→${segToCode} (${seg.time})`;
            });
            activityName = segmentDescriptions.join(' · ');
            activityType = 'flight';
            duration = 180 * selectedRoute.segments.length; // Rough estimate
            tags = ['flight', 'transit', 'needs-booking'];
            description = `${selectedRoute.label} · ${selectedRoute.totalTime} total · ${selectedRoute.stops} stop${selectedRoute.stops > 1 ? 's' : ''}`;
          } else {
            const fromCode = getAirportCode(fromCity);
            const toCode = getAirportCode(toCity);
            const flightTime = routeDurationStr || FLIGHT_TIMES[toCity] || FLIGHT_TIMES[fromCity] || '~3-5hr';
            activityName = `${fromCode}→${toCode} (${flightTime})`;
            activityType = 'flight';
            duration = routeDuration || 180;
            tags = ['flight', 'transit', 'needs-booking'];
            description = routeOperator ? `${routeOperator} · ${fromCity} to ${toCity}` : `Need to book · ${fromCity} to ${toCity}`;
          }
        } else if (transportMode === 'bus') {
          activityName = `Bus: ${fromCity} → ${toCity}`;
          if (routeDurationStr) activityName += ` (${routeDurationStr})`;
          activityType = 'bus';
          duration = routeDuration || 180;
          tags = ['bus', 'transit', 'needs-booking'];
          description = routeOperator ? `${routeOperator} · ${fromCity} to ${toCity}` : `Bus · ${fromCity} to ${toCity}`;
        } else if (transportMode === 'train') {
          activityName = `Train: ${fromCity} → ${toCity}`;
          if (routeDurationStr) activityName += ` (${routeDurationStr})`;
          activityType = 'train';
          duration = routeDuration || 120;
          tags = ['train', 'transit', 'needs-booking'];
          description = routeOperator ? `${routeOperator} · ${fromCity} to ${toCity}` : `Train · ${fromCity} to ${toCity}`;
        } else if (transportMode === 'drive' || transportMode === 'car') {
          activityName = `Drive: ${fromCity} → ${toCity}`;
          if (routeDurationStr) activityName += ` (${routeDurationStr})`;
          activityType = 'drive';
          duration = routeDuration || 180;
          tags = ['car', 'transit', 'driving'];
          description = `Self-drive · ${fromCity} to ${toCity}`;
        } else if (transportMode === 'ferry') {
          activityName = `Ferry: ${fromCity} → ${toCity}`;
          if (routeDurationStr) activityName += ` (${routeDurationStr})`;
          activityType = 'transit';
          duration = routeDuration || 120;
          tags = ['ferry', 'transit', 'needs-booking'];
          description = routeOperator ? `${routeOperator} · ${fromCity} to ${toCity}` : `Ferry · ${fromCity} to ${toCity}`;
        } else {
          activityName = `${fromCity} → ${toCity}`;
          if (routeDurationStr) activityName += ` (${routeDurationStr})`;
          activityType = 'transit';
          duration = routeDuration || 120;
          tags = ['transit', 'needs-booking'];
          description = `Transport · ${fromCity} to ${toCity}`;
        }

        if (routePrice) priceRange = routePrice;

        activities = [{
          id: `transport-${dayNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: activityName,
          type: activityType,
          description,
          suggestedTime: '10:00',
          duration,
          neighborhood: toCity,
          priceRange,
          tags,
          transportDetails: {
            from: fromCity,
            to: toCity,
            operator: routeOperator,
          },
        }];
        theme = `Travel to ${toCity}`;
      }

      days.push({
        dayNumber,
        date: allocation.startDate ? addDays(allocation.startDate, i) : '',
        city: allocation.city,
        activities,
        theme,
      });
      dayNumber++;
    }
  }

  return days;
}

// Parse date string without timezone issues (YYYY-MM-DD -> local date)
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Full date format like "Wednesday, February 11th"
function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st'
    : day === 2 || day === 22 ? 'nd'
    : day === 3 || day === 23 ? 'rd'
    : 'th';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).replace(/\d+/, `${day}${suffix}`);
}

export default function AutoItineraryView({
  cities,
  tripDna,
  duration: propDuration,
  startDate: propStartDate,
  endDate: propEndDate,
  selectedRoute,
  onBack,
  getCityCountry,
  onDatesChange,
  initialAllocations,
  onAllocationsChange,
  initialGeneratedDays,
  onGeneratedDaysChange,
  parentLoadComplete = false,
  onSave,
}: AutoItineraryViewProps) {
  // Get initial total days and start date
  // Priority: explicit props > tripDna > fallback
  // Using explicit props fixes date persistence when navigating between sections
  const initialTotalDays =
    propDuration ||
    (tripDna?.constraints as unknown as { duration?: { days?: number } })?.duration?.days ||
    tripDna?.constraints?.dates?.totalDays ||
    14;
  const initialStartDate =
    propStartDate ||
    (tripDna?.constraints as unknown as { startDate?: string })?.startDate ||
    tripDna?.constraints?.dates?.startDate ||
    new Date().toISOString().split('T')[0];

  // Editable trip dates state - managed locally, NOT synced from props
  // This allows users to freely edit dates without props overriding their changes
  const [tripStartDate, setTripStartDate] = useState(initialStartDate);
  const [tripTotalDays, setTripTotalDays] = useState(initialTotalDays);
  const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);
  const [isAllocationSheetOpen, setIsAllocationSheetOpen] = useState(false);
  // Start collapsed if allocations already saved, expanded only for new trips
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(() => {
    return !(initialAllocations && initialAllocations.length > 0);
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Computed end date
  const tripEndDate = addDays(tripStartDate, tripTotalDays - 1);

  // Total nights needed = days - 1 (you leave on the last day, don't sleep there)
  const tripTotalNights = tripTotalDays - 1;

  // Day allocation state - SIMPLE APPROACH:
  // Use initialAllocations directly if available, otherwise generate defaults
  // The key insight: initialAllocations comes from parent's savedAllocations state
  // which is populated from IndexedDB BEFORE this component renders (because parent
  // only renders us after persistenceLoaded=true)
  const [allocations, setAllocations] = useState<CityAllocation[]>(() => {
    debug('[AutoItinerary] useState init - initialAllocations:', initialAllocations?.length, 'parentLoadComplete:', parentLoadComplete);

    // If parent has loaded and has saved allocations, use them
    if (initialAllocations && initialAllocations.length > 0) {
      // Get unique cities from saved allocations (excluding transit)
      const savedUniqueCities = [...new Set(initialAllocations.filter(a => !a.city.includes('Transit')).map(a => a.city))];
      // Check if all saved cities exist in current route (order doesn't matter, route may have duplicates)
      const allCitiesPresent = savedUniqueCities.every(savedCity => cities.includes(savedCity));
      const routeCitiesInSaved = cities.every(city => savedUniqueCities.includes(city));

      if (allCitiesPresent && routeCitiesInSaved) {
        debug('[AutoItinerary] Using saved allocations from parent');
        return initialAllocations;
      }
      debug('[AutoItinerary] Cities mismatch - saved:', savedUniqueCities, 'current:', cities);
    }

    // No saved allocations or cities don't match - generate defaults
    // Use initialTotalDays - 1 because nights = days - 1 (you leave on last day)
    debug('[AutoItinerary] Generating default allocations');
    
    // Generate city allocations
    const cityAllocations = allocateDays(cities, initialTotalDays - 2, tripDna, initialStartDate); // -2 to leave room for transit
    
    // Auto-add transit day at the beginning for the initial flight
    if (cities.length > 0) {
      const transitAllocation: CityAllocation = {
        city: '✈️ In Transit',
        nights: 1,
        startDay: 1,
        endDay: 1,
        startDate: initialStartDate,
        endDate: initialStartDate,
      };
      
      // Recalculate days for city allocations (shift by 1)
      let currentDay = 2;
      const adjustedAllocations = cityAllocations.map(a => {
        const startDay = currentDay;
        const endDay = currentDay + a.nights - 1;
        currentDay = endDay + 1;
        return { ...a, startDay, endDay };
      });
      
      return [transitAllocation, ...adjustedAllocations];
    }
    
    return cityAllocations;
  });

  // Track if we loaded from saved data (to prevent regenerating on cities change)
  const [hasLoadedFromSaved, setHasLoadedFromSaved] = useState(
    () => initialAllocations && initialAllocations.length > 0
  );

  // Generated days - initialize from persisted data if available
  const [days, setDays] = useState<GeneratedDay[]>(() =>
    initialGeneratedDays && initialGeneratedDays.length > 0 ? initialGeneratedDays : []
  );
  const [isLoading, setIsLoading] = useState(() =>
    // If we have persisted days, don't show loading
    !(initialGeneratedDays && initialGeneratedDays.length > 0)
  );
  const [hasLoadedInitialDays] = useState(() =>
    initialGeneratedDays && initialGeneratedDays.length > 0
  );
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set(cities));
  const [isDurationExpanded, setIsDurationExpanded] = useState(false); // Collapsed by default

  // View mode: 'picture' | 'compact' | 'map'
  const [viewMode, setViewMode] = useState<'picture' | 'compact' | 'map'>('picture');

  // Category filter: 'all' | 'travel' | 'stay' | 'do'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'travel' | 'stay' | 'do'>('all');

  // Filter activities by category
  const filterActivitiesByCategory = useCallback((activities: GeneratedActivity[], filter: 'all' | 'travel' | 'stay' | 'do') => {
    if (filter === 'all') return activities;

    const travelTypes = ['flight', 'train', 'bus', 'drive', 'transit'];

    if (filter === 'travel') {
      return activities.filter(a => travelTypes.includes(a.type));
    }

    if (filter === 'stay') {
      // No dedicated accommodation type, filter by name keywords
      const stayKeywords = ['hotel', 'hostel', 'accommodation', 'check-in', 'check in', 'airbnb', 'resort', 'lodge', 'inn'];
      return activities.filter(a =>
        stayKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
      );
    }

    // 'do' = everything that's not travel or stay
    const stayKeywords = ['hotel', 'hostel', 'accommodation', 'check-in', 'check in', 'airbnb', 'resort', 'lodge', 'inn'];
    return activities.filter(a =>
      !travelTypes.includes(a.type) &&
      !stayKeywords.some(keyword => a.name.toLowerCase().includes(keyword))
    );
  }, []);

  // Track which activities we've already refreshed to avoid infinite loops
  const refreshedActivitiesRef = useRef<Set<string>>(new Set());

  // Detect and refresh activities without images
  // Fetches from Google Places API for activities missing images
  useEffect(() => {
    // Check for activities without images that haven't been refreshed yet
    const activitiesWithoutImages: { dayNumber: number; activityId: string; activityName: string; city: string }[] = [];

    days.forEach(day => {
      day.activities.forEach(activity => {
        if (!activity.imageUrl && !refreshedActivitiesRef.current.has(activity.id)) {
          activitiesWithoutImages.push({
            dayNumber: day.dayNumber,
            activityId: activity.id,
            activityName: activity.name,
            city: day.city
          });
        }
      });
    });

    if (activitiesWithoutImages.length === 0) return;

    debug(`[AutoItinerary] Found ${activitiesWithoutImages.length} activities without images, fetching from Google Places...`);

    // Mark these as being refreshed to avoid duplicate fetches
    activitiesWithoutImages.forEach(item => refreshedActivitiesRef.current.add(item.activityId));

    // Fetch real images from Google Places for each activity
    const fetchRealImages = async () => {
      const imageUpdates: Record<string, string> = {};

      // Fetch in parallel but limit concurrency
      const fetchPromises = activitiesWithoutImages.map(async (item) => {
        try {
          const response = await fetch(
            `/api/site-image?site=${encodeURIComponent(item.activityName)}&city=${encodeURIComponent(item.city)}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.imageUrl) {
              imageUpdates[item.activityId] = data.imageUrl;
              debug(`[AutoItinerary] Got Google Places image for ${item.activityName}`);
            }
          }
        } catch (error) {
          console.error(`[AutoItinerary] Failed to fetch image for ${item.activityName}:`, error);
        }
      });

      await Promise.all(fetchPromises);

      // Update days with new images
      if (Object.keys(imageUpdates).length > 0) {
        setDays(prev => prev.map(day => ({
          ...day,
          activities: day.activities.map(activity =>
            imageUpdates[activity.id]
              ? { ...activity, imageUrl: imageUpdates[activity.id] }
              : activity
          )
        })));
        debug(`[AutoItinerary] Updated ${Object.keys(imageUpdates).length} activities with Google Places images`);
      }
    };

    fetchRealImages();
  }, [days]); // Run whenever days change

  // Filtered days based on category filter
  const filteredDays = useMemo(() => {
    if (categoryFilter === 'all') return days;
    return days.map(day => ({
      ...day,
      activities: filterActivitiesByCategory(day.activities, categoryFilter)
    })).filter(day => day.activities.length > 0);
  }, [days, categoryFilter, filterActivitiesByCategory]);

  // Hotels per city
  const [selectedHotels, setSelectedHotels] = useState<Record<string, { name: string; id: string }>>({});
  const [hotelPickerCity, setHotelPickerCity] = useState<string | null>(null);

  // Activity detail drawer
  const [selectedActivity, setSelectedActivity] = useState<{ activity: GeneratedActivity; index: number } | null>(null);

  // Undo deletion state
  const [deletedActivity, setDeletedActivity] = useState<{
    activity: GeneratedActivity;
    dayNumber: number;
    index: number;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Full-screen map state
  const [mapSelectedIndex, setMapSelectedIndex] = useState(0);
  const [mapSelectedDay, setMapSelectedDay] = useState(1); // Which day to show in map view
  const [mapSelectedAllocationIdx, setMapSelectedAllocationIdx] = useState(0); // Which allocation (city visit) is selected
  const [mapPanelExpanded, setMapPanelExpanded] = useState(false); // Whether bottom panel is expanded (map collapsed)

  // Reservation modal state
  const [reservationModal, setReservationModal] = useState<{
    type: 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other';
    dayNumber: number;
  } | null>(null);

  // Sidebar calendar - track which day is in view
  const [activeDayNumber, setActiveDayNumber] = useState(1);
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to a specific day when clicking sidebar
  const scrollToDay = useCallback((dayNumber: number) => {
    const dayEl = dayRefs.current[dayNumber];
    if (dayEl) {
      dayEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveDayNumber(dayNumber);
    }
  }, []);

  // Flatten all activities for map navigation (with city/date info)
  const allActivitiesWithMeta = useMemo(() => {
    return days.flatMap(day => day.activities.map(activity => ({ ...activity, city: day.city, date: day.date, dayNumber: day.dayNumber })));
  }, [days]);

  // Activities for the selected day in map view
  const mapDayActivities = useMemo(() => {
    return allActivitiesWithMeta.filter(a => a.dayNumber === mapSelectedDay);
  }, [allActivitiesWithMeta, mapSelectedDay]);

  // Get all activities for drawer navigation
  const allActivities = days.flatMap(d => d.activities);
  const totalActivityCount = allActivities.length;

  // Handle activity tap
  const handleActivityTap = (activity: GeneratedActivity, index: number) => {
    setSelectedActivity({ activity, index });
  };

  // Handle activity delete with undo support
  const handleActivityDelete = (activityId: string) => {
    // Find the activity and its position before deleting
    let deletedInfo: { activity: GeneratedActivity; dayNumber: number; index: number } | null = null;

    days.forEach(day => {
      const idx = day.activities.findIndex(a => a.id === activityId);
      if (idx !== -1) {
        deletedInfo = {
          activity: day.activities[idx],
          dayNumber: day.dayNumber,
          index: idx,
        };
      }
    });

    if (deletedInfo) {
      // Clear any existing undo timeout
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }

      // Store for undo
      setDeletedActivity(deletedInfo);

      // Remove from days
      setDays(prev => prev.map(day => ({
        ...day,
        activities: day.activities.filter(a => a.id !== activityId),
      })));

      // Auto-clear undo option after 5 seconds
      undoTimeoutRef.current = setTimeout(() => {
        setDeletedActivity(null);
      }, 5000);
    }
  };

  // Undo activity deletion
  const handleUndoDelete = () => {
    if (!deletedActivity) return;

    // Clear timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }

    // Restore activity to its original position
    setDays(prev => prev.map(day => {
      if (day.dayNumber !== deletedActivity.dayNumber) return day;
      const newActivities = [...day.activities];
      newActivities.splice(deletedActivity.index, 0, deletedActivity.activity);
      return { ...day, activities: newActivities };
    }));

    setDeletedActivity(null);
  };

  // Handle activity time update
  const handleActivityTimeUpdate = (activityId: string, newTime: string) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.map(a =>
        a.id === activityId ? { ...a, suggestedTime: newTime } : a
      ),
    })));
  };

  // Handle activity cost update
  const handleActivityCostUpdate = (activityId: string, cost: number | undefined) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.map(a =>
        a.id === activityId ? { ...a, userCost: cost } : a
      ),
    })));
  };

  // Handle activity attachment add
  const handleActivityAttachmentAdd = (activityId: string, attachment: { type: 'ticket' | 'reservation' | 'link' | 'document'; name: string; url?: string }) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.map(a =>
        a.id === activityId ? { ...a, attachments: [...(a.attachments || []), attachment] } : a
      ),
    })));
  };

  // Handle opening reservation modal
  const handleAddReservation = (dayNumber: number, type: 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other') => {
    setReservationModal({ type, dayNumber });
  };

  // Handle adding a reservation/transport to a day
  const handleSaveReservation = (data: {
    name: string;
    type: 'flight' | 'train' | 'bus' | 'drive' | 'transit' | 'restaurant' | 'cafe' | 'activity' | 'attraction' | 'nightlife';
    description?: string;
    suggestedTime?: string;
    duration?: number;
    transportDetails?: {
      from: string;
      to: string;
      departureTime?: string;
      arrivalTime?: string;
      operator?: string;
      bookingRef?: string;
    };
    userCost?: number;
  }) => {
    if (!reservationModal) return;

    const newActivity: GeneratedActivity = {
      id: `res-${Date.now()}`,
      name: data.name,
      type: data.type,
      description: data.description,
      suggestedTime: data.suggestedTime,
      duration: data.duration,
      transportDetails: data.transportDetails,
      userCost: data.userCost,
    };

    setDays(prev => prev.map(day => {
      if (day.dayNumber !== reservationModal.dayNumber) return day;
      return {
        ...day,
        activities: [...day.activities, newActivity],
      };
    }));

    setReservationModal(null);
  };

  // Handle activity reorder within a day
  const handleActivityReorder = (dayNumber: number, fromIndex: number, toIndex: number) => {
    setDays(prev => prev.map(day => {
      if (day.dayNumber !== dayNumber) return day;
      const newActivities = [...day.activities];
      const [moved] = newActivities.splice(fromIndex, 1);
      newActivities.splice(toIndex, 0, moved);
      // Recalculate times based on new order
      const recalculatedActivities = newActivities.map((a, idx) => ({
        ...a,
        suggestedTime: `${9 + idx * 2}:00`, // Simple recalculation: 9am, 11am, 1pm, etc.
      }));
      return { ...day, activities: recalculatedActivities };
    }));
  };

  // Navigate drawer
  const navigateDrawer = (direction: 'prev' | 'next') => {
    if (!selectedActivity) return;
    const currentIdx = allActivities.findIndex(a => a.id === selectedActivity.activity.id);
    const newIdx = direction === 'prev' ? currentIdx - 1 : currentIdx + 1;
    if (newIdx >= 0 && newIdx < allActivities.length) {
      setSelectedActivity({ activity: allActivities[newIdx], index: newIdx + 1 });
    }
  };

  // Only recalculate allocations when CITIES actually change (not on mount)
  // Guard: If we started with saved allocations, don't regenerate unless cities change
  const [prevCities, setPrevCities] = useState(cities.join(','));
  useEffect(() => {
    const currentCitiesKey = cities.join(',');
    // Only regenerate if cities actually changed (not on initial mount)
    if (currentCitiesKey !== prevCities) {
      debug('[AutoItinerary] Cities CHANGED, regenerating allocations');
      setPrevCities(currentCitiesKey);
      setAllocations(allocateDays(cities, tripTotalNights, tripDna, tripStartDate));
      setHasLoadedFromSaved(false); // User changed cities, no longer using saved
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities.join(',')]); // Only cities

  // When trip start date changes, recalculate dates within existing allocations (preserve night counts)
  useEffect(() => {
    setAllocations(prev => {
      let currentDay = 1;
      return prev.map(a => {
        const startDay = currentDay;
        const endDay = currentDay + a.nights - 1;
        currentDay = endDay + 1;

        const start = parseLocalDate(tripStartDate);
        start.setDate(start.getDate() + startDay - 1);
        // End date is DEPARTURE date (day after last night), not last night
        const end = parseLocalDate(tripStartDate);
        end.setDate(end.getDate() + endDay);

        const formatLocalDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        return {
          ...a,
          startDay,
          endDay,
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
        };
      });
    });
  }, [tripStartDate]); // Only when start date changes

  // Handle trip date changes
  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    const start = parseLocalDate(newStartDate);
    const end = parseLocalDate(newEndDate);
    const newTotalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (newTotalDays > 0) {
      setTripStartDate(newStartDate);
      setTripTotalDays(newTotalDays);
      // Sync back to parent
      onDatesChange?.(newStartDate, newTotalDays);
      // NOTE: Allocations are NOT auto-updated when days change.
      // User can click "Auto-allocate" button to redistribute if needed.
    }
    setIsDateEditorOpen(false);
  };

  // Generate EMPTY itinerary on mount or when allocations change
  // BUT don't overwrite if we already have loaded days with activities
  // Flights are auto-added on transit days
  useEffect(() => {
    // If we already loaded persisted days, don't regenerate empty ones
    if (hasLoadedInitialDays) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    // Generate empty days immediately (no API call needed)
    // Pass cities so flights can be auto-added for transit days
    const timer = setTimeout(() => {
      setDays(generateEmptyDays(allocations, cities, 'Kelowna', selectedRoute));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [allocations, hasLoadedInitialDays, cities, selectedRoute]);

  // Keep days and activities in sync with allocations
  // When allocations change (city order), activities stay with their original city
  useEffect(() => {
    if (allocations.length === 0) return;

    // Build a map of dayNumber -> city from NEW allocations
    const newDayToCityMap: Record<number, string> = {};
    let dayNum = 1;
    for (const alloc of allocations) {
      for (let i = 0; i < alloc.nights; i++) {
        newDayToCityMap[dayNum] = alloc.city;
        dayNum++;
      }
    }

    const totalDaysNeeded = dayNum - 1;

    // If days array is empty, generate fresh
    if (days.length === 0) {
      debug('[AutoItinerary] No days, generating fresh with transport');
      setDays(generateEmptyDays(allocations, cities, 'Kelowna', selectedRoute));
      return;
    }

    // If day count changed, smart merge: preserve activities, add/remove days as needed
    if (days.length !== totalDaysNeeded) {
      debug('[AutoItinerary] Day count changed from', days.length, 'to', totalDaysNeeded);
      
      // Generate the new structure with transport
      const newDays = generateEmptyDays(allocations, cities, 'Kelowna', selectedRoute);
      
      // Preserve existing non-transport activities by city
      const activitiesByCity: Record<string, GeneratedActivity[]> = {};
      const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'drive', 'transit'];
      
      for (const day of days) {
        if (!day.city.includes('Transit') && day.activities.length > 0) {
          if (!activitiesByCity[day.city]) {
            activitiesByCity[day.city] = [];
          }
          const nonTransport = day.activities.filter(a => !TRANSPORT_TYPES.includes(a.type));
          activitiesByCity[day.city].push(...nonTransport);
        }
      }
      
      // Merge: keep transport from new days, add preserved activities
      const placedCountByCity: Record<string, number> = {};
      const mergedDays = newDays.map(newDay => {
        if (newDay.city.includes('Transit')) {
          // Transit day - keep as is (has transport activity)
          return newDay;
        }
        
        // Non-transit day - merge preserved activities
        const cityActivities = activitiesByCity[newDay.city] || [];
        const daysForCity = newDays.filter(d => d.city === newDay.city).length;
        const activitiesPerDay = Math.ceil(cityActivities.length / Math.max(daysForCity, 1));
        const startIdx = placedCountByCity[newDay.city] || 0;
        const endIdx = Math.min(startIdx + activitiesPerDay, cityActivities.length);
        const dayActivities = cityActivities.slice(startIdx, endIdx);
        placedCountByCity[newDay.city] = endIdx;
        
        return {
          ...newDay,
          activities: [...newDay.activities, ...dayActivities],
        };
      });
      
      setDays(mergedDays);
      return;
    }

    // Check if any day's city doesn't match the allocation
    let needsUpdate = false;
    for (const day of days) {
      const expectedCity = newDayToCityMap[day.dayNumber];
      if (expectedCity && day.city !== expectedCity) {
        needsUpdate = true;
        break;
      }
    }

    if (needsUpdate) {
      debug('[AutoItinerary] Re-syncing days - activities stay with their cities, transport regenerated');

      // Transport types to exclude from moving (will be regenerated)
      const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'drive', 'transit'];

      // Collect all NON-TRANSPORT activities grouped by their original city
      const activitiesByCity: Record<string, GeneratedActivity[]> = {};
      for (const day of days) {
        if (!day.city.includes('Transit') && day.activities.length > 0) {
          if (!activitiesByCity[day.city]) {
            activitiesByCity[day.city] = [];
          }
          // Only keep non-transport activities
          const nonTransport = day.activities.filter(a => !TRANSPORT_TYPES.includes(a.type));
          activitiesByCity[day.city].push(...nonTransport);
        }
      }

      // Build new days with correct cities and redistributed activities
      setDays(prev => {
        // Track which activities we've placed for each city
        const placedCountByCity: Record<string, number> = {};

        return prev.map((day, dayIdx) => {
          const newCity = newDayToCityMap[day.dayNumber];
          if (!newCity) return day;

          // Get activities for the new city (excluding transport)
          const cityActivities = activitiesByCity[newCity] || [];
          const placedCount = placedCountByCity[newCity] || 0;

          // How many days does this city have in the new allocation?
          const daysForCity = Object.values(newDayToCityMap).filter(c => c === newCity).length;
          const activitiesPerDay = Math.ceil(cityActivities.length / Math.max(daysForCity, 1));
          const startIdx = placedCount;
          const endIdx = Math.min(startIdx + activitiesPerDay, cityActivities.length);
          const dayActivities = cityActivities.slice(startIdx, endIdx);

          placedCountByCity[newCity] = endIdx;

          // Check if this is the FIRST day of a new city (need transport from previous city)
          const prevCity = dayIdx > 0 ? newDayToCityMap[prev[dayIdx - 1].dayNumber] : null;
          const isFirstDayOfCity = prevCity && prevCity !== newCity && !newCity.includes('Transit');

          if (isFirstDayOfCity && prevCity && !prevCity.includes('Transit')) {
            // Generate transport from previous city to this city
            const routeOptions = getTransportOptions(prevCity, newCity);
            const bestOption = routeOptions?.find(opt => opt.badge === 'best') || routeOptions?.[0];
            const transportMode = bestOption?.mode || 'flight';

            let transportActivity: GeneratedActivity | null = null;
            const routeDuration = bestOption?.durationMinutes || 180;
            const routeDurationStr = bestOption?.duration;
            const routeOperator = bestOption?.operator;

            if (transportMode === 'bus') {
              transportActivity = {
                id: `transport-${day.dayNumber}-${Date.now()}`,
                name: `Bus: ${prevCity} → ${newCity}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
                type: 'bus',
                duration: routeDuration,
                description: routeOperator ? `${routeOperator} · ${prevCity} to ${newCity}` : `Bus · ${prevCity} to ${newCity}`,
                tags: ['bus', 'transit', 'needs-booking'],
              };
            } else if (transportMode === 'train') {
              transportActivity = {
                id: `transport-${day.dayNumber}-${Date.now()}`,
                name: `Train: ${prevCity} → ${newCity}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
                type: 'train',
                duration: routeDuration,
                description: routeOperator ? `${routeOperator} · ${prevCity} to ${newCity}` : `Train · ${prevCity} to ${newCity}`,
                tags: ['train', 'transit', 'needs-booking'],
              };
            } else if (transportMode === 'drive') {
              transportActivity = {
                id: `transport-${day.dayNumber}-${Date.now()}`,
                name: `Drive: ${prevCity} → ${newCity}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
                type: 'drive',
                duration: routeDuration,
                description: `Drive · ${prevCity} to ${newCity}`,
                tags: ['drive', 'transit'],
              };
            } else {
              // Default to flight
              const fromCode = getAirportCode(prevCity);
              const toCode = getAirportCode(newCity);
              transportActivity = {
                id: `transport-${day.dayNumber}-${Date.now()}`,
                name: `${fromCode}→${toCode}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
                type: 'flight',
                duration: routeDuration,
                description: routeOperator ? `${routeOperator} · ${prevCity} to ${newCity}` : `Flight · ${prevCity} to ${newCity}`,
                tags: ['flight', 'transit', 'needs-booking'],
              };
            }

            if (transportActivity) {
              return {
                ...day,
                city: newCity,
                activities: [transportActivity, ...dayActivities],
              };
            }
          }

          return {
            ...day,
            city: newCity,
            activities: dayActivities,
          };
        });
      });
    }
  }, [allocations, days]);

  // Helper: Check if a day is a city transition (needs transport from previous city)
  const getTransitionInfo = (dayNumber: number): { isTransition: boolean; fromCity: string; toCity: string } | null => {
    const dayIdx = days.findIndex(d => d.dayNumber === dayNumber);
    if (dayIdx <= 0) return null;

    // Build day-to-city map from allocations
    const dayToCityMap: Record<number, string> = {};
    let dayNum = 1;
    for (const alloc of allocations) {
      for (let i = 0; i < alloc.nights; i++) {
        dayToCityMap[dayNum] = alloc.city;
        dayNum++;
      }
    }

    const currentCity = dayToCityMap[dayNumber];
    const prevCity = dayToCityMap[days[dayIdx - 1].dayNumber];

    if (!currentCity || !prevCity) return null;
    if (currentCity === prevCity) return null;
    if (currentCity.includes('Transit') || prevCity.includes('Transit')) return null;

    return { isTransition: true, fromCity: prevCity, toCity: currentCity };
  };

  // Helper: Check if a day has transport
  const dayHasTransport = (dayNumber: number): boolean => {
    const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'drive', 'transit'];
    const day = days.find(d => d.dayNumber === dayNumber);
    return day?.activities.some(a => TRANSPORT_TYPES.includes(a.type)) || false;
  };

  // Add transport to a day from route data
  const addTransportToDay = (dayNumber: number, mode?: string) => {
    const transitionInfo = getTransitionInfo(dayNumber);
    if (!transitionInfo) return;

    const { fromCity, toCity } = transitionInfo;
    const routeOptions = getTransportOptions(fromCity, toCity);
    const bestOption = routeOptions?.find(opt => opt.badge === 'best') || routeOptions?.[0];
    const transportMode = mode || bestOption?.mode || 'flight';

    const routeDuration = bestOption?.durationMinutes || 180;
    const routeDurationStr = bestOption?.duration;
    const routeOperator = bestOption?.operator;

    let transportActivity: GeneratedActivity;

    if (transportMode === 'bus') {
      transportActivity = {
        id: `transport-${dayNumber}-${Date.now()}`,
        name: `Bus: ${fromCity} → ${toCity}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
        type: 'bus',
        duration: routeDuration,
        description: routeOperator ? `${routeOperator} · ${fromCity} to ${toCity}` : `Bus · ${fromCity} to ${toCity}`,
        tags: ['bus', 'transit', 'needs-booking'],
      };
    } else if (transportMode === 'train') {
      transportActivity = {
        id: `transport-${dayNumber}-${Date.now()}`,
        name: `Train: ${fromCity} → ${toCity}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
        type: 'train',
        duration: routeDuration,
        description: routeOperator ? `${routeOperator} · ${fromCity} to ${toCity}` : `Train · ${fromCity} to ${toCity}`,
        tags: ['train', 'transit', 'needs-booking'],
      };
    } else if (transportMode === 'drive') {
      transportActivity = {
        id: `transport-${dayNumber}-${Date.now()}`,
        name: `Drive: ${fromCity} → ${toCity}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
        type: 'drive',
        duration: routeDuration,
        description: `Drive · ${fromCity} to ${toCity}`,
        tags: ['drive', 'transit'],
      };
    } else {
      const fromCode = getAirportCode(fromCity);
      const toCode = getAirportCode(toCity);
      transportActivity = {
        id: `transport-${dayNumber}-${Date.now()}`,
        name: `${fromCode}→${toCode}${routeDurationStr ? ` (${routeDurationStr})` : ''}`,
        type: 'flight',
        duration: routeDuration,
        description: routeOperator ? `${routeOperator} · ${fromCity} to ${toCity}` : `Flight · ${fromCity} to ${toCity}`,
        tags: ['flight', 'transit', 'needs-booking'],
      };
    }

    setDays(prev => prev.map(day => {
      if (day.dayNumber !== dayNumber) return day;
      return {
        ...day,
        activities: [transportActivity, ...day.activities],
      };
    }));
  };

  // Sync allocations back to parent whenever they change
  // BUT only after parent has finished loading from IndexedDB (to prevent overwriting saved data with defaults)
  useEffect(() => {
    // CRITICAL: Don't sync until parent has finished loading from IndexedDB
    // Otherwise we'll overwrite saved allocations with freshly-generated defaults
    if (!parentLoadComplete) {
      debug('[AutoItinerary] Parent not loaded yet, NOT syncing');
      return;
    }
    // Don't sync empty allocations - this would overwrite saved data
    if (allocations.length === 0) {
      debug('[AutoItinerary] Allocations empty, NOT syncing');
      return;
    }
    debug('[AutoItinerary] Syncing allocations to parent:', allocations.map(a => `${a.city}:${a.nights}`));
    onAllocationsChange?.(allocations);
  }, [allocations, onAllocationsChange, parentLoadComplete]);

  // Sync generated days to parent for persistence
  useEffect(() => {
    if (!parentLoadComplete) {
      return;
    }
    // Don't sync empty days - would overwrite saved data
    if (days.length === 0) {
      return;
    }
    // Only sync if we have activities (not just empty day shells)
    const hasActivities = days.some(d => d.activities.length > 0);
    if (!hasActivities) {
      return;
    }
    debug('[AutoItinerary] Syncing days to parent:', days.length, 'days');
    onGeneratedDaysChange?.(days);
  }, [days, onGeneratedDaysChange, parentLoadComplete]);

  // AI-powered auto-fill for a single city's days (with fallback to mock data)
  const autoFillCityDays = async (city: string, nights: number) => {
    debug(`[AutoFill API] Requesting ${nights} days for ${city}`);
    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city,
          nights,
          country: getCityCountry?.(city),
          tripStyle: tripDna?.vibeAndPace?.tripPace || 'balanced',
          interests: tripDna?.travelerProfile?.travelIdentities || [],
          budget: tripDna?.constraints?.budget?.dailySpend?.max
            ? (tripDna.constraints.budget.dailySpend.max < 100 ? 'budget' : tripDna.constraints.budget.dailySpend.max > 300 ? 'luxury' : 'moderate')
            : 'moderate',
        }),
      });

      if (!response.ok) {
        console.error(`[AutoFill API] Request failed with status ${response.status}`);
        throw new Error('Failed to generate itinerary');
      }

      const data = await response.json();
      debug(`[AutoFill API] Got ${data.days?.length || 0} days for ${city}:`,
        data.days?.map((d: { dayNumber: number; theme?: string; activities: { name: string }[] }) =>
          `Day ${d.dayNumber}: ${d.theme || 'no theme'} (${d.activities.length} activities: ${d.activities.map(a => a.name).slice(0, 2).join(', ')}...)`
        )
      );

      if (data.days && data.days.length > 0) {
        // Verify we got different days - check if activities are actually different
        if (data.days.length > 1) {
          const day1Names = data.days[0].activities.map((a: { name: string }) => a.name).sort().join(',');
          const day2Names = data.days[1].activities.map((a: { name: string }) => a.name).sort().join(',');
          if (day1Names === day2Names) {
            debugWarn(`[AutoFill API] WARNING: Day 1 and Day 2 have identical activities!`);
          }
        }
        return data.days;
      }
      throw new Error('No days returned');
    } catch (error) {
      console.error('[AutoFill API] Google Places itinerary failed for', city, error);
      // Return empty array - no fallback, only Google Places data
      return [];
    }
  };

  // Auto-fill a single day - ALWAYS fetch fresh from API to guarantee unique activities
  const [loadingDayNumber, setLoadingDayNumber] = useState<number | null>(null);

  const autoFillDay = async (dayNumber: number) => {
    const targetDay = days.find(d => d.dayNumber === dayNumber);
    if (!targetDay || targetDay.city.includes('Transit')) return;

    setLoadingDayNumber(dayNumber);

    // Collect ALL activity names already used in this city (across all days)
    const usedActivityNames = new Set<string>();
    days.forEach(d => {
      if (d.city === targetDay.city) {
        d.activities.forEach(a => {
          if (a.name) usedActivityNames.add(a.name.toLowerCase());
        });
      }
    });

    debug(`[AutoFill] Day ${dayNumber} of ${targetDay.city}, already used: ${usedActivityNames.size} activities`);

    // ALWAYS call API fresh - no caching to avoid stale data
    const cityNights = allocations.find(a => a.city === targetDay.city)?.nights || 3;

    try {
      const response = await fetch('/api/generate-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: targetDay.city,
          nights: 1, // Just request 1 day worth of activities
          country: getCityCountry?.(targetDay.city),
          tripStyle: tripDna?.vibeAndPace?.tripPace || 'balanced',
          interests: tripDna?.travelerProfile?.travelIdentities || [],
          budget: tripDna?.constraints?.budget?.dailySpend?.max
            ? (tripDna.constraints.budget.dailySpend.max < 100 ? 'budget' : tripDna.constraints.budget.dailySpend.max > 300 ? 'luxury' : 'moderate')
            : 'moderate',
          // Pass used activities so API can exclude them
          excludeActivities: Array.from(usedActivityNames),
        }),
      });

      if (!response.ok) throw new Error('API failed');

      const data = await response.json();
      const aiDay = data.days?.[0];

      if (aiDay && aiDay.activities) {
        // Filter out any activities that match used names (double-check)
        // Also exclude restaurants - user wants to pick their own dining spots
        const uniqueActivities = aiDay.activities.filter((act: GeneratedActivity) =>
          !usedActivityNames.has(act.name.toLowerCase()) &&
          act.type !== 'restaurant'
        );

        debug(`[AutoFill] Got ${aiDay.activities.length} activities, ${uniqueActivities.length} are unique (excluding restaurants)`);

        // Only replace activities if we have unique ones to add
        if (uniqueActivities.length > 0) {
          setDays(prev => prev.map(day => {
            if (day.dayNumber === dayNumber) {
              // PRESERVE existing transport activities (flight, train, bus, drive, transit)
              const existingTransport = day.activities.filter(a =>
                ['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type)
              );
              const newActivities = uniqueActivities.map((act: GeneratedActivity, idx: number) => ({
                ...act,
                id: `${day.city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${idx}-${Date.now()}`,
              }));
              return {
                ...day,
                theme: aiDay.theme,
                activities: [...existingTransport, ...newActivities],
              };
            }
            return day;
          }));
        } else {
          debug('[AutoFill] No unique activities found from API, keeping existing activities');
        }
      }
    } catch (error) {
      console.error('[AutoFill] Google Places API failed for', targetDay.city, error);
      // No fallback - only use Google Places data
    }

    setLoadingDayNumber(null);
  };

  // Auto-fill entire trip with AI-generated ACTIVITIES for each city
  // Flights are already auto-added on transit days by generateEmptyDays
  const autoFillEntireTrip = async () => {
    setIsLoading(true);

    // Collect all unique cities that need activities (exclude Transit)
    const citiesNeedingActivities = allocations
      .filter(a => !a.city.includes('Transit'))
      .map(a => a.city);
    const uniqueCities = [...new Set(citiesNeedingActivities)];

    debug('[AutoFill] Fetching activities from Google Places for cities:', uniqueCities);

    // Fetch activities for each city in parallel from Google Places API
    const cityActivitiesMap: Record<string, GeneratedActivity[]> = {};

    await Promise.all(uniqueCities.map(async (city) => {
      const cityNights = allocations.find(a => a.city === city)?.nights || 3;
      try {
        const response = await fetch('/api/generate-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            city,
            nights: cityNights,
            country: getCityCountry?.(city),
            tripStyle: tripDna?.vibeAndPace?.tripPace || 'balanced',
            interests: tripDna?.travelerProfile?.travelIdentities || [],
            budget: tripDna?.constraints?.budget?.dailySpend?.max
              ? (tripDna.constraints.budget.dailySpend.max < 100 ? 'budget' : tripDna.constraints.budget.dailySpend.max > 300 ? 'luxury' : 'moderate')
              : 'moderate',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Flatten all activities from all days
          const allActivities = (data.days || []).flatMap((d: { activities: GeneratedActivity[] }) => d.activities || []);
          cityActivitiesMap[city] = allActivities;
          debug(`[AutoFill] Got ${allActivities.length} activities from Google Places for ${city}`);
        } else {
          console.error(`[AutoFill] Google Places API returned ${response.status} for ${city}`);
          cityActivitiesMap[city] = [];
        }
      } catch (error) {
        console.error(`[AutoFill] Failed to fetch Google Places activities for ${city}:`, error);
        cityActivitiesMap[city] = [];
      }
    }));

    // Track used activities per city to avoid duplicates
    const usedActivitiesPerCity: Record<string, Set<string>> = {};
    uniqueCities.forEach(city => {
      usedActivitiesPerCity[city] = new Set();
    });

    // Now distribute activities across days
    setDays(prev => {
      let daysToProcess = prev;
      if (prev.length === 0) {
        daysToProcess = generateEmptyDays(allocations, cities, 'Kelowna', selectedRoute);
      }

      return daysToProcess.map((day) => {
        // Skip transit days - they already have flights from generateEmptyDays
        if (day.city.includes('Transit')) {
          return day;
        }

        // Get activities for this city from Google Places
        const cityActivities = cityActivitiesMap[day.city] || [];
        const usedSet = usedActivitiesPerCity[day.city] || new Set();

        // Pick 3-4 unused activities for this day
        const dayActivities: GeneratedActivity[] = [];
        const activitiesPerDay = 3 + (day.dayNumber % 2); // 3 or 4

        // Keep any existing transport activities (flight, train, bus, drive, transit)
        const existingTransport = day.activities.filter(a =>
          ['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type)
        );
        dayActivities.push(...existingTransport);

        for (const act of cityActivities) {
          if (dayActivities.length >= activitiesPerDay + existingTransport.length) break;
          if (usedSet.has(act.name.toLowerCase())) continue;
          // Skip restaurants - user picks their own dining spots
          if (act.type === 'restaurant') continue;

          usedSet.add(act.name.toLowerCase());
          dayActivities.push({
            ...act,
            id: `${day.city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${dayActivities.length}-${Date.now()}`,
          });
        }

        // Only replace if we found new non-transport activities
        const newNonTransportActivities = dayActivities.filter(a =>
          !['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type)
        );
        if (newNonTransportActivities.length > 0) {
          return {
            ...day,
            activities: dayActivities,
          };
        }
        // Keep existing activities if no new ones found
        return day;
      });
    });

    setIsLoading(false);
  };

  // Clear all activities (except transport) from entire trip
  const clearAllActivities = () => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.filter(a => 
        ['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type)
      ),
    })));
  };

  // Clear activities (except transport) from a specific day
  const clearDayActivities = (dayNumber: number) => {
    setDays(prev => prev.map(day => {
      if (day.dayNumber !== dayNumber) return day;
      return {
        ...day,
        activities: day.activities.filter(a => 
          ['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type)
        ),
      };
    }));
  };

  // Adjust allocation for a city - NO auto-balancing, user controls each city independently
  // Set allocation to a specific number of nights (by index to support duplicate cities)
  const setAllocationNights = (allocIndex: number, nights: number) => {
    const newNights = Math.max(1, Math.min(99, nights)); // Clamp between 1 and 99
    const currentNights = allocations[allocIndex]?.nights || 0;
    adjustAllocation(allocIndex, newNights - currentNights);
  };

  const adjustAllocation = (allocIndex: number, delta: number) => {
    setAllocations(prev => {
      if (allocIndex < 0 || allocIndex >= prev.length) return prev;

      const currentCity = prev[allocIndex];
      const newNights = Math.max(1, currentCity.nights + delta);

      // If no actual change, return as-is
      if (newNights === currentCity.nights) return prev;

      // Just update this city's nights - no balancing with other cities
      const newAllocations = prev.map((a, idx) => {
        if (idx === allocIndex) {
          return { ...a, nights: newNights };
        }
        return a;
      });

      // Recalculate start/end dates for all cities (they cascade from first city)
      let currentDay = 1;
      return newAllocations.map(a => {
        const startDay = currentDay;
        const endDay = currentDay + a.nights - 1;
        currentDay = endDay + 1;

        // Use parseLocalDate to avoid timezone issues
        const start = parseLocalDate(tripStartDate);
        start.setDate(start.getDate() + startDay - 1);
        // End date is DEPARTURE date (day after last night), not last night
        const end = parseLocalDate(tripStartDate);
        end.setDate(end.getDate() + endDay);

        const formatLocalDate = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        return {
          ...a,
          startDay,
          endDay,
          startDate: formatLocalDate(start),
          endDate: formatLocalDate(end),
        };
      });
    });
  };

  // Calculate current total
  const currentTotal = allocations.reduce((sum, a) => sum + a.nights, 0);

  // Toggle city expansion
  const toggleCity = (city: string) => {
    setExpandedCities(prev => {
      const next = new Set(prev);
      if (next.has(city)) {
        next.delete(city);
      } else {
        next.add(city);
      }
      return next;
    });
  };

  // Get days for a city
  const getDaysForCity = (city: string) => days.filter(d => d.city === city);

  // Get color for city index
  const getCityColor = (index: number) => DAY_COLORS[index % DAY_COLORS.length];

  // Get recommended nights for a city
  const getRecommendedNights = (city: string) => RECOMMENDED_NIGHTS[city] || DEFAULT_NIGHTS;

  // City colors for timeline bar - coral shades only
  const cityColors = [
    'bg-primary', 'bg-primary/80', 'bg-primary/60', 'bg-primary/40',
    'bg-rose-400', 'bg-rose-300', 'bg-red-400', 'bg-red-300'
  ];

  return (
    <div className="pb-20">
      {/* Compact Sticky Header - Dates only, editable */}
      <div className="sticky top-0 z-40 bg-background border-b py-3 -mx-4 px-4">
        <div className="flex items-center justify-end">
          {/* Editable dates */}
          <button
            onClick={() => {
              // TODO: Open date picker modal
              const newStart = prompt('Start date (YYYY-MM-DD):', tripStartDate);
              if (newStart && /^\d{4}-\d{2}-\d{2}$/.test(newStart)) {
                setTripStartDate(newStart);
              }
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span>{formatDate(tripStartDate)} - {formatDate(tripEndDate)}</span>
          </button>
        </div>
      </div>

      {/* Trip Breakdown - Collapsible (not sticky) */}
      <div className="mt-3 mb-4">
        <button
          onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Trip Breakdown</span>
            <span className="text-xs text-muted-foreground">
              {currentTotal === tripTotalNights
                ? `${tripTotalNights} nights across ${allocations.filter(a => !a.city.includes('Transit')).length} cities`
                : `${tripTotalNights - currentTotal} nights remaining`
              }
            </span>
          </div>
          <div className="flex items-center gap-2">
            {currentTotal !== tripTotalNights && (
              <span className="w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">!</span>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isBreakdownExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isBreakdownExpanded && (
          <div className="mt-2 p-3 bg-muted/30 rounded-xl space-y-3">
            {/* City allocations */}
            <div className="space-y-2">
              {allocations.map((alloc, allocIndex) => {
                const isTransit = alloc.city.includes('Transit');
                const colorClass = isTransit ? 'bg-gray-400' : cityColors[allocIndex % cityColors.length];
                return (
                  <div key={`${alloc.city}-${allocIndex}`} className="flex items-center gap-3 p-2 rounded-lg bg-background">
                    <div className={`w-2 h-6 rounded-full ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{alloc.city}</div>
                      <div className="text-xs text-muted-foreground">
                        {alloc.nights} {alloc.nights === 1 ? 'night' : 'nights'}
                      </div>
                    </div>
                    {!isTransit && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.stopPropagation(); adjustAllocation(allocIndex, -1); }}
                          disabled={alloc.nights <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{alloc.nights}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => { e.stopPropagation(); adjustAllocation(allocIndex, 1); }}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Status and Save button */}
            <div className="flex items-center justify-between">
              <span className={`text-xs ${
                currentTotal === tripTotalNights ? 'text-green-600' : 'text-amber-600'
              }`}>
                {currentTotal === tripTotalNights
                  ? '✓ All nights allocated'
                  : currentTotal > tripTotalNights
                    ? `${currentTotal - tripTotalNights} nights over`
                    : `${tripTotalNights - currentTotal} nights remaining`
                }
              </span>
              <Button
                size="sm"
                onClick={() => setIsBreakdownExpanded(false)}
                disabled={currentTotal !== tripTotalNights}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Allocation Sheet (Bottom Sheet) */}
      <Sheet open={isAllocationSheetOpen} onOpenChange={setIsAllocationSheetOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Dates & Nights</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* Date Editors */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Trip Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Start</label>
                  <input
                    type="date"
                    value={tripStartDate}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      setTripStartDate(newStart);
                      onDatesChange?.(newStart, tripTotalDays);
                    }}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">End</label>
                  <input
                    type="date"
                    value={tripEndDate}
                    onChange={(e) => handleDateChange(tripStartDate, e.target.value)}
                    min={tripStartDate}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{tripTotalDays} days, {tripTotalNights} nights</p>
            </div>

            {/* Status message */}
            <div className={`px-3 py-2 rounded-lg text-sm ${
              currentTotal === tripTotalNights
                ? 'bg-green-50 text-green-700 border border-green-200'
                : currentTotal > tripTotalNights
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {currentTotal === tripTotalNights
                ? '✓ All nights allocated!'
                : currentTotal > tripTotalNights
                  ? `⚠️ ${currentTotal - tripTotalNights} nights over`
                  : `📝 ${tripTotalNights - currentTotal} nights remaining`
              }
              {currentTotal !== tripTotalNights && (
                <button
                  onClick={() => setAllocations(allocateDays(cities, tripTotalNights, tripDna, tripStartDate))}
                  className="ml-2 px-2 py-0.5 text-xs font-medium bg-white/80 hover:bg-white border rounded"
                >
                  Auto-allocate
                </button>
              )}
            </div>

            {/* Calendar + Nights per City side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendar View - Left side */}
              {(() => {
                // Only show the trip start month
                const startParts = tripStartDate.split('-').map(Number);
                const year = startParts[0];
                const monthNum = startParts[1] - 1;
                const monthName = new Date(year, monthNum, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

                // Helper to check if date is in trip
                const isDateInTrip = (dateStr: string): boolean => {
                  return dateStr >= tripStartDate && dateStr <= tripEndDate;
                };

                // Get first day of month and total days
                const firstDay = new Date(year, monthNum, 1).getDay();
                const daysInMonth = new Date(year, monthNum + 1, 0).getDate();

                // Build calendar grid
                const cells: (number | null)[] = [];
                // Add empty cells for days before month starts
                for (let i = 0; i < firstDay; i++) cells.push(null);
                // Add days
                for (let d = 1; d <= daysInMonth; d++) cells.push(d);

                return (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Calendar</h3>
                    <div>
                      <div className="text-sm font-medium text-center mb-2">{monthName}</div>
                      <div className="grid grid-cols-7 gap-0.5 text-xs">
                        {/* Day headers */}
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <div key={day} className="text-center text-muted-foreground py-1">{day}</div>
                        ))}
                        {/* Calendar cells */}
                        {cells.map((day, cellIdx) => {
                          if (day === null) {
                            return <div key={`empty-${cellIdx}`} className="h-7" />;
                          }

                          const dateStr = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isInTrip = isDateInTrip(dateStr);

                          return (
                            <div
                              key={`day-${day}`}
                              className={`h-7 flex items-center justify-center rounded ${
                                isInTrip ? 'bg-primary/20 font-medium' : 'text-muted-foreground/50'
                              }`}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* City allocations - Right side */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Nights per City</h3>
              {allocations.map((alloc, allocIndex) => {
                const recommended = getRecommendedNights(alloc.city);
                const isTransit = alloc.city.includes('Transit');
                const colorClass = isTransit ? 'bg-gray-400' : cityColors[allocIndex % cityColors.length];
                return (
                  <div key={`${alloc.city}-${allocIndex}`} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                    <div className={`w-3 h-8 rounded-full ${colorClass}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{alloc.city}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(alloc.startDate || '')} - {formatDate(alloc.endDate || '')}
                        {!isTransit && <span className="ml-1">({recommended}n rec)</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isTransit ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={() => {
                            setAllocations(prev => {
                              const newAllocations = prev.filter((_, idx) => idx !== allocIndex);
                              let currentDay = 1;
                              return newAllocations.map(a => {
                                const startDay = currentDay;
                                const endDay = currentDay + a.nights - 1;
                                currentDay = endDay + 1;
                                const start = parseLocalDate(tripStartDate);
                                start.setDate(start.getDate() + startDay - 1);
                                const end = parseLocalDate(tripStartDate);
                                end.setDate(end.getDate() + endDay);
                                const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                return { ...a, startDay, endDay, startDate: fmt(start), endDate: fmt(end) };
                              });
                            });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          value={alloc.nights}
                          onChange={(e) => {
                            const newNights = parseInt(e.target.value) || 1;
                            if (newNights >= 1) {
                              const diff = newNights - alloc.nights;
                              adjustAllocation(allocIndex, diff);
                            }
                          }}
                          className="w-12 h-7 text-center font-semibold text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add Transit Day button */}
              <button
                onClick={() => {
                  // Create transit allocation
                  const transitAllocation: CityAllocation = {
                    city: '✈️ In Transit',
                    nights: 1,
                    startDay: 1,
                    endDay: 1,
                    startDate: tripStartDate,
                    endDate: tripStartDate,
                  };
                  
                  // Update allocations
                  const newAllocations = [transitAllocation, ...allocations];
                  let currentDay = 1;
                  const updatedAllocations = newAllocations.map(a => {
                    const startDay = currentDay;
                    const endDay = currentDay + a.nights - 1;
                    currentDay = endDay + 1;
                    const start = parseLocalDate(tripStartDate);
                    start.setDate(start.getDate() + startDay - 1);
                    const end = parseLocalDate(tripStartDate);
                    end.setDate(end.getDate() + endDay);
                    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    return { ...a, startDay, endDay, startDate: fmt(start), endDate: fmt(end) };
                  });
                  
                  // Generate new days structure with transport
                  const newDays = generateEmptyDays(updatedAllocations, cities, 'Kelowna', selectedRoute);
                  
                  // Preserve existing activities from current days
                  const TRANSPORT_TYPES = ['flight', 'train', 'bus', 'drive', 'transit'];
                  const activitiesByCity: Record<string, GeneratedActivity[]> = {};
                  for (const day of days) {
                    if (!day.city.includes('Transit') && day.activities.length > 0) {
                      if (!activitiesByCity[day.city]) activitiesByCity[day.city] = [];
                      activitiesByCity[day.city].push(...day.activities.filter(a => !TRANSPORT_TYPES.includes(a.type)));
                    }
                  }
                  
                  // Merge: transit days get transport, city days get their activities back
                  const placedCountByCity: Record<string, number> = {};
                  const mergedDays = newDays.map(newDay => {
                    if (newDay.city.includes('Transit')) return newDay; // Keep transport
                    const cityActivities = activitiesByCity[newDay.city] || [];
                    const daysForCity = newDays.filter(d => d.city === newDay.city).length;
                    const perDay = Math.ceil(cityActivities.length / Math.max(daysForCity, 1));
                    const startIdx = placedCountByCity[newDay.city] || 0;
                    const endIdx = Math.min(startIdx + perDay, cityActivities.length);
                    placedCountByCity[newDay.city] = endIdx;
                    return { ...newDay, activities: [...newDay.activities, ...cityActivities.slice(startIdx, endIdx)] };
                  });
                  
                  setAllocations(updatedAllocations);
                  setDays(mergedDays);
                }}
                className="w-full py-2 px-3 border-2 border-dashed border-muted-foreground/30 rounded-lg text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
              >
                <Plane className="w-4 h-4" />
                Add Transit Day
              </button>
              </div>
            </div>

            <Button onClick={() => {
              setIsAllocationSheetOpen(false);
              onSave?.(); // Also close the section in Trip Hub
            }} className="w-full">
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Actions bar: Auto-fill, Clear, and Filter */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Auto-fill entire trip button */}
        <Button
          variant="default"
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={autoFillEntireTrip}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Auto-fill trip
        </Button>

        {/* Clear all activities button */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllActivities}
          className="text-muted-foreground hover:text-destructive hover:border-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        {/* Filter dropdown */}
        <div className="relative">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-1"
          >
            <Filter className="w-4 h-4" />
            {categoryFilter === 'all' ? 'Filter' : categoryFilter === 'travel' ? 'Travel' : categoryFilter === 'stay' ? 'Stay' : 'Do'}
            <ChevronDown className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </Button>
          
          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-background border rounded-lg shadow-lg z-50 py-1">
              {[
                { id: 'all', label: 'All', icon: null },
                { id: 'travel', label: 'Travel', icon: '✈️' },
                { id: 'stay', label: 'Stay', icon: '🏨' },
                { id: 'do', label: 'Do', icon: '🎯' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { setCategoryFilter(item.id as typeof categoryFilter); setIsFilterOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 ${
                    categoryFilter === item.id ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  {item.label}
                  {categoryFilter === item.id && <Check className="w-3 h-3 ml-auto" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Generating your itinerary...</p>
        </div>
      )}

      {/* Map View - Full screen overlay */}
      {!isLoading && viewMode === 'map' && (() => {
        // Calculate day ranges for each allocation
        const allocationDayRanges: { start: number; end: number; days: typeof days }[] = [];
        let dayCounter = 1;
        allocations.forEach((alloc) => {
          const nights = Math.max(1, alloc.nights || 1);
          const allocDays = days.filter(d => d.dayNumber >= dayCounter && d.dayNumber < dayCounter + nights);
          allocationDayRanges.push({ start: dayCounter, end: dayCounter + nights - 1, days: allocDays });
          dayCounter += nights;
        });
        
        const selectedAlloc = allocations[mapSelectedAllocationIdx] || allocations[0];
        const selectedRange = allocationDayRanges[mapSelectedAllocationIdx] || allocationDayRanges[0];
        const allocDays = selectedRange?.days || [];
        
        return (
          <div className="fixed inset-0 z-50 bg-white flex flex-col">
            {/* Full nav header */}
            <DashboardHeader activeTab="trips" />

            {/* Map section - collapses when panel expanded */}
            <div className={`flex-shrink-0 relative transition-all duration-300 ${mapPanelExpanded ? 'h-[15vh]' : 'h-[40vh]'}`}>
              <ActivityMap
                days={days.filter(d => d.dayNumber === mapSelectedDay)}
                selectedActivityId={mapDayActivities[mapSelectedIndex]?.id}
                onActivitySelect={(activity) => {
                  const idx = mapDayActivities.findIndex(a => a.id === activity.id);
                  if (idx >= 0) setMapSelectedIndex(idx);
                }}
              />
              {/* Back button on map */}
              <button
                onClick={() => setViewMode('picture')}
                className="absolute top-3 left-3 z-[30] px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-sm font-medium text-gray-700 shadow-sm"
              >
                ← Back
              </button>
            </div>

            {/* Bottom section - scrollable content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Drag handle to expand/collapse */}
              <button 
                onClick={() => setMapPanelExpanded(!mapPanelExpanded)}
                className="flex-shrink-0 w-full py-1.5 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-1 rounded-full bg-gray-300" />
              </button>

              {/* City tabs - underline style, each allocation is SEPARATE */}
              <div className="flex-shrink-0 bg-white px-4 pt-3 border-b overflow-x-auto">
                <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
                  {allocations.map((alloc, idx) => {
                    const isTransit = alloc.city.toLowerCase().includes('transit') || alloc.nights === 0;
                    const isSelected = mapSelectedAllocationIdx === idx;
                    const range = allocationDayRanges[idx];
                    
                    return (
                      <button
                        key={`alloc-${idx}`}
                        onClick={() => {
                          setMapSelectedAllocationIdx(idx);
                          const firstDay = range?.days[0]?.dayNumber || 1;
                          setMapSelectedDay(firstDay);
                          setMapSelectedIndex(0);
                        }}
                        className={`pb-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                          isSelected
                            ? 'text-gray-900 border-gray-900'
                            : 'text-gray-400 border-transparent hover:text-gray-600'
                        }`}
                      >
                        {isTransit ? '✈️ In Transit' : `${alloc.city} (${alloc.nights})`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day tabs - RELATIVE numbering (Day 1, Day 2 within this allocation only) */}
              {allocDays.length > 0 && (
                <div className="flex-shrink-0 bg-white px-4 pt-2 border-b overflow-x-auto">
                  <div className="flex gap-6" style={{ minWidth: 'max-content' }}>
                    {allocDays.map((day, dayIdx) => {
                      const isSelected = mapSelectedDay === day.dayNumber;
                      return (
                        <button
                          key={day.dayNumber}
                          onClick={() => {
                            setMapSelectedDay(day.dayNumber);
                            setMapSelectedIndex(0);
                          }}
                          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${
                            isSelected
                              ? 'text-gray-900 border-gray-900'
                              : 'text-gray-400 border-transparent hover:text-gray-600'
                          }`}
                        >
                          Day {dayIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}



            {/* Activity list - SAME as compact/timeline view */}
            <div className="flex-1 overflow-y-auto">
              {mapDayActivities.length > 0 ? (
                <div className="divide-y">
                  {mapDayActivities.map((activity, idx) => {
                    const isTransport = ['flight', 'train', 'bus', 'drive', 'transit'].includes(activity.type);
                    const activityNumber = mapDayActivities
                      .slice(0, idx + 1)
                      .filter(a => !['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type))
                      .length;
                    const walkingTime = activity.walkingTimeToNext;
                    const displayKm = walkingTime ? (walkingTime * 0.08).toFixed(1) : null;
                    const nextActivity = idx < mapDayActivities.length - 1 ? mapDayActivities[idx + 1] : null;
                    const nextIsTransport = nextActivity && ['flight', 'train', 'bus', 'drive', 'transit'].includes(nextActivity.type);

                    // Transport items render as connectors, not cards
                    if (isTransport) {
                      return (
                        <div key={activity.id} className="flex items-center gap-3 px-4 py-2 bg-blue-50 border-y border-blue-100">
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            {activity.type === 'flight' && <Plane className="w-4 h-4" />}
                            {activity.type === 'train' && <Train className="w-4 h-4" />}
                            {activity.type === 'bus' && <Bus className="w-4 h-4" />}
                            {(activity.type === 'drive' || activity.type === 'transit') && <Car className="w-4 h-4" />}
                            <span className="font-medium">{activity.name}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={activity.id}>
                        {/* Activity card - compact/timeline style */}
                        <div
                          className={`flex items-center gap-3 p-3 ${
                            mapSelectedIndex === idx ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => setMapSelectedIndex(idx)}
                        >
                          {/* Number */}
                          <span className="w-5 text-sm text-gray-400 flex-shrink-0">{activityNumber}.</span>

                          {/* Image */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            {activity.imageUrl ? (
                              <img src={activity.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{activity.name}</h4>
                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-0.5">
                              🎯 Attractions
                            </span>
                          </div>
                        </div>

                        {/* Walking time connector - always show like compact view */}
                        {nextActivity && (
                          <div className="flex items-center gap-3 pl-9 py-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Footprints className="w-3.5 h-3.5" />
                              <span>{walkingTime || '?'} min • {displayKm || '?'} km</span>
                              <span className="text-gray-300">&gt;</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const city = days.find(d => d.dayNumber === mapSelectedDay)?.city || '';
                                  const origin = encodeURIComponent(activity.name + ' ' + city);
                                  const dest = encodeURIComponent(nextActivity.name + ' ' + city);
                                  window.open(`https://www.google.com/maps/dir/${origin}/${dest}`, '_blank');
                                }}
                                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full transition-colors"
                              >
                                <Navigation className="w-3 h-3" />
                                Directions
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <MapPin className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500">No activities for this day</p>
                </div>
              )}
            </div>
            </div>
          </div>
        );
      })()}

      {/* Days - chronological like Wanderlog (Picture & Compact views) */}
      {!isLoading && viewMode !== 'map' && filteredDays.map((day, idx) => {
        const cityIdx = allocations.findIndex(a => a.city === day.city);
        const color = getCityColor(cityIdx >= 0 ? cityIdx : 0);

        // Check if this day needs transport (is a city transition without transport)
        const transitionInfo = getTransitionInfo(day.dayNumber);
        const needsTransport = transitionInfo && !dayHasTransport(day.dayNumber);

        // Check if this is the first day in this city
        const prevDay = idx > 0 ? filteredDays[idx - 1] : null;
        const isFirstDayInCity = !prevDay || prevDay.city !== day.city;

        return (
          <DayCard
            key={day.dayNumber}
            day={day}
            color={color}
            viewMode={viewMode}
            onActivityTap={handleActivityTap}
            onActivityDelete={handleActivityDelete}
            onActivityTimeUpdate={handleActivityTimeUpdate}
            onActivityCostUpdate={handleActivityCostUpdate}
            onActivityAttachmentAdd={handleActivityAttachmentAdd}
            onActivityReorder={(fromIdx, toIdx) => handleActivityReorder(day.dayNumber, fromIdx, toIdx)}
            onAutoFill={() => autoFillDay(day.dayNumber)}
            onClearDay={() => clearDayActivities(day.dayNumber)}
            onAddReservation={(type) => handleAddReservation(day.dayNumber, type)}
            isLoadingDay={loadingDayNumber === day.dayNumber}
            missingTransport={needsTransport ? transitionInfo : null}
            onAddTransport={(mode) => addTransportToDay(day.dayNumber, mode)}
            isFirstDayInCity={isFirstDayInCity}
          />
        );
      })}

      {/* Empty state when filter has no results */}
      {!isLoading && viewMode !== 'map' && filteredDays.length === 0 && categoryFilter !== 'all' && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            {categoryFilter === 'travel' && <Plane className="w-8 h-8 text-muted-foreground" />}
            {categoryFilter === 'stay' && <Hotel className="w-8 h-8 text-muted-foreground" />}
            {categoryFilter === 'do' && <MapPin className="w-8 h-8 text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground font-medium">
            No {categoryFilter === 'travel' ? 'travel' : categoryFilter === 'stay' ? 'accommodations' : 'activities'} found
          </p>
          <button
            onClick={() => setCategoryFilter('all')}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Show all
          </button>
        </div>
      )}

      {/* Hotel Picker Modal */}
      {hotelPickerCity && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Hotels in {hotelPickerCity}</h3>
              <Button variant="ghost" size="sm" onClick={() => setHotelPickerCity(null)}>
                Close
              </Button>
            </div>
            <HotelPicker
              city={hotelPickerCity}
              country={getCityCountry?.(hotelPickerCity)}
              onSelectHotel={(hotel) => {
                setSelectedHotels(prev => ({
                  ...prev,
                  [hotelPickerCity!]: { name: hotel.name, id: hotel.id },
                }));
                setHotelPickerCity(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Activity Detail Drawer */}
      <ActivityDetailDrawer
        activity={selectedActivity?.activity ?? null}
        index={selectedActivity?.index ?? 0}
        totalCount={totalActivityCount}
        onClose={() => setSelectedActivity(null)}
        onPrev={() => navigateDrawer('prev')}
        onNext={() => navigateDrawer('next')}
      />

      {/* Add Reservation Modal */}
      {reservationModal && (
        <AddReservationModal
          type={reservationModal.type}
          dayNumber={reservationModal.dayNumber}
          onClose={() => setReservationModal(null)}
          onSave={handleSaveReservation}
        />
      )}

      {/* Undo Delete Toast */}
      {deletedActivity && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center gap-3 bg-gray-900 text-white rounded-full px-4 py-2.5 shadow-lg">
            <Trash2 className="w-4 h-4 text-gray-400" />
            <span className="text-sm">
              &quot;{deletedActivity.activity.name}&quot; deleted
            </span>
            <button
              onClick={handleUndoDelete}
              className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              Undo
            </button>
            <button
              onClick={() => setDeletedActivity(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating View Mode Toggle - Wanderlog style (always visible so user can navigate back) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
        <div className="flex items-center gap-1 bg-gray-900 rounded-full px-1 py-1 shadow-lg">
          <button
            onClick={() => setViewMode('picture')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'picture' ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            Picture
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'compact' ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" />
            Compact
          </button>
          <button
            onClick={() => {
              setMapSelectedDay(activeDayNumber); // Open to current day being viewed
              setMapSelectedIndex(0);
              setViewMode('map');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              viewMode === 'map' ? 'bg-white text-gray-900' : 'text-white/80 hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>
    </div>
  );
}

// ============ DAY CARD COMPONENT ============

type ReservationType = 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other';

interface DayCardProps {
  day: GeneratedDay;
  color: typeof DAY_COLORS[0];
  viewMode: 'picture' | 'compact';
  onActivityTap: (activity: GeneratedActivity, index: number) => void;
  onActivityDelete: (activityId: string) => void;
  onActivityTimeUpdate: (activityId: string, newTime: string) => void;
  onActivityCostUpdate: (activityId: string, cost: number | undefined) => void;
  onActivityAttachmentAdd: (activityId: string, attachment: { type: 'ticket' | 'reservation' | 'link' | 'document'; name: string; url?: string }) => void;
  onActivityReorder: (fromIndex: number, toIndex: number) => void;
  onAutoFill: () => void;
  onClearDay: () => void;
  onAddReservation: (type: ReservationType) => void;
  isLoadingDay?: boolean; // True when this specific day is being auto-filled
  dayRef?: (el: HTMLDivElement | null) => void; // Ref callback for scroll-to-day
  missingTransport?: { isTransition: boolean; fromCity: string; toCity: string } | null;
  onAddTransport?: (mode?: string) => void;
  isFirstDayInCity?: boolean;
}

function DayCard({ day, color, viewMode, onActivityTap, onActivityDelete, onActivityTimeUpdate, onActivityCostUpdate, onActivityAttachmentAdd, onActivityReorder, onAutoFill, onClearDay, onAddReservation, isLoadingDay, dayRef, missingTransport, onAddTransport, isFirstDayInCity }: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHotelPrompt, setShowHotelPrompt] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingCostId, setEditingCostId] = useState<string | null>(null);
  const [attachmentModalId, setAttachmentModalId] = useState<string | null>(null);
  const [newAttachment, setNewAttachment] = useState<{ type: 'ticket' | 'reservation' | 'link' | 'document'; name: string; url: string }>({ type: 'link', name: '', url: '' });
  const [directionsDropdownId, setDirectionsDropdownId] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<'walk' | 'drive' | 'bus'>('walk');
  const [showDayMenu, setShowDayMenu] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const activitySummary = day.activities.map(a => a.name).join(' • ');
  const isEmpty = day.activities.length === 0;

  // Calculate total time for day
  const totalMinutes = day.activities.reduce((sum, a) => sum + (a.duration || 60), 0);
  const totalMiles = day.activities.reduce((sum, a) => sum + (a.walkingTimeToNext || 0) * 0.05, 0);

  return (
    <div className="border-b pb-2">
      {/* Day header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left py-2"
      >
        <div className="flex items-start gap-3">
          <ChevronRight className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform mt-1 ${isExpanded ? 'rotate-90' : ''}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{formatFullDate(day.date)}</h3>
                <p className="text-sm text-muted-foreground">{day.city}</p>
              </div>
              <div className="relative">
                <button
                  className="p-1 hover:bg-muted rounded"
                  onClick={(e) => { e.stopPropagation(); setShowDayMenu(!showDayMenu); }}
                >
                  <span className="text-muted-foreground text-lg">•••</span>
                </button>
                {showDayMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddReservation('flight'); setShowDayMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Plane className="w-4 h-4" /> Add flight
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddReservation('lodging'); setShowDayMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Bed className="w-4 h-4" /> Add lodging
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddReservation('restaurant'); setShowDayMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Utensils className="w-4 h-4" /> Add restaurant
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onAddReservation('rental-car'); setShowDayMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                    >
                      <Car className="w-4 h-4" /> Add rental car
                    </button>
                    <div className="border-t my-1" />
                    <button
                      onClick={(e) => { e.stopPropagation(); onAutoFill(); setShowDayMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-primary"
                    >
                      <Sparkles className="w-4 h-4" /> Auto-fill day
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onClearDay(); setShowDayMenu(false); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" /> Clear day
                    </button>
                  </div>
                )}
              </div>
            </div>
            {!isExpanded && activitySummary && (
              <p className="text-sm text-primary font-medium truncate mt-1">{activitySummary}</p>
            )}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* Action buttons row */}
          <div className={`flex items-center gap-4 text-sm ${viewMode === 'compact' ? '' : 'ml-8'}`}>
            <button
              onClick={onAutoFill}
              disabled={isLoadingDay}
              className="flex items-center gap-1.5 text-primary font-medium hover:underline disabled:opacity-50"
            >
              {isLoadingDay ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {viewMode !== 'compact' && 'Generating...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {viewMode !== 'compact' && 'Auto-fill day'}
                </>
              )}
            </button>
            {!isEmpty && (
              <>
                <button className="flex items-center gap-1.5 text-primary font-medium hover:underline">
                  <MapPin className="w-4 h-4" />
                  {viewMode !== 'compact' && 'Optimize route'}
                </button>
                {viewMode !== 'compact' && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {Math.floor(totalMinutes / 60)}hr {totalMinutes % 60}min, {totalMiles.toFixed(1)} mi
                    </span>
                  </>
                )}
              </>
            )}
          </div>

          {/* Missing transport prompt - shows on city transition days */}
          {missingTransport && onAddTransport && (
            <div className="ml-8 bg-blue-50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Bus className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {missingTransport.fromCity} → {missingTransport.toCity}
                </p>
                <p className="text-xs text-blue-600">
                  Add transport for this travel day
                </p>
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => onAddTransport()}
              >
                Add
              </Button>
            </div>
          )}

          {/* Empty state - like Wanderlog */}
          {isEmpty && (
            <div className="ml-8 text-center py-8 text-muted-foreground">
              <p className="text-sm">No activities planned yet</p>
              <button
                onClick={onAutoFill}
                className="mt-2 text-primary font-medium text-sm hover:underline"
              >
                Auto-fill with recommendations
              </button>
            </div>
          )}

          {/* Hotel prompt - Wanderlog style */}
          {/* Only show on first day in each city, not for overnight flights */}
          {showHotelPrompt && !isEmpty && isFirstDayInCity && (() => {
            // Check if this is an overnight flight day (you sleep on the plane)
            const hasOvernightFlight = day.activities.some(a =>
              a.type === 'flight' && (
                (a.duration && a.duration >= 480) || // 8+ hours
                a.name?.includes('+1') || // Arrives next day
                a.name?.includes('12-14hr') || a.name?.includes('10-12hr') || a.name?.includes('8-10hr') // Long haul
              )
            );
            if (hasOvernightFlight) return null;
            return (
              <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white flex-shrink-0">
                  <Hotel className="w-4 h-4" />
                </div>
                <span className="flex-1 text-purple-700">No hotel for {day.city}</span>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-7 px-2 text-purple-600 hover:text-purple-800"
                  onClick={() => onAddReservation('lodging')}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-7 text-purple-600 hover:text-purple-800"
                  onClick={() => {
                    const searchQuery = encodeURIComponent(`hotels in ${day.city}`);
                    window.open(`https://www.tripadvisor.com/Search?q=${searchQuery}`, '_blank');
                  }}
                >
                  Book hotels
                </Button>
                <button
                  onClick={() => setShowHotelPrompt(false)}
                  className="text-purple-400 hover:text-purple-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })()}

          {/* Activities - Picture View (Large photos like Wanderlog) */}
          {!isEmpty && viewMode === 'picture' && (
            <div className="ml-8 space-y-4">
              {day.activities.map((activity, idx) => {
                const walkingTime = activity.walkingTimeToNext || (idx < day.activities.length - 1 ? Math.floor(Math.random() * 15) + 5 : 0);
                const walkingMiles = (walkingTime * 0.05).toFixed(2);
                const warning = getActivityWarnings(activity, day.date);
                // Calculate activity number excluding transport
                const isTransport = ['flight', 'train', 'bus', 'drive', 'transit'].includes(activity.type);
                const activityNumber = isTransport ? 0 : day.activities
                  .slice(0, idx + 1)
                  .filter(a => !['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type))
                  .length;

                return (
                  <div key={activity.id}>
                    {/* Transport time from previous */}
                    {idx > 0 && (() => {
                      const baseWalkTime = day.activities[idx - 1]?.walkingTimeToNext || walkingTime;
                      const driveTime = Math.max(3, Math.round(baseWalkTime * 0.25));
                      const busTime = Math.round(baseWalkTime * 0.7);
                      const driveMiles = (driveTime * 0.5).toFixed(1);
                      const busMiles = (busTime * 0.3).toFixed(1);
                      const dropdownKey = `${activity.id}-directions`;

                      return (
                        <div className="flex items-center gap-2 py-2 text-sm text-gray-500 relative">
                          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full">
                            {transportMode === 'walk' && <Footprints className="w-4 h-4" />}
                            {transportMode === 'drive' && <Car className="w-4 h-4" />}
                            {transportMode === 'bus' && <Bus className="w-4 h-4" />}
                            <span>
                              {transportMode === 'walk' && `${baseWalkTime} min · ${walkingMiles} mi`}
                              {transportMode === 'drive' && `${driveTime} min · ${driveMiles} mi`}
                              {transportMode === 'bus' && `${busTime} min · ${busMiles} mi`}
                            </span>
                            <button
                              onClick={() => setDirectionsDropdownId(directionsDropdownId === dropdownKey ? null : dropdownKey)}
                              className="text-gray-400 hover:text-gray-600 flex items-center gap-1"
                            >
                              <ChevronDown className={`w-3 h-3 transition-transform ${directionsDropdownId === dropdownKey ? 'rotate-180' : ''}`} />
                              Directions
                            </button>
                          </div>

                          {/* Dropdown */}
                          {directionsDropdownId === dropdownKey && (
                            <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border z-20 py-1 min-w-[180px]">
                              <button
                                onClick={() => { setTransportMode('walk'); setDirectionsDropdownId(null); }}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 ${transportMode === 'walk' ? 'text-violet-600' : 'text-gray-700'}`}
                              >
                                <Footprints className="w-4 h-4" />
                                <span>{baseWalkTime} min · {walkingMiles} mi</span>
                              </button>
                              <button
                                onClick={() => { setTransportMode('drive'); setDirectionsDropdownId(null); }}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 ${transportMode === 'drive' ? 'text-violet-600' : 'text-gray-700'}`}
                              >
                                <Car className="w-4 h-4" />
                                <span>{driveTime} min · {driveMiles} mi</span>
                              </button>
                              <button
                                onClick={() => { setTransportMode('bus'); setDirectionsDropdownId(null); }}
                                className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 ${transportMode === 'bus' ? 'text-violet-600' : 'text-gray-700'}`}
                              >
                                <Bus className="w-4 h-4" />
                                <span>{busTime} min · {busMiles} mi</span>
                              </button>
                              <div className="border-t my-1" />
                              <button
                                onClick={() => setDirectionsDropdownId(null)}
                                className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 text-gray-500"
                              >
                                <X className="w-4 h-4" />
                                <span>Hide directions</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Transport card (colored, no image) */}
                    {['flight', 'train', 'bus', 'drive', 'transit'].includes(activity.type) ? (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                              {activity.type === 'flight' && <Plane className="w-5 h-5" />}
                              {activity.type === 'train' && <Train className="w-5 h-5" />}
                              {activity.type === 'bus' && <Bus className="w-5 h-5" />}
                              {activity.type === 'drive' && <Car className="w-5 h-5" />}
                              {activity.type === 'transit' && <Plane className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900">{activity.name}</h4>
                              <p className="text-sm text-gray-600">{activity.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onActivityDelete(activity.id); }}
                            className="p-1.5 rounded-full hover:bg-blue-100 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Action buttons for transport */}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 pl-13">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingTimeId(activity.id); }}
                            className="flex items-center gap-1.5 hover:text-blue-600"
                          >
                            <Clock className="w-4 h-4" />
                            {activity.suggestedTime || 'Add time'}
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setAttachmentModalId(activity.id); }}
                            className="flex items-center gap-1.5 hover:text-blue-600"
                          >
                            <Paperclip className="w-4 h-4" />
                            Attach
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingCostId(activity.id); }}
                            className="flex items-center gap-1.5 hover:text-blue-600"
                          >
                            <DollarSign className="w-4 h-4" />
                            {activity.userCost ? `$${activity.userCost}` : 'Add cost'}
                          </button>
                        </div>
                      </div>
                    ) : (
                    /* Activity card with big image */
                    <button
                      onClick={() => onActivityTap(activity, activityNumber)}
                      className="w-full text-left"
                    >
                      {/* Large image */}
                      <div className="relative w-full h-48 rounded-xl overflow-hidden">
                        {activity.imageUrl ? (
                          <img
                            src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`}
                            alt={activity.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center">
                            <span className="text-4xl">📍</span>
                          </div>
                        )}
                        {/* Number badge */}
                        <div className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold shadow-lg">
                          {activityNumber}
                        </div>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onActivityDelete(activity.id); }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-500 hover:text-red-500 shadow"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Content below image */}
                      <div className="mt-2">
                        <h4 className="font-bold text-lg text-gray-900">{activity.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.openingHours && <span>{activity.openingHours} • </span>}
                          {activity.description}
                        </p>

                        {/* Closure/Warning badge */}
                        {warning && (
                          <div className="mt-2 inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full text-sm">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{warning}</span>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="ml-1 text-amber-400 hover:text-amber-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Booking status badge */}
                        {activity.bookingRequired && (
                          <div className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
                            activity.reservationStatus === 'done'
                              ? 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            {activity.reservationStatus === 'done' ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Booked</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>Need to book</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Action buttons row - Wanderlog style */}
                        <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                          {/* Time button/input */}
                          {editingTimeId === activity.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <Clock className="w-4 h-4" />
                              <input
                                type="time"
                                defaultValue={activity.suggestedTime || '09:00'}
                                autoFocus
                                className="px-1 py-0.5 text-sm border border-violet-300 rounded bg-violet-50"
                                onBlur={(e) => {
                                  onActivityTimeUpdate(activity.id, e.target.value);
                                  setEditingTimeId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    onActivityTimeUpdate(activity.id, e.currentTarget.value);
                                    setEditingTimeId(null);
                                  }
                                  if (e.key === 'Escape') setEditingTimeId(null);
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingTimeId(activity.id); }}
                              className="flex items-center gap-1.5 hover:text-violet-600 transition-colors"
                            >
                              <Clock className="w-4 h-4" />
                              {activity.suggestedTime || 'Add time'}
                            </button>
                          )}

                          {/* Attach button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setAttachmentModalId(activity.id); }}
                            className="flex items-center gap-1.5 hover:text-violet-600 transition-colors"
                          >
                            <Paperclip className="w-4 h-4" />
                            Attach
                            {activity.attachments && activity.attachments.length > 0 && (
                              <span className="bg-violet-100 text-violet-700 px-1.5 rounded text-xs">{activity.attachments.length}</span>
                            )}
                          </button>

                          {/* Cost button/input */}
                          {editingCostId === activity.id ? (
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              <DollarSign className="w-4 h-4" />
                              <input
                                type="number"
                                placeholder="0"
                                defaultValue={activity.userCost || ''}
                                autoFocus
                                className="w-16 px-1 py-0.5 text-sm border border-violet-300 rounded bg-violet-50"
                                onBlur={(e) => {
                                  const val = e.target.value ? parseFloat(e.target.value) : undefined;
                                  onActivityCostUpdate(activity.id, val);
                                  setEditingCostId(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const val = e.currentTarget.value ? parseFloat(e.currentTarget.value) : undefined;
                                    onActivityCostUpdate(activity.id, val);
                                    setEditingCostId(null);
                                  }
                                  if (e.key === 'Escape') setEditingCostId(null);
                                }}
                              />
                            </div>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingCostId(activity.id); }}
                              className="flex items-center gap-1.5 hover:text-violet-600 transition-colors"
                            >
                              <DollarSign className="w-4 h-4" />
                              {activity.userCost ? `$${activity.userCost}` : 'Add cost'}
                            </button>
                          )}
                        </div>

                        {/* Attachment Modal */}
                        {attachmentModalId === activity.id && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Add attachment</span>
                              <button onClick={() => setAttachmentModalId(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <select
                                value={newAttachment.type}
                                onChange={(e) => setNewAttachment(prev => ({ ...prev, type: e.target.value as 'link' | 'ticket' | 'reservation' | 'document' }))}
                                className="w-full px-2 py-1.5 text-sm border rounded"
                              >
                                <option value="link">Link</option>
                                <option value="ticket">Ticket</option>
                                <option value="reservation">Reservation</option>
                                <option value="document">Document</option>
                              </select>
                              <input
                                type="text"
                                placeholder="Name (e.g., Booking confirmation)"
                                value={newAttachment.name}
                                onChange={(e) => setNewAttachment(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full px-2 py-1.5 text-sm border rounded"
                              />
                              <input
                                type="url"
                                placeholder="URL (optional)"
                                value={newAttachment.url}
                                onChange={(e) => setNewAttachment(prev => ({ ...prev, url: e.target.value }))}
                                className="w-full px-2 py-1.5 text-sm border rounded"
                              />
                              <button
                                onClick={() => {
                                  if (newAttachment.name) {
                                    onActivityAttachmentAdd(activity.id, newAttachment);
                                    setNewAttachment({ type: 'link', name: '', url: '' });
                                    setAttachmentModalId(null);
                                  }
                                }}
                                disabled={!newAttachment.name}
                                className="w-full py-1.5 bg-violet-500 text-white rounded text-sm font-medium disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                            {/* Existing attachments */}
                            {activity.attachments && activity.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t space-y-1">
                                <span className="text-xs text-gray-500">Attached:</span>
                                {activity.attachments.map((att, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <Paperclip className="w-3 h-3 text-gray-400" />
                                    {att.url ? (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                                        {att.name}
                                      </a>
                                    ) : (
                                      <span>{att.name}</span>
                                    )}
                                    <span className="text-xs text-gray-400 capitalize">({att.type})</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Activities - Compact View (Wanderlog-style list) */}
          {!isEmpty && viewMode === 'compact' && (
            <div className="space-y-0">
              {day.activities.map((activity, idx) => {
                const walkingTime = activity.walkingTimeToNext || 0;
                const walkingKm = (walkingTime * 0.08).toFixed(1);
                // Calculate activity number excluding transport
                const isTransport = ['flight', 'train', 'bus', 'drive', 'transit'].includes(activity.type);
                const activityNumber = day.activities
                  .slice(0, idx + 1)
                  .filter(a => !['flight', 'train', 'bus', 'drive', 'transit'].includes(a.type))
                  .length;

                return (
                  <div key={activity.id}>
                    {/* Activity row */}
                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors">
                      {/* Number */}
                      <span className="w-6 text-sm text-gray-400 flex-shrink-0">{activityNumber}.</span>

                      {/* Thumbnail */}
                      <button
                        onClick={() => onActivityTap(activity, activityNumber)}
                        className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0"
                      >
                        {activity.imageUrl ? (
                          <img src={activity.imageUrl} alt={activity.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-violet-400" />
                          </div>
                        )}
                      </button>

                      {/* Content */}
                      <button
                        onClick={() => onActivityTap(activity, activityNumber)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <h4 className="font-medium text-gray-900 truncate">{activity.name}</h4>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          {activity.type === 'restaurant' ? 'Restaurant' : 'Attractions'}
                        </span>
                      </button>

                      {/* Action icons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => onActivityAttachmentAdd(activity.id, { type: 'document', name: 'Attachment' })}
                          className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                        >
                          <Paperclip className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onActivityDelete(activity.id)}
                          className="p-2 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Walking time connector */}
                    {idx < day.activities.length - 1 && (
                      <div className="flex items-center gap-3 pl-9 py-1">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Footprints className="w-3.5 h-3.5" />
                          <span>{walkingTime || '?'} min • {walkingKm} km</span>
                          <span className="text-gray-300">&gt;</span>
                          <button 
                            onClick={() => {
                              const dest = encodeURIComponent(activity.name + ' ' + day.city);
                              const nextActivity = day.activities[idx + 1];
                              const origin = nextActivity ? encodeURIComponent(nextActivity.name + ' ' + day.city) : '';
                              window.open(`https://www.google.com/maps/dir/${dest}/${origin}`, '_blank');
                            }}
                            className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full transition-colors"
                          >
                            <Navigation className="w-3 h-3" />
                            Directions
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add place / Add transport tabs */}
          <div className="ml-8 mt-3 flex items-center gap-4">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
              <Plus className="w-4 h-4" />
              Add a place
            </button>
            <button
              onClick={() => onAddReservation('flight')}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <Plane className="w-4 h-4" />
              Add transport
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ ACTIVITY CARD COMPONENT (Wanderlog-style) ============

interface ActivityCardProps {
  activity: GeneratedActivity;
  index: number;
  color: typeof DAY_COLORS[0];
  onTap: () => void;
  onDelete: () => void;
  showTravelTime?: boolean;
}

function ActivityCard({ activity, index, onTap, onDelete, showTravelTime = true }: ActivityCardProps) {
  return (
    <div className="relative">
      {/* Main card - Wanderlog style: number | content | small image */}
      <button onClick={onTap} className="w-full text-left">
        <div className="flex items-start gap-3 p-4 bg-card rounded-xl border hover:border-primary/30 transition-all">
          {/* Number badge */}
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {index}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-base">{activity.name}</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {activity.openingHours && <span>Open {activity.openingHours} • </span>}
              <span className="line-clamp-2">{activity.description}</span>
            </p>
          </div>

          {/* Small image on right */}
          <div className="w-28 h-24 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </button>

      {/* Travel time connector below card - only show if showTravelTime is true */}
      {showTravelTime && activity.walkingTimeToNext && (
        <div className="flex items-center gap-2 py-3 pl-4 ml-4 border-l-2 border-dashed border-muted">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Footprints className="w-4 h-4" />
            <span>{activity.walkingTimeToNext} min · {(activity.walkingTimeToNext * 0.05).toFixed(2)} mi</span>
            <button className="flex items-center gap-1 text-muted-foreground hover:text-primary">
              <ChevronDown className="w-3 h-3" />
              Directions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Travel time connector between activities
function TravelTimeConnector({ minutes, miles }: { minutes: number; miles: number }) {
  return (
    <div className="flex items-center gap-3 py-3 pl-8 ml-4 border-l-2 border-dashed border-muted">
      <div className="flex items-center gap-2 text-sm text-muted-foreground -ml-6 bg-background px-2">
        <div className="w-6 h-6 rounded bg-muted/80 flex items-center justify-center">
          <Footprints className="w-3.5 h-3.5" />
        </div>
        <span>{minutes} min · {miles.toFixed(1)} mi</span>
        <button className="flex items-center gap-1 text-primary hover:underline">
          Directions
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// ============ ACTIVITY DETAIL DRAWER ============

interface ActivityDetailDrawerProps {
  activity: GeneratedActivity | null;
  index: number;
  totalCount: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

function ActivityDetailDrawer({ activity, index, totalCount, onClose, onPrev, onNext }: ActivityDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'reviews' | 'photos'>('about');
  const [fetchedHistory, setFetchedHistory] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Fetch real history from AI if not available
  useEffect(() => {
    if (!activity || activity.history || fetchedHistory) return;

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const response = await fetch('/api/place-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            placeName: activity.name,
            city: activity.neighborhood,
            type: activity.type,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setFetchedHistory(data.history);
        }
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [activity, fetchedHistory]);

  // Reset fetched history when activity changes
  useEffect(() => {
    setFetchedHistory(null);
  }, [activity?.id]);

  if (!activity) return null;

  // Use activity data or generate fallback mock data
  const googleRating = activity.rating || (4.3 + Math.random() * 0.6);
  const googleReviewCount = activity.reviewCount || Math.floor(1000 + Math.random() * 8000);
  const taRating = activity.tripadvisorRating || (4.0 + Math.random() * 0.8);
  const taReviewCount = activity.tripadvisorReviewCount || Math.floor(500 + Math.random() * 3000);

  // Use activity history, fetched history, or show loading
  const richDescription = activity.history || fetchedHistory || null;

  // Day-by-day availability
  const DAY_ABBREVS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const DAY_NAMES_FULL = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

  const getDayAvailability = (dayIdx: number): 'open' | 'closed' | 'unknown' => {
    if (!activity.hoursPerDay) return 'unknown';
    const dayName = DAY_NAMES_FULL[dayIdx];
    const hours = activity.hoursPerDay[dayName];
    if (!hours) return 'unknown';
    if (hours.toLowerCase().includes('closed')) return 'closed';
    return 'open';
  };

  // Star breakdown (mock distribution)
  const getStarBreakdown = (rating: number): number[] => {
    const r = rating;
    return [
      Math.round((r / 5) * 70),  // 5 stars
      Math.round((r / 5) * 20),  // 4 stars
      Math.round((r / 5) * 7),   // 3 stars
      Math.round((r / 5) * 2),   // 2 stars
      Math.round((r / 5) * 1),   // 1 star
    ];
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const fullStars = Math.floor(rating);
    const hasHalf = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);
    const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

    return (
      <div className="flex">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} className={`${starSize} fill-amber-400 text-amber-400`} />
        ))}
        {hasHalf && (
          <div className="relative">
            <Star className={`${starSize} text-gray-200`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${starSize} fill-amber-400 text-amber-400`} />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} className={`${starSize} text-gray-200`} />
        ))}
      </div>
    );
  };

  // Mock reviews if not provided
  const reviews = activity.reviews || [
    { source: 'google' as const, rating: 5, text: "Amazing experience! Highly recommend visiting.", author: "Sarah M.", date: "2 weeks ago" },
    { source: 'tripadvisor' as const, rating: 4, text: "Beautiful place with great atmosphere. Can get crowded.", author: "TravelLover", date: "Jan 2025" },
    { source: 'google' as const, rating: 5, text: "One of the highlights of our trip!", author: "Mike R.", date: "1 month ago" },
  ];

  const reviewSummary = activity.reviewSummary ||
    `Visitors consistently praise ${activity.name} for its unique atmosphere and authentic experience. Most recommend arriving early to avoid crowds.`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-end" onClick={onClose}>
      <div className="bg-background w-full sm:w-[420px] h-[95vh] sm:h-full rounded-t-2xl sm:rounded-none overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header with navigation */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <button onClick={onPrev} disabled={index <= 1} className="p-1 hover:bg-muted rounded disabled:opacity-30">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">{index} of {totalCount}</span>
            <button onClick={onNext} disabled={index >= totalCount} className="p-1 hover:bg-muted rounded disabled:opacity-30">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {(['about', 'reviews', 'photos'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-medium capitalize ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'about' && (
            <div className="p-4 space-y-3">
              {/* Header with image */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {index}
                    </div>
                    <h3 className="font-bold">{activity.name}</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(activity.tags || []).slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[10px] capitalize py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <img src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`} alt="" className="w-16 h-16 rounded-lg object-cover" />
              </div>

              {/* Rich description / history section */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                  </svg>
                  <span className="text-sm font-medium text-amber-700">About this place</span>
                </div>
                {isLoadingHistory ? (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                    Loading historical information...
                  </div>
                ) : richDescription ? (
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {richDescription}
                  </p>
                ) : (
                  <p className="text-sm text-amber-700 italic">
                    Historical information unavailable
                  </p>
                )}
              </div>

              {/* Dual ratings section */}
              <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                {/* Google rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-blue-600">G</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{googleRating.toFixed(1)}</span>
                        {renderStars(googleRating)}
                      </div>
                      <span className="text-xs text-muted-foreground">{googleReviewCount.toLocaleString()} reviews</span>
                    </div>
                  </div>
                </div>

                {/* TripAdvisor rating with breakdown */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-white flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-green-600">TA</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{taRating.toFixed(1)}</span>
                        {renderStars(taRating)}
                      </div>
                      <span className="text-xs text-muted-foreground">{taReviewCount.toLocaleString()} reviews</span>
                    </div>
                  </div>
                  {/* Star breakdown */}
                  <div className="text-[10px] text-muted-foreground space-y-0.5">
                    {[5, 4, 3, 2, 1].map((stars, idx) => (
                      <div key={stars} className="flex items-center gap-1">
                        <span className="w-3">{stars}</span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${getStarBreakdown(taRating)[idx]}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Full address */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  {activity.address || `${activity.neighborhood}, Thailand`}
                </span>
              </div>

              {/* Day-by-day availability */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Hours</span>
                </div>
                <div className="flex gap-1">
                  {DAY_ABBREVS.map((day, idx) => {
                    const status = getDayAvailability(idx);
                    return (
                      <div
                        key={idx}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          status === 'open' ? 'bg-green-100 text-green-700' :
                          status === 'closed' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}
                        title={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][idx]}: ${
                          activity.hoursPerDay?.[DAY_NAMES_FULL[idx]] || 'Unknown'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
                {activity.openingHours && (
                  <p className="text-xs text-muted-foreground">Today: {activity.openingHours}</p>
                )}
              </div>

              {/* Typical duration */}
              {(activity.typicalDuration || activity.duration) && (
                <div className="flex items-center gap-2 text-sm bg-blue-50 rounded-lg p-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    {activity.typicalDuration || `People typically spend ${activity.duration} min here`}
                  </span>
                </div>
              )}

              {/* Match reasons - prominent display */}
              {(activity.matchReasons || []).length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <span className="font-bold text-green-700">{activity.matchScore || 0}% match</span>
                      <span className="text-green-600 text-sm ml-1">for you</span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {(activity.matchReasons || []).map((reason, idx) => (
                      <li key={idx} className="text-sm text-green-700 flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-4 space-y-4">
              {/* AI Summary */}
              <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span className="font-medium text-violet-700 text-sm">AI Summary</span>
                </div>
                <p className="text-sm text-violet-800">{reviewSummary}</p>
              </div>

              {/* Individual reviews */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Recent Reviews</h4>
                {reviews.map((review, idx) => (
                  <div key={idx} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${
                          review.source === 'google' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>
                          {review.source === 'google' ? 'G' : 'TA'}
                        </div>
                        <span className="font-medium text-sm">{review.author}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-sm text-muted-foreground">{review.text}</p>
                  </div>
                ))}
              </div>

              {/* View more link */}
              <Button variant="outline" size="sm" className="w-full">
                View all reviews on Google
              </Button>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2">
                <img src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`} alt="" className="rounded-lg aspect-square object-cover col-span-2" />
                <img src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`} alt="" className="rounded-lg aspect-square object-cover" />
                <img src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`} alt="" className="rounded-lg aspect-square object-cover" />
                <img src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`} alt="" className="rounded-lg aspect-square object-cover" />
                <img src={activity.imageUrl || `/api/placeholder/city/${encodeURIComponent(activity.name)}`} alt="" className="rounded-lg aspect-square object-cover" />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Photos from Google Places
              </p>
            </div>
          )}
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            Swap
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============ ADD RESERVATION MODAL ============

interface AddReservationModalProps {
  type: 'flight' | 'lodging' | 'rental-car' | 'restaurant' | 'attachment' | 'other';
  dayNumber: number;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: 'flight' | 'train' | 'bus' | 'drive' | 'transit' | 'restaurant' | 'cafe' | 'activity' | 'attraction' | 'nightlife';
    description?: string;
    suggestedTime?: string;
    duration?: number;
    transportDetails?: {
      from: string;
      to: string;
      departureTime?: string;
      arrivalTime?: string;
      operator?: string;
      bookingRef?: string;
    };
    userCost?: number;
  }) => void;
}

function AddReservationModal({ type, dayNumber, onClose, onSave }: AddReservationModalProps) {
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    airline: '',
    flightNumber: '',
    departureTime: '',
    arrivalTime: '',
    bookingRef: '',
    cost: '',
    name: '',
    notes: '',
  });

  const getTitle = () => {
    switch (type) {
      case 'flight': return 'Add Flight';
      case 'lodging': return 'Add Lodging';
      case 'rental-car': return 'Add Rental Car';
      case 'restaurant': return 'Add Restaurant';
      case 'attachment': return 'Add Attachment';
      case 'other': return 'Add Other';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'lodging': return <Bed className="w-5 h-5" />;
      case 'rental-car': return <Car className="w-5 h-5" />;
      case 'restaurant': return <Utensils className="w-5 h-5" />;
      case 'attachment': return <Paperclip className="w-5 h-5" />;
      case 'other': return <MoreHorizontal className="w-5 h-5" />;
    }
  };

  const handleSave = () => {
    if (type === 'flight') {
      const flightName = formData.airline && formData.flightNumber
        ? `${formData.airline} ${formData.flightNumber}`
        : `${formData.from} → ${formData.to}`;

      onSave({
        name: flightName,
        type: 'flight',
        description: `${formData.from} to ${formData.to}${formData.notes ? ` • ${formData.notes}` : ''}`,
        suggestedTime: formData.departureTime || undefined,
        transportDetails: {
          from: formData.from,
          to: formData.to,
          departureTime: formData.departureTime || undefined,
          arrivalTime: formData.arrivalTime || undefined,
          operator: formData.airline || undefined,
          bookingRef: formData.bookingRef || undefined,
        },
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else if (type === 'rental-car') {
      onSave({
        name: formData.name || 'Rental Car',
        type: 'drive',
        description: formData.notes || undefined,
        transportDetails: {
          from: formData.from || 'Pickup',
          to: formData.to || 'Return',
          bookingRef: formData.bookingRef || undefined,
        },
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else if (type === 'restaurant') {
      onSave({
        name: formData.name || 'Restaurant',
        type: 'restaurant',
        description: formData.notes || undefined,
        suggestedTime: formData.departureTime || undefined,
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else if (type === 'lodging') {
      onSave({
        name: formData.name || 'Accommodation',
        type: 'activity',
        description: formData.notes || undefined,
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    } else {
      onSave({
        name: formData.name || 'Item',
        type: 'activity',
        description: formData.notes || undefined,
        userCost: formData.cost ? parseFloat(formData.cost) : undefined,
      });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-xl max-w-md mx-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h2 className="font-bold text-lg">{getTitle()}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {type === 'flight' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                  <input
                    type="text"
                    placeholder="e.g. LAX"
                    value={formData.from}
                    onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                  <input
                    type="text"
                    placeholder="e.g. NRT"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Airline</label>
                  <input
                    type="text"
                    placeholder="e.g. United"
                    value={formData.airline}
                    onChange={(e) => setFormData(prev => ({ ...prev, airline: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Flight #</label>
                  <input
                    type="text"
                    placeholder="e.g. UA123"
                    value={formData.flightNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, flightNumber: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Departure</label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Arrival</label>
                  <input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirmation #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingRef: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {(type === 'restaurant' || type === 'lodging' || type === 'other') && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  type="text"
                  placeholder={type === 'restaurant' ? 'Restaurant name' : type === 'lodging' ? 'Hotel name' : 'Name'}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {type === 'restaurant' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Reservation Time</label>
                  <input
                    type="time"
                    value={formData.departureTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirmation #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingRef: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'rental-car' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rental Company</label>
                <input
                  type="text"
                  placeholder="e.g. Hertz"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Pickup Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Airport"
                    value={formData.from}
                    onChange={(e) => setFormData(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Return Location</label>
                  <input
                    type="text"
                    placeholder="Same as pickup"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Confirmation #</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={formData.bookingRef}
                    onChange={(e) => setFormData(prev => ({ ...prev, bookingRef: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.cost}
                      onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))}
                      className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {type === 'attachment' && (
            <div className="text-center py-8">
              <Paperclip className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Attachment upload coming soon</p>
              <p className="text-gray-400 text-xs mt-1">You&apos;ll be able to attach tickets, confirmations, etc.</p>
            </div>
          )}

          {/* Notes (for all types except attachment) */}
          {type !== 'attachment' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
              <textarea
                placeholder="Add any notes..."
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t bg-gray-50 rounded-b-2xl">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button className="flex-1" onClick={handleSave} disabled={type === 'attachment'}>
            Add to Day {dayNumber}
          </Button>
        </div>
      </div>
    </>
  );
}
