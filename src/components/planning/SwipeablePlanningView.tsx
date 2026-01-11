'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  MapPin,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Building2,
  UtensilsCrossed,
  Coffee,
  Hotel,
  Ticket,
  Heart,
  GripVertical,
  Footprints,
  Plus,
  Lock,
  Unlock,
  Users,
  Calendar,
  Zap,
  Pencil,
  X,
  Users2,
  Image,
  Route,
  ArrowRight,
  ArrowDown,
  Plane,
  Landmark,
  ScrollText,
  Building,
  ShoppingBag,
  Utensils,
  TreePine,
} from 'lucide-react';
import type { TripDNA } from '@/types/trip-dna';
import type { Itinerary } from '@/types/itinerary';
import type { PlanningItem } from './PlanningTripToggle';
import {
  itineraryToPlanningItems,
  extractCitiesFromItinerary,
  getItineraryDuration,
} from '@/lib/planning/itinerary-to-planning';
import { getCityImage, getSiteImage } from '@/lib/planning/city-images';
import { POPULAR_CITY_INFO, type CityInfo, type CityHighlight } from '@/lib/ai/city-info-generator';

interface SwipeablePlanningViewProps {
  tripDna: TripDNA;
  itinerary?: Itinerary | null; // Existing itinerary (for imported trips)
  items: PlanningItem[];
  onItemsChange: (items: PlanningItem[]) => void;
  onSearchAI?: (query: string, category: string) => void;
  duration?: number; // Trip duration in days
  isTripLocked?: boolean; // When Trip View is locked, only allow adding (not removing/editing)
}

interface CategoryStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gridSize: number;
}

