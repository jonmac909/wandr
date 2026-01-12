'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Lightbulb,
  Map,
  Image,
  List,
} from 'lucide-react';
import type { TripDNA } from '@/types/trip-dna';
import type { GeneratedActivity, GeneratedDay, CityAllocation } from '@/lib/planning/itinerary-generator';
import { allocateDays, RECOMMENDED_NIGHTS, DEFAULT_NIGHTS } from '@/lib/planning/itinerary-generator';
import { POPULAR_CITY_INFO } from '@/lib/ai/city-info-generator';
import dynamic from 'next/dynamic';

// Dynamically import HotelPicker and RouteMap
const HotelPicker = dynamic(() => import('./HotelPicker'), { ssr: false });
const RouteMap = dynamic(() => import('./RouteMap'), { ssr: false });

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

interface AutoItineraryViewProps {
  cities: string[];
  tripDna: TripDNA;
  duration?: number; // Total trip days
  onBack: () => void;
  getCityCountry?: (city: string) => string | undefined;
  onDatesChange?: (startDate: string, totalDays: number) => void; // Callback to sync dates back to parent
}

// Mock activities data for auto-fill
const MOCK_ACTIVITIES: Record<string, GeneratedActivity[]> = {
  'Bangkok': [
    {
      id: 'bkk-1',
      name: 'Grand Palace',
      type: 'attraction',
      description: 'Thailand\'s most famous landmark with stunning gold spires and intricate architecture',
      imageUrl: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=600&q=80',
      suggestedTime: '09:00',
      duration: 120,
      openingHours: '8:30AM-3:30PM',
      neighborhood: 'Rattanakosin',
      matchScore: 95,
      matchReasons: ['Top attraction', 'Historic site'],
      priceRange: '$$',
      tags: ['temple', 'history', 'photography'],
      walkingTimeToNext: 8,
    },
    {
      id: 'bkk-2',
      name: 'Wat Pho',
      type: 'attraction',
      description: 'Home to the massive reclining Buddha statue and traditional Thai massage school',
      imageUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=80',
      suggestedTime: '11:30',
      duration: 90,
      openingHours: '8AM-6:30PM',
      neighborhood: 'Rattanakosin',
      matchScore: 92,
      matchReasons: ['Near Grand Palace', 'Must-see temple'],
      priceRange: '$',
      tags: ['temple', 'buddha', 'culture'],
      walkingTimeToNext: 5,
    },
    {
      id: 'bkk-3',
      name: 'Jay Fai',
      type: 'restaurant',
      description: 'Legendary street food stall with Michelin star - famous for crab omelette',
      imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      suggestedTime: '13:00',
      duration: 60,
      openingHours: '2PM-10PM',
      neighborhood: 'Old Town',
      matchScore: 88,
      matchReasons: ['Michelin star', 'Local favorite'],
      priceRange: '$$$',
      tags: ['street food', 'seafood', 'michelin'],
      walkingTimeToNext: 15,
    },
    {
      id: 'bkk-4',
      name: 'Chatuchak Weekend Market',
      type: 'activity',
      description: 'World\'s largest weekend market with 15,000+ stalls',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '16:00',
      duration: 180,
      openingHours: '6AM-6PM (Sat-Sun)',
      neighborhood: 'Chatuchak',
      matchScore: 85,
      matchReasons: ['Shopping paradise', 'Local culture'],
      priceRange: '$',
      tags: ['market', 'shopping', 'local'],
    },
  ],
  'Chiang Mai': [
    {
      id: 'cnx-1',
      name: 'Doi Suthep Temple',
      type: 'attraction',
      description: 'Sacred hilltop temple with 309 steps and panoramic city views',
      imageUrl: 'https://images.unsplash.com/photo-1512553424870-a2a2d9e5ed73?w=600&q=80',
      suggestedTime: '08:00',
      duration: 150,
      openingHours: '6AM-6PM',
      neighborhood: 'Doi Suthep',
      matchScore: 94,
      matchReasons: ['Most sacred temple', 'Amazing views'],
      priceRange: '$',
      tags: ['temple', 'mountain', 'viewpoint'],
      walkingTimeToNext: 45,
    },
    {
      id: 'cnx-2',
      name: 'Khao Soi Khun Yai',
      type: 'restaurant',
      description: 'Best khao soi in Chiang Mai - creamy coconut curry noodles',
      imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&q=80',
      suggestedTime: '12:00',
      duration: 45,
      openingHours: '9AM-4PM',
      neighborhood: 'Old City',
      matchScore: 91,
      matchReasons: ['Local specialty', 'Authentic taste'],
      priceRange: '$',
      tags: ['noodles', 'curry', 'local'],
      walkingTimeToNext: 10,
    },
    {
      id: 'cnx-3',
      name: 'Sunday Walking Street',
      type: 'activity',
      description: 'Weekly night market along Ratchadamnoen Road with crafts and food',
      imageUrl: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80',
      suggestedTime: '17:00',
      duration: 180,
      openingHours: '4PM-10PM (Sun)',
      neighborhood: 'Old City',
      matchScore: 87,
      matchReasons: ['Local culture', 'Great food stalls'],
      priceRange: '$',
      tags: ['market', 'crafts', 'street food'],
    },
  ],
};

