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
  LayoutList, CalendarDays, FileText, DollarSign, GripVertical,
  Check, Circle, Hotel, UtensilsCrossed, Compass, MapPin, MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import { tripDb, type StoredTrip } from '@/lib/db/indexed-db';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
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
  'Flights': { bg: 'bg-blue-50 border-blue-200', iconBg: 'bg-blue-100 text-blue-600', text: 'text-blue-800' },
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

  // Get location for a specific day - infer from activities
  const getLocationForDay = (day: DayPlan): string => {
    if (!itinerary) return '';

    // Try to get location from hotel/accommodation activity on this day
    const hotelBlock = day.blocks.find(b =>
      b.activity?.category === 'accommodation' ||
      b.activity?.category === 'checkin' ||
      b.activity?.category === 'hotel'
    );
    if (hotelBlock?.activity?.location?.name) {
      // Extract city from hotel location (e.g., "Hotel Nikko Narita" -> look at location name)
      return hotelBlock.activity.location.name;
    }

    // Try to extract destination from flight arrival on this day
    const flightBlock = day.blocks.find(b => b.activity?.category === 'flight');
    if (flightBlock?.activity?.name) {
      // Parse flight name like "YVR → NRT" or "Vancouver to Tokyo"
      const flightName = flightBlock.activity.name;
      const arrowMatch = flightName.match(/→\s*(.+)$/);
      if (arrowMatch) return arrowMatch[1].trim();
      const toMatch = flightName.match(/to\s+(.+)$/i);
      if (toMatch) return toMatch[1].trim();
    }

    // Try any activity with a location
    for (const block of day.blocks) {
      if (block.activity?.location?.name) {
        return block.activity.location.name;
      }
    }

    // Last resort: check the day's theme which often contains location
    if (day.theme) {
      return day.theme;
    }

    // Fallback to trip destination
    return itinerary.meta.destination || `Day ${day.dayNumber}`;
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
                  ['flights', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : `${PIPELINE_COLORS['More'].bg} hover:opacity-80`
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 ${
                  ['flights', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? 'bg-primary-foreground/20'
                    : PIPELINE_COLORS['More'].iconBg
                }`}>
                  <MoreHorizontal className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-medium text-center ${
                  ['flights', 'hotels', 'experiences', 'packing', 'budget'].includes(contentFilter)
                    ? ''
                    : PIPELINE_COLORS['More'].text
                }`}>More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mb-2">
              <DropdownMenuItem onClick={() => setContentFilter('flights')}>
                <Plane className="w-4 h-4 mr-2" />
                Flights
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
            {/* Route Map - expanded to fill available space */}
            <TripRouteMap bases={itinerary.route.bases} className="flex-1 min-h-[200px]" />

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
                  {/* Flights */}
                  <PipelineRow
                    icon={<Plane className="w-4 h-4" />}
                    label="Flights"
                    count={itinerary.days.reduce((acc, d) => acc + d.blocks.filter(b => b.activity?.category === 'flight').length, 0)}
                    status={itinerary.days.some(d => d.blocks.some(b => b.activity?.category === 'flight')) ? 'complete' : 'pending'}
                    active={contentFilter === 'flights'}
                    onClick={() => setContentFilter(contentFilter === 'flights' ? 'overview' : 'flights')}
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

                      {/* Quick Glance Schedule - grouped by location from actual days */}
                      {(() => {
                        // Group consecutive days by location with day numbers
                        const groups: { location: string; startDate: string; endDate: string; startDay: number; endDay: number }[] = [];

                        itinerary.days.forEach((day, index) => {
                          const location = getLocationForDay(day);
                          const dayNum = index + 1;
                          const lastGroup = groups[groups.length - 1];

                          if (lastGroup && lastGroup.location === location) {
                            lastGroup.endDate = day.date;
                            lastGroup.endDay = dayNum;
                          } else {
                            groups.push({
                              location,
                              startDate: day.date,
                              endDate: day.date,
                              startDay: dayNum,
                              endDay: dayNum,
                            });
                          }
                        });

                        // Calculate actual trip duration from first to last date
                        const firstDate = itinerary.days[0]?.date;
                        const lastDate = itinerary.days[itinerary.days.length - 1]?.date;
                        let totalDays = itinerary.days.length;
                        if (firstDate && lastDate) {
                          const [y1, m1, d1] = firstDate.split('-').map(Number);
                          const [y2, m2, d2] = lastDate.split('-').map(Number);
                          const start = new Date(y1, m1 - 1, d1);
                          const end = new Date(y2, m2 - 1, d2);
                          totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        }

                        // Count unique destinations and flights
                        const uniqueDestinations = new Set(groups.map(g => g.location)).size;
                        const flightCount = itinerary.days.reduce((acc, d) =>
                          acc + d.blocks.filter(b => b.activity?.category === 'flight').length, 0);

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
                                  <p className="text-2xl font-bold">{flightCount}</p>
                                  <p className="text-xs text-muted-foreground">Flights</p>
                                </CardContent>
                              </Card>
                            </div>

                            <Card>
                              <CardContent className="p-4">
                                <h3 className="text-sm font-medium text-muted-foreground mb-3">Itinerary</h3>
                                <div className="space-y-2">
                                  {groups.map((group, index) => (
                                    <div
                                      key={`${group.location}-${index}`}
                                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                                    >
                                      <div className="w-16 text-xs font-medium text-primary text-center flex-shrink-0">
                                        {group.startDay === group.endDay
                                          ? `Day ${group.startDay}`
                                          : `Day ${group.startDay}-${group.endDay}`}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{group.location}</p>
                                        <p className="text-xs text-muted-foreground">
                                          {formatDateString(group.startDate)}
                                          {group.startDate !== group.endDate && ` – ${formatDateString(group.endDate)}`}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {/* Schedule - Daily Itinerary (same as All but with different trigger) */}
                  {(contentFilter === 'schedule' || contentFilter === 'all') && (
                    <div className="space-y-4 pr-2">
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

                        // Create a map of existing days by date
                        const daysByDate = new Map(itinerary.days.map(d => [d.date, d]));

                        // Generate all days
                        const allDays: (DayPlan | { date: string; dayNumber: number; isEmpty: true })[] = [];
                        let dayNum = 1;
                        const current = new Date(start);

                        while (current <= end) {
                          const dateStr = current.toISOString().split('T')[0];
                          const existingDay = daysByDate.get(dateStr);

                          if (existingDay) {
                            allDays.push({ ...existingDay, dayNumber: dayNum });
                          } else {
                            allDays.push({ date: dateStr, dayNumber: dayNum, isEmpty: true });
                          }

                          dayNum++;
                          current.setDate(current.getDate() + 1);
                        }

                        return allDays.map((day) => {
                          if ('isEmpty' in day) {
                            // Render empty day placeholder
                            const [year, month, dayOfMonth] = day.date.split('-').map(Number);
                            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const dateDisplay = `${months[month - 1]} ${dayOfMonth}`;

                            return (
                              <div key={day.date} className="p-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <span className="text-sm font-medium">Day {day.dayNumber}</span>
                                  <span className="text-xs">{dateDisplay}</span>
                                  <span className="text-xs ml-auto italic">No activities planned</span>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <DayCard
                              key={day.id}
                              day={day}
                              isToday={day.date === new Date().toISOString().split('T')[0]}
                              isExpanded={expandedDay === null || expandedDay === day.dayNumber}
                              onToggle={() => setExpandedDay(
                                expandedDay === day.dayNumber ? null : day.dayNumber
                              )}
                              onUpdateDay={handleUpdateDay}
                              location={getLocationForDay(day)}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              isDragging={dragState.blockId !== null}
                              dragOverIndex={dragState.targetDayId === day.id ? dragState.targetIndex : null}
                            />
                          );
                        });
                      })()}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
                        <GripVertical className="w-3 h-3" />
                        <span>Drag activities to reorder or move between days</span>
                      </div>
                    </div>
                  )}

                  {/* Filtered View - Flights */}
                  {contentFilter === 'flights' && (
                    <div className="space-y-4 pr-2">
                      {itinerary.days.flatMap(day =>
                        day.blocks.filter(b => b.activity?.category === 'flight').map(block => (
                          <Card key={block.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <Plane className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{block.activity?.name}</h4>
                                  <p className="text-sm text-muted-foreground">{block.activity?.description}</p>
                                  <p className="text-xs text-muted-foreground mt-2">Day {day.dayNumber} • {day.date}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                      {!itinerary.days.some(d => d.blocks.some(b => b.activity?.category === 'flight')) && (
                        <div className="text-center py-12">
                          <Plane className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                          <p className="text-muted-foreground">No flights in this trip</p>
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
                                  {base.nights} night{base.nights > 1 ? 's' : ''}
                                  {base.accommodation?.priceRange && ` • ${base.accommodation.priceRange}`}
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
                                  <p className="text-xs text-muted-foreground mt-2">Day {day.dayNumber} • {day.date}</p>
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
                    <div className="space-y-4 pr-2">
                      <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="font-semibold mb-2">Trip Documents</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload and organize your travel documents
                        </p>
                        <Button variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          Upload Document
                        </Button>
                      </div>
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Suggested Documents</h4>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Circle className="w-3 h-3" />
                            <span>Flight confirmations</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Circle className="w-3 h-3" />
                            <span>Hotel reservations</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Circle className="w-3 h-3" />
                            <span>Passport / ID copies</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Circle className="w-3 h-3" />
                            <span>Travel insurance</span>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <Circle className="w-3 h-3" />
                            <span>Activity tickets / bookings</span>
                          </div>
                        </div>
                      </div>
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
                              <span className="text-sm">Flights</span>
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