// Day colors for timeline (matching Trip.com style)
const DAY_COLORS = [
  { bg: 'bg-orange-500', text: 'text-orange-600', light: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500' },
  { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' },
  { bg: 'bg-cyan-500', text: 'text-cyan-600', light: 'bg-cyan-50', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  { bg: 'bg-pink-500', text: 'text-pink-600', light: 'bg-pink-50', border: 'border-pink-200', dot: 'bg-pink-500' },
  { bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500' },
  { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  { bg: 'bg-blue-500', text: 'text-blue-600', light: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' },
];

// Default city info for cities not in database (while loading from AI)
const DEFAULT_CITY_INFO: CityInfo = {
  bestFor: ['Exploration'],
  crowdLevel: 'Moderate',
  bestTime: 'Varies by season',
  topSites: ['Loading...'],
  localTip: 'Loading local insights...',
  avgDays: '2-3 days',
  pros: ['Discover something new'],
  cons: ['More research needed'],
};

// Get city info from the database, or return default while AI fetches
function getCityInfo(cityName: string): CityInfo {
  return POPULAR_CITY_INFO[cityName] || DEFAULT_CITY_INFO;
}

// Generate personalized recommendation based on TripDNA preferences
function getPersonalizedRecommendation(cityInfo: CityInfo, tripDna: TripDNA): { match: 'great' | 'good' | 'mixed'; reasons: string[]; concerns: string[] } {
  const reasons: string[] = [];
  const concerns: string[] = [];

  const { travelerProfile, vibeAndPace, interests, constraints } = tripDna;
  const travelIdentities = travelerProfile?.travelIdentities || [];

  // Check food preferences
  if (interests?.food?.importance === 'food-focused' && cityInfo.bestFor.some(b => b.toLowerCase().includes('food'))) {
    reasons.push('Amazing food scene matches your foodie preferences');
  }

  // Check pace preferences
  if (vibeAndPace?.tripPace === 'relaxed' && cityInfo.crowdLevel === 'Very High') {
    concerns.push('Very crowded - might feel rushed for your relaxed pace');
  }
  if (vibeAndPace?.tripPace === 'fast' && cityInfo.crowdLevel === 'Low') {
    reasons.push('Fewer crowds means you can see more in less time');
  }

  // Check adventure/nature preferences
  if (interests?.hobbies?.includes('hiking') && cityInfo.bestFor.some(b => b.toLowerCase().includes('nature') || b.toLowerCase().includes('hiking'))) {
    reasons.push('Great hiking and nature experiences');
  }

  // Check culture preferences (from travelIdentities)
  if (travelIdentities.includes('history') && cityInfo.bestFor.some(b => b.toLowerCase().includes('culture') || b.toLowerCase().includes('history'))) {
    reasons.push('Rich cultural experiences align with your interests');
  }

  // Check beach preferences
  if (travelIdentities.includes('relaxation') && cityInfo.bestFor.some(b => b.toLowerCase().includes('beach'))) {
    reasons.push('Beach vibes match what you are looking for');
  }

  // Check nightlife preferences
  if (travelIdentities.includes('nightlife') && cityInfo.bestFor.some(b => b.toLowerCase().includes('nightlife'))) {
    reasons.push('Vibrant nightlife scene');
  }

  // Check photography hobby
  if (interests?.hobbies?.includes('photography') && cityInfo.bestFor.some(b => b.toLowerCase().includes('photography') || b.toLowerCase().includes('scenery'))) {
    reasons.push('Incredible photo opportunities');
  }

  // Check family travel
  if (travelerProfile?.partyType === 'family' && cityInfo.crowdLevel === 'Very High') {
    concerns.push('Very crowded areas can be challenging with family');
  }

  // Check budget
  const budgetLevel = constraints?.budget?.dailySpend?.max;
  if (budgetLevel && budgetLevel < 100 && cityInfo.cons.some(c => c.toLowerCase().includes('expensive'))) {
    concerns.push('Can be pricey - look for budget options');
  }

  // Determine match level
  let match: 'great' | 'good' | 'mixed' = 'good';
  if (reasons.length >= 2 && concerns.length === 0) match = 'great';
  else if (concerns.length >= 2) match = 'mixed';

  // Add default reasons if none found
  if (reasons.length === 0) {
    reasons.push(`Known for ${cityInfo.bestFor.slice(0, 2).join(' and ')}`);
  }

  return { match, reasons: reasons.slice(0, 3), concerns: concerns.slice(0, 2) };
}

// Calculate match score for sorting cities
function getCityMatchScore(cityInfo: CityInfo, tripDna: TripDNA): number {
  let score = 0;
  const { vibeAndPace, interests, travelerProfile } = tripDna;
  const travelIdentities = travelerProfile?.travelIdentities || [];

  // Boost for matching travel identities
  if (travelIdentities.includes('relaxation') && cityInfo.bestFor.some(b => b.toLowerCase().includes('beach'))) score += 20;
  if ((travelIdentities.includes('history') || travelIdentities.includes('local-culture')) && cityInfo.bestFor.some(b => b.toLowerCase().includes('culture') || b.toLowerCase().includes('history'))) score += 20;
  if (travelIdentities.includes('nightlife') && cityInfo.bestFor.some(b => b.toLowerCase().includes('nightlife'))) score += 20;
  if ((travelIdentities.includes('adventure') || travelIdentities.includes('nature')) && cityInfo.bestFor.some(b => b.toLowerCase().includes('adventure') || b.toLowerCase().includes('nature'))) score += 20;

  // Boost for matching hobbies
  if (interests?.hobbies?.includes('hiking') && cityInfo.bestFor.some(b => b.toLowerCase().includes('nature') || b.toLowerCase().includes('hiking'))) score += 15;
  if (interests?.hobbies?.includes('photography') && cityInfo.bestFor.some(b => b.toLowerCase().includes('photography') || b.toLowerCase().includes('scenery'))) score += 15;
  if (interests?.hobbies?.includes('diving') && cityInfo.bestFor.some(b => b.toLowerCase().includes('beach') || b.toLowerCase().includes('snorkeling'))) score += 15;

  // Boost for food match
  if (interests?.food?.importance === 'food-focused' && cityInfo.bestFor.some(b => b.toLowerCase().includes('food'))) score += 15;

  // Penalty for crowd level vs pace
  if (vibeAndPace?.tripPace === 'relaxed' && cityInfo.crowdLevel === 'Very High') score -= 10;
  if (vibeAndPace?.tripPace === 'fast' && cityInfo.crowdLevel === 'Low') score += 10;

  return score;
}

// Planning flow steps: cities → hotels → restaurants → activities
const PLANNING_STEPS: CategoryStep[] = [
  {
    id: 'cities',
    title: 'Pick your cities',
    subtitle: 'Which cities do you want to explore?',
    icon: Building2,
    gridSize: 18,
  },
  {
    id: 'hotels',
    title: 'Best hotels',
    subtitle: 'Where to stay with prices',
    icon: Hotel,
    gridSize: 18,
  },
  {
    id: 'restaurants',
    title: 'Where to eat',
    subtitle: 'Top restaurants and cafes',
    icon: UtensilsCrossed,
    gridSize: 18,
  },
  {
    id: 'activities',
    title: 'Things to do',
    subtitle: 'Activities and experiences',
    icon: Ticket,
    gridSize: 18,
  },
];

type PlanningPhase = 'picking' | 'route-planning' | 'favorites-library' | 'day-planning';

export function SwipeablePlanningView({
  tripDna,
  itinerary,
  items,
  onItemsChange,
  onSearchAI,
  duration: propDuration,
  isTripLocked = false,
}: SwipeablePlanningViewProps) {
  // Calculate duration from itinerary or props
  const duration = propDuration || getItineraryDuration(itinerary) || 7;

  // Determine if this is an imported trip (has existing itinerary)
  const hasExistingItinerary = Boolean(itinerary && itinerary.days.length > 0);

  // For imported trips, start in favorites-library phase to review picks before day planning
  const [phase, setPhase] = useState<PlanningPhase>(hasExistingItinerary ? 'favorites-library' : 'picking');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [detailItem, setDetailItem] = useState<PlanningItem | null>(null);
  const [expandedDay, setExpandedDay] = useState<number>(0);
  const [initialized, setInitialized] = useState(false);
  const [activeDestinationFilter, setActiveDestinationFilter] = useState<string>('');
  const [cityDetailItem, setCityDetailItem] = useState<PlanningItem | null>(null);
  const [cityImageIndex, setCityImageIndex] = useState(0);
  const [highlightTab, setHighlightTab] = useState<string>('photos'); // Active tab for city highlights
  const [gridOffset, setGridOffset] = useState(0); // For "more options" pagination
  const [routeOrder, setRouteOrder] = useState<string[]>([]); // Ordered list of city names
  const [countryOrder, setCountryOrder] = useState<string[]>([]); // Order of countries to visit
  const [draggedCityIndex, setDraggedCityIndex] = useState<number | null>(null); // For drag-and-drop

  // Initialize from existing itinerary
  useEffect(() => {
    if (hasExistingItinerary && !initialized) {
      // Convert itinerary to planning items
      const existingItems = itineraryToPlanningItems(itinerary);
      if (existingItems.length > 0 && items.length === 0) {
        onItemsChange(existingItems);
      }

      // Pre-populate selected IDs and cities
      const ids = new Set<string>();
      existingItems.forEach(item => {
        if (item.isFavorited) ids.add(item.id);
      });
      setSelectedIds(ids);

      // Extract cities from itinerary
      const cities = extractCitiesFromItinerary(itinerary);
      setSelectedCities(cities);

      setInitialized(true);
    }
  }, [hasExistingItinerary, itinerary, items.length, onItemsChange, initialized]);

  // Get all destinations from TripDNA
  const destinations = useMemo(() => {
    // Parse "Turkey → Spain" into ["Turkey", "Spain"]
    const parseDestinations = (dest: string): string[] => {
      if (dest.includes('→')) return dest.split('→').map(d => d.trim());
      if (dest.includes('->')) return dest.split('->').map(d => d.trim());
      if (dest.includes(' - ')) return dest.split(' - ').map(d => d.trim());
      return [dest];
    };

    if (tripDna.interests.destinations && tripDna.interests.destinations.length > 0) {
      return tripDna.interests.destinations;
    } else if (tripDna.interests.destination) {
      return parseDestinations(tripDna.interests.destination);
    }
    return ['Your destination'];
  }, [tripDna.interests.destinations, tripDna.interests.destination]);

  // Set default destination filter to first destination
  useEffect(() => {
    if (destinations.length > 0 && !activeDestinationFilter) {
      setActiveDestinationFilter(destinations[0]);
    }
  }, [destinations, activeDestinationFilter]);

  const currentStep = PLANNING_STEPS[currentStepIndex];

  // Get items for current step/category
  const getStepItems = (stepId: string) => {
    return items.filter((item) => item.tags?.includes(stepId));
  };

  const allStepItems = getStepItems(currentStep.id);

  // Filter by active destination when viewing cities
  const stepItems = useMemo(() => {
    if (currentStep.id !== 'cities' || !activeDestinationFilter) {
      return allStepItems;
    }
    return allStepItems.filter(item => item.tags?.includes(activeDestinationFilter));
  }, [allStepItems, currentStep.id, activeDestinationFilter]);

  // Auto-load items when entering a step with no items
  useEffect(() => {
    if (phase === 'picking' && stepItems.length === 0 && onSearchAI) {
      // Auto-trigger load for current step
      if (currentStep.id === 'cities') {
        const query = destinations.length > 1
          ? `top cities to visit in ${destinations.join(' and ')}`
          : `top 10 cities to visit in ${destinations[0]}`;
        onSearchAI(query, 'cities');
      } else if (selectedCities.length > 0) {
        const citiesQuery = selectedCities.join(', ');
        onSearchAI(`best ${currentStep.id} in ${citiesQuery}`, currentStep.id);
      }
    }
  }, [phase, currentStepIndex, stepItems.length, onSearchAI, currentStep.id, destinations, selectedCities]);

  // Get selected/favorited items
  const selectedItems = useMemo(() => {
    return items.filter((i) => i.isFavorited);
  }, [items]);

  // Get unassigned selected items (for day planning)
  const unassignedItems = useMemo(() => {
    return selectedItems.filter((i) => i.dayAssigned === undefined);
  }, [selectedItems]);

  // Get items for a specific day
  const getDayItems = (dayIndex: number) => {
    return selectedItems
      .filter((item) => item.dayAssigned === dayIndex)
      .sort((a, b) => (a.orderInDay || 0) - (b.orderInDay || 0));
  };

  const getDayColors = (dayIndex: number) => DAY_COLORS[dayIndex % DAY_COLORS.length];

  // Toggle selection
  const toggleSelect = (itemId: string, itemName: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      if (currentStep.id === 'cities') {
        setSelectedCities((prev) => prev.filter((c) => c !== itemName));
      }
    } else {
      newSelected.add(itemId);
      if (currentStep.id === 'cities') {
        setSelectedCities((prev) => [...prev, itemName]);
      }
    }
    setSelectedIds(newSelected);

    onItemsChange(
      items.map((item) =>
        item.id === itemId ? { ...item, isFavorited: newSelected.has(itemId) } : item
      )
    );
  };

  // Add item to day
  const addToDay = (itemId: string, dayIndex: number) => {
    const dayItems = getDayItems(dayIndex);
    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? { ...item, dayAssigned: dayIndex, orderInDay: dayItems.length }
          : item
      )
    );
  };

  // Remove from day
  const removeFromDay = (itemId: string) => {
    onItemsChange(
      items.map((item) =>
        item.id === itemId
          ? { ...item, dayAssigned: undefined, orderInDay: undefined }
          : item
      )
    );
  };

  // Go to next step
  const goToNextStep = () => {
    // After cities step, go to route planning
    if (currentStep.id === 'cities' && selectedCities.length > 0) {
      // Initialize route order with selected cities
      setRouteOrder([...selectedCities]);
      // Initialize country order if multi-country
      if (destinations.length > 1) {
        setCountryOrder([...destinations]);
      }
      setPhase('route-planning');
      return;
    }

    if (currentStepIndex < PLANNING_STEPS.length - 1) {
      const nextStep = PLANNING_STEPS[currentStepIndex + 1];
      if (onSearchAI && selectedCities.length > 0) {
        const citiesQuery = routeOrder.length > 0 ? routeOrder.join(', ') : selectedCities.join(', ');
        onSearchAI(`best ${nextStep.id} in ${citiesQuery}`, nextStep.id);
      }
      setCurrentStepIndex(currentStepIndex + 1);
      setGridOffset(0); // Reset pagination
    } else {
      // Finished all steps, go to favorites library
      setPhase('favorites-library');
    }
  };

  // Show more items in grid
  const showMoreItems = () => {
    const newOffset = gridOffset + currentStep.gridSize;
    if (newOffset < stepItems.length) {
      setGridOffset(newOffset);
    }
  };

  // Show previous items in grid
  const showPrevItems = () => {
    const newOffset = gridOffset - currentStep.gridSize;
    setGridOffset(Math.max(0, newOffset));
  };

  // Go to previous step
  const goToPrevStep = () => {
    if (phase === 'day-planning') {
      setPhase('favorites-library');
    } else if (phase === 'favorites-library') {
      setPhase('picking');
      setCurrentStepIndex(PLANNING_STEPS.length - 1); // Go back to last picking step
      setGridOffset(0);
    } else if (phase === 'route-planning') {
      setPhase('picking');
      setCurrentStepIndex(0); // Go back to cities step
      setGridOffset(0);
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setGridOffset(0);
    }
  };

  // Confirm route and proceed to hotels
  const confirmRoute = () => {
    // Update selectedCities to match the route order
    setSelectedCities([...routeOrder]);
    // Move to hotels step
    setCurrentStepIndex(1); // hotels is index 1
    setPhase('picking');
    // Load hotels for the cities in route order
    if (onSearchAI) {
      onSearchAI(`best hotels in ${routeOrder.join(', ')}`, 'hotels');
    }
  };

  // Move city up in route order
  const moveCityUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...routeOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setRouteOrder(newOrder);
  };

  // Move city down in route order
  const moveCityDown = (index: number) => {
    if (index >= routeOrder.length - 1) return;
    const newOrder = [...routeOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setRouteOrder(newOrder);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedCityIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedCityIndex === null || draggedCityIndex === index) return;

    // Reorder in real-time as user drags
    const newOrder = [...routeOrder];
    const [draggedCity] = newOrder.splice(draggedCityIndex, 1);
    newOrder.splice(index, 0, draggedCity);
    setRouteOrder(newOrder);
    setDraggedCityIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedCityIndex(null);
  };

  // Swap country order
  const swapCountryOrder = () => {
    setCountryOrder([...countryOrder].reverse());
    // Reorder cities based on new country order
    const citiesByCountry: Record<string, string[]> = {};
    destinations.forEach(dest => { citiesByCountry[dest] = []; });
    routeOrder.forEach(city => {
      const cityItem = items.find(i => i.name === city);
      const country = cityItem?.tags?.find(t => destinations.includes(t));
      if (country) {
        citiesByCountry[country].push(city);
      }
    });
    const newOrder = countryOrder.flatMap(country => citiesByCountry[country] || []);
    setRouteOrder(newOrder);
  };

  // Get country for a city
  const getCityCountry = (cityName: string): string | undefined => {
    const cityItem = items.find(i => i.name === cityName);
    return cityItem?.tags?.find(t => destinations.includes(t));
  };

  // Start day planning
  const startDayPlanning = () => {
    setPhase('day-planning');
  };

  // Request AI to load items
  const loadStepItems = () => {
    if (onSearchAI) {
      if (currentStep.id === 'cities') {
        // For cities, load from all destinations
        const query = destinations.length > 1
          ? `top cities to visit in ${destinations.join(' and ')}`
          : `top 10 cities to visit in ${destinations[0]}`;
        onSearchAI(query, 'cities');
      } else if (selectedCities.length > 0) {
        const citiesQuery = selectedCities.join(', ');
        onSearchAI(`best ${currentStep.id} in ${citiesQuery}`, currentStep.id);
      }
    }
  };

  // Check if item is a city
  const isCity = (item: PlanningItem) => item.tags?.includes('cities');

  // Item grid square component
  const ItemSquare = ({ item }: { item: PlanningItem }) => {
    const isSelected = selectedIds.has(item.id);
    const itemIsCity = isCity(item);

    return (
      <div className="relative aspect-square rounded-xl overflow-hidden group">
        {/* Main click area - opens modal */}
        <button
          onClick={() => {
            if (itemIsCity) {
              setCityDetailItem(item);
            } else {
              setDetailItem(item);
            }
          }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </button>

        {/* Rating (top-left) */}
        {item.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 pointer-events-none">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] text-white font-medium">{item.rating}</span>
          </div>
        )}

        {/* Heart button (bottom-right) - toggles selection */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleSelect(item.id, item.name);
          }}
          className={`absolute bottom-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-white scale-100'
              : 'bg-black/40 backdrop-blur-sm hover:bg-black/60 scale-90 group-hover:scale-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isSelected ? 'text-red-500 fill-red-500' : 'text-white'}`} />
        </button>

        {/* Name */}
        <div className="absolute bottom-0 left-0 right-10 p-2 pointer-events-none">
          <p className="text-xs font-semibold text-white line-clamp-2 leading-tight">
            {item.name}
          </p>
          {item.priceInfo && (
            <p className="text-[10px] text-white/70 mt-0.5">{item.priceInfo}</p>
          )}
        </div>
      </div>
    );
  };

  // Get favorites by category for library view
  const getFavoritesByCategory = () => {
    const byCategory: Record<string, PlanningItem[]> = {
      cities: [],
      hotels: [],
      restaurants: [],
      cafes: [],
      activities: [],
    };

    selectedItems.forEach(item => {
      if (item.tags?.includes('cities')) byCategory.cities.push(item);
      else if (item.tags?.includes('hotels') || item.category === 'hotels') byCategory.hotels.push(item);
      else if (item.tags?.includes('restaurants') || item.category === 'restaurants') byCategory.restaurants.push(item);
      else if (item.tags?.includes('cafes') || item.category === 'cafes') byCategory.cafes.push(item);
      else byCategory.activities.push(item);
    });

    return byCategory;
  };

  // ============ FAVORITES LIBRARY PHASE ============
  if (phase === 'favorites-library') {
    const favoritesByCategory = getFavoritesByCategory();

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Your Favorites</h2>
            <p className="text-sm text-muted-foreground">
              {selectedItems.length} items saved to your trip
            </p>
          </div>
        </div>

        {/* Favorites by category */}
        <div className="space-y-4">
          {/* Cities */}
          {favoritesByCategory.cities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-primary" />
                Cities ({favoritesByCategory.cities.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {favoritesByCategory.cities.map((item) => (
                  <div key={item.id} className="w-20 flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden mb-1">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium text-center line-clamp-1">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hotels */}
          {favoritesByCategory.hotels.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Hotel className="w-4 h-4 text-purple-500" />
                Hotels ({favoritesByCategory.hotels.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {favoritesByCategory.hotels.map((item) => (
                  <div key={item.id} className="w-20 flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden mb-1">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium text-center line-clamp-1">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Restaurants */}
          {favoritesByCategory.restaurants.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                Restaurants ({favoritesByCategory.restaurants.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {favoritesByCategory.restaurants.map((item) => (
                  <div key={item.id} className="w-20 flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden mb-1">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium text-center line-clamp-1">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cafes */}
          {favoritesByCategory.cafes.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Coffee className="w-4 h-4 text-amber-600" />
                Cafes ({favoritesByCategory.cafes.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {favoritesByCategory.cafes.map((item) => (
                  <div key={item.id} className="w-20 flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden mb-1">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium text-center line-clamp-1">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {favoritesByCategory.activities.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Ticket className="w-4 h-4 text-green-500" />
                Activities ({favoritesByCategory.activities.length})
              </h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {favoritesByCategory.activities.map((item) => (
                  <div key={item.id} className="w-20 flex-shrink-0">
                    <div className="w-20 h-20 rounded-xl overflow-hidden mb-1">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-medium text-center line-clamp-1">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Empty state */}
        {selectedItems.length === 0 && (
          <div className="py-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No favorites yet</p>
            <p className="text-xs text-muted-foreground mt-1">Go back and pick some items you love</p>
          </div>
        )}

        {/* Start Day Planning button */}
        {selectedItems.length > 0 && (
          <Button className="w-full" size="lg" onClick={startDayPlanning}>
            <Calendar className="w-4 h-4 mr-2" />
            Plan Your {duration} Days
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    );
  }

  // ============ ROUTE PLANNING PHASE ============
  if (phase === 'route-planning') {
    // Group cities by country
    const citiesByCountry: Record<string, { city: string; item?: PlanningItem }[]> = {};
    destinations.forEach(dest => { citiesByCountry[dest] = []; });
    routeOrder.forEach(city => {
      const cityItem = items.find(i => i.name === city && i.tags?.includes('cities'));
      const country = cityItem?.tags?.find(t => destinations.includes(t)) || destinations[0];
      if (!citiesByCountry[country]) citiesByCountry[country] = [];
      citiesByCountry[country].push({ city, item: cityItem });
    });

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Route className="w-5 h-5 text-primary" />
              Plan Your Route
            </h2>
            <p className="text-sm text-muted-foreground">
              Drag to reorder your travel path
            </p>
          </div>
        </div>

        {/* Country order selector (for multi-country trips) */}
        {destinations.length > 1 && (
          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Which country first?
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                {countryOrder.map((country, idx) => (
                  <div key={country} className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-background rounded-lg font-medium text-sm border">
                      {country}
                    </div>
                    {idx < countryOrder.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={swapCountryOrder}>
                Swap
              </Button>
            </div>
          </div>
        )}

        {/* Route visualization */}
        <div className="space-y-2">
          {routeOrder.map((city, index) => {
            const cityItem = items.find(i => i.name === city && i.tags?.includes('cities'));
            const country = getCityCountry(city);
            const isLastInCountry = index < routeOrder.length - 1 && getCityCountry(routeOrder[index + 1]) !== country;

            return (
              <div key={city}>
                {/* City card - Draggable */}
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 bg-background rounded-xl border cursor-grab active:cursor-grabbing transition-all ${
                    draggedCityIndex === index ? 'opacity-50 scale-95 shadow-lg' : ''
                  }`}
                >
                  {/* Drag handle */}
                  <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />

                  {/* Order number */}
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>

                  {/* City image */}
                  {cityItem?.imageUrl && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={cityItem.imageUrl} alt={city} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* City info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{city}</div>
                    {country && (
                      <div className="text-xs text-muted-foreground">{country}</div>
                    )}
                  </div>
                </div>

                {/* Connector line */}
                {index < routeOrder.length - 1 && (
                  <div className="flex items-center gap-2 py-1 pl-[1.25rem]">
                    <div className={`w-0.5 h-6 ${isLastInCountry ? 'bg-orange-400' : 'bg-muted-foreground/30'}`} />
                    <span className="text-xs text-muted-foreground">
                      {isLastInCountry ? (
                        <span className="flex items-center gap-1 text-orange-600">
                          <Plane className="w-3 h-3" />
                          Flight to {getCityCountry(routeOrder[index + 1])}
                        </span>
                      ) : (
                        '↓ Next stop'
                      )}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Route summary */}
        <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>
              {routeOrder.length} cities · {destinations.length > 1 ? `${destinations.length} countries` : destinations[0]}
            </span>
          </div>
        </div>

        {/* Confirm button */}
        <Button className="w-full" size="lg" onClick={confirmRoute}>
          <Check className="w-4 h-4 mr-2" />
          Confirm Route & Find Hotels
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  // ============ DAY PLANNING PHASE ============
  if (phase === 'day-planning') {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Plan Your Days</h2>
            <p className="text-sm text-muted-foreground">
              Drag your picks to each day
            </p>
          </div>
        </div>

        {/* Unassigned items pool */}
        {unassignedItems.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              Your Picks ({unassignedItems.length} to assign)
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {unassignedItems.map((item) => (
                <div
                  key={item.id}
                  className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 relative cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('itemId', item.id);
                  }}
                >
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                  <GripVertical className="absolute top-1 right-1 w-3 h-3 text-white/70" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day timeline (Trip.com style) */}
        <div className="space-y-3">
          {Array.from({ length: duration }, (_, dayIndex) => {
            const colors = getDayColors(dayIndex);
            const dayItems = getDayItems(dayIndex);
            const isExpanded = expandedDay === dayIndex;

            return (
              <div
                key={dayIndex}
                className={`rounded-xl border-2 transition-all ${
                  isExpanded ? `${colors.border} ${colors.light}` : 'border-muted'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const itemId = e.dataTransfer.getData('itemId');
                  if (itemId) addToDay(itemId, dayIndex);
                }}
              >
                {/* Day header */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? -1 : dayIndex)}
                  className="w-full flex items-center gap-3 p-3"
                >
                  <div className={`w-8 h-8 rounded-full ${colors.dot} flex items-center justify-center text-white font-bold text-sm`}>
                    {dayIndex + 1}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm">Day {dayIndex + 1}</div>
                    <div className="text-xs text-muted-foreground">
                      {dayItems.length > 0
                        ? `${dayItems.length} activities`
                        : 'Drop activities here'}
                    </div>
                  </div>
                  {dayItems.length > 0 && (
                    <div className="flex -space-x-2">
                      {dayItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="w-8 h-8 rounded-full overflow-hidden border-2 border-background">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                          +{dayItems.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                {/* Expanded day timeline */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 space-y-0">
                    {dayItems.length === 0 ? (
                      <div className={`text-center py-6 rounded-lg border-2 border-dashed ${colors.border}`}>
                        <p className="text-sm text-muted-foreground">
                          Drag activities here
                        </p>
                      </div>
                    ) : (
                      dayItems.map((item, index) => (
                        <div key={item.id}>
                          {/* Activity card */}
                          <div className="flex gap-3">
                            {/* Timeline */}
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${colors.dot} ring-4 ring-background z-10`} />
                              {index < dayItems.length - 1 && (
                                <div className={`w-0.5 flex-1 ${colors.dot} opacity-30`} />
                              )}
                            </div>

                            {/* Card */}
                            <div className="flex-1 mb-2 p-3 rounded-xl bg-background border shadow-sm">
                              <div className="flex gap-3">
                                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                                  {item.duration && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {item.duration} min
                                    </p>
                                  )}
                                  {item.priceInfo && (
                                    <p className="text-xs mt-0.5">
                                      <span className="bg-muted px-1.5 py-0.5 rounded">{item.priceInfo}</span>
                                    </p>
                                  )}
                                </div>
                                {!isTripLocked && (
                                  <button
                                    onClick={() => removeFromDay(item.id)}
                                    className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Travel time connector */}
                          {index < dayItems.length - 1 && (
                            <div className="flex gap-3 py-0.5">
                              <div className="flex flex-col items-center w-3">
                                <div className={`w-0.5 h-6 ${colors.dot} opacity-30`} />
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Footprints className="w-3 h-3" />
                                <span>~10 min walk</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Complete button */}
        {unassignedItems.length === 0 && selectedItems.length > 0 && (
          <Button className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Complete Planning
          </Button>
        )}
      </div>
    );
  }

  // Helper to format TripDNA values for display
  const formatPartyType = (type: string) => {
    const labels: Record<string, string> = {
      solo: 'Solo', couple: 'Couple', family: 'Family', friends: 'Friends'
    };
    return labels[type] || type;
  };

  const formatPace = (pace: string) => {
    const labels: Record<string, string> = {
      relaxed: 'Relaxed', balanced: 'Balanced', fast: 'Action-packed'
    };
    return labels[pace] || pace;
  };

  const formatIdentity = (id: string) => {
    return id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // ============ PICKING PHASE ============
  return (
    <div className="space-y-2">
      {/* Step title row: "Pick your cities" with back button and heart count */}
      <div className="flex items-center gap-2">
        {currentStepIndex > 0 && (
          <Button variant="ghost" size="sm" className="p-1 h-7 w-7" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <h2 className="text-base font-bold flex-1">{currentStep.title}</h2>

        {/* Favs count - fixed position right side */}
        <div className="flex items-center gap-1 min-w-[40px] justify-end">
          {selectedItems.length > 0 && (
            <>
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span className="text-sm font-medium">{selectedItems.length}</span>
            </>
          )}
        </div>
      </div>

      {/* Destination filter tabs (for cities step with multiple countries) */}
      {currentStep.id === 'cities' && destinations.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {destinations.map((dest) => {
            // Count selected cities for this country
            const countrySelectedCount = selectedCities.filter(city => {
              const cityCountry = getCityCountry(city);
              return cityCountry === dest;
            }).length;

            return (
              <button
                key={dest}
                onClick={() => { setActiveDestinationFilter(dest); setGridOffset(0); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                  activeDestinationFilter === dest
                    ? 'bg-primary text-primary-foreground'
                    : countrySelectedCount === 0
                      ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                {dest}
                {countrySelectedCount > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeDestinationFilter === dest
                      ? 'bg-white/20'
                      : 'bg-primary/20 text-primary'
                  }`}>
                    {countrySelectedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Multi-country reminder - show if some countries have no cities selected */}
      {currentStep.id === 'cities' && destinations.length > 1 && selectedCities.length > 0 && (() => {
        const countriesWithoutCities = destinations.filter(dest => {
          const hasCity = selectedCities.some(city => getCityCountry(city) === dest);
          return !hasCity;
        });
        if (countriesWithoutCities.length > 0) {
          return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Don&apos;t forget to pick cities in {countriesWithoutCities.join(', ')}
              </span>
            </div>
          );
        }
        return null;
      })()}

      {/* Selected cities reminder (for non-cities steps) */}
      {currentStep.id !== 'cities' && selectedCities.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{selectedCities.join(', ')}</span>
        </div>
      )}

      {/* Top Picks for You - only show on cities step with items */}
      {currentStep.id === 'cities' && stepItems.length > 3 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Top Picks for You</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {stepItems
              .map(item => ({
                item,
                score: getCityMatchScore(getCityInfo(item.name), tripDna)
              }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map(({ item }) => {
                const isSelected = selectedIds.has(item.id);
                const cityInfo = getCityInfo(item.name);
                const recommendation = getPersonalizedRecommendation(cityInfo, tripDna);
                return (
                  <div
                    key={`top-${item.id}`}
                    className="flex-shrink-0 w-[140px] rounded-xl overflow-hidden border bg-card cursor-pointer hover:border-primary/30 transition-all"
                    onClick={() => setCityDetailItem(item)}
                  >
                    <div className="relative h-20">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        recommendation.match === 'great' ? 'bg-green-500 text-white' :
                        recommendation.match === 'mixed' ? 'bg-amber-500 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {recommendation.match === 'great' ? 'Great' : recommendation.match === 'mixed' ? 'Mixed' : 'Good'}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(item.id, item.name);
                        }}
                        className={`absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-white' : 'bg-black/40 backdrop-blur-sm'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isSelected ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                      </button>
                    </div>
                    <div className="p-2">
                      <div className="font-semibold text-sm truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{cityInfo.bestFor.slice(0, 2).join(' · ')}</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Items grid (3x3 = 9 squares) */}
      {stepItems.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {stepItems.slice(gridOffset, gridOffset + currentStep.gridSize).map((item) => (
            <ItemSquare key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm font-medium mb-2">Loading recommendations...</p>
          <p className="text-xs text-muted-foreground mb-4">
            Claude is finding the best {currentStep.title.toLowerCase()}
          </p>
          <Button variant="outline" size="sm" onClick={loadStepItems}>
            <Sparkles className="w-4 h-4 mr-2" />
            Load with AI
          </Button>
        </div>
      )}

      {/* Pagination controls */}
      {stepItems.length > currentStep.gridSize && (
        <div className="flex items-center justify-center gap-2">
          {gridOffset > 0 && (
            <Button variant="ghost" size="sm" onClick={showPrevItems} className="text-xs">
              <ChevronLeft className="w-3 h-3 mr-1" />
              Previous
            </Button>
          )}
          <span className="text-xs text-muted-foreground">
            {Math.floor(gridOffset / currentStep.gridSize) + 1} / {Math.ceil(stepItems.length / currentStep.gridSize)}
          </span>
          {gridOffset + currentStep.gridSize < stepItems.length && (
            <Button variant="ghost" size="sm" onClick={showMoreItems} className="text-xs">
              More
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Continue button - shows what's next */}
      {selectedIds.size > 0 && stepItems.length > 0 && (
        <Button className="w-full" onClick={goToNextStep}>
          {currentStepIndex === PLANNING_STEPS.length - 1 ? (
            <>
              Plan Your Days
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : currentStep.id === 'cities' ? (
            <>
              <Route className="w-4 h-4 mr-2" />
              Plan your route
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : currentStep.id === 'hotels' ? (
            <>
              Best restaurants in {selectedCities.length > 0 ? selectedCities[0] : 'your cities'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : currentStep.id === 'restaurants' ? (
            <>
              Things to do & activities
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next: {PLANNING_STEPS[currentStepIndex + 1]?.title || 'Continue'}
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      )}

      {/* Item detail modal */}
      <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
        <DialogContent className="max-w-sm">
          {detailItem && (
            <>
              <div className="relative w-full h-48 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-lg">
                <img src={detailItem.imageUrl} alt={detailItem.name} className="w-full h-full object-cover" />
                {detailItem.rating && (
                  <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs text-white font-medium">{detailItem.rating}</span>
                  </div>
                )}
              </div>

              <DialogHeader>
                <DialogTitle className="flex items-start justify-between gap-2">
                  <span>{detailItem.name}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      selectedIds.has(detailItem.id) ? 'bg-green-500 text-white' : 'bg-muted'
                    }`}
                  >
                    {selectedIds.has(detailItem.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                {detailItem.neighborhood && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {detailItem.neighborhood}
                  </p>
                )}

                {detailItem.priceInfo && (
                  <p className="text-sm flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    {detailItem.priceInfo}
                  </p>
                )}

                {detailItem.hours && (
                  <p className="text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    {detailItem.hours}
                  </p>
                )}

                <p className="text-sm text-muted-foreground">{detailItem.description}</p>

                {detailItem.tips && detailItem.tips.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-amber-800 mb-1">Tips</h4>
                    <ul className="text-xs text-amber-700 space-y-1">
                      {detailItem.tips.map((tip, i) => (
                        <li key={i}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {detailItem.tags && detailItem.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {detailItem.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button
                  className="w-full"
                  variant={selectedIds.has(detailItem.id) ? 'outline' : 'default'}
                  onClick={() => {
                    toggleSelect(detailItem.id, detailItem.name);
                    setDetailItem(null);
                  }}
                >
                  {selectedIds.has(detailItem.id) ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Selected
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Trip
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* City Detail Modal */}
      <Dialog open={!!cityDetailItem} onOpenChange={() => { setCityDetailItem(null); setCityImageIndex(0); setHighlightTab('photos'); }}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 [&>button]:hidden">
          {cityDetailItem && (() => {
            const cityInfo = getCityInfo(cityDetailItem.name);
            const isSelected = selectedIds.has(cityDetailItem.id);
            const cityName = cityDetailItem.name.toLowerCase().replace(/\s+/g, '');
            const recommendation = getPersonalizedRecommendation(cityInfo, tripDna);

            // Create image slides: city overview + top sites (using real Unsplash images)
            const country = destinations.length > 0 ? destinations[0] : undefined;
            const imageSlides = [
              { label: cityDetailItem.name, url: getCityImage(cityDetailItem.name, country) },
              ...cityInfo.topSites.slice(0, 4).map((site) => ({
                label: site,
                url: getSiteImage(site)
              }))
            ];

            // Touch swipe handlers
            let touchStartX = 0;
            const handleTouchStart = (e: React.TouchEvent) => {
              touchStartX = e.touches[0].clientX;
            };
            const handleTouchEnd = (e: React.TouchEvent) => {
              const touchEndX = e.changedTouches[0].clientX;
              const diff = touchStartX - touchEndX;
              if (Math.abs(diff) > 50) {
                if (diff > 0 && cityImageIndex < imageSlides.length - 1) {
                  setCityImageIndex(i => i + 1);
                } else if (diff < 0 && cityImageIndex > 0) {
                  setCityImageIndex(i => i - 1);
                }
              }
            };

            return (
              <div className="overflow-hidden rounded-lg">
                {/* Clean image slider - no text overlay */}
                <div
                  className="relative h-56 sm:h-64"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={imageSlides[cityImageIndex].url}
                    alt={imageSlides[cityImageIndex].label}
                    className="w-full h-full object-cover"
                  />

                  {/* Close button - top right */}
                  <button
                    onClick={() => { setCityDetailItem(null); setCityImageIndex(0); }}
                    className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Navigation arrows */}
                  {cityImageIndex > 0 && (
                    <button
                      onClick={() => setCityImageIndex(i => i - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  {cityImageIndex < imageSlides.length - 1 && (
                    <button
                      onClick={() => setCityImageIndex(i => i + 1)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Dot indicators */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {imageSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCityImageIndex(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === cityImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Heart button - bottom right */}
                  <button
                    onClick={() => toggleSelect(cityDetailItem.id, cityDetailItem.name)}
                    className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                      isSelected ? 'bg-white' : 'bg-black/40 backdrop-blur-sm hover:bg-black/60'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isSelected ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                  </button>
                </div>

                <div className="p-4 space-y-3">
                  {/* City name and match indicator */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{cityDetailItem.name}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {cityInfo.crowdLevel} crowds · {cityInfo.avgDays}
                      </p>
                    </div>
                    {/* Match badge */}
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      recommendation.match === 'great' ? 'bg-green-100 text-green-700' :
                      recommendation.match === 'mixed' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {recommendation.match === 'great' ? 'Great Match' :
                       recommendation.match === 'mixed' ? 'Mixed Fit' : 'Good Choice'}
                    </div>
                  </div>

                  {/* Famous for - prominent section */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3">
                    <div className="text-xs font-semibold text-primary mb-1">Famous for</div>
                    <p className="text-sm font-medium">{cityInfo.bestFor.join(' · ')}</p>
                  </div>

                  {/* Personalized recommendation */}
                  {recommendation.reasons.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                        <Heart className="w-4 h-4" />
                        Why you will love it
                      </div>
                      {recommendation.reasons.map((reason, i) => (
                        <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-green-500 mt-0.5">+</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Concerns based on preferences */}
                  {recommendation.concerns.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-amber-600 flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        Watch out for
                      </div>
                      {recommendation.concerns.map((concern, i) => (
                        <div key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">!</span>
                          <span>{concern}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Best time */}
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                    Best time: <span className="text-foreground font-medium">{cityInfo.bestTime}</span>
                  </p>

                  {/* Ideal For - who should visit */}
                  {cityInfo.idealFor && cityInfo.idealFor.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-muted-foreground mb-1.5">Perfect for</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {cityInfo.idealFor.map((type) => (
                          <span key={type} className="text-xs bg-background px-2 py-1 rounded-full border">
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Categorized Highlights - Tabbed */}
                  {cityInfo.highlights && (
                    <div className="space-y-3">
                      {/* Tab Buttons */}
                      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                        {[
                          { id: 'photos', icon: Image, label: 'Photos', color: 'text-blue-600' },
                          ...(cityInfo.highlights.landmarks?.length ? [{ id: 'landmarks', icon: Landmark, label: 'Landmarks', color: 'text-amber-600' }] : []),
                          ...(cityInfo.highlights.history?.length ? [{ id: 'history', icon: ScrollText, label: 'History', color: 'text-orange-600' }] : []),
                          ...(cityInfo.highlights.museums?.length ? [{ id: 'museums', icon: Building, label: 'Museums', color: 'text-purple-600' }] : []),
                          ...(cityInfo.highlights.markets?.length ? [{ id: 'markets', icon: ShoppingBag, label: 'Markets', color: 'text-green-600' }] : []),
                          ...(cityInfo.highlights.food?.length ? [{ id: 'food', icon: Utensils, label: 'Food', color: 'text-red-500' }] : []),
                          ...(cityInfo.highlights.nature?.length ? [{ id: 'nature', icon: TreePine, label: 'Nature', color: 'text-emerald-600' }] : []),
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            onClick={() => setHighlightTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full whitespace-nowrap transition-colors ${
                              highlightTab === tab.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            <tab.icon className={`w-3.5 h-3.5 ${highlightTab === tab.id ? '' : tab.color}`} />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div className="border rounded-lg p-3 min-h-[200px]">
                        {/* Photos Tab */}
                        {highlightTab === 'photos' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                              {cityInfo.topSites.slice(0, 4).map((site, idx) => (
                                <div
                                  key={site}
                                  className="aspect-video bg-muted rounded-lg flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                                  onClick={() => setCityImageIndex(idx + 1)}
                                >
                                  <div className="text-center p-2">
                                    <Image className="w-6 h-6 mx-auto text-muted-foreground mb-1" />
                                    <span className="text-xs text-muted-foreground">{site}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                              Tap a photo to view in full screen
                            </p>
                          </div>
                        )}

                        {/* Landmarks Tab */}
                        {highlightTab === 'landmarks' && cityInfo.highlights.landmarks && (
                          <div className="space-y-3">
                            {cityInfo.highlights.landmarks.map((item) => (
                              <div key={item.name} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                <p className="text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* History Tab */}
                        {highlightTab === 'history' && cityInfo.highlights.history && (
                          <div className="space-y-3">
                            {cityInfo.highlights.history.map((item) => (
                              <div key={item.name} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                <p className="text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Museums Tab */}
                        {highlightTab === 'museums' && cityInfo.highlights.museums && (
                          <div className="space-y-3">
                            {cityInfo.highlights.museums.map((item) => (
                              <div key={item.name} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                <p className="text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Markets Tab */}
                        {highlightTab === 'markets' && cityInfo.highlights.markets && (
                          <div className="space-y-3">
                            {cityInfo.highlights.markets.map((item) => (
                              <div key={item.name} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                <p className="text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Food Tab */}
                        {highlightTab === 'food' && cityInfo.highlights.food && (
                          <div className="space-y-3">
                            {cityInfo.highlights.food.map((item) => (
                              <div key={item.name} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                <p className="text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Nature Tab */}
                        {highlightTab === 'nature' && cityInfo.highlights.nature && (
                          <div className="space-y-3">
                            {cityInfo.highlights.nature.map((item) => (
                              <div key={item.name} className="text-sm">
                                <span className="font-medium">{item.name}</span>
                                <p className="text-muted-foreground mt-0.5">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Top Sites list - only show if no highlights */}
                  {!cityInfo.highlights && (
                    <div>
                      <div className="text-sm font-semibold mb-1.5">Must-See Sites</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {cityInfo.topSites.map((site, idx) => (
                          <button
                            key={site}
                            onClick={() => setCityImageIndex(idx + 1)}
                            className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                              cityImageIndex === idx + 1
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                            }`}
                          >
                            {site}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Local tip */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-amber-700 mb-0.5">Local Tip</div>
                      <p className="text-sm text-amber-800">{cityInfo.localTip}</p>
                    </div>
                  </div>

                  {/* Action button */}
                  <Button
                    className="w-full"
                    size="sm"
                    variant={isSelected ? 'outline' : 'default'}
                    onClick={() => {
                      toggleSelect(cityDetailItem.id, cityDetailItem.name);
                      setCityDetailItem(null);
                      setCityImageIndex(0);
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Added to Trip
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Trip
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