// Generate EMPTY days (no activities) - like Wanderlog
function generateEmptyDays(allocations: CityAllocation[]): GeneratedDay[] {
  const days: GeneratedDay[] = [];
  let dayNumber = 1;

  for (const allocation of allocations) {
    for (let i = 0; i < allocation.nights; i++) {
      days.push({
        dayNumber,
        date: allocation.startDate ? addDays(allocation.startDate, i) : '',
        city: allocation.city,
        activities: [], // Empty - user will auto-fill
      });
      dayNumber++;
    }
  }

  return days;
}

// Fill a single day with activities
function fillDayWithActivities(day: GeneratedDay, dayIndex: number): GeneratedDay {
  const cityActivities = MOCK_ACTIVITIES[day.city] || MOCK_ACTIVITIES['Bangkok'] || [];

  // Create unique IDs for this day's activities
  const dayActivities = cityActivities.map((act, idx) => ({
    ...act,
    id: `${day.city.toLowerCase().replace(/\s+/g, '-')}-day${day.dayNumber}-${idx}-${Date.now()}`,
  }));

  return {
    ...day,
    theme: dayIndex === 0 ? 'Highlights Day' : dayIndex === 1 ? 'Local Discovery' : 'Relaxed Exploration',
    activities: dayActivities.slice(0, 3 + (dayIndex % 2)),
  };
}

