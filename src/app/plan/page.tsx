'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  Sparkles,
  MapPin,
  Calendar,
  Users,
  Compass,
  Utensils,
  Mountain,
  Palmtree,
  Heart,
  Tent,
  Crown,
  Plus,
  X,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { tripDb } from '@/lib/db/indexed-db';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { GeneralChatSheet } from '@/components/chat/GeneralChatSheet';
import { useDashboardData } from '@/hooks/useDashboardData';
import { PlanningNav, type PlanningSection } from '@/components/planning/PlanningNav';
import { SwipeablePlanningView, type PlanningPhase } from '@/components/planning/SwipeablePlanningView';
import type { PlanningItem } from '@/components/planning/PlanningTripToggle';
import { getCityImage } from '@/lib/planning/city-images';
import type { TripDNA } from '@/types/trip-dna';

type DurationType = 'days' | 'weeks' | 'months';
type Pace = 'relaxed' | 'balanced' | 'active';
type DestinationMode = 'known' | 'surprise';
type TripType =
  // Scenery
  | 'beach' | 'mountains' | 'gardens' | 'countryside'
  // Culture
  | 'museums' | 'theater' | 'history' | 'local-traditions'
  // Relaxation
  | 'spa' | 'lounges'
  // Active
  | 'hiking' | 'water-sports' | 'wildlife'
  // Food
  | 'street-food' | 'fine-dining' | 'food-tours'
  // Other
  | 'nightlife' | 'shopping' | 'photography';

// Valid trip type IDs for filtering old/invalid data
const VALID_TRIP_TYPES: TripType[] = [
  'beach', 'mountains', 'gardens', 'countryside',
  'museums', 'theater', 'history', 'local-traditions',
  'spa', 'lounges',
  'hiking', 'water-sports', 'wildlife',
  'street-food', 'fine-dining', 'food-tours',
  'nightlife', 'shopping', 'photography'
];

// Filter and normalize trip types from saved data
const filterValidTripTypes = (types: string[]): TripType[] => {
  return types
    .map(t => t.toLowerCase() as TripType)
    .filter(t => VALID_TRIP_TYPES.includes(t));
};
type Budget = '$' | '$$' | '$$$';
type TravelerType = 'solo' | 'couple' | 'friends' | 'family';
type LodgingType = 'hotel' | 'boutique' | 'apartment' | 'resort';
type AreaType = 'quiet' | 'central';

const LODGING_OPTIONS: { id: LodgingType; label: string }[] = [
  { id: 'hotel', label: 'Hotel' },
  { id: 'boutique', label: 'Boutique' },
  { id: 'apartment', label: 'Apartment' },
  { id: 'resort', label: 'Resort' },
];

const AREA_OPTIONS: { id: AreaType; label: string }[] = [
  { id: 'quiet', label: 'Quiet' },
  { id: 'central', label: 'Central' },
];

// Common things to avoid
const AVOIDANCE_OPTIONS = [
  { id: 'big-cities', label: 'Big cities' },
  { id: 'crowds', label: 'Crowds' },
  { id: 'tourist-traps', label: 'Tourist traps' },
  { id: 'heat', label: 'Hot weather (>35°C)' },
  { id: 'cold', label: 'Cold weather (<10°C)' },
  { id: 'polluted', label: 'Polluted/Dirty areas' },
  { id: 'rude-service', label: 'Rude service' },
  { id: 'noisy', label: 'Noisy environments' },
  { id: 'long-waits', label: 'Long waits' },
  { id: 'disorganized', label: 'Disorganized places' },
  { id: 'long-drives', label: 'Long drives (3+ hrs)' },
  { id: 'extra-long-drives', label: 'Extra long drives (5+ hrs)' },
  { id: 'long-walks', label: 'Long walks' },
  { id: 'early-mornings', label: 'Early mornings' },
  { id: 'late-nights', label: 'Late nights' },
  { id: 'spicy-food', label: 'Spicy food' },
  { id: 'seafood', label: 'Seafood' },
  { id: 'public-transit', label: 'Public transit' },
];

interface TripTypeCategory {
  label: string;
  types: { id: TripType; label: string; icon: typeof Compass }[];
}

