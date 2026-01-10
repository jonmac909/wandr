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

// City information database for rich detail modals
interface CityInfo {
  bestFor: string[];
  crowdLevel: 'Low' | 'Moderate' | 'High' | 'Very High';
  bestTime: string;
  topSites: string[];
  localTip: string;
  avgDays: string;
  pros: string[];
  cons: string[];
}

const CITY_INFO: Record<string, CityInfo> = {
  // Turkey
  'Istanbul': { bestFor: ['History', 'Culture', 'Food'], crowdLevel: 'High', bestTime: 'Apr-May, Sep-Oct', topSites: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar', 'Topkapi Palace'], localTip: 'Take a Bosphorus ferry at sunset for stunning views', avgDays: '3-4 days', pros: ['Incredible history spanning millennia', 'Amazing food scene', 'Great value for money'], cons: ['Can be overwhelming for first-timers', 'Traffic congestion', 'Persistent street vendors'] },
  'Cappadocia': { bestFor: ['Nature', 'Adventure', 'Photography'], crowdLevel: 'Moderate', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Hot Air Balloon Rides', 'Göreme Open Air Museum', 'Underground Cities', 'Fairy Chimneys'], localTip: 'Book balloon rides weeks in advance, especially for sunrise flights', avgDays: '2-3 days', pros: ['Otherworldly landscapes', 'Unique cave hotels', 'Bucket-list balloon rides'], cons: ['Balloon flights often cancelled due to weather', 'Limited nightlife', 'Remote location'] },
  'Antalya': { bestFor: ['Beach', 'History', 'Relaxation'], crowdLevel: 'Moderate', bestTime: 'May-Jun, Sep-Oct', topSites: ['Kaleiçi Old Town', 'Düden Waterfalls', 'Aspendos Theater', 'Konyaaltı Beach'], localTip: 'Visit Perge and Aspendos ancient ruins nearby', avgDays: '2-3 days', pros: ['Beautiful beaches', 'Ancient ruins nearby', 'Good weather most of year'], cons: ['Very touristy in summer', 'Resort-heavy areas', 'Can feel commercialized'] },
  'Ephesus': { bestFor: ['History', 'Architecture'], crowdLevel: 'High', bestTime: 'Mar-May, Sep-Nov', topSites: ['Library of Celsus', 'Temple of Artemis', 'Terrace Houses', 'Great Theatre'], localTip: 'Arrive early morning to beat tour groups, enter from upper gate', avgDays: '1 day', pros: ['Best-preserved ancient city', 'UNESCO World Heritage', 'Fascinating history'], cons: ['Cruise ship crowds', 'Very hot in summer', 'Not much else nearby'] },
  'Pamukkale': { bestFor: ['Nature', 'Relaxation'], crowdLevel: 'Moderate', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Travertine Terraces', 'Hierapolis Ancient City', 'Cleopatra Pool', 'Necropolis'], localTip: 'Visit at sunset when the terraces glow pink and gold', avgDays: '1-2 days', pros: ['Unique natural wonder', 'Ancient spa experience', 'Great photo opportunities'], cons: ['Terraces can be slippery', 'Remote location', 'Limited accommodation options'] },
  // Switzerland
  'Zurich': { bestFor: ['Culture', 'Shopping', 'Food'], crowdLevel: 'Moderate', bestTime: 'Jun-Sep', topSites: ['Old Town (Altstadt)', 'Lake Zurich', 'Kunsthaus', 'Bahnhofstrasse'], localTip: 'Take the free bikes from Züri rollt stations to explore', avgDays: '1-2 days', pros: ['Clean and efficient', 'Beautiful lake setting', 'Excellent public transport'], cons: ['Very expensive', 'Can feel sterile', 'Not as charming as other Swiss cities'] },
  'Lucerne': { bestFor: ['Scenery', 'Culture', 'Nature'], crowdLevel: 'Moderate', bestTime: 'May-Sep', topSites: ['Chapel Bridge', 'Mt. Pilatus', 'Lake Lucerne', 'Lion Monument'], localTip: 'Take the Golden Round Trip combining boat, cogwheel train, and cable car', avgDays: '2-3 days', pros: ['Stunning mountain views', 'Charming old town', 'Gateway to Swiss Alps'], cons: ['Crowded in peak season', 'Expensive mountain excursions', 'Weather dependent'] },
  'Interlaken': { bestFor: ['Adventure', 'Nature', 'Photography'], crowdLevel: 'High', bestTime: 'Jun-Sep', topSites: ['Jungfraujoch', 'Harder Kulm', 'Paragliding', 'Lake Thun'], localTip: 'Get the Jungfrau Travel Pass for unlimited transport in the region', avgDays: '2-3 days', pros: ['Adventure sports capital', 'Stunning alpine scenery', 'Excellent hiking'], cons: ['Very touristy', 'Extremely expensive', 'Town itself is unremarkable'] },
  'Zermatt': { bestFor: ['Skiing', 'Hiking', 'Photography'], crowdLevel: 'Moderate', bestTime: 'Dec-Apr (ski), Jul-Sep (hike)', topSites: ['Matterhorn', 'Gornergrat', '5 Lakes Walk', 'Glacier Paradise'], localTip: 'The town is car-free - arrive by train for the full experience', avgDays: '2-3 days', pros: ['Iconic Matterhorn views', 'Car-free village', 'Year-round skiing'], cons: ['Very expensive', 'Remote access', 'Matterhorn often hidden in clouds'] },
  'Geneva': { bestFor: ['Culture', 'Luxury', 'Food'], crowdLevel: 'Moderate', bestTime: 'May-Sep', topSites: ['Jet d\'Eau', 'Old Town', 'CERN', 'Lake Geneva'], localTip: 'Free public transport with your hotel stay - ask for the Geneva Transport Card', avgDays: '1-2 days', pros: ['International atmosphere', 'Beautiful lake', 'Excellent museums'], cons: ['Very expensive', 'Can feel corporate', 'French-speaking (language barrier)'] },
  // Spain
  'Barcelona': { bestFor: ['Architecture', 'Beach', 'Nightlife'], crowdLevel: 'Very High', bestTime: 'May-Jun, Sep-Oct', topSites: ['Sagrada Familia', 'Park Güell', 'La Rambla', 'Gothic Quarter'], localTip: 'Book Sagrada Familia tickets online weeks ahead', avgDays: '3-4 days', pros: ['Unique Gaudí architecture', 'Beach and city combined', 'Vibrant nightlife'], cons: ['Extremely crowded', 'Pickpockets on La Rambla', 'Overtourism concerns'] },
  'Madrid': { bestFor: ['Art', 'Food', 'Nightlife'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Nov', topSites: ['Prado Museum', 'Royal Palace', 'Retiro Park', 'Plaza Mayor'], localTip: 'Dinner starts at 9-10pm - embrace the late Spanish schedule', avgDays: '2-3 days', pros: ['World-class art museums', 'Fantastic food scene', 'Less touristy than Barcelona'], cons: ['Hot summers', 'Late schedule takes adjustment', 'No beach'] },
  'Seville': { bestFor: ['History', 'Architecture', 'Flamenco'], crowdLevel: 'Moderate', bestTime: 'Mar-May, Sep-Nov', topSites: ['Alcázar', 'Cathedral & Giralda', 'Plaza de España', 'Triana'], localTip: 'Visit during Feria de Abril for the ultimate Seville experience', avgDays: '2-3 days', pros: ['Authentic flamenco culture', 'Stunning Moorish architecture', 'Great tapas'], cons: ['Extremely hot in summer', 'Siesta shuts everything down', 'Can be humid'] },
  'Granada': { bestFor: ['History', 'Architecture', 'Food'], crowdLevel: 'Moderate', bestTime: 'Mar-May, Sep-Nov', topSites: ['Alhambra', 'Albaicín', 'Sacromonte', 'Granada Cathedral'], localTip: 'Tapas are free with drinks - bar hop through Albaicín', avgDays: '2-3 days', pros: ['Alhambra is breathtaking', 'Free tapas culture', 'Affordable'], cons: ['Alhambra tickets sell out fast', 'Steep hills to climb', 'Limited beach access'] },
  // Italy
  'Rome': { bestFor: ['History', 'Art', 'Food'], crowdLevel: 'Very High', bestTime: 'Apr-May, Sep-Oct', topSites: ['Colosseum', 'Vatican Museums', 'Trevi Fountain', 'Roman Forum'], localTip: 'Book skip-the-line tickets for Vatican and Colosseum', avgDays: '3-4 days', pros: ['2,500+ years of history', 'Incredible food everywhere', 'Art at every corner'], cons: ['Overwhelming crowds', 'Tourist traps near attractions', 'Hot and chaotic in summer'] },
  'Florence': { bestFor: ['Art', 'Architecture', 'Food'], crowdLevel: 'High', bestTime: 'Apr-Jun, Sep-Oct', topSites: ['Uffizi Gallery', 'Duomo', 'Ponte Vecchio', 'Accademia'], localTip: 'Climb the Duomo dome at sunset for magical views', avgDays: '2-3 days', pros: ['Renaissance art capital', 'Walkable historic center', 'Tuscan food and wine'], cons: ['Very crowded', 'Expensive near center', 'Can feel like a museum'] },
  'Venice': { bestFor: ['Romance', 'Art', 'Architecture'], crowdLevel: 'Very High', bestTime: 'Mar-May, Sep-Nov', topSites: ['St. Mark\'s Basilica', 'Grand Canal', 'Rialto Bridge', 'Doge\'s Palace'], localTip: 'Get lost in Dorsoduro for authentic local experience away from crowds', avgDays: '2-3 days', pros: ['Truly unique city', 'Romantic atmosphere', 'No cars'], cons: ['Extremely crowded', 'Very expensive', 'Flooding risk (acqua alta)'] },
  'Amalfi Coast': { bestFor: ['Scenery', 'Beach', 'Food'], crowdLevel: 'High', bestTime: 'May-Jun, Sep', topSites: ['Positano', 'Ravello', 'Amalfi', 'Path of the Gods'], localTip: 'Take SITA buses - much cheaper than taxis on the winding roads', avgDays: '3-4 days', pros: ['Stunning coastal scenery', 'Charming villages', 'Excellent seafood'], cons: ['Narrow winding roads', 'Very crowded in summer', 'Expensive accommodations'] },
  // Default fallback
  '_default': { bestFor: ['Exploration'], crowdLevel: 'Moderate', bestTime: 'Varies by season', topSites: ['Local landmarks', 'City center', 'Markets', 'Museums'], localTip: 'Ask locals for their favorite hidden spots', avgDays: '2-3 days', pros: ['New discoveries await', 'Authentic experiences', 'Off the beaten path'], cons: ['Less tourist infrastructure', 'Language barriers possible', 'Less online info available'] },
};

function getCityInfo(cityName: string): CityInfo {
  return CITY_INFO[cityName] || CITY_INFO['_default'];
}

// Planning flow steps
const PLANNING_STEPS: CategoryStep[] = [
  {
    id: 'cities',
    title: 'Pick your cities',
    subtitle: 'Which cities do you want to explore?',
    icon: Building2,
    gridSize: 9,
  },
  {
    id: 'experiences',
    title: 'Must-do experiences',
    subtitle: 'Activities and attractions for your trip',
    icon: Ticket,
    gridSize: 9,
  },
  {
    id: 'hotels',
    title: 'Where to stay',
    subtitle: 'Hotels matching your style',
    icon: Hotel,
    gridSize: 6,
  },
  {
    id: 'restaurants',
    title: 'Where to eat',
    subtitle: 'Top restaurants and local spots',
    icon: UtensilsCrossed,
    gridSize: 9,
  },
  {
    id: 'cafes',
    title: 'Coffee & Cafes',
    subtitle: 'Best cafes and coffee spots',
    icon: Coffee,
    gridSize: 6,
  },
];

type PlanningPhase = 'picking' | 'favorites-library' | 'day-planning';

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
  const [activeDestinationFilter, setActiveDestinationFilter] = useState<string>('all');
  const [cityDetailItem, setCityDetailItem] = useState<PlanningItem | null>(null);
  const [cityImageIndex, setCityImageIndex] = useState(0);
  const [gridOffset, setGridOffset] = useState(0); // For "more options" pagination

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
    const dests: string[] = [];
    if (tripDna.interests.destinations && tripDna.interests.destinations.length > 0) {
      dests.push(...tripDna.interests.destinations);
    } else if (tripDna.interests.destination) {
      dests.push(tripDna.interests.destination);
    }
    return dests.length > 0 ? dests : ['Your destination'];
  }, [tripDna.interests.destinations, tripDna.interests.destination]);

  const currentStep = PLANNING_STEPS[currentStepIndex];

  // Get items for current step/category
  const getStepItems = (stepId: string) => {
    return items.filter((item) => item.tags?.includes(stepId));
  };

  const allStepItems = getStepItems(currentStep.id);

  // Filter by active destination when viewing cities
  const stepItems = useMemo(() => {
    if (currentStep.id !== 'cities' || activeDestinationFilter === 'all') {
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
    if (currentStepIndex < PLANNING_STEPS.length - 1) {
      const nextStep = PLANNING_STEPS[currentStepIndex + 1];
      if (onSearchAI && selectedCities.length > 0) {
        const citiesQuery = selectedCities.join(', ');
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
    } else if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setGridOffset(0);
    }
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
    <div className="space-y-3">
      {/* Compact step header with back button */}
      <div className="flex items-center gap-2">
        {currentStepIndex > 0 && (
          <Button variant="ghost" size="sm" className="p-1 h-8 w-8" onClick={goToPrevStep}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex items-center gap-2 flex-1">
          <currentStep.icon className="w-5 h-5 text-primary" />
          <div>
            <h2 className="text-base font-bold">{currentStep.title}</h2>
            <p className="text-xs text-muted-foreground">{currentStep.subtitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
      </div>

      {/* Labeled progress bar */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
        {PLANNING_STEPS.map((step, index) => {
          const StepIcon = step.icon;
          const isComplete = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (index < currentStepIndex) {
                    setCurrentStepIndex(index);
                    setGridOffset(0);
                  }
                }}
                disabled={index > currentStepIndex}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground'
                    : isComplete
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <StepIcon className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">{step.id === 'cities' ? 'Cities' : step.id === 'experiences' ? 'Activities' : step.id.charAt(0).toUpperCase() + step.id.slice(1)}</span>
              </button>
              {index < PLANNING_STEPS.length - 1 && (
                <ChevronRight className={`w-3 h-3 mx-0.5 flex-shrink-0 ${isComplete ? 'text-green-500' : 'text-muted-foreground'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Your picks - fixed height inline display, doesn't expand/move page */}
      <div className="h-10 flex items-center gap-2">
        {selectedItems.length > 0 ? (
          <>
            <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 flex-shrink-0" />
            <span className="text-xs font-medium flex-shrink-0">Your picks:</span>
            <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
              {selectedItems.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-pink-200"
                >
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                </div>
              ))}
              {selectedItems.length > 8 && (
                <span className="text-xs text-muted-foreground self-center ml-1">+{selectedItems.length - 8}</span>
              )}
            </div>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Tap hearts to add picks</span>
        )}
      </div>

      {/* Destination filter tabs (for multiple destinations) */}
      {currentStep.id === 'cities' && destinations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => { setActiveDestinationFilter('all'); setGridOffset(0); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeDestinationFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            All ({allStepItems.length})
          </button>
          {destinations.map((dest) => {
            const destCount = allStepItems.filter(item => item.tags?.includes(dest)).length;
            return (
              <button
                key={dest}
                onClick={() => { setActiveDestinationFilter(dest); setGridOffset(0); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeDestinationFilter === dest
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <MapPin className="w-3 h-3" />
                {dest} ({destCount})
              </button>
            );
          })}
        </div>
      )}

      {/* Selected cities reminder (for non-cities steps) */}
      {currentStep.id !== 'cities' && selectedCities.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          <MapPin className="w-4 h-4" />
          <span>For: {selectedCities.join(', ')}</span>
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

      {/* Continue button */}
      {selectedIds.size > 0 && stepItems.length > 0 && (
        <Button className="w-full" onClick={goToNextStep}>
          {currentStepIndex === PLANNING_STEPS.length - 1 ? (
            <>
              Plan Your Days
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Continue with {selectedIds.size} {currentStep.id}
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
      <Dialog open={!!cityDetailItem} onOpenChange={() => { setCityDetailItem(null); setCityImageIndex(0); }}>
        <DialogContent className="max-w-md sm:max-w-lg p-0 gap-0 [&>button]:hidden">
          {cityDetailItem && (() => {
            const cityInfo = getCityInfo(cityDetailItem.name);
            const isSelected = selectedIds.has(cityDetailItem.id);
            const cityName = cityDetailItem.name.toLowerCase().replace(/\s+/g, '');

            // Create image slides: city overview + top sites (using real Unsplash images)
            const imageSlides = [
              { label: cityDetailItem.name, url: getCityImage(cityDetailItem.name) },
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
                  {/* City name and meta */}
                  <div>
                    <h2 className="text-xl font-bold">{cityDetailItem.name}</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {cityInfo.crowdLevel} crowds · {cityInfo.avgDays}
                    </p>
                  </div>

                  {/* Best time - separate line */}
                  <p className="text-sm text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
                    Best time: <span className="text-foreground font-medium">{cityInfo.bestTime}</span>
                  </p>

                  {/* Tags - separate line */}
                  <div className="flex gap-1.5 flex-wrap">
                    {cityInfo.bestFor.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 bg-muted text-foreground text-xs font-medium rounded-full">{tag}</span>
                    ))}
                  </div>

                  {/* Top Sites list */}
                  <div>
                    <div className="text-sm font-semibold mb-1.5">Top Sites</div>
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

                  {/* Pros & Cons - simplified colors */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="font-semibold text-sm mb-1.5">Pros</div>
                      {cityInfo.pros.slice(0, 3).map((pro, i) => (
                        <div key={i} className="text-xs text-muted-foreground mb-1 flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">+</span>
                          <span>{pro}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-1.5">Cons</div>
                      {cityInfo.cons.slice(0, 3).map((con, i) => (
                        <div key={i} className="text-xs text-muted-foreground mb-1 flex items-start gap-1.5">
                          <span className="mt-0.5">-</span>
                          <span>{con}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Local tip */}
                  <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{cityInfo.localTip}</p>
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
