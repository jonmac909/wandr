'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TripDNA } from '@/types/trip-dna';
import { Itinerary, DayPlan, FoodRecommendation } from '@/types/itinerary';
import { TripOverview } from '@/components/itinerary/trip-overview';
import { DayCard } from '@/components/itinerary/day-card';
import { PackingListView } from '@/components/itinerary/packing-list';
import { FoodLayerView } from '@/components/itinerary/food-layer';
import { FoodRecommendationModal } from '@/components/itinerary/food-recommendation-modal';
import { generatePackingList, isPackingListEmpty } from '@/lib/packing/generator';
import { fixFlightDurations, fixAirportCodes } from '@/lib/trips/fix-durations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Calendar, Package, Utensils, Map, Sparkles, Clock, Plane, Train,
  ChevronLeft, Home, Trash2, Pencil, Save, X, MoreVertical, RefreshCw,
  LayoutList, CalendarDays, FileText, DollarSign, GripVertical,
  Check, Circle, Hotel, UtensilsCrossed, Compass, MapPin, MoreHorizontal, ChevronDown,
  Shield, CreditCard, Stethoscope, Car, Ticket, Upload, Plus
} from 'lucide-react';
import Link from 'next/link';
import { tripDb, type StoredTrip } from '@/lib/db/indexed-db';
import { DashboardHeader, TripDrawer, ProfileSettings, MonthCalendar } from '@/components/dashboard';
import { TripRouteMap } from '@/components/trip/TripRouteMap';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Pipeline category colors matching the daily itinerary
const PIPELINE_COLORS: Record<string, { bg: string; iconBg: string; text: string }> = {
  'Overview': { bg: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-800' },
  'Schedule': { bg: 'bg-cyan-50 border-cyan-200', iconBg: 'bg-cyan-100 text-cyan-600', text: 'text-cyan-800' },
  'Transport': { bg: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100 text-blue-600', text: 'text-blue-800' },
  'Hotels': { bg: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100 text-purple-600', text: 'text-purple-800' },
  'Food': { bg: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100 text-orange-600', text: 'text-orange-800' },
  'Activities': { bg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100 text-amber-600', text: 'text-amber-800' },
  'Packing': { bg: 'bg-green-50 border-green-200', iconBg: 'bg-green-100 text-green-600', text: 'text-green-800' },
  'Docs': { bg: 'bg-slate-50 border-slate-200', iconBg: 'bg-slate-100 text-slate-600', text: 'text-slate-800' },
  'Budget': { bg: 'bg-emerald-50 border-emerald-200', iconBg: 'bg-emerald-100 text-emerald-600', text: 'text-emerald-800' },
  'More': { bg: 'bg-gray-50 border-gray-200', iconBg: 'bg-gray-100 text-gray-600', text: 'text-gray-800' },
};

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [tripDna, setTripDna] = useState<TripDNA | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [foodModalDay, setFoodModalDay] = useState<DayPlan | null>(null);
  const [contentFilter, setContentFilter] = useState<string>('overview');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingOverviewIndex, setEditingOverviewIndex] = useState<number | null>(null);
  const [editedLocation, setEditedLocation] = useState('');
  const [expandedOverviewIndex, setExpandedOverviewIndex] = useState<number | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get all trips for the drawer
  const { trips } = useDashboardData();

  // Scroll to day when calendar date is clicked
  const scrollToDay = useCallback((dateStr: string) => {
    setSelectedCalendarDate(dateStr);
    const dayElement = dayRefs.current[dateStr];
    if (dayElement && scheduleContainerRef.current) {
      dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  // Drag and drop state
  const [dragState, setDragState] = useState<{
    blockId: string | null;
    sourceDayId: string | null;
    targetDayId: string | null;
    targetIndex: number | null;
  }>({
    blockId: null,
    sourceDayId: null,
    targetDayId: null,
    targetIndex: null,
  });

  useEffect(() => {
    async function loadTrip() {
      try {
        // Load from cloud/IndexedDB (cloud-first with local fallback)
        const storedTrip = await tripDb.get(tripId);

        if (storedTrip) {
          setTripDna(storedTrip.tripDna);
          if (storedTrip.itinerary) {
            // Parse dates if they're strings (from JSON storage)
            const itinerary = storedTrip.itinerary;
            if (typeof itinerary.createdAt === 'string') {
              itinerary.createdAt = new Date(itinerary.createdAt);
            }
            if (typeof itinerary.updatedAt === 'string') {
              itinerary.updatedAt = new Date(itinerary.updatedAt);
            }
            if (itinerary.aiMeta && typeof itinerary.aiMeta.generatedAt === 'string') {
              itinerary.aiMeta.generatedAt = new Date(itinerary.aiMeta.generatedAt);
            }
            setItinerary(itinerary);
          }
        } else {
          // Fallback to localStorage for backwards compatibility
          const storedTripDna = localStorage.getItem(`trip-dna-${tripId}`);
          if (storedTripDna) {
            setTripDna(JSON.parse(storedTripDna));
          }
          const storedItinerary = localStorage.getItem(`itinerary-${tripId}`);
          if (storedItinerary) {
            setItinerary(JSON.parse(storedItinerary));
          }
        }
      } catch (error) {
        console.error('Error loading trip:', error);
        // Fallback to localStorage on error
        const storedTripDna = localStorage.getItem(`trip-dna-${tripId}`);
        if (storedTripDna) {
          setTripDna(JSON.parse(storedTripDna));
        }
        const storedItinerary = localStorage.getItem(`itinerary-${tripId}`);
        if (storedItinerary) {
          setItinerary(JSON.parse(storedItinerary));
        }
      }
      setLoading(false);
    }

    loadTrip();
  }, [tripId]);

  const handleDelete = async () => {
    await tripDb.delete(tripId);
    localStorage.removeItem(`trip-dna-${tripId}`);
    localStorage.removeItem(`itinerary-${tripId}`);
    router.push('/');
  };

  const handleSaveTitle = async () => {
    if (!itinerary || !editedTitle.trim()) return;

    const updatedItinerary = {
      ...itinerary,
      meta: { ...itinerary.meta, title: editedTitle.trim() },
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));
    setIsEditing(false);

    // Sync to cloud
    if (tripDna) {
      tripDb.updateItinerary(tripId, updatedItinerary);
    }
  };

  const startEditing = () => {
    setEditedTitle(itinerary?.meta.title || '');
    setIsEditing(true);
  };

  const handleUpdateDay = (updatedDay: DayPlan) => {
    if (!itinerary) return;

    const updatedDays = itinerary.days.map(d =>
      d.id === updatedDay.id ? updatedDay : d
    );

    const updatedItinerary = {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Update location name for a range of days (used in overview editing)
  const handleUpdateOverviewLocation = (startDate: string, endDate: string, newLocation: string) => {
    if (!itinerary || !newLocation.trim()) return;

    // Update all days in the range to have this location as their theme
    const updatedDays = itinerary.days.map(day => {
      if (day.date >= startDate && day.date <= endDate) {
        return { ...day, theme: newLocation.trim() };
      }
      return day;
    });

    const updatedItinerary = {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
    setEditingOverviewIndex(null);
  };

  // Drag and drop handlers
  const handleDragStart = (blockId: string, dayId: string) => {
    setDragState({
      blockId,
      sourceDayId: dayId,
      targetDayId: null,
      targetIndex: null,
    });
  };

  const handleDragEnd = () => {
    setDragState({
      blockId: null,
      sourceDayId: null,
      targetDayId: null,
      targetIndex: null,
    });
  };

  const handleDragOver = (dayId: string, index: number) => {
    setDragState(prev => ({
      ...prev,
      targetDayId: dayId,
      targetIndex: index,
    }));
  };

  const handleDrop = (targetDayId: string, targetIndex: number) => {
    if (!itinerary || !dragState.blockId || !dragState.sourceDayId) return;

    const sourceDay = itinerary.days.find(d => d.id === dragState.sourceDayId);
    const targetDay = itinerary.days.find(d => d.id === targetDayId);

    if (!sourceDay || !targetDay) return;

    const blockToMove = sourceDay.blocks.find(b => b.id === dragState.blockId);
    if (!blockToMove) return;

    // Remove from source
    const newSourceBlocks = sourceDay.blocks.filter(b => b.id !== dragState.blockId);

    // Add to target
    let newTargetBlocks: typeof targetDay.blocks;
    if (sourceDay.id === targetDay.id) {
      // Same day reordering
      const originalIndex = sourceDay.blocks.findIndex(b => b.id === dragState.blockId);
      const adjustedIndex = originalIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newTargetBlocks = [...newSourceBlocks];
      newTargetBlocks.splice(adjustedIndex, 0, blockToMove);
    } else {
      // Moving between days
      newTargetBlocks = [...targetDay.blocks];
      newTargetBlocks.splice(targetIndex, 0, blockToMove);
    }

    // Update days
    const updatedDays = itinerary.days.map(d => {
      if (d.id === sourceDay.id && d.id === targetDay.id) {
        return { ...d, blocks: newTargetBlocks };
      }
      if (d.id === sourceDay.id) {
        return { ...d, blocks: newSourceBlocks };
      }
      if (d.id === targetDay.id) {
        return { ...d, blocks: newTargetBlocks };
      }
      return d;
    });

    const updatedItinerary = {
      ...itinerary,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));
    tripDb.updateItinerary(tripId, updatedItinerary);

    handleDragEnd();
  };

  const handleAddFoodRecommendation = (recommendation: FoodRecommendation) => {
    if (!itinerary) return;

    // Check if already exists
    const exists = itinerary.foodLayer.some(f => f.id === recommendation.id);
    if (exists) return;

    // Add to food layer
    const updatedFoodLayer = [...itinerary.foodLayer, recommendation];

    // Also add as a time block to the day's schedule
    const updatedDays = itinerary.days.map(day => {
      if (day.id !== recommendation.dayId) return day;

      // Create a food activity block
      const mealTimeToBlockType = {
        breakfast: 'morning-anchor',
        lunch: 'midday-flex',
        dinner: 'evening-vibe',
        snack: 'midday-flex',
      } as const;

      const blockType = recommendation.mealTime
        ? mealTimeToBlockType[recommendation.mealTime]
        : 'midday-flex';

      const foodBlock = {
        id: `block-${recommendation.id}`,
        type: blockType as 'morning-anchor' | 'midday-flex' | 'evening-vibe',
        activity: {
          id: recommendation.id,
          name: recommendation.name,
          category: 'food' as const,
          description: `${recommendation.cuisine} - ${recommendation.notes || ''}`,
          location: recommendation.location,
          duration: 60, // 1 hour default
          bookingRequired: recommendation.reservationRequired,
          tips: [],
          tags: [recommendation.cuisine, recommendation.mealTime || 'meal'],
        },
        priority: 'if-energy' as const,
        isLocked: false,
      };

      return {
        ...day,
        blocks: [...day.blocks, foodBlock],
      };
    });

    const updatedItinerary = {
      ...itinerary,
      foodLayer: updatedFoodLayer,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  const handleDeleteFoodRecommendation = (foodId: string) => {
    if (!itinerary) return;

    // Remove from food layer
    const updatedFoodLayer = itinerary.foodLayer.filter(f => f.id !== foodId);

    // Also remove from day schedules
    const updatedDays = itinerary.days.map(day => ({
      ...day,
      blocks: day.blocks.filter(block => block.activity?.id !== foodId),
    }));

    const updatedItinerary = {
      ...itinerary,
      foodLayer: updatedFoodLayer,
      days: updatedDays,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Airport code to city name mapping
  const AIRPORT_TO_CITY: Record<string, string> = {
    // Japan
    'NRT': 'Tokyo', 'HND': 'Tokyo', 'KIX': 'Osaka', 'ITM': 'Osaka',
    'NGO': 'Nagoya', 'CTS': 'Sapporo', 'FUK': 'Fukuoka', 'OKA': 'Okinawa',
    // Thailand
    'BKK': 'Bangkok', 'DMK': 'Bangkok', 'CNX': 'Chiang Mai', 'HKT': 'Phuket',
    'USM': 'Koh Samui', 'KBV': 'Krabi',
    // Vietnam
    'HAN': 'Hanoi', 'SGN': 'Ho Chi Minh City', 'DAD': 'Da Nang',
    'CXR': 'Nha Trang', 'PQC': 'Phu Quoc', 'HUI': 'Hue',
    // Southeast Asia
    'SIN': 'Singapore', 'KUL': 'Kuala Lumpur', 'MNL': 'Manila',
    'CGK': 'Jakarta', 'DPS': 'Bali', 'REP': 'Siem Reap', 'PNH': 'Phnom Penh',
    'RGN': 'Yangon', 'VTE': 'Vientiane', 'LPQ': 'Luang Prabang',
    // East Asia
    'HKG': 'Hong Kong', 'ICN': 'Seoul', 'GMP': 'Seoul', 'TPE': 'Taipei',
    'PEK': 'Beijing', 'PVG': 'Shanghai', 'SHA': 'Shanghai',
    // Europe
    'CDG': 'Paris', 'ORY': 'Paris', 'LHR': 'London', 'LGW': 'London',
    'STN': 'London', 'FCO': 'Rome', 'BCN': 'Barcelona', 'AMS': 'Amsterdam',
    'BER': 'Berlin', 'TXL': 'Berlin', 'MUC': 'Munich', 'VIE': 'Vienna',
    'ZRH': 'Zurich', 'GVA': 'Geneva', 'MAD': 'Madrid', 'LIS': 'Lisbon',
    // North America
    'JFK': 'New York', 'EWR': 'New York', 'LGA': 'New York',
    'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'YVR': 'Vancouver',
    'YYZ': 'Toronto', 'YUL': 'Montreal', 'YLW': 'Kelowna', 'SEA': 'Seattle',
    // Oceania
    'SYD': 'Sydney', 'MEL': 'Melbourne', 'AKL': 'Auckland', 'BNE': 'Brisbane',
    // Middle East
    'DXB': 'Dubai', 'DOH': 'Doha', 'AUH': 'Abu Dhabi',
    // Hawaii
    'HNL': 'Honolulu', 'OGG': 'Maui', 'LIH': 'Kauai',
  };

  // Convert airport code to city name - ALWAYS return city name, never airport code
  const airportToCity = (location: string): string => {
    if (!location) return '';
    const trimmed = location.trim();

    // Check if it's a direct airport code match
    const upperCode = trimmed.toUpperCase();
    if (AIRPORT_TO_CITY[upperCode]) {
      return AIRPORT_TO_CITY[upperCode];
    }

    // Check if location starts with airport code (e.g., "CNX, Thailand" or "CNX - Chiang Mai")
    const firstPart = trimmed.split(/[,\-–]/)[0].trim().toUpperCase();
    if (AIRPORT_TO_CITY[firstPart]) {
      return AIRPORT_TO_CITY[firstPart];
    }

    // Check if any 3-letter airport code appears in the string
    const codeMatch = trimmed.match(/\b([A-Z]{3})\b/i);
    if (codeMatch) {
      const matchedCode = codeMatch[1].toUpperCase();
      if (AIRPORT_TO_CITY[matchedCode]) {
        return AIRPORT_TO_CITY[matchedCode];
      }
    }

    // Return original but strip any trailing country/region after comma
    const cityPart = trimmed.split(',')[0].trim();
    return cityPart;
  };

  // Format date for display (e.g., "Mon, Feb 10")
  const formatDisplayDate = (dateStr: string): string => {
    // Parse as local date (avoid timezone issues)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
    return `${weekday}, ${monthName} ${day}`;
  };

  // Get the BASE CITY for a day (used for overview grouping - only groups by city changes)
  // Returns the city where you SLEEP that night, not where you start the day
  const getCityForDay = (day: DayPlan): string => {
    if (!itinerary) return '';

    // Find the base where this day is the checkIn date or between checkIn and day before checkOut
    for (const base of itinerary.route.bases) {
      if (day.date >= base.checkIn && day.date < base.checkOut) {
        return base.location;
      }
    }

    // Check if this day is the checkIn date of any base
    for (const base of itinerary.route.bases) {
      if (day.date === base.checkIn) {
        return base.location;
      }
    }

    // For travel days before first base, find the next base (where you'll arrive)
    const sortedBases = [...itinerary.route.bases].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    for (const base of sortedBases) {
      if (day.date < base.checkIn) {
        return base.location;
      }
    }

    // For days after last checkout, use last base
    if (sortedBases.length > 0) {
      return sortedBases[sortedBases.length - 1].location;
    }

    return '';
  };

  // Get location for a specific day - uses the base city (where you sleep)
  const getLocationForDay = (day: DayPlan): string => {
    // Just use getCityForDay - it returns the city from base.location
    return getCityForDay(day);
  };

  // Regenerate packing list based on trip activities
  const handleRegeneratePackingList = () => {
    if (!itinerary) return;

    const newPackingList = generatePackingList(itinerary, tripDna);

    const updatedItinerary = {
      ...itinerary,
      packingLayer: newPackingList,
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updatedItinerary));

    // Sync to cloud
    tripDb.updateItinerary(tripId, updatedItinerary);
  };

  // Fix flight durations by parsing "Xhr flight" from notes/description
  const handleFixFlightDurations = () => {
    if (!itinerary) return;

    const result = fixFlightDurations(itinerary);

    if (result.fixedCount === 0) {
      alert('No flight durations needed fixing. All durations look correct!');
      return;
    }

    setItinerary(result.itinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(result.itinerary));

    // Also update IndexedDB
    tripDb.get(tripId).then(stored => {
      if (stored) {
        tripDb.save({ ...stored, itinerary: result.itinerary });
      }
    });

    const detailsMsg = result.details.length > 0
      ? '\n\nFixed:\n' + result.details.join('\n')
      : '';
    alert(`Fixed ${result.fixedCount} flight duration(s)!${detailsMsg}`);
  };

  // Fix airport code typos (e.g., KLW → YLW)
  const handleFixAirportCodes = () => {
    if (!itinerary) return;

    const result = fixAirportCodes(itinerary);

    if (result.fixedCount === 0) {
      alert('No airport code typos found!');
      return;
    }

    setItinerary(result.itinerary);
    localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(result.itinerary));

    // Also update IndexedDB
    tripDb.get(tripId).then(stored => {
      if (stored) {
        tripDb.save({ ...stored, itinerary: result.itinerary });
      }
    });

    const detailsMsg = result.details.length > 0
      ? '\n\nFixed:\n' + result.details.join('\n')
      : '';
    alert(`Fixed ${result.fixedCount} airport code(s)!${detailsMsg}`);
  };

  // Auto-generate packing list if empty
  useEffect(() => {
    if (itinerary && isPackingListEmpty(itinerary.packingLayer)) {
      handleRegeneratePackingList();
    }
  }, [itinerary?.id]); // Only run when itinerary loads

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading trip...</p>
        </div>
      </div>
    );
  }

  if (!tripDna) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-bold mb-2">Trip Not Found</h2>
            <p className="text-muted-foreground mb-4">
              We couldn&apos;t find this trip. It may have been deleted or the link is incorrect.
            </p>
            <Link href="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no itinerary yet, show generation prompt
  if (!itinerary) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card>
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Ready to Generate Your Itinerary</h1>
              <p className="text-muted-foreground mb-6">
                Your Trip DNA has been saved. Now Claude will generate a personalized
                itinerary based on your preferences.
              </p>

              {/* Trip DNA Summary */}
              <div className="text-left bg-muted/50 rounded-lg p-4 mb-6 text-sm">
                <h3 className="font-semibold mb-2">Your Trip DNA:</h3>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Party:</strong> {tripDna.travelerProfile.partyType}</li>
                  <li>• <strong>Pace:</strong> {tripDna.vibeAndPace.tripPace}</li>
                  <li>• <strong>Destination:</strong> {tripDna.interests.destination || 'Not specified'}</li>
                  <li>• <strong>Identities:</strong> {tripDna.travelerProfile.travelIdentities.slice(0, 3).join(', ')}</li>
                  <li>• <strong>Budget:</strong> ${tripDna.constraints.budget.dailySpend.min}-${tripDna.constraints.budget.dailySpend.max}/day</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-amber-800 mb-2">
                  🤖 Generation via Claude Opus 4.5
                </h3>
                <p className="text-sm text-amber-700">
                  This app uses <strong>Claude Opus 4.5</strong> via Claude Code (your subscription) to generate itineraries.
                  Ask Claude to generate your itinerary based on this Trip DNA.
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  <strong>Copy this prompt:</strong>
                </p>
                <pre className="bg-white border rounded p-2 text-xs mt-2 overflow-x-auto whitespace-pre-wrap">
{`Using Claude Opus 4.5, generate a detailed itinerary for this Trip DNA. Include:
- Optimized route with bases and movements
- Daily plans with time blocks (morning-anchor, midday-flex, evening-vibe, rest-block)
- Priority rankings (must-see, if-energy, skip-guilt-free)
- Food layer with local classics, splurges, and backups
- Packing list with capsule wardrobe and do-not-bring items

Trip DNA:
${JSON.stringify(tripDna, null, 2)}`}
                </pre>
              </div>

              <div className="flex gap-3 mt-6 justify-center">
                <Link href="/questionnaire">
                  <Button variant="outline">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Edit Trip DNA
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Full itinerary view
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Food Recommendation Modal */}
      {foodModalDay && (
        <FoodRecommendationModal
          location={getLocationForDay(foodModalDay)}
          date={foodModalDay.date}
          dayId={foodModalDay.id}
          onClose={() => setFoodModalDay(null)}
          onAddRecommendation={handleAddFoodRecommendation}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-destructive" />
                </div>
                <h2 className="text-xl font-bold mb-2">Delete Trip?</h2>
                <p className="text-muted-foreground mb-6">
                  Are you sure you want to delete &quot;{itinerary.meta.title}&quot;? This action cannot be undone.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Trip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Navigation Header */}
      <DashboardHeader
        activeTab="trips"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Mobile Top Bar (hidden on tablet and up) */}
      <div className="md:hidden fixed top-14 left-0 right-0 bg-background/95 backdrop-blur border-b z-10">
        <div className="px-4 py-2 flex items-center justify-between">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold text-sm truncate flex-1 text-center mx-4">{itinerary.meta.title}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={startEditing}>
                <Pencil className="w-4 h-4 mr-2" />
                Rename Trip
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Trip
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar (square widgets matching desktop) - hidden on tablet and up */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-10 pb-safe">
        <div className="flex justify-center items-center px-3 pt-3 pb-5 gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles, colors: PIPELINE_COLORS['Overview'] },
            { id: 'schedule', label: 'Schedule', icon: Calendar, colors: PIPELINE_COLORS['Schedule'] },
            { id: 'restaurants', label: 'Food', icon: UtensilsCrossed, colors: PIPELINE_COLORS['Food'] },
            { id: 'docs', label: 'Docs', icon: FileText, colors: PIPELINE_COLORS['Docs'] },
          ].map(({ id, label, icon: Icon, colors }) => (
            <button
              key={id}
              onClick={() => setContentFilter(id)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all aspect-square flex-1 max-w-[72px] border ${
                contentFilter === id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : `${colors.bg} hover:opacity-80`
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                contentFilter === id
                  ? 'bg-primary-foreground/20'
                  : colors.iconBg
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] font-medium text-center ${contentFilter === id ? '' : colors.text}`}>{label}</span>
            </button>
          ))}
          {/* More dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all aspect-square flex-1 max-w-[72px] border ${
                  ['transport', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : `${PIPELINE_COLORS['More'].bg} hover:opacity-80`
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                  ['transport', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? 'bg-primary-foreground/20'
                    : PIPELINE_COLORS['More'].iconBg
                }`}>
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium text-center ${
                  ['transport', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? ''
                    : PIPELINE_COLORS['More'].text
                }`}>More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mb-2">
              <DropdownMenuItem onClick={() => setContentFilter('transport')}>
                <Plane className="w-4 h-4 mr-2" />
                Transport
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('hotels')}>
                <Hotel className="w-4 h-4 mr-2" />
                Hotels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('experiences')}>
                <Compass className="w-4 h-4 mr-2" />
                Activities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('packing')}>
                <Package className="w-4 h-4 mr-2" />
                Packing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setContentFilter('budget')}>
                <DollarSign className="w-4 h-4 mr-2" />
                Budget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area - Fixed height, no page scroll */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 pt-24 pb-28 md:pt-4 md:pb-4 overflow-hidden flex flex-col">
        {/* Two Column Layout: Trip Info + Pipeline Left, Itinerary Right - fills remaining space */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
          {/* Left Column - Route Map (top, expanded) + Pipeline widgets (bottom, square grid) */}
          <aside className="hidden md:flex md:col-span-4 flex-col gap-3 min-h-0">
            {/* Map - shows all locations for overview, single location for schedule */}
            <TripRouteMap
              bases={itinerary.route.bases}
              className="flex-1 min-h-[200px]"
              singleLocation={contentFilter === 'schedule' ? (() => {
                // Get today's date or first day's location for schedule view
                const today = new Date().toISOString().split('T')[0];
                const todayDay = itinerary.days.find(d => d.date === today);
                const currentDay = todayDay || itinerary.days[0];
                return currentDay ? getLocationForDay(currentDay) : undefined;
              })() : undefined}
            />

            {/* Pipeline Card - compact square widgets at bottom */}
            <Card className="flex-shrink-0">
              <CardContent className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {/* Overview */}
                  <PipelineRow
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Overview"
                    count={itinerary.days.length}
                    status="complete"
                    active={contentFilter === 'overview'}
                    onClick={() => setContentFilter('overview')}
                  />
                  {/* Schedule - Daily Itinerary */}
                  <PipelineRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Schedule"
                    count={itinerary.days.length}
                    status="complete"
                    active={contentFilter === 'schedule'}
                    onClick={() => setContentFilter('schedule')}
                  />
                  {/* Transport (flights, trains, buses) */}
                  <PipelineRow
                    icon={<Plane className="w-4 h-4" />}
                    label="Transport"
                    count={itinerary.days.reduce((acc, d) => acc + d.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit').length, 0)}
                    status={itinerary.days.some(d => d.blocks.some(b => b.activity?.category === 'flight' || b.activity?.category === 'transit')) ? 'complete' : 'pending'}
                    active={contentFilter === 'transport'}
                    onClick={() => setContentFilter(contentFilter === 'transport' ? 'overview' : 'transport')}
                  />
                  {/* Hotels */}
                  <PipelineRow
                    icon={<Hotel className="w-4 h-4" />}
                    label="Hotels"
                    count={itinerary.route.bases.filter(b => b.accommodation?.name).length}
                    total={itinerary.route.bases.length}
                    status={itinerary.route.bases.every(b => b.accommodation?.name) ? 'complete' : itinerary.route.bases.some(b => b.accommodation?.name) ? 'partial' : 'pending'}
                    active={contentFilter === 'hotels'}
                    onClick={() => setContentFilter(contentFilter === 'hotels' ? 'overview' : 'hotels')}
                  />
                  {/* Restaurants */}
                  <PipelineRow
                    icon={<UtensilsCrossed className="w-4 h-4" />}
                    label="Food"
                    count={itinerary.foodLayer?.length || 0}
                    status={(itinerary.foodLayer?.length || 0) > 0 ? 'complete' : 'pending'}
                    active={contentFilter === 'restaurants'}
                    onClick={() => setContentFilter(contentFilter === 'restaurants' ? 'overview' : 'restaurants')}
                  />
                  {/* Experiences */}
                  <PipelineRow
                    icon={<Compass className="w-4 h-4" />}
                    label="Activities"
                    count={itinerary.days.reduce((acc, d) => acc + d.blocks.filter(b => b.activity && !['flight', 'transit', 'food'].includes(b.activity.category)).length, 0)}
                    status={itinerary.days.some(d => d.blocks.some(b => b.activity && !['flight', 'transit', 'food'].includes(b.activity.category))) ? 'complete' : 'pending'}
                    active={contentFilter === 'experiences'}
                    onClick={() => setContentFilter(contentFilter === 'experiences' ? 'overview' : 'experiences')}
                  />
                  {/* Packing */}
                  <PipelineRow
                    icon={<Package className="w-4 h-4" />}
                    label="Packing"
                    status={!isPackingListEmpty(itinerary.packingLayer) ? 'complete' : 'pending'}
                    active={contentFilter === 'packing'}
                    onClick={() => setContentFilter(contentFilter === 'packing' ? 'overview' : 'packing')}
                  />
                  {/* Docs */}
                  <PipelineRow
                    icon={<FileText className="w-4 h-4" />}
                    label="Docs"
                    status="pending"
                    active={contentFilter === 'docs'}
                    onClick={() => setContentFilter(contentFilter === 'docs' ? 'overview' : 'docs')}
                  />
                  {/* Budget */}
                  <PipelineRow
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Budget"
                    status="pending"
                    active={contentFilter === 'budget'}
                    onClick={() => setContentFilter(contentFilter === 'budget' ? 'overview' : 'budget')}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Column - Daily Itinerary */}
          <section className="col-span-1 md:col-span-8 min-h-0 h-full max-h-[calc(100vh-14rem)] md:max-h-[calc(100vh-8rem)] overflow-hidden">
            <Card className="h-full flex flex-col">
              <CardContent className="p-4 flex flex-col h-full overflow-hidden">
                {/* Scrollable content area */}
                <div className="flex-1 overflow-auto min-h-0">
                  {/* Overview - Trip Summary */}
                  {contentFilter === 'overview' && (
                    <div className="space-y-4 pr-2">
                      {/* Trip Header */}
                      <div className="flex items-start justify-between">
                        {isEditing ? (
                          <div className="flex-1 space-y-2">
                            <Input
                              value={editedTitle}
                              onChange={(e) => setEditedTitle(e.target.value)}
                              className="h-10 text-xl font-bold"
                              placeholder="Trip name"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={handleSaveTitle}>
                                <Save className="w-4 h-4 mr-1" />
                                Save
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <h2 className="text-2xl font-bold">{itinerary.meta.title}</h2>
                              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                <MapPin className="w-4 h-4" />
                                <span>{itinerary.meta.destination}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={startEditing}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>

                      {/* Quick Glance Schedule - grouped by location from full date range */}
                      {(() => {
                        // Get full date range
                        const firstDate = itinerary.days[0]?.date;
                        const lastDate = itinerary.days[itinerary.days.length - 1]?.date;
                        if (!firstDate || !lastDate) return null;

                        const [y1, m1, d1] = firstDate.split('-').map(Number);
                        const [y2, m2, d2] = lastDate.split('-').map(Number);
                        const start = new Date(y1, m1 - 1, d1);
                        const end = new Date(y2, m2 - 1, d2);
                        const totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        // Create a map of existing days by date
                        const daysByDate: Record<string, DayPlan> = {};
                        itinerary.days.forEach(d => { daysByDate[d.date] = d; });

                        // Group consecutive days by location with day numbers (including empty days)
                        const groups: { location: string; startDate: string; endDate: string; startDay: number; endDay: number; nights: number }[] = [];
                        let dayNum = 1;
                        const current = new Date(start);
                        let lastLocation = '';

                        while (current <= end) {
                          const dateStr = current.toISOString().split('T')[0];
                          const existingDay = daysByDate[dateStr];

                          // Get CITY for this day (not theme/activity - only actual city changes)
                          let location: string;
                          if (existingDay) {
                            location = getCityForDay(existingDay);
                          } else {
                            // For empty days, use the last known location
                            location = lastLocation || itinerary.meta.destination || 'Unknown';
                          }

                          const lastGroup = groups[groups.length - 1];
                          if (lastGroup && lastGroup.location === location) {
                            lastGroup.endDate = dateStr;
                            lastGroup.endDay = dayNum;
                            // Nights = number of days at this location (you sleep each night you're there, except maybe last day)
                            lastGroup.nights = lastGroup.endDay - lastGroup.startDay + 1;
                          } else {
                            groups.push({
                              location,
                              startDate: dateStr,
                              endDate: dateStr,
                              startDay: dayNum,
                              endDay: dayNum,
                              nights: 1, // Even a single day means 1 night at that location
                            });
                          }

                          lastLocation = location;
                          dayNum++;
                          current.setDate(current.getDate() + 1);
                        }

                        // Count unique destinations and transport (flights + trains/buses)
                        const uniqueDestinations = new Set(groups.map(g => g.location)).size;
                        const transportCount = itinerary.days.reduce((acc, d) =>
                          acc + d.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit').length, 0);

                        // Format date string without timezone issues
                        const formatDateString = (dateStr: string) => {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return `${months[month - 1]} ${day}`;
                        };

                        return (
                          <>
                            {/* Trip Stats */}
                            <div className="grid grid-cols-3 gap-3">
                              <Card>
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold">{totalDays}</p>
                                  <p className="text-xs text-muted-foreground">Days</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold">{uniqueDestinations}</p>
                                  <p className="text-xs text-muted-foreground">Destinations</p>
                                </CardContent>
                              </Card>
                              <Card>
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold">{transportCount}</p>
                                  <p className="text-xs text-muted-foreground">Flights</p>
                                </CardContent>
                              </Card>
                            </div>

                            <Card>
                              <CardContent className="p-4">
                                <div className="space-y-2">
                                  {groups.map((group, index) => {
                                    // Get days within this group's date range
                                    const daysInGroup = itinerary.days.filter(
                                      d => d.date >= group.startDate && d.date <= group.endDate
                                    );
                                    // Get transport blocks for this group
                                    const transportBlocks = daysInGroup.flatMap(d =>
                                      d.blocks.filter(b =>
                                        b.activity?.category === 'flight' || b.activity?.category === 'transit'
                                      ).map(b => ({ ...b, date: d.date }))
                                    );
                                    const isExpanded = expandedOverviewIndex === index;

                                    return (
                                      <div key={`${group.location}-${index}`}>
                                        <div
                                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group cursor-pointer hover:bg-muted/70 transition-colors"
                                          onClick={() => {
                                            if (editingOverviewIndex !== index) {
                                              setExpandedOverviewIndex(isExpanded ? null : index);
                                            }
                                          }}
                                        >
                                          {/* Day numbers */}
                                          <div className="w-16 text-xs font-medium text-primary text-center flex-shrink-0">
                                            {group.startDay === group.endDay
                                              ? `Day ${group.startDay}`
                                              : `Day ${group.startDay}-${group.endDay}`}
                                          </div>
                                          {/* Location and dates */}
                                          <div className="flex-1 min-w-0">
                                            {editingOverviewIndex === index ? (
                                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <Input
                                                  value={editedLocation}
                                                  onChange={(e) => setEditedLocation(e.target.value)}
                                                  className="h-7 text-sm"
                                                  autoFocus
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      handleUpdateOverviewLocation(group.startDate, group.endDate, editedLocation);
                                                    } else if (e.key === 'Escape') {
                                                      setEditingOverviewIndex(null);
                                                    }
                                                  }}
                                                />
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-7 w-7"
                                                  onClick={() => handleUpdateOverviewLocation(group.startDate, group.endDate, editedLocation)}
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                  size="icon"
                                                  variant="ghost"
                                                  className="h-7 w-7"
                                                  onClick={() => setEditingOverviewIndex(null)}
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                </Button>
                                              </div>
                                            ) : (
                                              <>
                                                <p className="font-medium truncate">
                                                  {group.location}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                  {formatDateString(group.startDate)}
                                                  {group.startDate !== group.endDate && ` – ${formatDateString(group.endDate)}`}
                                                </p>
                                              </>
                                            )}
                                          </div>
                                          {/* Nights and actions */}
                                          {editingOverviewIndex !== index && (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                              <span className="text-xs text-muted-foreground">
                                                {group.nights === 1 ? '1 night' : `${group.nights} nights`}
                                              </span>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingOverviewIndex(index);
                                                  setEditedLocation(group.location);
                                                }}
                                              >
                                                <Pencil className="w-3 h-3" />
                                              </Button>
                                              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </div>
                                          )}
                                        </div>

                                        {/* Expanded dropdown with daily details */}
                                        {isExpanded && editingOverviewIndex !== index && (
                                          <div className="mt-2 space-y-2 pb-2 pl-3">
                                            {/* Transport for this location group */}
                                            {transportBlocks.length > 0 && (
                                              <div className="space-y-1">
                                                {transportBlocks.map((block) => (
                                                  <div
                                                    key={block.id}
                                                    className="flex items-center gap-2 p-2 rounded bg-blue-50 text-sm"
                                                  >
                                                    {block.activity?.category === 'flight' ? (
                                                      <Plane className="w-3.5 h-3.5 text-blue-600" />
                                                    ) : (
                                                      <Train className="w-3.5 h-3.5 text-cyan-600" />
                                                    )}
                                                    <span className="flex-1">{block.activity?.name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                      {formatDisplayDate(block.date)}
                                                    </span>
                                                  </div>
                                                ))}
                                              </div>
                                            )}

                                            {/* Summary of days */}
                                            {daysInGroup.map((day) => {
                                              const nonTransportActivities = day.blocks.filter(
                                                b => b.activity && b.activity.category !== 'flight' && b.activity.category !== 'transit'
                                              );
                                              if (nonTransportActivities.length === 0 && !transportBlocks.some(t => t.date === day.date)) return null;

                                              return (
                                                <div key={day.id} className="p-2 rounded bg-muted/30 text-sm">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                                    <span className="font-medium">{formatDisplayDate(day.date)}</span>
                                                  </div>
                                                  {nonTransportActivities.length > 0 && (
                                                    <ul className="ml-5 text-xs text-muted-foreground space-y-0.5">
                                                      {nonTransportActivities.slice(0, 3).map((block) => (
                                                        <li key={block.id}>{block.activity?.name}</li>
                                                      ))}
                                                      {nonTransportActivities.length > 3 && (
                                                        <li>+{nonTransportActivities.length - 3} more</li>
                                                      )}
                                                    </ul>
                                                  )}
                                                </div>
                                              );
                                            })}

                                            {daysInGroup.length === 0 && transportBlocks.length === 0 && (
                                              <p className="text-xs text-muted-foreground italic">No activities planned</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Schedule - Calendar + Daily list */}
                  {(contentFilter === 'schedule' || contentFilter === 'all') && (
                    <div className="flex flex-col h-full">
                      {(() => {
                        // Generate all days in the date range (no gaps)
                        const firstDate = itinerary.days[0]?.date;
                        const lastDate = itinerary.days[itinerary.days.length - 1]?.date;
                        if (!firstDate || !lastDate) return itinerary.days.map((day) => (
                          <DayCard key={day.id} day={day} location={getLocationForDay(day)} />
                        ));

                        const [y1, m1, d1] = firstDate.split('-').map(Number);
                        const [y2, m2, d2] = lastDate.split('-').map(Number);
                        const start = new Date(y1, m1 - 1, d1);
                        const end = new Date(y2, m2 - 1, d2);
                        const today = new Date().toISOString().split('T')[0];

                        // Create a map of existing days by date
                        const daysByDate: Record<string, DayPlan> = {};
                        itinerary.days.forEach(d => { daysByDate[d.date] = d; });

                        // Generate all days
                        type DayEntry = (DayPlan & { dayNumber: number }) | { date: string; dayNumber: number; isEmpty: true };
                        const allDays: DayEntry[] = [];
                        let dayNum = 1;
                        const current = new Date(start);

                        while (current <= end) {
                          const dateStr = current.toISOString().split('T')[0];
                          const existingDay = daysByDate[dateStr];

                          if (existingDay) {
                            allDays.push({ ...existingDay, dayNumber: dayNum });
                          } else {
                            allDays.push({ date: dateStr, dayNumber: dayNum, isEmpty: true });
                          }

                          dayNum++;
                          current.setDate(current.getDate() + 1);
                        }

                        // Create a StoredTrip for MonthCalendar
                        const currentTripForCalendar: StoredTrip = {
                          id: tripId,
                          tripDna: tripDna!,
                          itinerary: itinerary,
                          createdAt: itinerary.createdAt,
                          updatedAt: itinerary.updatedAt,
                          syncedAt: new Date(),
                          status: 'active',
                        };

                        return (
                          <>
                            {/* Calendar Card - Same as dashboard */}
                            <div className="flex-shrink-0 mb-3">
                              <MonthCalendar
                                trips={[currentTripForCalendar]}
                                onDateClick={(date) => {
                                  const dateStr = date.toISOString().split('T')[0];
                                  scrollToDay(dateStr);
                                }}
                              />
                            </div>

                            {/* Day list */}
                            <div ref={scheduleContainerRef} className="flex-1 overflow-auto space-y-3 pr-2">
                              {allDays.map((day) => {
                                if ('isEmpty' in day && day.isEmpty) {
                                  // Render empty day placeholder
                                  const [, month, dayOfMonth] = day.date.split('-').map(Number);
                                  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                  const dateDisplay = `${shortMonths[month - 1]} ${dayOfMonth}`;

                                  return (
                                    <div
                                      key={day.date}
                                      ref={(el) => { dayRefs.current[day.date] = el; }}
                                      className="p-3 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20"
                                    >
                                      <div className="flex items-center gap-3 text-muted-foreground">
                                        <span className="text-sm font-medium">Day {day.dayNumber}</span>
                                        <span className="text-xs">{dateDisplay}</span>
                                        <span className="text-xs ml-auto italic">No activities planned</span>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={day.date}
                                    ref={(el) => { dayRefs.current[day.date] = el; }}
                                  >
                                    <DayCard
                                      day={day as DayPlan}
                                      isToday={day.date === today}
                                      isExpanded={expandedDay === null || expandedDay === day.dayNumber}
                                      onToggle={() => setExpandedDay(
                                        expandedDay === day.dayNumber ? null : day.dayNumber
                                      )}
                                      onUpdateDay={handleUpdateDay}
                                      location={getLocationForDay(day as DayPlan)}
                                      onDragStart={handleDragStart}
                                      onDragEnd={handleDragEnd}
                                      onDrop={handleDrop}
                                      onDragOver={handleDragOver}
                                      isDragging={dragState.blockId !== null}
                                      dragOverIndex={dragState.targetDayId === (day as DayPlan).id ? dragState.targetIndex : null}
                                    />
                                  </div>
                                );
                              })}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
                                <GripVertical className="w-3 h-3" />
                                <span>Drag activities to reorder or move between days</span>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Filtered View - Transport (flights + trains/buses) */}
                  {contentFilter === 'transport' && (
                    <div className="space-y-4 pr-2">
                      {itinerary.days.flatMap(day =>
                        day.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit').map(block => (
                          <Card key={block.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  block.activity?.category === 'flight' ? 'bg-blue-100' : 'bg-cyan-100'
                                }`}>
                                  {block.activity?.category === 'flight'
                                    ? <Plane className="w-6 h-6 text-blue-600" />
                                    : <Train className="w-6 h-6 text-cyan-600" />
                                  }
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{block.activity?.name}</h4>
                                  <p className="text-sm text-muted-foreground">{block.activity?.description}</p>
                                  <p className="text-xs text-muted-foreground mt-2">{formatDisplayDate(day.date)}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                      {!itinerary.days.some(d => d.blocks.some(b => b.activity?.category === 'flight' || b.activity?.category === 'transit')) && (
                        <div className="text-center py-12">
                          <Plane className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground">No transport in this trip</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Filtered View - Hotels */}
                  {contentFilter === 'hotels' && (
                    <div className="space-y-4 pr-2">
                      {itinerary.route.bases.map(base => (
                        <Card key={base.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <Hotel className="w-6 h-6 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{base.accommodation?.name || 'Accommodation TBD'}</h4>
                                <p className="text-sm text-muted-foreground">{base.location}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {formatDisplayDate(base.checkIn)} - {formatDisplayDate(base.checkOut)}
                                  {' • '}{base.nights} night{base.nights > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Filtered View - Restaurants */}
                  {contentFilter === 'restaurants' && (
                    <div className="space-y-4 pr-2">
                      <FoodLayerView foods={itinerary.foodLayer} onDeleteFood={handleDeleteFoodRecommendation} />
                    </div>
                  )}

                  {/* Filtered View - Experiences */}
                  {contentFilter === 'experiences' && (
                    <div className="space-y-4 pr-2">
                      {itinerary.days.flatMap(day =>
                        day.blocks.filter(b => b.activity && b.activity.category !== 'flight' && b.activity.category !== 'transit' && b.activity.category !== 'food').map(block => (
                          <Card key={block.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                  <Compass className="w-6 h-6 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{block.activity?.name}</h4>
                                  <p className="text-sm text-muted-foreground">{block.activity?.description}</p>
                                  <p className="text-xs text-muted-foreground mt-2">{formatDisplayDate(day.date)}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                      {!itinerary.days.some(d => d.blocks.some(b => b.activity && b.activity.category !== 'flight' && b.activity.category !== 'transit' && b.activity.category !== 'food')) && (
                        <div className="text-center py-12">
                          <Compass className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground">No experiences planned yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Packing List View */}
                  {contentFilter === 'packing' && (
                    <div className="pr-2">
                      <PackingListView packingList={itinerary.packingLayer} onRegenerate={handleRegeneratePackingList} />
                    </div>
                  )}

                  {/* Documents View */}
                  {contentFilter === 'docs' && (
                    <div className="space-y-3 pr-2">
                      {/* Document categories as cards */}
                      {[
                        { icon: Stethoscope, label: 'Health Insurance', desc: 'Medical coverage abroad', color: 'bg-red-100 text-red-600' },
                        { icon: Shield, label: 'Travel Insurance', desc: 'Trip protection & cancellation', color: 'bg-green-100 text-green-600' },
                        { icon: FileText, label: 'Passport / Visa', desc: 'ID and entry documents', color: 'bg-blue-100 text-blue-600' },
                        { icon: Plane, label: 'Flight Confirmations', desc: 'Booking references & e-tickets', color: 'bg-sky-100 text-sky-600' },
                        { icon: Hotel, label: 'Hotel Reservations', desc: 'Accommodation bookings', color: 'bg-purple-100 text-purple-600' },
                        { icon: Car, label: 'Car Rental', desc: 'Vehicle bookings & licenses', color: 'bg-orange-100 text-orange-600' },
                        { icon: Ticket, label: 'Activity Tickets', desc: 'Tours, attractions & events', color: 'bg-amber-100 text-amber-600' },
                        { icon: CreditCard, label: 'Payment & Cards', desc: 'Credit cards & travel money', color: 'bg-emerald-100 text-emerald-600' },
                      ].map((doc) => (
                        <Card key={doc.label} className="cursor-pointer hover:bg-muted/30 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.color}`}>
                                <doc.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm">{doc.label}</h4>
                                <p className="text-xs text-muted-foreground">{doc.desc}</p>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Budget View */}
                  {contentFilter === 'budget' && (
                    <div className="space-y-4 pr-2">
                      <div className="text-center py-8">
                        <DollarSign className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="font-semibold mb-2">Trip Budget</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Track your travel expenses
                        </p>
                      </div>

                      {/* Budget Summary */}
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-muted-foreground">Total Budget</span>
                            <span className="text-lg font-bold">$0.00</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-sm text-muted-foreground">Spent</span>
                            <span className="text-lg font-bold text-green-600">$0.00</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Remaining</span>
                            <span className="text-lg font-bold">$0.00</span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Budget Categories */}
                      <div>
                        <h4 className="text-sm font-medium mb-3">Categories</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Plane className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">Transport</span>
                            </div>
                            <span className="text-sm font-medium">$0</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-purple-500" />
                              <span className="text-sm">Accommodation</span>
                            </div>
                            <span className="text-sm font-medium">$0</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                              <span className="text-sm">Food & Dining</span>
                            </div>
                            <span className="text-sm font-medium">$0</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Compass className="w-4 h-4 text-amber-500" />
                              <span className="text-sm">Activities</span>
                            </div>
                            <span className="text-sm font-medium">$0</span>
                          </div>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Add Expense
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
      />

      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
}

// Pipeline Row Component (vertical sidebar layout)
interface PipelineRowProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  total?: number;
  status: 'complete' | 'partial' | 'pending';
  active?: boolean;
  onClick: () => void;
}

function PipelineRow({ icon, label, count, total, status, active, onClick }: PipelineRowProps) {
  const colors = PIPELINE_COLORS[label] || { bg: 'bg-muted/50 border-transparent', iconBg: 'bg-muted text-muted-foreground', text: '' };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all aspect-square border ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : `${colors.bg} hover:opacity-80`
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
        active
          ? 'bg-primary-foreground/20'
          : colors.iconBg
      }`}>
        {status === 'complete' && !active ? <Check className="w-5 h-5" /> : icon}
      </div>
      <span className={`text-xs font-medium text-center ${active ? '' : colors.text}`}>{label}</span>
      {count !== undefined && (
        <p className={`text-[10px] text-center ${active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {total ? `${count}/${total}` : `${count}`}
        </p>
      )}
    </button>
  );
}