const TRIP_TYPE_CATEGORIES: TripTypeCategory[] = [
  {
    label: 'Scenery',
    types: [
      { id: 'beach', label: 'Beach', icon: Palmtree },
      { id: 'mountains', label: 'Mountains', icon: Mountain },
      { id: 'gardens', label: 'Gardens & Parks', icon: Heart },
      { id: 'countryside', label: 'Countryside', icon: Tent },
    ],
  },
  {
    label: 'Culture',
    types: [
      { id: 'museums', label: 'Museums & Art', icon: Compass },
      { id: 'theater', label: 'Shows & Theater', icon: Sparkles },
      { id: 'history', label: 'History & Architecture', icon: Crown },
      { id: 'local-traditions', label: 'Local Traditions', icon: Heart },
    ],
  },
  {
    label: 'Relaxation',
    types: [
      { id: 'spa', label: 'Spa & Wellness', icon: Heart },
      { id: 'lounges', label: 'Lounges & Rooftops', icon: Crown },
    ],
  },
  {
    label: 'Active',
    types: [
      { id: 'hiking', label: 'Hiking & Trekking', icon: Mountain },
      { id: 'water-sports', label: 'Water Sports', icon: Palmtree },
      { id: 'wildlife', label: 'Wildlife & Safari', icon: Tent },
    ],
  },
  {
    label: 'Food',
    types: [
      { id: 'street-food', label: 'Street Food', icon: Utensils },
      { id: 'fine-dining', label: 'Fine Dining', icon: Crown },
      { id: 'food-tours', label: 'Food Tours', icon: Utensils },
    ],
  },
  {
    label: 'Other',
    types: [
      { id: 'nightlife', label: 'Nightlife', icon: Sparkles },
      { id: 'shopping', label: 'Shopping', icon: Heart },
      { id: 'photography', label: 'Photography', icon: Compass },
    ],
  },
];

// Helper to get popular cities for a destination
function getCitiesForDestination(destination: string): string[] {
  const cityMap: Record<string, string[]> = {
    'Turkey': ['Istanbul', 'Cappadocia', 'Antalya', 'Bodrum', 'Ephesus', 'Pamukkale', 'Izmir', 'Ankara', 'Fethiye', 'Kas', 'Trabzon', 'Bursa', 'Konya', 'Dalyan', 'Oludeniz', 'Marmaris', 'Alanya', 'Side'],
    'Spain': ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada', 'San Sebastian', 'Bilbao', 'Malaga', 'Toledo', 'Cordoba', 'Ibiza', 'Ronda', 'Salamanca', 'Girona', 'Segovia', 'Cadiz', 'Marbella', 'Palma de Mallorca'],
    'Italy': ['Rome', 'Florence', 'Venice', 'Milan', 'Amalfi Coast', 'Cinque Terre', 'Naples', 'Tuscany', 'Bologna', 'Verona', 'Lake Como', 'Siena', 'Ravenna', 'Pisa', 'Sorrento'],
    'France': ['Paris', 'Nice', 'Lyon', 'Bordeaux', 'Marseille', 'Provence', 'Strasbourg', 'Mont Saint-Michel', 'Cannes', 'Avignon', 'Annecy', 'Colmar', 'Saint-Tropez', 'Chamonix', 'Carcassonne'],
    'Japan': ['Tokyo', 'Kyoto', 'Osaka', 'Hiroshima', 'Nara', 'Hakone', 'Kanazawa', 'Nikko', 'Fukuoka', 'Takayama', 'Nagoya', 'Kamakura', 'Naoshima', 'Kobe', 'Miyajima'],
    'Thailand': ['Bangkok', 'Chiang Mai', 'Phuket', 'Krabi', 'Koh Samui', 'Ayutthaya', 'Pai', 'Chiang Rai', 'Koh Phi Phi', 'Koh Lanta', 'Koh Tao', 'Hua Hin', 'Koh Chang', 'Sukhothai', 'Kanchanaburi'],
    'Portugal': ['Lisbon', 'Porto', 'Sintra', 'Algarve', 'Madeira', 'Évora', 'Coimbra', 'Cascais', 'Lagos', 'Nazaré', 'Óbidos', 'Azores', 'Braga', 'Aveiro', 'Tavira'],
    'Greece': ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu', 'Meteora', 'Delphi', 'Thessaloniki', 'Naxos', 'Paros', 'Zakynthos', 'Hydra', 'Milos', 'Nafplio'],
    'Vietnam': ['Hanoi', 'Ho Chi Minh City', 'Ha Long Bay', 'Hoi An', 'Da Nang', 'Sapa', 'Hue', 'Nha Trang', 'Phu Quoc', 'Ninh Binh', 'Dalat', 'Mui Ne', 'Can Tho', 'Phong Nha', 'Quy Nhon'],
    'Indonesia': ['Bali', 'Jakarta', 'Yogyakarta', 'Ubud', 'Lombok', 'Komodo', 'Raja Ampat', 'Bandung', 'Surabaya', 'Gili Islands', 'Labuan Bajo', 'Sulawesi', 'Sumatra', 'Flores', 'Malang'],
    'Hawaii': ['Honolulu', 'Waikiki', 'Maui', 'Kauai', 'Big Island', 'Hilo', 'Kona', 'Lahaina', 'North Shore', 'Pearl Harbor'],
  };
  return cityMap[destination] || [];
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-pulse text-muted-foreground">Loading...</div></div>}>
      <PlanPageContent />
    </Suspense>
  );
}

function PlanPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { trips, refresh } = useDashboardData();

  // Section navigation
  const [currentSection, setCurrentSection] = useState<PlanningSection>('where');
  const [completedSections, setCompletedSections] = useState<PlanningSection[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit mode - check URL param first, then localStorage for active planning session
  const editTripId = searchParams.get('edit');
  const isEditMode = !!editTripId;

  // Trip ID for persistence (created when moving past Section 2)
  // On mount, check localStorage for an active planning session
  const [tripId, setTripId] = useState<string | null>(() => {
    if (editTripId) return editTripId;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activePlanningTripId');
    }
    return null;
  });

  // Persist tripId to localStorage when it changes
  useEffect(() => {
    if (tripId) {
      localStorage.setItem('activePlanningTripId', tripId);
    }
  }, [tripId]);

  // Section 1: Where & When
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('known');
  const [destinations, setDestinations] = useState<string[]>([]);
  const [destinationInput, setDestinationInput] = useState('');
  const [mustVisitPlaces, setMustVisitPlaces] = useState<string[]>([]);
  const [mustVisitInput, setMustVisitInput] = useState('');
  const [draggedDestIdx, setDraggedDestIdx] = useState<number | null>(null);
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);
  const [surpriseDescription, setSurpriseDescription] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originAirport, setOriginAirport] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('days');
  const [durationDays, setDurationDays] = useState(14);
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFlexibility, setDateFlexibility] = useState<number>(0);

  // Section 2: Preferences (merged from old Step 2 + Step 3)
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [budget, setBudget] = useState<Budget>('$$');
  const [pace, setPace] = useState<Pace>('balanced');
  const [travelerType, setTravelerType] = useState<TravelerType>('couple');
  const [lodging, setLodging] = useState<LodgingType>('hotel');
  const [area, setArea] = useState<AreaType>('central');
  const [avoidances, setAvoidances] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');

  // Sections 3-5: Planning state
  const [planningItems, setPlanningItems] = useState<PlanningItem[]>([]);
  const [planningPhase, setPlanningPhase] = useState<PlanningPhase>('picking');

  // Helper to capitalize country/place names
  const capitalizePlace = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const addDestination = () => {
    const trimmed = destinationInput.trim();
    if (trimmed) {
      const capitalized = capitalizePlace(trimmed);
      if (!destinations.includes(capitalized)) {
        setDestinations([...destinations, capitalized]);
        setDestinationInput('');
      }
    }
  };

  const removeDestination = (dest: string) => {
    setDestinations(destinations.filter(d => d !== dest));
  };

  // Drag handlers for reordering destinations
  const handleDestDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedDestIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', idx.toString());
    // Create a custom drag image
    const target = e.currentTarget as HTMLElement;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.transform = 'scale(1.05)';
    clone.style.opacity = '0.9';
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 0, 0);
    setTimeout(() => document.body.removeChild(clone), 0);
  };

  const handleDestDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedDestIdx === null || draggedDestIdx === idx) return;
    setDropTargetIdx(idx);
  };

  const handleDestDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedDestIdx === null || draggedDestIdx === idx) return;

    // Reorder destinations
    const newDests = [...destinations];
    const [dragged] = newDests.splice(draggedDestIdx, 1);
    newDests.splice(idx, 0, dragged);
    setDestinations(newDests);
  };

  const handleDestDragEnd = () => {
    setDraggedDestIdx(null);
    setDropTargetIdx(null);
  };

  const addMustVisitPlace = () => {
    const trimmed = mustVisitInput.trim();
    if (trimmed) {
      const capitalized = capitalizePlace(trimmed);
      if (!mustVisitPlaces.includes(capitalized)) {
        setMustVisitPlaces([...mustVisitPlaces, capitalized]);
        setMustVisitInput('');
      }
    }
  };

  const removeMustVisitPlace = (place: string) => {
    setMustVisitPlaces(mustVisitPlaces.filter(p => p !== place));
  };

  const toggleAvoidance = (id: string) => {
    setAvoidances((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleTripType = (type: TripType) => {
    setTripTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  // Load existing trip data when editing OR resuming from localStorage
  useEffect(() => {
    async function loadTripForEdit() {
      // Use tripId which could come from URL param or localStorage
      const loadId = editTripId || tripId;
      if (!loadId) return;
      setIsLoading(true);

      try {
        const trip = await tripDb.get(loadId);
        if (trip?.tripDna) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dna = trip.tripDna as any;

          // Pre-fill destinations (countries)
          if (dna.interests?.destinations?.length > 0) {
            setDestinations(dna.interests.destinations);
          } else if (dna.interests?.destination) {
            const dest = dna.interests.destination;
            if (dest.includes('→')) {
              setDestinations(dest.split('→').map((d: string) => d.trim()));
            } else {
              setDestinations([dest]);
            }
          }

          // Pre-fill must visit places (cities)
          if (dna.interests?.mustVisitPlaces?.length > 0) {
            setMustVisitPlaces(dna.interests.mustVisitPlaces);
          }

          // Pre-fill duration
          const days = dna.constraints?.duration?.days || 14;
          if (days >= 30) {
            setDurationType('months');
            setDurationMonths(Math.round(days / 30));
          } else if (days >= 7 && days % 7 === 0) {
            setDurationType('weeks');
            setDurationWeeks(Math.round(days / 7));
          } else {
            setDurationType('days');
            setDurationDays(days);
          }

          // Pre-fill dates
          if (dna.constraints?.startDate) setStartDate(dna.constraints.startDate);
          if (dna.constraints?.endDate) setEndDate(dna.constraints.endDate);
          if (dna.constraints?.dateFlexibility !== undefined) setDateFlexibility(dna.constraints.dateFlexibility);

          // Pre-fill pace
          if (dna.vibeAndPace?.tripPace) setPace(dna.vibeAndPace.tripPace as Pace);

          // Pre-fill origin
          if (dna.origin?.city) setOriginCity(dna.origin.city);
          if (dna.origin?.airport) setOriginAirport(dna.origin.airport);

          // Pre-fill trip types
          if (dna.interests?.tripTypes?.length > 0) {
            setTripTypes(filterValidTripTypes(dna.interests.tripTypes));
          } else if (dna.travelerProfile?.travelIdentities?.length > 0) {
            setTripTypes(filterValidTripTypes(dna.travelerProfile.travelIdentities));
          }

          // Pre-fill budget
          if (dna.constraints?.budget?.level) setBudget(dna.constraints.budget.level as Budget);

          // Pre-fill traveler type
          if (dna.travelerProfile?.partyType) {
            setTravelerType(dna.travelerProfile.partyType as TravelerType);
          } else if (dna.travelers?.type) {
            setTravelerType(dna.travelers.type as TravelerType);
          }

          // Pre-fill lodging and area
          if (dna.constraints?.lodging) setLodging(dna.constraints.lodging as LodgingType);
          if (dna.constraints?.area) setArea(dna.constraints.area as AreaType);

          // Pre-fill avoidances
          if (dna.preferences?.avoidances || dna.constraints?.avoidances) {
            const avoidStr = dna.preferences?.avoidances || dna.constraints?.avoidances;
            if (typeof avoidStr === 'string') {
              const avoidArr = avoidStr.split(',').map((a: string) => a.trim()).filter(Boolean);
              setAvoidances(avoidArr);
            } else if (Array.isArray(avoidStr)) {
              setAvoidances(avoidStr);
            }
          }

          // Pre-fill special requests
          if (dna.preferences?.specialRequests) setSpecialRequests(dna.preferences.specialRequests);

          setDestinationMode('known');

          // Restore planning progress
          if (dna.planningProgress) {
            const progress = dna.planningProgress;
            if (progress.currentSection) {
              setCurrentSection(progress.currentSection as PlanningSection);
            }
            if (progress.completedSections?.length > 0) {
              setCompletedSections(progress.completedSections as PlanningSection[]);
            }
            if (progress.planningPhase) {
              // Migrate old 'favorites-library' phase to new 'auto-itinerary'
              const phase = progress.planningPhase === 'favorites-library'
                ? 'auto-itinerary'
                : progress.planningPhase;
              setPlanningPhase(phase as PlanningPhase);
            }
          } else {
            // Default for trips without saved progress
            setCompletedSections(['where', 'prefs']);
          }
        }
      } catch (error) {
        console.error('Failed to load trip for editing:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTripForEdit();
  }, [editTripId, tripId]);

  // Pre-fill destination from URL query param (for new trips)
  useEffect(() => {
    if (editTripId) return;
    const destParam = searchParams.get('destination');
    if (destParam) {
      if (destParam.includes(',')) {
        const parts = destParam.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          setDestinations([parts[parts.length - 1]]);
          setMustVisitPlaces([parts[0]]);
        }
      } else {
        setDestinations([destParam]);
      }
      setDestinationMode('known');
    }
  }, [searchParams, editTripId]);

  // Track if end date was manually changed vs calculated from duration
  const [endDateSource, setEndDateSource] = useState<'duration' | 'manual'>('duration');

  // Ref to prevent useEffects from overriding dates when syncing from itinerary
  const syncingFromItinerary = useRef(false);

  // Auto-calculate end date based on duration
  useEffect(() => {
    if (!startDate || endDateSource === 'manual' || syncingFromItinerary.current) return;

    const start = new Date(startDate);
    let end: Date;

    if (durationType === 'days') {
      end = new Date(start);
      end.setDate(start.getDate() + durationDays);
    } else if (durationType === 'weeks') {
      end = new Date(start);
      end.setDate(start.getDate() + durationWeeks * 7);
    } else {
      end = new Date(start);
      end.setMonth(start.getMonth() + durationMonths);
    }

    const formatted = end.toISOString().split('T')[0];
    setEndDate(formatted);
  }, [startDate, durationType, durationDays, durationWeeks, durationMonths, endDateSource]);

  // Recalculate duration when end date is manually changed
  useEffect(() => {
    if (endDateSource !== 'manual' || !startDate || !endDate || syncingFromItinerary.current) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate current duration from state for comparison
    const currentDuration = durationType === 'days'
      ? durationDays
      : durationType === 'weeks'
        ? durationWeeks * 7
        : durationMonths * 30;

    if (daysDiff > 0 && daysDiff !== currentDuration) {
      // Update duration to match the manually set dates
      if (daysDiff >= 30) {
        setDurationType('months');
        setDurationMonths(Math.round(daysDiff / 30));
      } else if (daysDiff >= 7 && daysDiff % 7 === 0) {
        setDurationType('weeks');
        setDurationWeeks(Math.round(daysDiff / 7));
      } else {
        setDurationType('days');
        setDurationDays(Math.min(daysDiff, 14)); // Cap at slider max
        // If more than 14 days but not weeks/months, switch to weeks
        if (daysDiff > 14) {
          setDurationType('weeks');
          setDurationWeeks(Math.ceil(daysDiff / 7));
        }
      }
    }

    // Reset to duration-driven mode after handling
    setEndDateSource('duration');
  }, [endDateSource, startDate, endDate, durationType, durationDays, durationWeeks, durationMonths]);

  // Auto-save planning progress when section changes
  useEffect(() => {
    // Don't save while loading - prevents overwriting saved progress with defaults
    if (!tripId || isLoading) return;

    const saveProgress = async () => {
      try {
        const existingTrip = await tripDb.get(tripId);
        if (existingTrip) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updatedDna = {
            ...(existingTrip.tripDna as any),
            planningProgress: {
              currentSection,
              completedSections,
              planningPhase,
            },
          };
          await tripDb.save({
            ...existingTrip,
            tripDna: updatedDna,
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Failed to save planning progress:', error);
      }
    };

    saveProgress();
  }, [tripId, currentSection, completedSections, planningPhase, isLoading]);

  const getDurationLabel = () => {
    if (durationType === 'days') {
      if (durationDays >= 30) return '30+ days';
      if (durationDays === 1) return '1 day';
      return `${durationDays} days`;
    } else if (durationType === 'weeks') {
      if (durationWeeks === 1) return '1 week';
      return `${durationWeeks} weeks`;
    } else {
      if (durationMonths === 1) return '1 month';
      return `${durationMonths} months`;
    }
  };

  const actualDuration = durationType === 'days'
    ? durationDays
    : durationType === 'weeks'
      ? durationWeeks * 7
      : durationMonths * 30;

  // Build TripDNA for SwipeablePlanningView
  const tripDna: TripDNA = useMemo(() => {
    const destinationDisplay = destinations.length > 1
      ? destinations.join(' → ')
      : destinations[0] || '';

    // Build a simplified TripDNA-like object for the planning flow
    // Using 'as unknown as TripDNA' since we have a simplified schema for the plan page
    return {
      id: tripId || 'temp',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      travelerProfile: {
        partyType: travelerType,
        travelIdentities: tripTypes,
      },
      vibeAndPace: {
        tripPace: pace,
      },
      origin: {
        city: originCity.trim() || undefined,
        airport: originAirport.trim() || undefined,
      },
      interests: {
        destination: destinationMode === 'known' ? destinationDisplay : surpriseDescription,
        destinations: destinations.length > 0 ? destinations : [],
        mainDestination: destinations[0] || '',
        mustVisitPlaces: destinationMode === 'known' ? mustVisitPlaces : [],
        tripTypes,
      },
      constraints: {
        duration: { days: actualDuration },
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        dateFlexibility: dateFlexibility,
        budget: {
          currency: 'USD',
          level: budget,
          accommodationRange: { min: 50, max: budget === '$' ? 100 : budget === '$$' ? 200 : 400, perNight: true },
          dailySpend: { min: 50, max: budget === '$' ? 100 : budget === '$$' ? 200 : 400 },
          splurgeMoments: budget === '$$$' ? 3 : budget === '$$' ? 2 : 1,
        },
        lodging,
        area,
        avoidances: avoidances.length > 0 ? avoidances.join(', ') : undefined,
      },
      logistics: {
        movementTolerance: 'moderate',
        preferredBases: 3,
        transport: { comfortable: ['train', 'flight'], avoid: [] },
      },
      preferences: {
        avoidances: avoidances.length > 0 ? avoidances.join(', ') : undefined,
        specialRequests: specialRequests.trim() || undefined,
      },
      travelers: {
        type: travelerType,
        count: travelerType === 'solo' ? 1 : travelerType === 'couple' ? 2 : 4,
      },
    } as unknown as TripDNA;
  }, [tripId, travelerType, tripTypes, pace, originCity, originAirport, destinationMode, destinations, surpriseDescription, mustVisitPlaces, actualDuration, startDate, endDate, dateFlexibility, budget, lodging, area, avoidances, specialRequests]);

  // Save trip and get ID when moving past Section 2
  const saveTripAndProceed = async () => {
    setIsGenerating(true);

    try {
      const id = tripId || crypto.randomUUID();

      if (!tripId) {
        // Save new trip to DB
        await tripDb.save({
          id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tripDna: tripDna as any,
          itinerary: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncedAt: null,
          status: 'draft',
        });
        setTripId(id);
        // Update URL so refresh keeps the trip
        router.replace(`/plan?edit=${id}`, { scroll: false });
      } else {
        // Update existing trip
        const existingTrip = await tripDb.get(id);
        if (existingTrip) {
          await tripDb.save({
            ...existingTrip,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tripDna: tripDna as any,
            updatedAt: new Date(),
          });
        }
      }

      // Mark prefs as completed and move to cities
      setCompletedSections(prev => [...new Set([...prev, 'where' as PlanningSection, 'prefs' as PlanningSection])]);
      setCurrentSection('cities');

      // Generate city items for planning
      const mockItems: PlanningItem[] = [];
      destinations.forEach((dest: string, destIdx: number) => {
        const cityNames = getCitiesForDestination(dest);
        cityNames.forEach((city, idx) => {
          mockItems.push({
            id: `city-${destIdx}-${idx}`,
            name: city,
            description: `Explore ${city}`,
            imageUrl: getCityImage(city, dest),
            category: 'activities',
            tags: ['cities', dest],
          });
        });
      });
      setPlanningItems(mockItems);
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Validation
  const canProceedSection1 = destinationMode === 'known' ? destinations.length > 0 : surpriseDescription.trim().length > 0;
  const canProceedSection2 = tripTypes.length > 0;

  // Handle section change
  const handleSectionChange = (section: PlanningSection) => {
    const SECTION_ORDER: PlanningSection[] = ['where', 'prefs', 'cities', 'route', 'itinerary'];
    const currentIdx = SECTION_ORDER.indexOf(currentSection);
    const targetIdx = SECTION_ORDER.indexOf(section);

    // If moving forward, mark all sections up to current as complete
    if (targetIdx > currentIdx) {
      const sectionsToComplete = SECTION_ORDER.slice(0, targetIdx);
      setCompletedSections(prev => [...new Set([...prev, ...sectionsToComplete])]);
    }

    // Map section to planning phase for SwipeablePlanningView
    if (section === 'cities') {
      setPlanningPhase('picking');
    } else if (section === 'route') {
      setPlanningPhase('route-planning');
    } else if (section === 'itinerary') {
      setPlanningPhase('auto-itinerary');
    }
    setCurrentSection(section);
  };

  // Handle planning phase changes from SwipeablePlanningView
  const handlePlanningPhaseChange = (phase: PlanningPhase) => {
    setPlanningPhase(phase);
    // Sync section with phase
    if (phase === 'picking') {
      setCurrentSection('cities');
    } else if (phase === 'route-planning') {
      setCurrentSection('route');
      setCompletedSections(prev => [...new Set([...prev, 'cities' as PlanningSection])]);
    } else if (phase === 'auto-itinerary' || phase === 'favorites-library' || phase === 'day-planning') {
      setCurrentSection('itinerary');
      setCompletedSections(prev => [...new Set([...prev, 'cities' as PlanningSection, 'route' as PlanningSection])]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading trip...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 5-Section Navigation */}
        <PlanningNav
          currentSection={currentSection}
          onSectionChange={handleSectionChange}
          completedSections={completedSections}
        />

        {/* Section 1: Where & When */}
        {currentSection === 'where' && (
          <div className="space-y-6">
            {/* Origin */}
            <div className="border rounded-lg p-4">
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Where are you traveling from?
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    placeholder="e.g., Vancouver, Los Angeles..."
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="w-24">
                  <Input
                    placeholder="YVR"
                    value={originAirport}
                    onChange={(e) => setOriginAirport(e.target.value.toUpperCase())}
                    maxLength={3}
                    className="bg-background text-center uppercase"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">City and airport code (optional)</p>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Where are you going?</h2>
            </div>

            {/* Destination Mode */}
            <div className="space-y-3">
              <button
                onClick={() => setDestinationMode('known')}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  destinationMode === 'known' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${destinationMode === 'known' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {destinationMode === 'known' && <div className="w-full h-full rounded-full bg-white scale-50" />}
                  </div>
                  <div>
                    <div className="font-medium">I know where</div>
                    <div className="text-sm text-muted-foreground">Enter your destination</div>
                  </div>
                </div>
                {destinationMode === 'known' && (
                  <div className="mt-4 pl-7 space-y-4" onClick={(e) => e.stopPropagation()}>
                    {/* Destinations (Countries/Regions) */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Countries / Regions</label>
                      {destinations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {destinations.map((dest, idx) => (
                            <div key={dest} className="relative flex items-center">
                              {/* Drop indicator before */}
                              {dropTargetIdx === idx && draggedDestIdx !== null && draggedDestIdx > idx && (
                                <div className="absolute -left-2 top-0 bottom-0 w-1 bg-primary rounded-full animate-pulse" />
                              )}
                              <Badge
                                variant="default"
                                draggable
                                onDragStart={(e) => handleDestDragStart(e, idx)}
                                onDragOver={(e) => handleDestDragOver(e, idx)}
                                onDrop={(e) => handleDestDrop(e, idx)}
                                onDragEnd={handleDestDragEnd}
                                onDragLeave={() => setDropTargetIdx(null)}
                                className={`pl-1 pr-1 py-1 gap-1 bg-primary/10 text-primary border border-primary/20 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                                  draggedDestIdx === idx ? 'opacity-40 scale-95' : ''
                                } ${dropTargetIdx === idx && draggedDestIdx !== idx ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                              >
                                <GripVertical className="w-3 h-3 text-primary/50" />
                                {idx > 0 && <span className="text-xs">→</span>}
                                {dest}
                                <button onClick={() => removeDestination(dest)} className="ml-1 hover:bg-primary/20 rounded-full p-0.5">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                              {/* Drop indicator after */}
                              {dropTargetIdx === idx && draggedDestIdx !== null && draggedDestIdx < idx && (
                                <div className="absolute -right-2 top-0 bottom-0 w-1 bg-primary rounded-full animate-pulse" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Thailand, Vietnam, Japan..."
                          value={destinationInput}
                          onChange={(e) => setDestinationInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDestination(); } }}
                          className="bg-background flex-1"
                        />
                        <Button type="button" size="icon" variant="outline" onClick={addDestination} disabled={!destinationInput.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add multiple countries for a multi-destination trip
                        {destinations.length > 1 && ' • Drag to reorder'}
                      </p>
                    </div>

                    {/* Must-Visit Cities */}
                    {destinations.length > 0 && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">
                          Must-visit cities <span className="text-muted-foreground/60">(optional)</span>
                        </label>
                        {mustVisitPlaces.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {mustVisitPlaces.map((place) => (
                              <Badge key={place} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                                <MapPin className="w-3 h-3" />
                                {place}
                                <button onClick={() => removeMustVisitPlace(place)} className="ml-1 hover:bg-muted rounded-full p-0.5">
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add specific cities..."
                            value={mustVisitInput}
                            onChange={(e) => setMustVisitInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMustVisitPlace(); } }}
                            className="bg-background flex-1"
                          />
                          <Button type="button" size="icon" variant="outline" onClick={addMustVisitPlace} disabled={!mustVisitInput.trim()}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </button>

              <button
                onClick={() => setDestinationMode('surprise')}
                className={`w-full p-4 rounded-lg border text-left transition-all ${
                  destinationMode === 'surprise' ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full border-2 ${destinationMode === 'surprise' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                    {destinationMode === 'surprise' && <div className="w-full h-full rounded-full bg-white scale-50" />}
                  </div>
                  <div>
                    <div className="font-medium">Anywhere</div>
                    <div className="text-sm text-muted-foreground">Describe what you&apos;re looking for</div>
                  </div>
                </div>
                {destinationMode === 'surprise' && (
                  <div className="mt-3 pl-7">
                    <Textarea
                      placeholder="e.g., Somewhere warm with beaches, good food, under $100/day, safe for solo travel..."
                      value={surpriseDescription}
                      onChange={(e) => setSurpriseDescription(e.target.value)}
                      className="bg-background min-h-[80px]"
                    />
                  </div>
                )}
              </button>
            </div>

            {/* When & Duration */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="font-medium">When & Duration</div>

              {/* Duration Type Toggle */}
              <div>
                <div className="text-sm text-muted-foreground mb-2">How long?</div>
                <div className="flex gap-2 mb-3">
                  <Button variant={durationType === 'days' ? 'default' : 'outline'} size="sm" onClick={() => setDurationType('days')}>Days</Button>
                  <Button variant={durationType === 'weeks' ? 'default' : 'outline'} size="sm" onClick={() => setDurationType('weeks')}>Weeks</Button>
                  <Button variant={durationType === 'months' ? 'default' : 'outline'} size="sm" onClick={() => setDurationType('months')}>Months</Button>
                </div>

                {durationType === 'days' && (
                  <div>
                    <Slider value={[durationDays]} onValueChange={([v]) => setDurationDays(v)} min={1} max={14} step={1} className="mb-2" />
                    <div className="text-center text-sm font-medium">{getDurationLabel()}</div>
                  </div>
                )}
                {durationType === 'weeks' && (
                  <div>
                    <Slider value={[durationWeeks]} onValueChange={([v]) => setDurationWeeks(v)} min={1} max={8} step={1} className="mb-2" />
                    <div className="text-center text-sm font-medium">{getDurationLabel()}</div>
                  </div>
                )}
                {durationType === 'months' && (
                  <div>
                    <Slider value={[durationMonths]} onValueChange={([v]) => setDurationMonths(v)} min={1} max={12} step={1} className="mb-2" />
                    <div className="text-center text-sm font-medium">{getDurationLabel()}</div>
                  </div>
                )}
              </div>

              {/* Start & End Dates */}
              <div>
                <div className="text-sm text-muted-foreground mb-2">Travel dates</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Start date</label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">End date</label>
                    <Input type="date" value={endDate} onChange={(e) => { setEndDateSource('manual'); setEndDate(e.target.value); }} min={startDate} className="bg-background" />
                  </div>
                </div>
              </div>

              {/* Date Flexibility */}
              <div>
                <div className="text-sm text-muted-foreground mb-2">Date flexibility</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 0, label: 'Exact dates' },
                    { value: 1, label: '± 1 day' },
                    { value: 2, label: '± 2 days' },
                    { value: 3, label: '± 3 days' },
                    { value: 7, label: '± 1 week' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setDateFlexibility(value)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                        dateFlexibility === value ? 'bg-primary text-primary-foreground border-primary' : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canProceedSection1}
              onClick={() => {
                setCompletedSections(prev => [...new Set([...prev, 'where' as PlanningSection])]);
                setCurrentSection('prefs');
              }}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Section 2: Preferences (Two-Column Layout, No Collapsibles) */}
        {currentSection === 'prefs' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Tell us about your trip</h2>
            </div>

            {/* Who's Going - Full Width */}
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-3">Who&apos;s going?</div>
              <div className="grid grid-cols-4 gap-2">
                {(['solo', 'couple', 'friends', 'family'] as TravelerType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTravelerType(t)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      travelerType === t ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                    }`}
                  >
                    <div className="text-sm font-medium">{t.charAt(0).toUpperCase() + t.slice(1)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget & Pace - Two Columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-3">Budget</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['$', '$$', '$$$'] as Budget[]).map((b) => (
                    <button
                      key={b}
                      onClick={() => setBudget(b)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        budget === b ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <div className="font-medium text-sm">{b}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-medium mb-3">Pace</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['relaxed', 'balanced', 'active'] as Pace[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPace(p)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        pace === p ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <div className="font-medium text-xs">{p.charAt(0).toUpperCase() + p.slice(1)}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Lodging & Area - Two Columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="font-medium mb-3">Lodging</div>
                <div className="grid grid-cols-2 gap-2">
                  {LODGING_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setLodging(id)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        lodging === id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <div className="font-medium text-sm">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="font-medium mb-3">Area</div>
                <div className="grid grid-cols-2 gap-2">
                  {AREA_OPTIONS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => setArea(id)}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        area === id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                      }`}
                    >
                      <div className="font-medium text-sm">{label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Interests - Full Width */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Interests</div>
                {tripTypes.length > 0 && (
                  <span className="text-sm text-muted-foreground">{tripTypes.length} selected</span>
                )}
              </div>
              <div className="space-y-4">
                {TRIP_TYPE_CATEGORIES.map((category) => (
                  <div key={category.label}>
                    <div className="text-xs font-semibold text-muted-foreground mb-2">{category.label}</div>
                    <div className="flex flex-wrap gap-2">
                      {category.types.map(({ id, label }) => (
                        <button
                          key={id}
                          onClick={() => toggleTripType(id)}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                            tripTypes.includes(id)
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-muted hover:border-primary/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Things to Avoid - Full Width */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Things to avoid</div>
                {avoidances.length > 0 && (
                  <span className="text-sm text-muted-foreground">{avoidances.length} selected</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {AVOIDANCE_OPTIONS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => toggleAvoidance(id)}
                    className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                      avoidances.includes(id)
                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : 'border-muted hover:border-destructive/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Requests - Full Width */}
            <div className="border rounded-lg p-4">
              <div className="font-medium mb-2">Special requests</div>
              <p className="text-sm text-muted-foreground mb-3">Anything else we should know? (optional)</p>
              <Textarea
                placeholder="e.g., celebrating anniversary, need wheelchair access, traveling with a baby..."
                className="min-h-[80px]"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            {/* Save & Continue Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canProceedSection2 || isGenerating}
              onClick={saveTripAndProceed}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Save & Pick Cities
                </>
              )}
            </Button>
          </div>
        )}

        {/* Sections 3, 4, 5: City Picker, Route Planner, Itinerary */}
        {(currentSection === 'cities' || currentSection === 'route' || currentSection === 'itinerary') && tripId && (
          <SwipeablePlanningView
            tripDna={tripDna}
            tripId={tripId}
            itinerary={null}
            items={planningItems}
            onItemsChange={setPlanningItems}
            duration={actualDuration}
            isTripLocked={false}
            controlledPhase={planningPhase}
            onPhaseChange={handlePlanningPhaseChange}
            onDatesChange={(newStartDate, newTotalDays) => {
              // Prevent useEffects from overriding these dates
              syncingFromItinerary.current = true;

              // Sync dates back to plan page state
              setStartDate(newStartDate);

              // Calculate and set end date directly (totalDays includes start day, so subtract 1)
              const start = new Date(newStartDate);
              const end = new Date(start);
              end.setDate(start.getDate() + newTotalDays - 1);
              setEndDate(end.toISOString().split('T')[0]);

              // Update duration to match (so actualDuration is correct when itinerary remounts)
              setDurationType('days');
              setDurationDays(newTotalDays);

              // Clear the sync flag after React processes the state updates
              setTimeout(() => {
                syncingFromItinerary.current = false;
              }, 0);
            }}
            onSearchAI={(query, category) => {
              if (category === 'cities') {
                const mockItems: PlanningItem[] = [];
                destinations.forEach((dest: string, destIdx: number) => {
                  const cityNames = getCitiesForDestination(dest);
                  cityNames.forEach((city, idx) => {
                    mockItems.push({
                      id: `city-${destIdx}-${idx}`,
                      name: city,
                      description: `Explore ${city}`,
                      imageUrl: getCityImage(city, dest),
                      category: 'activities',
                      tags: ['cities', dest],
                    });
                  });
                });
                setPlanningItems(mockItems);
              }
            }}
          />
        )}
      </main>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
        onRefresh={refresh}
      />

      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      <GeneralChatSheet
        open={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}