// Fill ALL days with activities
function fillAllDays(days: GeneratedDay[]): GeneratedDay[] {
  return days.map((day, idx) => fillDayWithActivities(day, idx));
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// Full date format like "Wednesday, February 11th"
function formatFullDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
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
  onBack,
  getCityCountry,
  onDatesChange,
}: AutoItineraryViewProps) {
  // Get initial total days and start date from tripDna
  // Plan page stores at: constraints.duration.days and constraints.startDate
  const initialTotalDays =
    propDuration ||
    (tripDna?.constraints as unknown as { duration?: { days?: number } })?.duration?.days ||
    tripDna?.constraints?.dates?.totalDays ||
    14;
  const initialStartDate =
    (tripDna?.constraints as unknown as { startDate?: string })?.startDate ||
    tripDna?.constraints?.dates?.startDate ||
    new Date().toISOString().split('T')[0];

  // Editable trip dates state
  const [tripStartDate, setTripStartDate] = useState(initialStartDate);
  const [tripTotalDays, setTripTotalDays] = useState(initialTotalDays);
  const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);

  // Sync state when props change (e.g., from "When" page)
  useEffect(() => {
    setTripStartDate(initialStartDate);
    setTripTotalDays(initialTotalDays);
  }, [initialStartDate, initialTotalDays]);

  // Computed end date
  const tripEndDate = addDays(tripStartDate, tripTotalDays - 1);

  // Day allocation state (can be adjusted by user)
  const [allocations, setAllocations] = useState<CityAllocation[]>(() =>
    allocateDays(cities, initialTotalDays, tripDna, initialStartDate)
  );

  // Generated days (mock for now)
  const [days, setDays] = useState<GeneratedDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set(cities));
  const [isDurationExpanded, setIsDurationExpanded] = useState(false); // Collapsed by default

  // View mode: 'picture' | 'compact' | 'map'
  const [viewMode, setViewMode] = useState<'picture' | 'compact' | 'map'>('picture');

  // Hotels per city
  const [selectedHotels, setSelectedHotels] = useState<Record<string, { name: string; id: string }>>({});
  const [hotelPickerCity, setHotelPickerCity] = useState<string | null>(null);

  // Activity detail drawer
  const [selectedActivity, setSelectedActivity] = useState<{ activity: GeneratedActivity; index: number } | null>(null);

  // Full-screen map state
  const [mapSelectedIndex, setMapSelectedIndex] = useState(0);

  // Flatten all activities for map navigation (with city/date info)
  const allActivitiesWithMeta = useMemo(() => {
    return days.flatMap(day => day.activities.map(activity => ({ ...activity, city: day.city, date: day.date })));
  }, [days]);

  // Get all activities for drawer navigation
  const allActivities = days.flatMap(d => d.activities);
  const totalActivityCount = allActivities.length;

  // Handle activity tap
  const handleActivityTap = (activity: GeneratedActivity, index: number) => {
    setSelectedActivity({ activity, index });
  };

  // Handle activity delete
  const handleActivityDelete = (activityId: string) => {
    setDays(prev => prev.map(day => ({
      ...day,
      activities: day.activities.filter(a => a.id !== activityId),
    })));
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

  // Recalculate allocations when cities, trip dates, or tripDna changes
  useEffect(() => {
    setAllocations(allocateDays(cities, tripTotalDays, tripDna, tripStartDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities.join(','), tripTotalDays, tripStartDate, tripDna?.vibeAndPace?.tripPace]);

  // Handle trip date changes
  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    const start = new Date(newStartDate);
    const end = new Date(newEndDate);
    const newTotalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (newTotalDays > 0) {
      setTripStartDate(newStartDate);
      setTripTotalDays(newTotalDays);
      // Sync back to parent
      onDatesChange?.(newStartDate, newTotalDays);
      // Allocations will auto-update via useEffect
    }
    setIsDateEditorOpen(false);
  };

  // Generate EMPTY itinerary on mount or when allocations change
  useEffect(() => {
    setIsLoading(true);
    // Generate empty days immediately (no API call needed)
    const timer = setTimeout(() => {
      setDays(generateEmptyDays(allocations));
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [allocations]);

  // Auto-fill a single day
  const autoFillDay = (dayNumber: number) => {
    setDays(prev => prev.map((day, idx) => {
      if (day.dayNumber === dayNumber) {
        return fillDayWithActivities(day, idx);
      }
      return day;
    }));
  };

  // Auto-fill entire trip
  const autoFillEntireTrip = () => {
    setIsLoading(true);
    setTimeout(() => {
      setDays(prev => fillAllDays(prev));
      setIsLoading(false);
    }, 800);
  };

  // Adjust allocation for a city - auto-balances to maintain total days
  const adjustAllocation = (city: string, delta: number) => {
    setAllocations(prev => {
      // Find city to adjust and city to balance with
      const cityIndex = prev.findIndex(a => a.city === city);
      if (cityIndex === -1) return prev;

      const currentCity = prev[cityIndex];
      const newNights = Math.max(1, currentCity.nights + delta);
      const actualDelta = newNights - currentCity.nights;

      // If no actual change, return as-is
      if (actualDelta === 0) return prev;

      // Find a city to take from / give to (pick the one with most days if adding, fewest if removing)
      let balanceIndex = -1;
      if (actualDelta > 0) {
        // Adding days - take from city with most days (that has more than 1)
        let maxNights = 0;
        prev.forEach((a, idx) => {
          if (idx !== cityIndex && a.nights > maxNights && a.nights > 1) {
            maxNights = a.nights;
            balanceIndex = idx;
          }
        });
      } else {
        // Removing days - give to city with fewest days
        let minNights = Infinity;
        prev.forEach((a, idx) => {
          if (idx !== cityIndex && a.nights < minNights) {
            minNights = a.nights;
            balanceIndex = idx;
          }
        });
      }

      // If no city to balance with, just adjust without balancing
      const newAllocations = prev.map((a, idx) => {
        if (idx === cityIndex) {
          return { ...a, nights: newNights };
        }
        if (idx === balanceIndex && balanceIndex !== -1) {
          // Balance: opposite of delta
          const balancedNights = Math.max(1, a.nights - actualDelta);
          return { ...a, nights: balancedNights };
        }
        return a;
      });

      // Recalculate start/end days
      let currentDay = 1;
      return newAllocations.map(a => {
        const startDay = currentDay;
        const endDay = currentDay + a.nights - 1;
        currentDay = endDay + 1;

        const start = new Date(tripStartDate);
        start.setDate(start.getDate() + startDay - 1);
        const end = new Date(tripStartDate);
        end.setDate(end.getDate() + endDay - 1);

        return {
          ...a,
          startDay,
          endDay,
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
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

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Itinerary</h2>
        </div>
        <button
          onClick={() => setIsDateEditorOpen(!isDateEditorOpen)}
          className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
        >
          <Calendar className="w-4 h-4" />
          {formatDate(tripStartDate)} - {formatDate(tripEndDate)}
          <ChevronDown className={`w-3 h-3 transition-transform ${isDateEditorOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-lg p-1">
        <button
          onClick={() => setViewMode('picture')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'picture' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Image className="w-4 h-4" />
          Picture
        </button>
        <button
          onClick={() => setViewMode('compact')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'compact' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <List className="w-4 h-4" />
          Compact
        </button>
        <button
          onClick={() => setViewMode('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === 'map' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Map className="w-4 h-4" />
          Map
        </button>
      </div>

      {/* Date Editor */}
      {isDateEditorOpen && (
        <div className="bg-card border rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-sm">Edit Travel Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
              <input
                type="date"
                value={tripStartDate}
                onChange={(e) => {
                  const newStart = e.target.value;
                  // Keep same duration, just shift dates
                  setTripStartDate(newStart);
                  onDatesChange?.(newStart, tripTotalDays);
                }}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">End Date</label>
              <input
                type="date"
                value={tripEndDate}
                onChange={(e) => handleDateChange(tripStartDate, e.target.value)}
                min={tripStartDate}
                className="w-full px-3 py-2 text-sm border rounded-lg bg-background"
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">Total: {tripTotalDays} days</span>
            <Button size="sm" onClick={() => setIsDateEditorOpen(false)}>Done</Button>
          </div>
        </div>
      )}

      {/* Auto-fill entire trip button */}
      <Button
        variant="default"
        className="w-full bg-primary hover:bg-primary/90"
        onClick={autoFillEntireTrip}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Auto-fill entire trip
      </Button>

      {/* Tips Section */}
      {cities.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-sm text-amber-800">Local Tips</h3>
          </div>
          <div className="space-y-2">
            {cities.slice(0, 3).map((city) => {
              const cityInfo = POPULAR_CITY_INFO[city];
              if (!cityInfo?.localTip) return null;
              return (
                <div key={city} className="text-sm">
                  <span className="font-medium text-amber-800">{city}:</span>{' '}
                  <span className="text-amber-700">{cityInfo.localTip}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day Allocation Summary - Collapsible */}
      <div className="bg-muted/30 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsDurationExpanded(!isDurationExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Hotel className="w-4 h-4" />
            Nights per City
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={currentTotal === tripTotalDays ? 'default' : 'destructive'}>
              {currentTotal} / {tripTotalDays} days
            </Badge>
            {isDurationExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* City allocations - only show when expanded */}
        {isDurationExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {allocations.map((alloc) => {
              const recommended = getRecommendedNights(alloc.city);
              return (
                <div key={alloc.city} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="w-2 h-8 rounded-full bg-primary/60" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {alloc.city}
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        ({recommended} nights rec&apos;d)
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(alloc.startDate || '')} - {formatDate(alloc.endDate || '')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => { e.stopPropagation(); adjustAllocation(alloc.city, -1); }}
                      disabled={alloc.nights <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-semibold text-sm">
                      {alloc.nights}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => { e.stopPropagation(); adjustAllocation(alloc.city, 1); }}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Generating your personalized itinerary...</p>
        </div>
      )}

      {/* Full-screen Map View */}
      {!isLoading && viewMode === 'map' && allActivitiesWithMeta.length > 0 && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Exit button */}
          <button
            onClick={() => setViewMode('picture')}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-lg text-sm font-medium"
          >
            <X className="w-4 h-4" />
            Exit map
          </button>

          {/* Map area */}
          <div className="flex-1 relative">
            {getCityCountry && (
              <RouteMap
                cities={cities}
                getCityCountry={getCityCountry}
                calculateDistance={() => null}
              />
            )}
            {/* Numbered markers overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="flex flex-wrap gap-1 max-w-xs">
                {allActivitiesWithMeta.slice(0, 9).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMapSelectedIndex(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg pointer-events-auto cursor-pointer ${
                      idx === mapSelectedIndex ? 'bg-violet-600 ring-4 ring-violet-200' : 'bg-violet-500'
                    }`}
                    style={{ transform: `translate(${(idx % 5 - 2) * 30}px, ${Math.floor(idx / 5) * 25}px)` }}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom navigation bar */}
          <div className="absolute bottom-[45%] left-0 right-0 flex items-center justify-center gap-2 px-4 py-2">
            <button
              onClick={() => setMapSelectedIndex(Math.max(0, mapSelectedIndex - 1))}
              disabled={mapSelectedIndex === 0}
              className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-3 py-1.5 bg-white rounded-full shadow-lg text-sm font-medium">
              {mapSelectedIndex + 1} of {allActivitiesWithMeta.length}
            </span>
            <button
              onClick={() => setMapSelectedIndex(Math.min(allActivitiesWithMeta.length - 1, mapSelectedIndex + 1))}
              disabled={mapSelectedIndex === allActivitiesWithMeta.length - 1}
              className="p-2 bg-white rounded-full shadow-lg disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white rounded-full shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
                <path d="M11 8v6M8 11h6"/>
              </svg>
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full shadow-lg text-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18"/>
              </svg>
              Optimize route
              <Badge className="bg-violet-100 text-violet-700 text-xs">PRO</Badge>
            </button>
            <button
              onClick={() => setViewMode('picture')}
              className="p-2 bg-white rounded-full shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bottom sheet with activity details */}
          <div className="bg-white border-t rounded-t-2xl shadow-2xl" style={{ height: '45%' }}>
            {/* Tabs */}
            <div className="flex border-b px-4">
              {['About', 'Reviews', 'Photos', 'Mentions'].map((tab, idx) => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-sm font-medium ${idx === 0 ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Activity content */}
            {allActivitiesWithMeta[mapSelectedIndex] && (
              <div className="p-4 overflow-y-auto" style={{ maxHeight: 'calc(45% - 50px)' }}>
                {/* Header with image */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {mapSelectedIndex + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{allActivitiesWithMeta[mapSelectedIndex].name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{allActivitiesWithMeta[mapSelectedIndex].description}</p>
                  </div>
                  {allActivitiesWithMeta[mapSelectedIndex].imageUrl && (
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={allActivitiesWithMeta[mapSelectedIndex].imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Added button */}
                <div className="mb-4">
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-sm">
                    <span>🔖</span>
                    Added
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {allActivitiesWithMeta[mapSelectedIndex].tags?.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="font-semibold text-amber-600">4.3</span>
                  <span className="text-gray-500">(25688)</span>
                  <span className="text-blue-500 font-bold">G</span>
                  <span className="text-gray-400 mx-2">•</span>
                  <span className="text-gray-500 text-sm">Mentioned by</span>
                  <span className="text-violet-600 text-sm">+118 other lists</span>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <span className="text-sm text-gray-600">
                    {allActivitiesWithMeta[mapSelectedIndex].neighborhood}, {allActivitiesWithMeta[mapSelectedIndex].city}
                  </span>
                </div>

                {/* Hours */}
                {allActivitiesWithMeta[mapSelectedIndex].openingHours && (
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {new Date().toLocaleDateString('en-US', { weekday: 'long' })}: {allActivitiesWithMeta[mapSelectedIndex].openingHours}
                    </span>
                  </div>
                )}

                {/* Day pills */}
                <div className="flex items-center gap-1 mb-3">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <span key={d} className="w-7 h-7 flex items-center justify-center text-xs font-medium bg-violet-100 text-violet-700 rounded">
                      {d}
                    </span>
                  ))}
                  <button className="ml-2 text-sm text-violet-600">Show times</button>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-gray-400">⏱</span>
                  <span className="text-sm text-gray-600">
                    People typically spend {allActivitiesWithMeta[mapSelectedIndex].duration || 30} min here
                  </span>
                </div>

                {/* Open in */}
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-500 mb-2">Open in:</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Google Maps</button>
                    <button className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm">Apple Maps</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty state for map view */}
      {!isLoading && viewMode === 'map' && allActivitiesWithMeta.length === 0 && (
        <div className="text-center py-12">
          <Map className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No activities to show on map</p>
          <p className="text-sm text-gray-400">Auto-fill your trip to see activities</p>
        </div>
      )}

      {/* Days - chronological like Wanderlog (Picture & Compact views) */}
      {!isLoading && viewMode !== 'map' && days.map((day) => {
        const cityIdx = allocations.findIndex(a => a.city === day.city);
        const color = getCityColor(cityIdx >= 0 ? cityIdx : 0);

        return (
          <DayCard
            key={day.dayNumber}
            day={day}
            color={color}
            viewMode={viewMode}
            onActivityTap={handleActivityTap}
            onActivityDelete={handleActivityDelete}
            onAutoFill={() => autoFillDay(day.dayNumber)}
          />
        );
      })}

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
    </div>
  );
}

// ============ DAY CARD COMPONENT ============

interface DayCardProps {
  day: GeneratedDay;
  color: typeof DAY_COLORS[0];
  viewMode: 'picture' | 'compact';
  onActivityTap: (activity: GeneratedActivity, index: number) => void;
  onActivityDelete: (activityId: string) => void;
  onAutoFill: () => void;
}

function DayCard({ day, color, viewMode, onActivityTap, onActivityDelete, onAutoFill }: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showHotelPrompt, setShowHotelPrompt] = useState(true);
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const activitySummary = day.activities.map(a => a.name).join(' • ');
  const isEmpty = day.activities.length === 0;

  // Calculate total time for day
  const totalMinutes = day.activities.reduce((sum, a) => sum + (a.duration || 60), 0);
  const totalMiles = day.activities.reduce((sum, a) => sum + (a.walkingTimeToNext || 0) * 0.05, 0);

  return (
    <div className="border-b pb-6">
      {/* Day header - clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left py-4"
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">{formatFullDate(day.date)}</h3>
                <p className="text-sm text-muted-foreground">{day.city}</p>
              </div>
              <button className="p-1 hover:bg-muted rounded" onClick={(e) => e.stopPropagation()}>
                <span className="text-muted-foreground text-lg">•••</span>
              </button>
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
          <div className="flex items-center gap-4 text-sm ml-8">
            <button
              onClick={onAutoFill}
              className="flex items-center gap-1.5 text-primary font-medium hover:underline"
            >
              <Sparkles className="w-4 h-4" />
              Auto-fill day
            </button>
            {!isEmpty && (
              <>
                <span className="text-muted-foreground">•</span>
                <button className="flex items-center gap-1.5 text-primary font-medium hover:underline">
                  <MapPin className="w-4 h-4" />
                  Optimize route
                </button>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {Math.floor(totalMinutes / 60)}hr {totalMinutes % 60}min, {totalMiles.toFixed(1)} mi
                </span>
              </>
            )}
          </div>

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
          {showHotelPrompt && !isEmpty && (
            <div className="ml-8 bg-secondary/50 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Hotel className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  Looks like you don&apos;t have lodging for {formatDate(day.date)} yet.
                </p>
              </div>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Book hotels
              </Button>
              <button
                onClick={() => setShowHotelPrompt(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Activities - Picture View */}
          {!isEmpty && viewMode === 'picture' && (
            <div className="space-y-0">
              {day.activities.map((activity, idx) => (
                <div key={activity.id}>
                  {/* Travel time connector between activities - shows travel from PREVIOUS activity */}
                  {idx > 0 && day.activities[idx - 1].walkingTimeToNext && (
                    <TravelTimeConnector
                      minutes={day.activities[idx - 1].walkingTimeToNext || 10}
                      miles={(day.activities[idx - 1].walkingTimeToNext || 10) * 0.05}
                    />
                  )}
                  <ActivityCard
                    activity={activity}
                    index={idx + 1}
                    color={color}
                    onTap={() => onActivityTap(activity, idx + 1)}
                    onDelete={() => onActivityDelete(activity.id)}
                    showTravelTime={false}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Activities - Compact View (no images) */}
          {!isEmpty && viewMode === 'compact' && (
            <div className="space-y-0 ml-4">
              {day.activities.map((activity, idx) => {
                const isActivityExpanded = expandedActivityId === activity.id;
                const walkingTime = activity.walkingTimeToNext || Math.floor(Math.random() * 15) + 5;
                const walkingMiles = (walkingTime * 0.05).toFixed(2);

                return (
                  <div key={activity.id}>
                    {/* Activity row - expandable */}
                    <div className={`bg-gray-100 rounded-lg ${isActivityExpanded ? 'ring-2 ring-violet-300' : ''}`}>
                      <button
                        onClick={() => setExpandedActivityId(isActivityExpanded ? null : activity.id)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        {isActivityExpanded && (
                          <>
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <input type="checkbox" className="w-5 h-5 rounded border-gray-300" onClick={(e) => e.stopPropagation()} />
                          </>
                        )}
                        <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-base text-gray-900">{activity.name}</p>
                          {isActivityExpanded && activity.openingHours && (
                            <p className="text-sm text-gray-600">Open {activity.openingHours} • Add notes, links, etc. here</p>
                          )}
                        </div>
                        {isActivityExpanded && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onActivityDelete(activity.id); }}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </button>

                      {/* Expanded content */}
                      {isActivityExpanded && (
                        <div className="px-3 pb-3 space-y-3">
                          {/* Action buttons */}
                          <div className="flex items-center gap-4 text-sm">
                            <button className="flex items-center gap-1 text-violet-600 hover:text-violet-700">
                              <Clock className="w-4 h-4" />
                              Add time
                            </button>
                            <button className="flex items-center gap-1 text-violet-600 hover:text-violet-700">
                              <span className="text-lg">📎</span>
                              Attach
                            </button>
                            <button className="flex items-center gap-1 text-violet-600 hover:text-violet-700">
                              <DollarSign className="w-4 h-4" />
                              Add cost
                            </button>
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                            <span className="font-medium text-gray-900">4.5</span>
                            <span className="text-gray-500">(1,234)</span>
                            <span className="text-blue-500 text-lg">G</span>
                          </div>

                          {/* Address */}
                          <div className="flex items-start gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                            <span>{activity.neighborhood || day.city}</span>
                          </div>

                          {/* Opening hours */}
                          {activity.openingHours && (
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}: {activity.openingHours}</span>
                            </div>
                          )}

                          {/* Day pills */}
                          <div className="flex items-center gap-1">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                              <span key={d} className="w-7 h-7 flex items-center justify-center text-xs font-medium bg-violet-100 text-violet-700 rounded">
                                {d}
                              </span>
                            ))}
                            <button className="ml-2 text-sm text-violet-600 hover:underline">Show times</button>
                          </div>

                          {/* Duration */}
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>⏱</span>
                            <span>People typically spend {activity.duration || 60} min here</span>
                          </div>

                          {/* Added by / View on map */}
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Added by you</span>
                            <span className="text-gray-300">·</span>
                            <button className="text-violet-600 hover:underline">View on map</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Walking info below each item */}
                    <div className="flex items-center justify-center gap-2 py-2 text-gray-500">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
                      </svg>
                      <span className="text-sm">{walkingTime} min · {walkingMiles} mi</span>
                      <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                        <ChevronDown className="w-3 h-3" />
                        Directions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add a place */}
          <div className="ml-8 flex items-center gap-3 py-3 px-4 bg-muted/30 rounded-xl border-2 border-dashed border-muted">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Add a place"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
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
              src={activity.imageUrl}
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

  if (!activity) return null;

  // Mock Google rating (in real app, this comes from Google Places API)
  const googleRating = 4.5 + Math.random() * 0.4;
  const reviewCount = Math.floor(1000 + Math.random() * 8000);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-end" onClick={onClose}>
      <div className="bg-background w-full sm:w-96 sm:h-full rounded-t-2xl sm:rounded-none overflow-hidden flex flex-col max-h-[85vh] sm:max-h-full" onClick={(e) => e.stopPropagation()}>
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
              className={`flex-1 py-2 text-sm font-medium capitalize ${
                activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Name + image */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {index}
                    </div>
                    <h3 className="font-bold">{activity.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                </div>
                <img src={activity.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover" />
              </div>

              {/* Added button */}
              <Button variant="outline" size="sm" className="w-full">
                <Check className="w-4 h-4 mr-2" />
                Added
              </Button>

              {/* Category tags */}
              <div className="flex flex-wrap gap-1.5">
                {activity.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Google rating */}
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{googleRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">({reviewCount.toLocaleString()})</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">G</span>
              </div>

              {/* Location */}
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <span>{activity.neighborhood}, Thailand</span>
              </div>

              {/* Opening hours */}
              {activity.openingHours && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <span>Open {activity.openingHours}</span>
                </div>
              )}

              {/* Match reasons */}
              {activity.matchReasons.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-700 text-sm">{activity.matchScore}% match for you</span>
                  </div>
                  <ul className="space-y-1">
                    {activity.matchReasons.map((reason, idx) => (
                      <li key={idx} className="text-xs text-green-600 flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-green-500" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="text-center text-muted-foreground py-8">
              <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Reviews from Google Places</p>
              <p className="text-xs">Coming soon</p>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="grid grid-cols-2 gap-2">
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover" />
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover opacity-70" />
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover opacity-50" />
              <img src={activity.imageUrl} alt="" className="rounded-lg aspect-square object-cover opacity-30" />
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
