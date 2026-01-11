'use client';

import { useState, useEffect, Suspense } from 'react';
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
  ChevronDown,
  ChevronUp,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { tripDb } from '@/lib/db/indexed-db';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { GeneralChatSheet } from '@/components/chat/GeneralChatSheet';
import { useDashboardData } from '@/hooks/useDashboardData';

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

const AREA_OPTIONS: { id: AreaType; label: string; desc: string }[] = [
  { id: 'quiet', label: 'Quiet', desc: 'Peaceful neighborhood' },
  { id: 'central', label: 'Central', desc: 'Walkable to attractions' },
];

// Common things to avoid
const AVOIDANCE_OPTIONS = [
  { id: 'big-cities', label: 'Big cities' },
  { id: 'crowds', label: 'Crowds' },
  { id: 'tourist-traps', label: 'Tourist traps' },
  { id: 'heat', label: 'Hot weather' },
  { id: 'cold', label: 'Cold weather' },
  { id: 'long-drives', label: 'Long drives' },
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
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Edit mode
  const editTripId = searchParams.get('edit');
  const isEditMode = !!editTripId;

  // Step 1: Basics
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('known');
  const [destinations, setDestinations] = useState<string[]>([]); // Countries/regions (e.g., ["Turkey", "Spain"])
  const [destinationInput, setDestinationInput] = useState(''); // Input for adding destinations
  const [mustVisitPlaces, setMustVisitPlaces] = useState<string[]>([]); // Specific cities
  const [mustVisitInput, setMustVisitInput] = useState('');

  // Add destination helper
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

  // Remove destination helper
  const removeDestination = (dest: string) => {
    setDestinations(destinations.filter(d => d !== dest));
  };

  // Load existing trip data when editing
  useEffect(() => {
    async function loadTripForEdit() {
      if (!editTripId) return;
      setIsLoading(true);

      try {
        const trip = await tripDb.get(editTripId);
        if (trip?.tripDna) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const dna = trip.tripDna as any;

          // Pre-fill destinations (countries)
          if (dna.interests?.destinations?.length > 0) {
            setDestinations(dna.interests.destinations);
          } else if (dna.interests?.destination) {
            // Parse "Turkey → Spain" format
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
          if (dna.constraints?.startDate) {
            setStartDate(dna.constraints.startDate);
          }
          if (dna.constraints?.endDate) {
            setEndDate(dna.constraints.endDate);
          }
          if (dna.constraints?.dateFlexibility !== undefined) {
            setDateFlexibility(dna.constraints.dateFlexibility);
          }

          // Pre-fill pace
          if (dna.vibeAndPace?.tripPace) {
            setPace(dna.vibeAndPace.tripPace as Pace);
          }

          // Pre-fill trip types (filter to only valid current IDs)
          if (dna.interests?.tripTypes?.length > 0) {
            setTripTypes(filterValidTripTypes(dna.interests.tripTypes));
          } else if (dna.travelerProfile?.travelIdentities?.length > 0) {
            setTripTypes(filterValidTripTypes(dna.travelerProfile.travelIdentities));
          }

          // Pre-fill budget
          if (dna.constraints?.budget?.level) {
            setBudget(dna.constraints.budget.level as Budget);
          }

          // Pre-fill traveler type
          if (dna.travelerProfile?.partyType) {
            setTravelerType(dna.travelerProfile.partyType as TravelerType);
          } else if (dna.travelers?.type) {
            setTravelerType(dna.travelers.type as TravelerType);
          }

          setDestinationMode('known');
        }
      } catch (error) {
        console.error('Failed to load trip for editing:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadTripForEdit();
  }, [editTripId]);

  // Pre-fill destination from URL query param (for new trips)
  useEffect(() => {
    if (editTripId) return; // Skip if editing
    const destParam = searchParams.get('destination');
    if (destParam) {
      // If it looks like "City, Country", extract both
      if (destParam.includes(',')) {
        const parts = destParam.split(',').map(s => s.trim());
        if (parts.length >= 2) {
          setDestinations([parts[parts.length - 1]]); // Country is last
          setMustVisitPlaces([parts[0]]); // City is first
        }
      } else {
        setDestinations([destParam]);
      }
      setDestinationMode('known');
    }
  }, [searchParams, editTripId]);

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

  const [surpriseDescription, setSurpriseDescription] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('days');
  const [durationDays, setDurationDays] = useState(14);
  const [durationWeeks, setDurationWeeks] = useState(2);
  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateFlexibility, setDateFlexibility] = useState<number>(0); // 0 = exact, 1-7 = +/- days
  const [pace, setPace] = useState<Pace>('balanced');

  // Step 2: Style
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [budget, setBudget] = useState<Budget>('$$');
  const [travelerType, setTravelerType] = useState<TravelerType>('couple');
  const [lodging, setLodging] = useState<LodgingType>('hotel');
  const [area, setArea] = useState<AreaType>('central');

  // Step 3: Preferences
  const [avoidances, setAvoidances] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');

  const toggleAvoidance = (id: string) => {
    setAvoidances((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState<string[]>(['timing', 'tripType']);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
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

  const handleBuildTrip = async () => {
    setIsGenerating(true);

    try {
      // Use existing ID if editing, otherwise create new
      const tripId = editTripId || crypto.randomUUID();
      const actualDuration = durationType === 'days'
        ? durationDays
        : durationType === 'weeks'
          ? durationWeeks * 7
          : durationMonths * 30;

      // Build destination string - multi-country with arrow
      const destinationDisplay = destinations.length > 1
        ? destinations.join(' → ')
        : destinations[0] || '';

      // Build tripDna in the expected format for the trip page
      const tripDna = {
        id: tripId,
        version: '1.0',
        createdAt: isEditMode ? undefined : new Date().toISOString(), // Preserve original createdAt
        travelerProfile: {
          partyType: travelerType,
          travelIdentities: tripTypes, // Trip types serve as travel identities
        },
        vibeAndPace: {
          tripPace: pace,
        },
        interests: {
          destination: destinationMode === 'known' ? destinationDisplay : surpriseDescription,
          destinations: destinations.length > 0 ? destinations : [], // Array of countries
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
        preferences: {
          avoidances: avoidances.length > 0 ? avoidances.join(', ') : undefined,
          specialRequests: specialRequests.trim() || undefined,
        },
        travelers: {
          type: travelerType,
          count: travelerType === 'solo' ? 1 : travelerType === 'couple' ? 2 : 4,
        },
      };

      if (isEditMode) {
        // Update existing trip
        const existingTrip = await tripDb.get(tripId);
        if (existingTrip) {
          await tripDb.save({
            ...existingTrip,
            id: tripId,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tripDna: tripDna as any,
            updatedAt: new Date(),
          });
        }
      } else {
        // Save new trip to DB
        await tripDb.save({
          id: tripId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tripDna: tripDna as any,
          itinerary: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          syncedAt: null,
          status: 'draft',
        });
      }

      // Navigate to trip page
      router.push(`/trip/${tripId}`);
    } catch (error) {
      console.error('Error saving trip:', error);
      setIsGenerating(false);
    }
  };

  const canProceedStep1 = destinationMode === 'known' ? destinations.length > 0 : surpriseDescription.trim();
  const canBuild = tripTypes.length > 0;

  // Loading state for edit mode
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading trip...</p>
        </div>
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
        {/* 3-Step Progress Indicator - Clickable */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-0">
            {/* Step 1 */}
            <button
              onClick={() => setStep(1)}
              className="flex flex-col items-center w-24"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-colors ${
                step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className={`text-xs font-medium text-center transition-colors ${
                step >= 1 ? 'text-primary' : 'text-muted-foreground'
              }`}>
                Where & When
              </span>
            </button>

            {/* Connector 1-2 */}
            <div className={`h-0.5 w-16 -mx-2 rounded transition-colors ${
              step > 1 ? 'bg-primary' : 'bg-muted'
            }`} />

            {/* Step 2 */}
            <button
              onClick={() => setStep(2)}
              className="flex flex-col items-center w-24"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-colors ${
                step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className={`text-xs font-medium text-center transition-colors ${
                step >= 2 ? 'text-primary' : 'text-muted-foreground'
              }`}>
                Trip Style
              </span>
            </button>

            {/* Connector 2-3 */}
            <div className={`h-0.5 w-16 -mx-2 rounded transition-colors ${
              step > 2 ? 'bg-primary' : 'bg-muted'
            }`} />

            {/* Step 3 */}
            <button
              onClick={() => setStep(3)}
              className="flex flex-col items-center w-24"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-1 transition-colors ${
                step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className={`text-xs font-medium text-center transition-colors ${
                step >= 3 ? 'text-primary' : 'text-muted-foreground'
              }`}>
                Preferences
              </span>
            </button>
          </div>
        </div>
        {step === 1 && (
          <div className="space-y-6">
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
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Countries / Regions
                      </label>
                      {destinations.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {destinations.map((dest, idx) => (
                            <Badge key={dest} variant="default" className="pl-2 pr-1 py-1 gap-1 bg-primary/10 text-primary border border-primary/20">
                              {idx > 0 && <span className="text-xs mr-1">→</span>}
                              {dest}
                              <button
                                onClick={() => removeDestination(dest)}
                                className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          placeholder="e.g., Thailand, Vietnam, Japan..."
                          value={destinationInput}
                          onChange={(e) => setDestinationInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addDestination();
                            }
                          }}
                          className="bg-background flex-1"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          onClick={addDestination}
                          disabled={!destinationInput.trim()}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Add multiple countries for a multi-destination trip
                      </p>
                    </div>

                    {/* Must-Visit Cities (Optional) */}
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
                                <button
                                  onClick={() => removeMustVisitPlace(place)}
                                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                                >
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
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addMustVisitPlace();
                              }
                            }}
                            className="bg-background flex-1"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={addMustVisitPlace}
                            disabled={!mustVisitInput.trim()}
                          >
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

            {/* Timing & Duration - Collapsible */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('timing')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">When & Duration</span>
                {expandedSections.includes('timing') ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {expandedSections.includes('timing') && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Duration Type Toggle */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">How long?</div>
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={durationType === 'days' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDurationType('days')}
                      >
                        Days
                      </Button>
                      <Button
                        variant={durationType === 'weeks' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDurationType('weeks')}
                      >
                        Weeks
                      </Button>
                      <Button
                        variant={durationType === 'months' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDurationType('months')}
                      >
                        Months
                      </Button>
                    </div>

                    {durationType === 'days' && (
                      <div>
                        <Slider
                          value={[durationDays]}
                          onValueChange={([v]) => setDurationDays(v)}
                          min={1}
                          max={14}
                          step={1}
                          className="mb-2"
                        />
                        <div className="text-center text-sm font-medium">{getDurationLabel()}</div>
                      </div>
                    )}
                    {durationType === 'weeks' && (
                      <div>
                        <Slider
                          value={[durationWeeks]}
                          onValueChange={([v]) => setDurationWeeks(v)}
                          min={1}
                          max={8}
                          step={1}
                          className="mb-2"
                        />
                        <div className="text-center text-sm font-medium">{getDurationLabel()}</div>
                      </div>
                    )}
                    {durationType === 'months' && (
                      <div>
                        <Slider
                          value={[durationMonths]}
                          onValueChange={([v]) => setDurationMonths(v)}
                          min={1}
                          max={12}
                          step={1}
                          className="mb-2"
                        />
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
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">End date</label>
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="bg-background"
                        />
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
                            dateFlexibility === value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-muted hover:border-primary/30'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canProceedStep1}
              onClick={() => setStep(2)}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">What kind of trip?</h2>
            </div>

            {/* Who's Going - Collapsible (FIRST) */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('travelers')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">Who&apos;s going?</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{travelerType.charAt(0).toUpperCase() + travelerType.slice(1)}</Badge>
                  {expandedSections.includes('travelers') ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedSections.includes('travelers') && (
                <div className="px-4 pb-4">
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
              )}
            </div>

            {/* Trip Type - Collapsible with Categories */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('tripType')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">Interests</span>
                <div className="flex items-center gap-2">
                  {tripTypes.length > 0 && (
                    <span className="text-sm text-muted-foreground">{tripTypes.length} selected</span>
                  )}
                  {expandedSections.includes('tripType') ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedSections.includes('tripType') && (
                <div className="px-4 pb-4 space-y-4">
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
              )}
            </div>

            {/* Budget - Collapsible */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('budget')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">Budget</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{budget}</Badge>
                  {expandedSections.includes('budget') ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedSections.includes('budget') && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['$', '$$', '$$$'] as Budget[]).map((b) => (
                      <button
                        key={b}
                        onClick={() => setBudget(b)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          budget === b ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                        }`}
                      >
                        <div className="font-medium">{b}</div>
                        <div className="text-xs text-muted-foreground">
                          {b === '$' && 'Budget'}
                          {b === '$$' && 'Mid-range'}
                          {b === '$$$' && 'Luxury'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pace - Collapsible */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('pace')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">Pace</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{pace.charAt(0).toUpperCase() + pace.slice(1)}</Badge>
                  {expandedSections.includes('pace') ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedSections.includes('pace') && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(['relaxed', 'balanced', 'active'] as Pace[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPace(p)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          pace === p ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                        }`}
                      >
                        <div className="font-medium text-sm">{p.charAt(0).toUpperCase() + p.slice(1)}</div>
                        <div className="text-xs text-muted-foreground">
                          {p === 'relaxed' && 'Lots of free time'}
                          {p === 'balanced' && 'Some free time'}
                          {p === 'active' && 'Fully scheduled'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Lodging - Collapsible */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('lodging')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">Lodging</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{lodging.charAt(0).toUpperCase() + lodging.slice(1)}</Badge>
                  {expandedSections.includes('lodging') ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedSections.includes('lodging') && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-4 gap-2">
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
              )}
            </div>

            {/* Area - Collapsible */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('area')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">Area</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{area === 'central' ? 'Central' : 'Quiet'}</Badge>
                  {expandedSections.includes('area') ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedSections.includes('area') && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {AREA_OPTIONS.map(({ id, label, desc }) => (
                      <button
                        key={id}
                        onClick={() => setArea(id)}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          area === id ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                        }`}
                      >
                        <div className="font-medium text-sm">{label}</div>
                        <div className="text-xs text-muted-foreground">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Next Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={() => setStep(3)}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">Any preferences?</h2>
              <p className="text-sm text-muted-foreground mt-1">Optional - skip if none</p>
            </div>

            {/* Things to Avoid */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="font-medium">Things to avoid</label>
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

            {/* Special Requests */}
            <div className="border rounded-lg p-4">
              <label className="font-medium block mb-2">Special requests</label>
              <p className="text-sm text-muted-foreground mb-3">
                Anything else we should know?
              </p>
              <Textarea
                placeholder="e.g., celebrating anniversary, need wheelchair access, traveling with a baby..."
                className="min-h-[80px]"
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
              />
            </div>

            {/* Save Preferences Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canBuild || isGenerating}
              onClick={handleBuildTrip}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Save & Start Planning
                </>
              )}
            </Button>
          </div>
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
