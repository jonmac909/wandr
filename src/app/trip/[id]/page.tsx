'use client';

import { useEffect, useState } from 'react';
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
  Calendar, Package, Utensils, Map, Sparkles, Clock, Plane,
  ChevronLeft, Home, Trash2, Pencil, Save, X, MoreVertical, RefreshCw,
  LayoutList, CalendarDays, FileText, DollarSign, GripVertical
} from 'lucide-react';
import Link from 'next/link';
import { tripDb } from '@/lib/db/indexed-db';
import { DashboardHeader } from '@/components/dashboard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function TripPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [tripDna, setTripDna] = useState<TripDNA | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [foodModalDay, setFoodModalDay] = useState<DayPlan | null>(null);
  const [itineraryView, setItineraryView] = useState<'daily' | 'calendar'>('daily');

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

  // Get location for a specific day based on the base or activities
  const getLocationForDay = (day: DayPlan): string => {
    if (!itinerary) return '';

    // Try to get location from the day's base
    const base = itinerary.route.bases.find(b => b.id === day.baseId);
    if (base?.location) return base.location;

    // Fallback to destination from meta
    return itinerary.meta.destination || '';
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
    <div className="min-h-screen bg-background">
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
      <DashboardHeader activeTab="trips" />

      <div className="flex h-[calc(100vh-56px)]">
        {/* Side Navigation */}
        <aside className="w-56 border-r bg-muted/30 flex-shrink-0 hidden lg:flex flex-col">
          {/* Trip Title & Back */}
          <div className="p-4 border-b">
            <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3">
              <ChevronLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="h-8 text-sm font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                />
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 flex-1" onClick={handleSaveTitle}>
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7" onClick={() => setIsEditing(false)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <h1 className="font-semibold text-sm leading-tight">{itinerary.meta.title}</h1>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={startEditing}>
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-2">
            <div className="space-y-1">
              {[
                { id: 'overview', label: 'Overview', icon: Sparkles },
                { id: 'days', label: 'Itinerary', icon: Calendar },
                { id: 'map', label: 'Map', icon: Map },
                { id: 'budget', label: 'Budget', icon: DollarSign },
                { id: 'docs', label: 'Docs', icon: FileText },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeTab === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Bottom Actions */}
          <div className="p-2 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-2 text-sm h-9">
                  <MoreVertical className="w-4 h-4" />
                  More Options
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={handleFixFlightDurations}>
                  <Clock className="w-4 h-4 mr-2" />
                  Fix Flight Durations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFixAirportCodes}>
                  <Plane className="w-4 h-4 mr-2" />
                  Fix Airport Codes
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
        </aside>

        {/* Mobile Top Bar (hidden on desktop) */}
        <div className="lg:hidden fixed top-14 left-0 right-0 bg-background/95 backdrop-blur border-b z-10">
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
          {/* Mobile Tabs */}
          <div className="flex overflow-x-auto px-2 pb-2 gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'days', label: 'Itinerary', icon: Calendar },
              { id: 'map', label: 'Map', icon: Map },
              { id: 'budget', label: 'Budget', icon: DollarSign },
              { id: 'docs', label: 'Docs', icon: FileText },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  activeTab === id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 lg:py-6 pt-28 lg:pt-6">
            {activeTab === 'overview' && (
              <TripOverview itinerary={itinerary} />
            )}

            {activeTab === 'days' && (
              <div className="space-y-4">
            {/* View Toggle: Daily vs Calendar */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Itinerary</h2>
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setItineraryView('daily')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    itineraryView === 'daily'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                  Daily
                </button>
                <button
                  onClick={() => setItineraryView('calendar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    itineraryView === 'calendar'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </button>
              </div>
            </div>

            {itineraryView === 'daily' ? (
              /* Daily View - Existing day cards with drag-and-drop */
              <div className="space-y-4">
                {itinerary.days.map((day) => (
                  <DayCard
                    key={day.id}
                    day={day}
                    isToday={day.date === new Date().toISOString().split('T')[0]}
                    isExpanded={expandedDay === null || expandedDay === day.dayNumber}
                    onToggle={() => setExpandedDay(
                      expandedDay === day.dayNumber ? null : day.dayNumber
                    )}
                    onUpdateDay={handleUpdateDay}
                    onFindFood={(d) => setFoodModalDay(d)}
                    location={getLocationForDay(day)}
                    // Drag and drop props
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    isDragging={dragState.blockId !== null}
                    dragOverIndex={dragState.targetDayId === day.id ? dragState.targetIndex : null}
                  />
                ))}
              </div>
            ) : (
              /* Calendar View - Week/Month grid */
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Calendar View Coming Soon</p>
                    <p className="text-sm">See your trip at a glance with drag-and-drop activities</p>
                  </div>
                </CardContent>
              </Card>
            )}

                {/* Drag hint */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
                  <GripVertical className="w-3 h-3" />
                  <span>Drag activities to reorder or move between days</span>
                </div>
              </div>
            )}

            {activeTab === 'map' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground py-12">
                    <Map className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-2">Interactive Map</p>
                    <p className="text-sm mb-4">View all your destinations, activities, and route on the map</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {itinerary.route.bases.map((base, i) => (
                        <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          {base.location}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'budget' && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-6">
                    {/* Budget Summary */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Estimated Total</p>
                        <p className="text-2xl font-bold text-primary">
                          ${((tripDna?.constraints.budget.dailySpend.max || 200) * itinerary.days.length).toLocaleString()}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Daily Average</p>
                        <p className="text-2xl font-bold">
                          ${tripDna?.constraints.budget.dailySpend.max || 200}
                        </p>
                      </div>
                    </div>

                    {/* Budget Categories */}
                    <div className="space-y-3">
                      <h3 className="font-semibold">Budget Breakdown</h3>
                      {[
                        { label: 'Accommodation', percent: 40, amount: ((tripDna?.constraints.budget.accommodationRange.max || 150) * itinerary.days.length) },
                        { label: 'Food & Dining', percent: 25, amount: ((tripDna?.constraints.budget.dailySpend.max || 200) * 0.4 * itinerary.days.length) },
                        { label: 'Activities', percent: 20, amount: ((tripDna?.constraints.budget.dailySpend.max || 200) * 0.35 * itinerary.days.length) },
                        { label: 'Transport', percent: 15, amount: ((tripDna?.constraints.budget.dailySpend.max || 200) * 0.25 * itinerary.days.length) },
                      ].map((cat, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{cat.label}</span>
                            <span className="font-medium">${Math.round(cat.amount).toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${cat.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-4">
                {/* Food/Restaurants */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Utensils className="w-4 h-4" />
                        Restaurants & Food
                      </h3>
                      <span className="text-sm text-muted-foreground">{itinerary.foodLayer.length} saved</span>
                    </div>
                    <FoodLayerView foods={itinerary.foodLayer} onDeleteFood={handleDeleteFoodRecommendation} />
                  </CardContent>
                </Card>

                {/* Packing List */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Packing List
                      </h3>
                      <Button variant="ghost" size="sm" onClick={handleRegeneratePackingList}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regenerate
                      </Button>
                    </div>
                    <PackingListView packingList={itinerary.packingLayer} onRegenerate={handleRegeneratePackingList} />
                  </CardContent>
                </Card>

                {/* Notes/Links placeholder */}
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4" />
                      Notes & Links
                    </h3>
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Add booking confirmations, travel documents, and notes here</p>
                      <Button variant="outline" size="sm" className="mt-4">
                        Add Document
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
