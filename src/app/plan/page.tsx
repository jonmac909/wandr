'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
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

type DurationType = 'days' | 'months';
type Pace = 'relaxed' | 'balanced' | 'active';
type DestinationMode = 'known' | 'surprise';
type TripType = 'culture' | 'food' | 'nature' | 'beach' | 'adventure' | 'luxury' | 'family';
type Budget = '$' | '$$' | '$$$';
type TravelerType = 'solo' | 'couple' | 'friends' | 'family';

const TRIP_TYPES: { id: TripType; label: string; icon: typeof Compass }[] = [
  { id: 'culture', label: 'Culture & History', icon: Compass },
  { id: 'food', label: 'Food & Drink', icon: Utensils },
  { id: 'nature', label: 'Nature & Outdoors', icon: Mountain },
  { id: 'beach', label: 'Beach & Relax', icon: Palmtree },
  { id: 'adventure', label: 'Adventure', icon: Tent },
  { id: 'luxury', label: 'Luxury', icon: Crown },
  { id: 'family', label: 'Family-friendly', icon: Heart },
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

  // Step 1: Basics
  const [destinationMode, setDestinationMode] = useState<DestinationMode>('known');
  const [mainDestination, setMainDestination] = useState(''); // Country/region
  const [mustVisitPlaces, setMustVisitPlaces] = useState<string[]>([]); // Specific cities
  const [mustVisitInput, setMustVisitInput] = useState('');

  // Pre-fill destination from URL query param
  useEffect(() => {
    const destParam = searchParams.get('destination');
    if (destParam) {
      // If it looks like "City, Country", extract both
      if (destParam.includes(',')) {
        const [city, country] = destParam.split(',').map(s => s.trim());
        setMainDestination(country);
        setMustVisitPlaces([city]);
      } else {
        setMainDestination(destParam);
      }
      setDestinationMode('known');
    }
  }, [searchParams]);

  const addMustVisitPlace = () => {
    const trimmed = mustVisitInput.trim();
    if (trimmed && !mustVisitPlaces.includes(trimmed)) {
      setMustVisitPlaces([...mustVisitPlaces, trimmed]);
      setMustVisitInput('');
    }
  };

  const removeMustVisitPlace = (place: string) => {
    setMustVisitPlaces(mustVisitPlaces.filter(p => p !== place));
  };

  const [surpriseDescription, setSurpriseDescription] = useState('');
  const [durationType, setDurationType] = useState<DurationType>('days');
  const [durationDays, setDurationDays] = useState(14);
  const [durationMonths, setDurationMonths] = useState(1);
  const [startMonth, setStartMonth] = useState<number | null>(null);
  const [startYear, setStartYear] = useState<number>(new Date().getFullYear());
  const [flexibleDates, setFlexibleDates] = useState(true);
  const [pace, setPace] = useState<Pace>('balanced');

  // Step 2: Style
  const [tripTypes, setTripTypes] = useState<TripType[]>([]);
  const [budget, setBudget] = useState<Budget>('$$');
  const [travelerType, setTravelerType] = useState<TravelerType>('couple');

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
      if (prev.length >= 3) {
        return [...prev.slice(1), type];
      }
      return [...prev, type];
    });
  };

  const getDurationLabel = () => {
    if (durationType === 'days') {
      if (durationDays >= 30) return '30+ days';
      if (durationDays === 1) return '1 day';
      return `${durationDays} days`;
    } else {
      if (durationMonths === 1) return '1 month';
      return `${durationMonths} months`;
    }
  };

  const handleBuildTrip = async () => {
    setIsGenerating(true);

    try {
      // Create trip DNA
      const tripId = crypto.randomUUID();
      const actualDuration = durationType === 'days' ? durationDays : durationMonths * 30;

      // Build destination string
      const allPlaces = mustVisitPlaces.length > 0
        ? mustVisitPlaces.join(' → ')
        : mainDestination;
      const destinationDisplay = mainDestination + (mustVisitPlaces.length > 0 ? ` (${allPlaces})` : '');

      // Build tripDna in the expected format for the trip page
      const tripDna = {
        id: tripId,
        version: '1.0',
        createdAt: new Date().toISOString(),
        travelerProfile: {
          partyType: travelerType,
          travelIdentities: tripTypes, // Trip types serve as travel identities
        },
        vibeAndPace: {
          tripPace: pace,
        },
        interests: {
          destination: destinationMode === 'known' ? destinationDisplay : surpriseDescription,
          mainDestination: destinationMode === 'known' ? mainDestination : '',
          mustVisitPlaces: destinationMode === 'known' ? mustVisitPlaces : [],
          tripTypes,
        },
        constraints: {
          duration: { days: actualDuration },
          startMonth: startMonth !== null ? startMonth : undefined,
          startYear: startMonth !== null ? startYear : undefined,
          flexibleDates,
          budget: {
            currency: 'USD',
            level: budget,
            accommodationRange: { min: 50, max: budget === '$' ? 100 : budget === '$$' ? 200 : 400, perNight: true },
            dailySpend: { min: 50, max: budget === '$' ? 100 : budget === '$$' ? 200 : 400 },
            splurgeMoments: budget === '$$$' ? 3 : budget === '$$' ? 2 : 1,
          },
        },
        travelers: {
          type: travelerType,
          count: travelerType === 'solo' ? 1 : travelerType === 'couple' ? 2 : 4,
        },
      };

      // Save to DB
      await tripDb.save({
        id: tripId,
        tripDna: tripDna as any,
        itinerary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
        status: 'draft',
      });

      // Navigate to trip page
      router.push(`/trip/${tripId}`);
    } catch (error) {
      console.error('Error creating trip:', error);
      setIsGenerating(false);
    }
  };

  const canProceedStep1 = destinationMode === 'known' ? mainDestination.trim() : surpriseDescription.trim();
  const canBuild = tripTypes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenChat={() => setChatOpen(true)}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Header with Back Button */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => step === 1 ? router.push('/') : setStep(1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-semibold">Plan New Trip</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 2</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
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
                    {/* Main Destination (Country/Region) */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Where to go
                      </label>
                      <Input
                        placeholder="e.g., Switzerland, Japan, Southeast Asia..."
                        value={mainDestination}
                        onChange={(e) => setMainDestination(e.target.value)}
                        className="bg-background"
                      />
                    </div>

                    {/* Must-Visit Places (Optional) */}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Must-visit places <span className="text-muted-foreground/60">(optional)</span>
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
                        variant={durationType === 'months' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setDurationType('months')}
                      >
                        Months
                      </Button>
                    </div>

                    {durationType === 'days' ? (
                      <div>
                        <Slider
                          value={[durationDays]}
                          onValueChange={([v]) => setDurationDays(v)}
                          min={3}
                          max={30}
                          step={1}
                          className="mb-2"
                        />
                        <div className="text-center text-sm font-medium">{getDurationLabel()}</div>
                      </div>
                    ) : (
                      <div>
                        <Slider
                          value={[durationMonths]}
                          onValueChange={([v]) => setDurationMonths(v)}
                          min={1}
                          max={6}
                          step={1}
                          className="mb-2"
                        />
                        <div className="text-center text-sm font-medium">{getDurationLabel()}</div>
                      </div>
                    )}
                  </div>

                  {/* Start Month/Year */}
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">When? (optional)</div>
                    <div className="flex gap-2">
                      <select
                        value={startMonth ?? ''}
                        onChange={(e) => setStartMonth(e.target.value ? parseInt(e.target.value) : null)}
                        className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="">Any month</option>
                        <option value="0">January</option>
                        <option value="1">February</option>
                        <option value="2">March</option>
                        <option value="3">April</option>
                        <option value="4">May</option>
                        <option value="5">June</option>
                        <option value="6">July</option>
                        <option value="7">August</option>
                        <option value="8">September</option>
                        <option value="9">October</option>
                        <option value="10">November</option>
                        <option value="11">December</option>
                      </select>
                      <select
                        value={startYear}
                        onChange={(e) => setStartYear(parseInt(e.target.value))}
                        disabled={startMonth === null}
                        className="w-24 h-10 rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50"
                      >
                        {[0, 1, 2].map((offset) => {
                          const year = new Date().getFullYear() + offset;
                          return <option key={year} value={year}>{year}</option>;
                        })}
                      </select>
                    </div>
                    <label className="flex items-center gap-2 mt-2 text-sm">
                      <input
                        type="checkbox"
                        checked={flexibleDates}
                        onChange={(e) => setFlexibleDates(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-muted-foreground">Flexible dates</span>
                    </label>
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
                          {p === 'relaxed' && 'Slow days'}
                          {p === 'balanced' && 'Mix of both'}
                          {p === 'active' && 'Packed schedule'}
                        </div>
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

            {/* Trip Type - Collapsible */}
            <div className="border rounded-lg">
              <button
                onClick={() => toggleSection('tripType')}
                className="w-full p-4 flex items-center justify-between"
              >
                <span className="font-medium">Trip Type</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Pick up to 3</span>
                  {expandedSections.includes('tripType') ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedSections.includes('tripType') && (
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {TRIP_TYPES.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => toggleTripType(id)}
                        className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 ${
                          tripTypes.includes(id) ? 'border-primary bg-primary/5' : 'border-muted hover:border-primary/30'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{label}</span>
                      </button>
                    ))}
                  </div>
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

            {/* Who's Going - Collapsible */}
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

            {/* Build Trip Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!canBuild || isGenerating}
              onClick={handleBuildTrip}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Building...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Build Trip
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
