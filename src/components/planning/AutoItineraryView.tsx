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
} from 'lucide-react';
import type { TripDNA } from '@/types/trip-dna';
import type { GeneratedActivity, GeneratedDay, CityAllocation } from '@/lib/planning/itinerary-generator';
import { allocateDays } from '@/lib/planning/itinerary-generator';
import dynamic from 'next/dynamic';

// Dynamically import HotelPicker
const HotelPicker = dynamic(() => import('./HotelPicker'), { ssr: false });

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
  onBack: () => void;
  getCityCountry?: (city: string) => string | undefined;
}

// Mock generated days for initial UI
function generateMockDays(allocations: CityAllocation[]): GeneratedDay[] {
  const mockActivities: Record<string, GeneratedActivity[]> = {
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

  const days: GeneratedDay[] = [];
  let dayNumber = 1;

  for (const allocation of allocations) {
    const cityActivities = mockActivities[allocation.city] || mockActivities['Bangkok'];

    for (let i = 0; i < allocation.nights; i++) {
      // Rotate through activities
      const dayActivities = cityActivities.map((act, idx) => ({
        ...act,
        id: `${allocation.city.toLowerCase()}-day${dayNumber}-${idx}`,
      }));

      days.push({
        dayNumber,
        date: allocation.startDate ? addDays(allocation.startDate, i) : '',
        city: allocation.city,
        theme: i === 0 ? 'Highlights Day' : i === 1 ? 'Local Discovery' : 'Relaxed Exploration',
        activities: dayActivities.slice(0, 3 + (i % 2)), // Vary activity count
      });

      dayNumber++;
    }
  }

  return days;
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

export default function AutoItineraryView({
  cities,
  tripDna,
  onBack,
  getCityCountry,
}: AutoItineraryViewProps) {
  // Get total days from TripDNA (check multiple possible paths)
  const totalDays =
    tripDna?.constraints?.dates?.totalDays ||
    (tripDna?.constraints as unknown as { duration?: { days?: number } })?.duration?.days ||
    14;
  const startDate =
    tripDna?.constraints?.dates?.startDate ||
    (tripDna?.constraints as unknown as { startDate?: string })?.startDate ||
    new Date().toISOString().split('T')[0];

  // Day allocation state (can be adjusted by user)
  const [allocations, setAllocations] = useState<CityAllocation[]>(() =>
    allocateDays(cities, totalDays, tripDna, startDate)
  );

  // Generated days (mock for now)
  const [days, setDays] = useState<GeneratedDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set(cities));
  const [isDurationExpanded, setIsDurationExpanded] = useState(false); // Collapsed by default

  // Hotels per city
  const [selectedHotels, setSelectedHotels] = useState<Record<string, { name: string; id: string }>>({});
  const [hotelPickerCity, setHotelPickerCity] = useState<string | null>(null);

  // Activity detail drawer
  const [selectedActivity, setSelectedActivity] = useState<{ activity: GeneratedActivity; index: number } | null>(null);

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

  // Recalculate allocations when cities or totalDays change
  useEffect(() => {
    setAllocations(allocateDays(cities, totalDays, tripDna, startDate));
  }, [cities.join(','), totalDays]);

  // Generate itinerary on mount or when allocations change
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    const timer = setTimeout(() => {
      setDays(generateMockDays(allocations));
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [allocations]);

  // Adjust allocation for a city
  const adjustAllocation = (city: string, delta: number) => {
    setAllocations(prev => {
      const newAllocations = prev.map(a => {
        if (a.city === city) {
          const newNights = Math.max(1, a.nights + delta);
          return { ...a, nights: newNights };
        }
        return a;
      });

      // Recalculate start/end days
      let currentDay = 1;
      return newAllocations.map(a => {
        const startDay = currentDay;
        const endDay = currentDay + a.nights - 1;
        currentDay = endDay + 1;

        const start = new Date(startDate);
        start.setDate(start.getDate() + startDay - 1);
        const end = new Date(startDate);
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

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Itinerary
          </h2>
          <p className="text-sm text-muted-foreground">
            AI-generated based on your preferences
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-1" />
          Regenerate
        </Button>
      </div>

      {/* Day Allocation Summary - Collapsible */}
      <div className="bg-muted/30 rounded-xl overflow-hidden">
        <button
          onClick={() => setIsDurationExpanded(!isDurationExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Trip Duration
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant={currentTotal === totalDays ? 'default' : 'destructive'}>
              {currentTotal} / {totalDays} days
            </Badge>
            {isDurationExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* City allocations - only show when expanded */}
        {isDurationExpanded && (
          <div className="px-4 pb-4 space-y-2">
            {allocations.map((alloc) => {
              return (
                <div key={alloc.city} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <div className="w-2 h-8 rounded-full bg-primary/60" />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{alloc.city}</div>
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

      {/* City sections with days */}
      {!isLoading && allocations.map((alloc, cityIdx) => {
        const color = getCityColor(cityIdx);
        const cityDays = getDaysForCity(alloc.city);
        const isExpanded = expandedCities.has(alloc.city);
        const hasHotel = selectedHotels[alloc.city];

        return (
          <div key={alloc.city} className="space-y-3">
            {/* City header */}
            <button
              onClick={() => toggleCity(alloc.city)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl ${color.light} ${color.border} border transition-all`}
            >
              <div className={`w-10 h-10 rounded-full ${color.bg} flex items-center justify-center text-white font-bold`}>
                {cityIdx + 1}
              </div>
              <div className="flex-1 text-left">
                <div className="font-bold">{alloc.city}</div>
                <div className="text-xs text-muted-foreground">
                  {alloc.nights} nights · {formatDate(alloc.startDate || '')} - {formatDate(alloc.endDate || '')}
                </div>
              </div>
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {isExpanded && (
              <div className="space-y-3 pl-4">
                {/* Hotel prompt */}
                <button
                  onClick={() => setHotelPickerCity(alloc.city)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 border-dashed transition-all ${
                    hasHotel
                      ? 'border-green-300 bg-green-50'
                      : 'border-muted-foreground/30 hover:border-primary/50'
                  }`}
                >
                  <Hotel className={`w-5 h-5 ${hasHotel ? 'text-green-600' : 'text-muted-foreground'}`} />
                  <div className="flex-1 text-left">
                    {hasHotel ? (
                      <>
                        <div className="font-medium text-sm text-green-700">{hasHotel.name}</div>
                        <div className="text-xs text-green-600">Tap to change</div>
                      </>
                    ) : (
                      <>
                        <div className="font-medium text-sm">Add hotel for {formatDate(alloc.startDate || '')} - {formatDate(alloc.endDate || '')}</div>
                        <div className="text-xs text-muted-foreground">Tap to browse accommodations</div>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>

                {/* Days */}
                {cityDays.map((day) => (
                  <DayCard
                    key={day.dayNumber}
                    day={day}
                    color={color}
                    onActivityTap={handleActivityTap}
                    onActivityDelete={handleActivityDelete}
                  />
                ))}
              </div>
            )}
          </div>
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
  onActivityTap: (activity: GeneratedActivity, index: number) => void;
  onActivityDelete: (activityId: string) => void;
}

function DayCard({ day, color, onActivityTap, onActivityDelete }: DayCardProps) {
  return (
    <div className="space-y-3">
      {/* Day header */}
      <div className={`${color.light} px-4 py-2 rounded-lg ${color.border} border`}>
        <div className="flex items-center justify-between">
          <div>
            <span className={`font-bold ${color.text}`}>Day {day.dayNumber}</span>
            <span className="text-muted-foreground text-sm ml-2">{formatDate(day.date)}</span>
          </div>
          {day.theme && (
            <Badge variant="secondary" className="text-xs">
              {day.theme}
            </Badge>
          )}
        </div>
      </div>

      {/* Activities - Wanderlog style cards */}
      <div className="space-y-3">
        {day.activities.map((activity, idx) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            index={idx + 1}
            color={color}
            onTap={() => onActivityTap(activity, idx + 1)}
            onDelete={() => onActivityDelete(activity.id)}
          />
        ))}

        {/* Add activity button */}
        <button className="w-full flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground hover:text-primary transition-colors border-2 border-dashed rounded-xl hover:border-primary/50">
          <Plus className="w-4 h-4" />
          Add a place
        </button>
      </div>
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
}

function ActivityCard({ activity, index, color, onTap, onDelete }: ActivityCardProps) {
  return (
    <div className="group bg-card border rounded-xl overflow-hidden hover:border-primary/30 transition-all">
      <div className="flex">
        {/* Left side - drag handle, checkbox, number */}
        <div className="flex items-start gap-1 p-3 pr-0">
          <button className="p-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab">
            <GripVertical className="w-4 h-4" />
          </button>
          <div className={`w-7 h-7 rounded-full ${color.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {index}
          </div>
        </div>

        {/* Middle - content */}
        <button onClick={onTap} className="flex-1 p-3 pl-2 text-left">
          <div className="font-semibold text-sm">{activity.name}</div>

          {/* Opening hours + short description */}
          <div className="text-xs text-muted-foreground mt-0.5">
            {activity.openingHours && (
              <span>Open {activity.openingHours} • </span>
            )}
            <span className="line-clamp-2">{activity.description}</span>
          </div>

          {/* Notes placeholder */}
          <div className="text-xs text-muted-foreground/60 italic mt-2">
            Add notes, links, etc. here
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <button className="flex items-center gap-1 hover:text-foreground">
              <Clock className="w-3 h-3" />
              Add time
            </button>
            <button className="flex items-center gap-1 hover:text-foreground">
              <DollarSign className="w-3 h-3" />
              Add cost
            </button>
          </div>
        </button>

        {/* Right side - image */}
        <div className="p-3 pl-0">
          <div className="w-24 h-20 rounded-lg overflow-hidden relative">
            <img
              src={activity.imageUrl}
              alt={activity.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-3 pl-0 text-muted-foreground/30 hover:text-destructive transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Walking time footer */}
      {activity.walkingTimeToNext && (
        <div className="px-4 py-2 border-t bg-muted/30 flex items-center gap-2 text-xs text-muted-foreground">
          <Footprints className="w-3 h-3" />
          <span>{activity.walkingTimeToNext} min</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{(activity.walkingTimeToNext * 0.05).toFixed(1)} mi</span>
          <button className="ml-auto flex items-center gap-1 hover:text-foreground">
            <span>Directions</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-end">
      <div className="bg-background w-full sm:w-96 sm:h-full rounded-t-2xl sm:rounded-none overflow-hidden flex flex-col max-h-[85vh] sm:max-h-full">
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
