'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
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
import { generateBookingUrl } from '@/lib/booking/urls';
import { getFlagForLocation } from '@/lib/geo/city-country';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Calendar, Package, Utensils, Map, Sparkles, Clock, Plane, Train,
  ChevronLeft, Home, Trash2, Pencil, Save, X, RefreshCw,
  LayoutList, CalendarDays, FileText, DollarSign, GripVertical,
  Check, Circle, Hotel, UtensilsCrossed, Compass, MapPin, MoreHorizontal, ChevronDown,
  Shield, CreditCard, Stethoscope, Car, Ticket, Upload, Plus, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { tripDb, documentDb, StoredDocument } from '@/lib/db/indexed-db';
import { DashboardHeader, TripDrawer, ProfileSettings, MonthCalendar } from '@/components/dashboard';
import { TripRouteMap } from '@/components/trip/TripRouteMap';
import { ChatSheet } from '@/components/chat/ChatSheet';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Pipeline category colors - all distinct warm neutral tones
const PIPELINE_COLORS: Record<string, { bg: string; iconBg: string; text: string }> = {
  'Overview': { bg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100 text-red-600', text: 'text-red-800' },
  'Schedule': { bg: 'bg-gray-50 border-gray-200', iconBg: 'bg-gray-100 text-gray-600', text: 'text-gray-800' },
  'Transport': { bg: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100 text-blue-600', text: 'text-blue-800' },
  'Hotels': { bg: 'bg-purple-50 border-purple-200', iconBg: 'bg-purple-100 text-purple-600', text: 'text-purple-800' },
  'Food': { bg: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100 text-orange-600', text: 'text-orange-800' },
  'Activities': { bg: 'bg-yellow-50 border-yellow-200', iconBg: 'bg-yellow-100 text-yellow-600', text: 'text-yellow-800' },
  'Packing': { bg: 'bg-amber-100 border-amber-300', iconBg: 'bg-amber-200 text-amber-700', text: 'text-amber-800' },
  'Docs': { bg: 'bg-lime-50 border-lime-200', iconBg: 'bg-lime-100 text-lime-600', text: 'text-lime-800' },
  'Budget': { bg: 'bg-indigo-50 border-indigo-200', iconBg: 'bg-indigo-100 text-indigo-600', text: 'text-indigo-800' },
  'More': { bg: 'bg-stone-50 border-stone-200', iconBg: 'bg-stone-100 text-stone-600', text: 'text-stone-800' },
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
  const [chatOpen, setChatOpen] = useState(false);
  const [editingOverviewIndex, setEditingOverviewIndex] = useState<number | null>(null);
  const [editedLocation, setEditedLocation] = useState('');
  const [expandedOverviewIndex, setExpandedOverviewIndex] = useState<number | null>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [editingHotelIndex, setEditingHotelIndex] = useState<number | null>(null);
  const [editingNights, setEditingNights] = useState<number>(1);
  const scheduleContainerRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Get all trips for the drawer
  const { trips } = useDashboardData();


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
      // Load documents for this trip
      const docs = await documentDb.getByTrip(tripId);
      setDocuments(docs);

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

  // Document upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !uploadingCategory) return;

    // Map category labels to document types
    const categoryToType: Record<string, StoredDocument['type']> = {
      'Health Insurance': 'pdf',
      'Travel Insurance': 'pdf',
      'Passport / Visa': 'pdf',
      'Flight Confirmations': 'booking',
      'Hotel Reservations': 'booking',
      'Car Rental': 'booking',
      'Activity Tickets': 'booking',
      'Payment & Cards': 'other',
    };

    for (const file of Array.from(files)) {
      const type = categoryToType[uploadingCategory] || 'other';
      const doc = await documentDb.add(tripId, `${uploadingCategory}: ${file.name}`, type, file);
      setDocuments(prev => [...prev, doc]);
    }

    // Reset
    setUploadingCategory(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (docId: string) => {
    await documentDb.delete(docId);
    setDocuments(prev => prev.filter(d => d.id !== docId));
  };

  // Get documents for a specific category
  const getDocsForCategory = (category: string) => {
    return documents.filter(d => d.name.startsWith(`${category}:`));
  };

  // Update hotel nights
  const handleUpdateHotelNights = async (baseIndex: number, newNights: number) => {
    if (!itinerary) return;

    const bases = [...itinerary.route.bases];
    const base = bases[baseIndex];
    if (!base || !base.checkIn) return;

    // Calculate new checkout date
    const [year, month, day] = base.checkIn.split('-').map(Number);
    const checkInDate = new Date(year, month - 1, day);
    checkInDate.setDate(checkInDate.getDate() + newNights);
    const newCheckOut = `${checkInDate.getFullYear()}-${String(checkInDate.getMonth() + 1).padStart(2, '0')}-${String(checkInDate.getDate()).padStart(2, '0')}`;

    // Update base
    bases[baseIndex] = {
      ...base,
      nights: newNights,
      checkOut: newCheckOut,
    };

    const updatedItinerary = {
      ...itinerary,
      route: { ...itinerary.route, bases },
      updatedAt: new Date(),
    };

    setItinerary(updatedItinerary);
    setEditingHotelIndex(null);

    // Persist to DB
    if (tripDna) {
      await tripDb.updateItinerary(tripId, updatedItinerary);
    }
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

    // Update all days in the range:
    // 1. Set a custom location override field
    // 2. Update all activity locations to the new city
    const updatedDays = itinerary.days.map(day => {
      if (day.date >= startDate && day.date <= endDate) {
        // Update all activity locations to new city
        const updatedBlocks = day.blocks.map(block => {
          if (block.activity?.location) {
            return {
              ...block,
              activity: {
                ...block.activity,
                location: { ...block.activity.location, name: newLocation.trim() }
              }
            };
          }
          return block;
        });
        return { ...day, blocks: updatedBlocks, customLocation: newLocation.trim() };
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

  // Get flags for multi-country destination string (e.g., "Thailand, Vietnam, Japan, Hawaii")
  // Returns string with flag before each country: "🇹🇭 Thailand, 🇻🇳 Vietnam, 🇯🇵 Japan, 🇺🇸 Hawaii"
  const getFlagsForDestination = (destination: string): string => {
    if (!destination) return '';
    const parts = destination.split(',').map(p => p.trim());
    return parts.map(part => {
      const flag = getFlagForLocation(part);
      return flag ? `${flag} ${part}` : part;
    }).join(', ');
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

  // Calculate actual nights from consecutive base check-ins (base.nights data may be wrong)
  const getActualNights = (baseIndex: number): number => {
    if (!itinerary?.route?.bases) return 1;
    const bases = itinerary.route.bases;
    const base = bases[baseIndex];
    const nextBase = bases[baseIndex + 1];

    if (nextBase?.checkIn && base?.checkIn) {
      const [y1, m1, d1] = base.checkIn.split('-').map(Number);
      const [y2, m2, d2] = nextBase.checkIn.split('-').map(Number);
      const checkInDate = new Date(y1, m1 - 1, d1);
      const nextCheckInDate = new Date(y2, m2 - 1, d2);
      const diffDays = Math.round((nextCheckInDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) return diffDays;
    }

    return base?.nights || 1;
  };

  // Calculate checkout date from checkin + nights
  const getCheckOutDate = (checkIn: string, nights: number): string => {
    const [year, month, day] = checkIn.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + nights);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Normalize location names - merge equivalent places and convert airport codes
  const normalizeLocation = (location: string): string => {
    if (!location) return '';
    const trimmed = location.trim();
    const lower = trimmed.toLowerCase();

    // Airport code conversions
    if (trimmed.toUpperCase() === 'YLW') return 'Kelowna';
    if (trimmed.toUpperCase() === 'HNL') return 'Honolulu';
    if (trimmed.toUpperCase() === 'OGG') return 'Maui';
    if (trimmed.toUpperCase() === 'NRT') return 'Tokyo';

    // Merge airport cities to main city (Narita is Tokyo's airport)
    if (lower === 'narita' || lower.includes('narita')) return 'Tokyo';
    if (lower === 'tokyo narita') return 'Tokyo';
    if (lower === 'haneda' || lower.includes('haneda')) return 'Tokyo';

    // Merge equivalent locations (Oahu = Honolulu, they're the same place)
    if (lower === 'oahu' || lower.includes('oahu')) return 'Honolulu';
    if (lower === 'waikiki' || lower.includes('waikiki')) return 'Honolulu';

    // Use airportToCity for any remaining codes
    const converted = airportToCity(trimmed);
    return converted;
  };

  // Get the BASE CITY for a day - analyze the schedule to find where you SLEEP that night
  // Always normalizes the result (converts airport codes, merges Oahu/Honolulu, etc.)
  const getCityForDay = (day: DayPlan): string => {
    if (!itinerary) return '';

    // 0. Check if user manually edited this location
    if ((day as DayPlan & { customLocation?: string }).customLocation) {
      return normalizeLocation((day as DayPlan & { customLocation?: string }).customLocation!);
    }

    // 1. First check for accommodation activity - that's where you sleep
    const accommodationBlock = day.blocks.find(b =>
      b.activity?.category === 'accommodation' ||
      b.activity?.category === 'checkin'
    );
    if (accommodationBlock?.activity) {
      // Try location.name first, then fall back to parsing hotel name
      if (accommodationBlock.activity.location?.name) {
        return normalizeLocation(accommodationBlock.activity.location.name);
      }
      // Parse hotel name for location hints (e.g., "Hotel Nikko Narita" → Tokyo)
      const hotelName = accommodationBlock.activity.name || '';
      if (hotelName.toLowerCase().includes('narita')) return 'Tokyo';
      if (hotelName.toLowerCase().includes('haneda')) return 'Tokyo';
    }

    // 2. Check for flight - but handle overnight flights specially
    const flightBlocks = day.blocks.filter(b => b.activity?.category === 'flight');
    if (flightBlocks.length > 0) {
      // Map common airport codes to city names
      const airportToCityMap: Record<string, string> = {
        'NRT': 'Tokyo', 'HND': 'Tokyo', 'KIX': 'Osaka',
        'BKK': 'Bangkok', 'CNX': 'Chiang Mai', 'HKT': 'Phuket',
        'SIN': 'Singapore', 'HKG': 'Hong Kong', 'ICN': 'Seoul',
        'TPE': 'Taipei', 'YVR': 'Vancouver', 'YYZ': 'Toronto',
        'YLW': 'Kelowna', 'YYC': 'Calgary', 'YEG': 'Edmonton',
        'LAX': 'Los Angeles', 'SFO': 'San Francisco', 'JFK': 'New York',
        'LHR': 'London', 'CDG': 'Paris', 'FCO': 'Rome',
        'DAN': 'Da Nang', 'DAD': 'Da Nang', 'SGN': 'Ho Chi Minh',
        'HAN': 'Hanoi', 'REP': 'Siem Reap', 'KUL': 'Kuala Lumpur',
        'HNL': 'Honolulu', 'OGG': 'Maui', 'LIH': 'Kauai',
      };

      // Check if ANY flight is overnight (arrives next day)
      const hasOvernightFlight = flightBlocks.some(b =>
        (b.activity?.name || '').includes('+1') || (b.activity?.name || '').includes('+2')
      );

      if (hasOvernightFlight) {
        // For overnight flights, show where you START the day (first flight's origin)
        const firstFlight = flightBlocks[0];
        const firstName = firstFlight?.activity?.name || '';
        const firstCodeMatch = firstName.match(/([A-Z]{3})\s*[-–→]\s*([A-Z]{3})/);
        if (firstCodeMatch) {
          return normalizeLocation(airportToCityMap[firstCodeMatch[1]] || firstCodeMatch[1]);
        }
      }

      // For same-day flights, use last flight's destination
      const lastFlight = flightBlocks[flightBlocks.length - 1];
      const flightName = lastFlight?.activity?.name || '';
      const codeMatch = flightName.match(/([A-Z]{3})\s*[-–→]\s*([A-Z]{3})/);

      if (codeMatch) {
        return normalizeLocation(airportToCityMap[codeMatch[2]] || codeMatch[2]);
      }

      // Try to parse destination from flight name formats:
      // "Bangkok → Chiang Mai" or "City A - City B" (but not times like 9:50am-1:00pm)
      const cityMatch = flightName.match(/([A-Za-z][A-Za-z\s]+)\s*[→–]\s*([A-Za-z][A-Za-z\s]+?)(?:\s|$)/);
      if (cityMatch && !cityMatch[2].match(/\d/)) {
        return normalizeLocation(cityMatch[2].trim());
      }

      // Fallback to location if can't parse
      if (lastFlight?.activity?.location?.name) {
        return normalizeLocation(lastFlight.activity.location.name);
      }
    }

    // 3. Check any activity's location - they should all be in same city for that day
    for (const block of day.blocks) {
      if (block.activity?.location?.name) {
        return normalizeLocation(block.activity.location.name);
      }
    }

    // 4. Fallback to base data if no activities have location
    for (const base of itinerary.route.bases) {
      if (day.date >= base.checkIn && day.date < base.checkOut) {
        return normalizeLocation(base.location);
      }
    }

    return '';
  };

  // Get location for a specific day - uses the base city (where you sleep)
  const getLocationForDay = (day: DayPlan): string => {
    // Just use getCityForDay - it returns the city from base.location
    return getCityForDay(day);
  };

  // Build route from schedule - extract unique cities in order they appear
  const sortedBases = useMemo(() => {
    if (!itinerary?.days) return itinerary?.route?.bases || [];

    // Get cities from schedule in order
    const seenCities = new Set<string>();
    const orderedCities: string[] = [];

    itinerary.days.forEach(day => {
      const city = getCityForDay(day);
      if (city && !seenCities.has(city.toLowerCase())) {
        seenCities.add(city.toLowerCase());
        orderedCities.push(city);
      }
    });

    // Map ordered cities to bases (or create placeholder bases)
    const bases = itinerary.route?.bases || [];
    return orderedCities.map((city, index) => {
      // Try to find matching base
      const matchingBase = bases.find(b => {
        const baseCity = normalizeLocation(b.location?.split(',')[0] || '');
        return baseCity.toLowerCase() === city.toLowerCase();
      });

      return matchingBase || {
        id: `city-${index}`,
        location: city,
        nights: 1,
        checkIn: '',
        checkOut: '',
        rationale: '',
      };
    });
  }, [itinerary?.days, itinerary?.route?.bases]);

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

  // Calculate total trip days from date range (not just days with activities)
  const getTotalTripDays = (): number => {
    if (!itinerary?.days?.length) return 0;

    // Use tripDna start date if available (includes departure day)
    const tripStartDate = tripDna?.constraints?.dates?.startDate;
    const firstDate = tripStartDate || itinerary.days[0]?.date;
    const lastDate = itinerary.days[itinerary.days.length - 1]?.date;

    if (!firstDate || !lastDate) return itinerary.days.length;

    const [y1, m1, d1] = firstDate.split('-').map(Number);
    const [y2, m2, d2] = lastDate.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);

    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
        onOpenChat={() => setChatOpen(true)}
      />


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
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 pt-1 pb-20 md:pb-1 overflow-hidden flex flex-col">
        {/* Two Column Layout: Trip Info + Pipeline Left, Itinerary Right - fills remaining space */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-1.5 items-stretch">
          {/* Left Column - Route Map (top, expanded) + Pipeline widgets (bottom, square grid) */}
          <aside className="hidden md:flex md:col-span-4 flex-col gap-1.5 min-h-0">
            {/* Map - shows all locations for overview, single location for schedule */}
            <TripRouteMap
              bases={sortedBases}
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
            <Card className="flex-shrink-0 py-0">
              <CardContent className="p-1.5">
                <div className="grid grid-cols-3 gap-2">
                  {/* Overview */}
                  <PipelineRow
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Overview"
                    countLabel={`${itinerary.days.length}/${getTotalTripDays()}`}
                    active={contentFilter === 'overview'}
                    onClick={() => setContentFilter('overview')}
                  />
                  {/* Schedule - Daily Itinerary */}
                  <PipelineRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Schedule"
                    countLabel={`${itinerary.days.length}/${getTotalTripDays()}`}
                    active={contentFilter === 'schedule'}
                    onClick={() => setContentFilter('schedule')}
                  />
                  {/* Transport (flights, trains, buses) */}
                  <PipelineRow
                    icon={<Plane className="w-4 h-4" />}
                    label="Transport"
                    count={itinerary.days.reduce((acc, d) => acc + d.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit').length, 0)}
                    active={contentFilter === 'transport'}
                    onClick={() => setContentFilter(contentFilter === 'transport' ? 'overview' : 'transport')}
                  />
                  {/* Hotels */}
                  <PipelineRow
                    icon={<Hotel className="w-4 h-4" />}
                    label="Hotels"
                    count={itinerary.route.bases.filter(b => b.accommodation?.name).length}
                    active={contentFilter === 'hotels'}
                    onClick={() => setContentFilter(contentFilter === 'hotels' ? 'overview' : 'hotels')}
                  />
                  {/* Food */}
                  <PipelineRow
                    icon={<UtensilsCrossed className="w-4 h-4" />}
                    label="Food"
                    count={itinerary.foodLayer?.length || 0}
                    active={contentFilter === 'restaurants'}
                    onClick={() => setContentFilter(contentFilter === 'restaurants' ? 'overview' : 'restaurants')}
                  />
                  {/* Activities */}
                  <PipelineRow
                    icon={<Compass className="w-4 h-4" />}
                    label="Activities"
                    count={itinerary.days.reduce((acc, d) => acc + d.blocks.filter(b => b.activity && !['flight', 'transit', 'food'].includes(b.activity.category)).length, 0)}
                    active={contentFilter === 'experiences'}
                    onClick={() => setContentFilter(contentFilter === 'experiences' ? 'overview' : 'experiences')}
                  />
                  {/* Packing */}
                  <PipelineRow
                    icon={<Package className="w-4 h-4" />}
                    label="Packing"
                    active={contentFilter === 'packing'}
                    onClick={() => setContentFilter(contentFilter === 'packing' ? 'overview' : 'packing')}
                  />
                  {/* Docs */}
                  <PipelineRow
                    icon={<FileText className="w-4 h-4" />}
                    label="Docs"
                    active={contentFilter === 'docs'}
                    onClick={() => setContentFilter(contentFilter === 'docs' ? 'overview' : 'docs')}
                  />
                  {/* Budget */}
                  <PipelineRow
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Budget"
                    active={contentFilter === 'budget'}
                    onClick={() => setContentFilter(contentFilter === 'budget' ? 'overview' : 'budget')}
                  />
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Right Column - Daily Itinerary */}
          <section className="col-span-1 md:col-span-8 min-h-0 h-full overflow-hidden">
            <Card className="h-full flex flex-col py-0">
              <CardContent className="p-1.5 flex flex-col h-full overflow-hidden">
                {/* Persistent Trip Header - shows on all views */}
                <div className="flex-shrink-0 pb-2 mb-2 border-b text-center md:text-left">
                  {isEditing ? (
                    <div className="space-y-2">
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="h-9 text-lg font-bold"
                        placeholder="Trip name"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-center md:justify-start">
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
                    <div className="group">
                      <div className="flex items-center justify-center md:justify-start gap-2">
                        <h2 className="text-lg font-bold">{itinerary.meta.title}</h2>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={startEditing}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getFlagsForDestination(itinerary.meta.destination)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Calendar Card - Shows on all views EXCEPT overview */}
                {contentFilter !== 'overview' && (
                  <div className="flex-shrink-0 mb-2">
                    {/* Mobile: collapsible, starts collapsed */}
                    <div className="md:hidden">
                      <MonthCalendar
                        trips={[{
                          id: tripId,
                          tripDna: tripDna!,
                          itinerary: itinerary,
                          createdAt: itinerary.createdAt,
                          updatedAt: itinerary.updatedAt,
                          syncedAt: new Date(),
                          status: 'active' as const,
                        }]}
                        compact
                        itinerary={itinerary}
                        contentFilter={contentFilter}
                        collapsible
                        defaultCollapsed
                        onDateClick={(date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          setTimeout(() => {
                            const dateElement = document.querySelector(`[data-date="${dateStr}"]`);
                            if (dateElement) {
                              dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else if (contentFilter === 'schedule') {
                              const dayElement = dayRefs.current[dateStr];
                              if (dayElement) {
                                dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }
                          }, 100);
                        }}
                      />
                    </div>
                    {/* Desktop: not collapsible */}
                    <div className="hidden md:block">
                      <MonthCalendar
                        trips={[{
                          id: tripId,
                          tripDna: tripDna!,
                          itinerary: itinerary,
                          createdAt: itinerary.createdAt,
                          updatedAt: itinerary.updatedAt,
                          syncedAt: new Date(),
                          status: 'active' as const,
                        }]}
                        compact
                        itinerary={itinerary}
                        contentFilter={contentFilter}
                        onDateClick={(date) => {
                          const dateStr = date.toISOString().split('T')[0];
                          setTimeout(() => {
                            const dateElement = document.querySelector(`[data-date="${dateStr}"]`);
                            if (dateElement) {
                              dateElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            } else if (contentFilter === 'schedule') {
                              const dayElement = dayRefs.current[dateStr];
                              if (dayElement) {
                                dayElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }
                          }, 100);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Scrollable content area */}
                <div className="flex-1 overflow-auto min-h-0">
                  {/* Overview - Trip Summary */}
                  {contentFilter === 'overview' && (
                    <div className="space-y-3 pr-1">
                      {/* Quick Glance Schedule - grouped by location from full date range */}
                      {(() => {
                        // Get full date range - use tripDna start date if available (includes departure day)
                        const tripStartDate = tripDna?.constraints?.dates?.startDate;
                        const firstDate = tripStartDate || itinerary.days[0]?.date;
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

                        // Helper to format date as YYYY-MM-DD without timezone issues
                        const toDateStr = (d: Date) => {
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          return `${yyyy}-${mm}-${dd}`;
                        };

                        while (current <= end) {
                          const dateStr = toDateStr(current);
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
                            // Same location - extend the group
                            lastGroup.endDate = dateStr;
                            lastGroup.endDay = dayNum;
                            lastGroup.nights = Math.max(1, lastGroup.endDay - lastGroup.startDay);
                          } else {
                            // Location change - start new group (no overlap)
                            groups.push({
                              location,
                              startDate: dateStr,
                              endDate: dateStr,
                              startDay: dayNum,
                              endDay: dayNum,
                              nights: 1,
                            });
                          }

                          lastLocation = location;
                          dayNum++;
                          current.setDate(current.getDate() + 1);
                        }

                        // Exclude origin (first) and return (last) locations from destination counts
                        // These are typically home cities, not destinations
                        const destinationGroups = groups.length > 2
                          ? groups.slice(1, -1)  // Remove first and last
                          : groups;

                        // Count unique cities (destinations only, not origin)
                        const uniqueCities = new Set(destinationGroups.map(g => g.location)).size;

                        // Count unique countries by looking at flags (destinations only)
                        const uniqueCountries = new Set(
                          destinationGroups.map(g => getFlagForLocation(g.location)).filter(f => f)
                        ).size;

                        // Format date string without timezone issues
                        const formatDateString = (dateStr: string) => {
                          const [year, month, day] = dateStr.split('-').map(Number);
                          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return `${months[month - 1]} ${day}`;
                        };

                        // Format the trip date range
                        const tripDateRange = `${formatDateString(firstDate)} – ${formatDateString(lastDate)}`;

                        // Count flights
                        const allFlights = itinerary.days.flatMap(d =>
                          d.blocks.filter(b => b.activity?.category === 'flight')
                        );
                        const totalFlights = allFlights.length;

                        return (
                          <>
                            {/* Stats Cards Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                              <Card className="py-0">
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold text-primary">{totalDays}</p>
                                  <p className="text-xs text-muted-foreground">days</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{tripDateRange}</p>
                                </CardContent>
                              </Card>
                              <Card className="py-0">
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold text-primary">{uniqueCountries}</p>
                                  <p className="text-xs text-muted-foreground">{uniqueCountries === 1 ? 'country' : 'countries'}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{uniqueCities} {uniqueCities === 1 ? 'city' : 'cities'}</p>
                                </CardContent>
                              </Card>
                              <Card className="py-0">
                                <CardContent className="p-3 text-center">
                                  <p className="text-2xl font-bold text-primary">{totalFlights}</p>
                                  <p className="text-xs text-muted-foreground">{totalFlights === 1 ? 'flight' : 'flights'}</p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Destinations Card */}
                            <Card className="py-0">
                              <CardContent className="p-2">
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
                                                  {getFlagForLocation(group.location)} {group.location}
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
                                          <div className="mt-2 space-y-1 pb-2 pl-3">
                                            {/* All events as flat list with date on right */}
                                            {daysInGroup.flatMap((day) =>
                                              day.blocks.filter(b => b.activity).map((block) => (
                                                <div key={block.id} className="flex items-center gap-2 text-sm">
                                                  {block.activity?.category === 'flight' && (
                                                    <Plane className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                                  )}
                                                  {block.activity?.category === 'transit' && (
                                                    <Train className="w-3 h-3 text-amber-600 flex-shrink-0" />
                                                  )}
                                                  {block.activity?.category === 'accommodation' && (
                                                    <Hotel className="w-3 h-3 text-rose-600 flex-shrink-0" />
                                                  )}
                                                  {!['flight', 'transit', 'accommodation'].includes(block.activity?.category || '') && (
                                                    <Circle className="w-2 h-2 text-muted-foreground flex-shrink-0" />
                                                  )}
                                                  <span className="text-xs flex-1 truncate">
                                                    {block.activity?.name}
                                                    {block.activity?.category === 'flight' && (block.activity?.name || '').includes('+1') && (
                                                      <span className="text-muted-foreground ml-1">(overnight)</span>
                                                    )}
                                                  </span>
                                                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                    {formatDisplayDate(day.date)}
                                                  </span>
                                                </div>
                                              ))
                                            )}

                                            {daysInGroup.every(d => d.blocks.filter(b => b.activity).length === 0) && (
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

                        return (
                          <>
                            {/* Day list */}
                            <div ref={scheduleContainerRef} className="flex-1 overflow-auto space-y-2 pr-1">
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
                                      isExpanded={true}
                                      onUpdateDay={handleUpdateDay}
                                      location={getLocationForDay(day as DayPlan)}
                                      bases={itinerary.route.bases}
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
                  {contentFilter === 'transport' && (() => {
                    // Calculate transport stats
                    const allTransport = itinerary.days.flatMap(d =>
                      d.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit')
                    );
                    const flightCount = allTransport.filter(b => b.activity?.category === 'flight').length;
                    const transitCount = allTransport.filter(b => b.activity?.category === 'transit').length;
                    const notBooked = allTransport.filter(b => b.activity?.reservationStatus !== 'done').length;
                    const today = new Date().toISOString().split('T')[0];

                    // Filter days to only include those with transport
                    const daysWithTransport = itinerary.days
                      .filter(day => day.blocks.some(b => b.activity?.category === 'flight' || b.activity?.category === 'transit'))
                      .map(day => ({
                        ...day,
                        blocks: day.blocks.filter(b => b.activity?.category === 'flight' || b.activity?.category === 'transit')
                      }));

                    return (
                    <div className="space-y-2 pr-1">
                      {/* Summary stats bar */}
                      <div className="flex items-center gap-3 text-sm pb-2 border-b">
                        {flightCount > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Plane className="w-3.5 h-3.5" />
                            {flightCount} flight{flightCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {transitCount > 0 && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <Train className="w-3.5 h-3.5" />
                            {transitCount} train{transitCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {notBooked > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <span className="w-2 h-2 rounded-full border-2 border-orange-400" />
                            {notBooked} to book
                          </span>
                        )}
                        {notBooked === 0 && allTransport.length > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            All booked
                          </span>
                        )}
                      </div>
                      {/* Use DayCard with filtered blocks - same as schedule view */}
                      {daysWithTransport.map(day => (
                        <DayCard
                          key={day.id}
                          day={day}
                          isToday={day.date === today}
                          isExpanded={true}
                          onUpdateDay={handleUpdateDay}
                          location={getLocationForDay(day)}
                          bases={itinerary.route.bases}
                        />
                      ))}
                      {daysWithTransport.length === 0 && (
                        <div className="text-center py-8">
                          <Plane className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No transport in this trip</p>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Filtered View - Hotels */}
                  {contentFilter === 'hotels' && (() => {
                    // Calculate hotel stats - use optional chaining for safety
                    const bases = itinerary.route?.bases || [];
                    const hotelCount = bases.length;
                    const totalNights = bases.reduce((sum, _, idx) => sum + getActualNights(idx), 0);
                    const notBooked = bases.filter(base => {
                      const block = itinerary.days.flatMap(d => d.blocks)
                        .find(b => b.activity?.name?.toLowerCase() === base.accommodation?.name?.toLowerCase());
                      return block?.activity?.reservationStatus !== 'done';
                    }).length;
                    const today = new Date().toISOString().split('T')[0];

                    return (
                    <div className="space-y-2 pr-1">
                      {/* Summary stats bar */}
                      <div className="flex items-center gap-3 text-sm pb-2 border-b">
                        <span className="flex items-center gap-1 text-purple-600">
                          <Hotel className="w-3.5 h-3.5" />
                          {hotelCount} hotel{hotelCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-muted-foreground">
                          {totalNights} night{totalNights !== 1 ? 's' : ''}
                        </span>
                        {notBooked > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <span className="w-2 h-2 rounded-full border-2 border-orange-400" />
                            {notBooked} to book
                          </span>
                        )}
                        {notBooked === 0 && hotelCount > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            All booked
                          </span>
                        )}
                      </div>
                      {/* Hotels from route.bases - wrapped in Card like DayCard */}
                      {bases.map((base, index) => {
                        const nights = getActualNights(index);
                        const isToday = base.checkIn === today;
                        // Find accommodation block to get booking status
                        const accommodationBlock = itinerary.days
                          .flatMap(d => d.blocks)
                          .find(b => b.activity?.name?.toLowerCase() === base.accommodation?.name?.toLowerCase());
                        const isBooked = accommodationBlock?.activity?.reservationStatus === 'done';

                        return (
                          <Card key={base.id} className={isToday ? 'ring-2 ring-primary shadow-lg' : ''}>
                            <CardContent className="p-3">
                              {/* Date header - matching DayCard */}
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="text-base font-medium">{formatDisplayDate(base.checkIn)}</div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3" />
                                    {getFlagForLocation(base.location)} {base.location}
                                  </div>
                                </div>
                              </div>
                              {/* Hotel card - matching DayCard TimeBlockCard style */}
                              <div className="p-2 rounded-lg border bg-purple-100 text-purple-800 border-purple-200">
                                <div className="flex items-center gap-1">
                                  <span className="opacity-60 flex-shrink-0">
                                    <Hotel className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="font-medium text-sm">{base.accommodation?.name || 'Accommodation TBD'}</span>
                                  {editingHotelIndex === index ? (
                                    <div className="flex items-center gap-1 ml-auto">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-purple-600 hover:text-purple-800"
                                        onClick={() => setEditingNights(Math.max(1, editingNights - 1))}
                                      >
                                        <span className="text-sm font-bold">−</span>
                                      </Button>
                                      <span className="text-[11px] font-medium w-4 text-center">{editingNights}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-purple-600 hover:text-purple-800"
                                        onClick={() => setEditingNights(editingNights + 1)}
                                      >
                                        <span className="text-sm font-bold">+</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-green-600 hover:text-green-800"
                                        onClick={() => handleUpdateHotelNights(index, editingNights)}
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                        onClick={() => setEditingHotelIndex(null)}
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <button
                                      className="text-[11px] opacity-50 ml-auto flex-shrink-0 flex items-center gap-1 hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        setEditingHotelIndex(index);
                                        setEditingNights(nights);
                                      }}
                                    >
                                      {nights} night{nights > 1 ? 's' : ''}
                                      <Pencil className="w-2.5 h-2.5" />
                                    </button>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] opacity-70">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {base.location}
                                  </span>
                                  <span>
                                    {formatDisplayDate(base.checkIn)} - {formatDisplayDate(getCheckOutDate(base.checkIn, nights))}
                                  </span>
                                  {base.accommodation?.name && (
                                    <div className="flex items-center gap-1">
                                      {!isBooked && (
                                        <a
                                          href={`https://www.booking.com/searchresults.html?ss=${encodeURIComponent(base.location)}&checkin=${base.checkIn}&checkout=${getCheckOutDate(base.checkIn, nights)}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={(e) => e.stopPropagation()}
                                          className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0 h-4 rounded-full bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200 transition-colors"
                                        >
                                          <ExternalLink className="w-2.5 h-2.5" />
                                          Book
                                        </a>
                                      )}
                                      <span
                                        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border-2 ${
                                          isBooked
                                            ? 'bg-green-500 border-green-500 text-white'
                                            : 'bg-transparent border-orange-400'
                                        }`}
                                      >
                                        {isBooked && <Check className="w-2.5 h-2.5" />}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {bases.length === 0 && (
                        <div className="text-center py-8">
                          <Hotel className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No hotels in this trip</p>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Filtered View - Restaurants */}
                  {contentFilter === 'restaurants' && (
                    <div className="space-y-2 pr-1">
                      <FoodLayerView foods={itinerary.foodLayer} onDeleteFood={handleDeleteFoodRecommendation} />
                    </div>
                  )}

                  {/* Filtered View - Experiences */}
                  {contentFilter === 'experiences' && (() => {
                    // Calculate experience stats - activities that are not flights, transit, food, or accommodation
                    const isExperience = (category?: string) =>
                      category && category !== 'flight' && category !== 'transit' && category !== 'food' && category !== 'checkin' && category !== 'accommodation';

                    const allExperiences = itinerary.days.flatMap(d =>
                      d.blocks.filter(b => isExperience(b.activity?.category))
                    );
                    const activityCount = allExperiences.length;
                    const notBooked = allExperiences.filter(b => b.activity?.bookingRequired && b.activity?.reservationStatus !== 'done').length;
                    const needsBooking = allExperiences.filter(b => b.activity?.bookingRequired).length;
                    const today = new Date().toISOString().split('T')[0];

                    // Filter days to only include those with experience blocks
                    const daysWithExperiences = itinerary.days
                      .filter(day => day.blocks.some(b => isExperience(b.activity?.category)))
                      .map(day => ({
                        ...day,
                        blocks: day.blocks.filter(b => isExperience(b.activity?.category))
                      }));

                    return (
                    <div className="space-y-2 pr-1">
                      {/* Summary stats bar */}
                      <div className="flex items-center gap-3 text-sm pb-2 border-b">
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Compass className="w-3.5 h-3.5" />
                          {activityCount} activit{activityCount !== 1 ? 'ies' : 'y'}
                        </span>
                        {notBooked > 0 && (
                          <span className="flex items-center gap-1 text-orange-600">
                            <span className="w-2 h-2 rounded-full border-2 border-orange-400" />
                            {notBooked} to book
                          </span>
                        )}
                        {notBooked === 0 && needsBooking > 0 && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Check className="w-3.5 h-3.5" />
                            All booked
                          </span>
                        )}
                      </div>
                      {/* Use DayCard with filtered blocks - same as schedule view */}
                      {daysWithExperiences.map(day => (
                        <DayCard
                          key={day.id}
                          day={day}
                          isToday={day.date === today}
                          isExpanded={true}
                          onUpdateDay={handleUpdateDay}
                          location={getLocationForDay(day)}
                          bases={itinerary.route.bases}
                        />
                      ))}
                      {daysWithExperiences.length === 0 && (
                        <div className="text-center py-8">
                          <Compass className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                          <p className="text-sm text-muted-foreground">No experiences planned yet</p>
                        </div>
                      )}
                    </div>
                    );
                  })()}

                  {/* Packing List View */}
                  {contentFilter === 'packing' && (
                    <div className="pr-1">
                      <PackingListView packingList={itinerary.packingLayer} onRegenerate={handleRegeneratePackingList} />
                    </div>
                  )}

                  {/* Documents View */}
                  {contentFilter === 'docs' && (
                    <div className="space-y-2 pr-1">
                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                        className="hidden"
                        onChange={handleFileUpload}
                      />

                      {/* Document categories as cards */}
                      {[
                        { icon: Stethoscope, label: 'Health Insurance', desc: 'Medical coverage abroad', color: 'bg-rose-100 text-rose-600' },
                        { icon: Shield, label: 'Travel Insurance', desc: 'Trip protection & cancellation', color: 'bg-stone-100 text-stone-600' },
                        { icon: FileText, label: 'Passport / Visa', desc: 'ID and entry documents', color: 'bg-amber-100 text-amber-600' },
                        { icon: Plane, label: 'Flight Confirmations', desc: 'Booking references & e-tickets', color: 'bg-blue-100 text-blue-600' },
                        { icon: Hotel, label: 'Hotel Reservations', desc: 'Accommodation bookings', color: 'bg-purple-100 text-purple-600' },
                        { icon: Car, label: 'Car Rental', desc: 'Vehicle bookings & licenses', color: 'bg-amber-100 text-amber-600' },
                        { icon: Ticket, label: 'Activity Tickets', desc: 'Tours, attractions & events', color: 'bg-yellow-100 text-yellow-600' },
                        { icon: CreditCard, label: 'Payment & Cards', desc: 'Credit cards & travel money', color: 'bg-stone-100 text-stone-600' },
                      ].map((doc) => {
                        const categoryDocs = getDocsForCategory(doc.label);
                        return (
                          <Card key={doc.label} className="hover:bg-muted/30 transition-colors">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.color}`}>
                                  <doc.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-sm">{doc.label}</h4>
                                  <p className="text-xs text-muted-foreground">
                                    {categoryDocs.length > 0 ? `${categoryDocs.length} file${categoryDocs.length > 1 ? 's' : ''}` : doc.desc}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 flex-shrink-0"
                                  onClick={() => {
                                    setUploadingCategory(doc.label);
                                    fileInputRef.current?.click();
                                  }}
                                >
                                  <Upload className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Show uploaded files for this category */}
                              {categoryDocs.length > 0 && (
                                <div className="mt-3 pt-3 border-t space-y-2">
                                  {categoryDocs.map((uploadedDoc) => {
                                    const fileName = uploadedDoc.name.replace(`${doc.label}: `, '');
                                    return (
                                      <div key={uploadedDoc.id} className="flex items-center gap-2 text-xs">
                                        <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                        <span className="flex-1 truncate">{fileName}</span>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 flex-shrink-0 hover:text-red-600"
                                          onClick={() => handleDeleteDocument(uploadedDoc.id)}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 flex-shrink-0"
                                          onClick={() => {
                                            // Open file in new tab
                                            const url = URL.createObjectURL(uploadedDoc.data);
                                            window.open(url, '_blank');
                                          }}
                                        >
                                          <ExternalLink className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Budget View */}
                  {contentFilter === 'budget' && (
                    <div className="space-y-3 pr-1">
                      <div className="text-center py-4">
                        <DollarSign className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-xs text-muted-foreground">
                          Track your travel expenses
                        </p>
                      </div>

                      {/* Budget Summary */}
                      <Card>
                        <CardContent className="p-3">
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
                              <Plane className="w-4 h-4 text-orange-500" />
                              <span className="text-sm">Transport</span>
                            </div>
                            <span className="text-sm font-medium">$0</span>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-rose-500" />
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

      {/* Chat Sheet */}
      {itinerary && (
        <ChatSheet
          open={chatOpen}
          onOpenChange={setChatOpen}
          tripId={tripId}
          itinerary={itinerary}
          onItineraryUpdate={(updated) => {
            setItinerary(updated);
            localStorage.setItem(`itinerary-${tripId}`, JSON.stringify(updated));
            tripDb.updateItinerary(tripId, updated);
          }}
          onOpenSettings={() => setProfileOpen(true)}
        />
      )}

    </div>
  );
}

// Pipeline Row Component (vertical sidebar layout)
interface PipelineRowProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
  countLabel?: string; // For custom labels like "41/50"
  active?: boolean;
  onClick: () => void;
}

// Active state colors matching category colors
const ACTIVE_COLORS: Record<string, { bg: string; iconBg: string; text: string }> = {
  'Overview': { bg: 'bg-red-500 border-red-600', iconBg: 'bg-red-400/30', text: 'text-white' },
  'Schedule': { bg: 'bg-red-500 border-red-600', iconBg: 'bg-red-400/30', text: 'text-white' },
  'Transport': { bg: 'bg-blue-500 border-blue-600', iconBg: 'bg-blue-400/30', text: 'text-white' },
  'Hotels': { bg: 'bg-purple-500 border-purple-600', iconBg: 'bg-purple-400/30', text: 'text-white' },
  'Food': { bg: 'bg-orange-500 border-orange-600', iconBg: 'bg-orange-400/30', text: 'text-white' },
  'Activities': { bg: 'bg-yellow-500 border-yellow-600', iconBg: 'bg-yellow-400/30', text: 'text-white' },
  'Packing': { bg: 'bg-amber-500 border-amber-600', iconBg: 'bg-amber-400/30', text: 'text-white' },
  'Docs': { bg: 'bg-lime-500 border-lime-600', iconBg: 'bg-lime-400/30', text: 'text-white' },
  'Budget': { bg: 'bg-indigo-500 border-indigo-600', iconBg: 'bg-indigo-400/30', text: 'text-white' },
};

function PipelineRow({ icon, label, count, countLabel, active, onClick }: PipelineRowProps) {
  const colors = PIPELINE_COLORS[label] || { bg: 'bg-muted/50 border-transparent', iconBg: 'bg-muted text-muted-foreground', text: '' };
  const activeColors = ACTIVE_COLORS[label] || { bg: 'bg-primary border-primary', iconBg: 'bg-primary-foreground/20', text: 'text-white' };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all aspect-square border ${
        active
          ? activeColors.bg
          : `${colors.bg} hover:opacity-80`
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
        active
          ? activeColors.iconBg
          : colors.iconBg
      }`}>
        {icon}
      </div>
      <span className={`text-xs font-medium text-center ${active ? activeColors.text : colors.text}`}>{label}</span>
      {(count !== undefined || countLabel) && (
        <p className={`text-[10px] text-center ${active ? 'text-white/70' : 'text-muted-foreground'}`}>
          {countLabel || count}
        </p>
      )}
    </button>
  );
}
