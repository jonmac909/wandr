'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Heart, MapPin, Plus, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TripDrawer } from '@/components/dashboard/TripDrawer';
import { ProfileSettings } from '@/components/dashboard/ProfileSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { savedPlacesDb, tripDb, preferencesDb, type TravelInterest } from '@/lib/db/indexed-db';
import { getCountryInfoForCity } from '@/lib/geo/city-country';
import type { SavedPlace, BrowsePlace, PlaceCategory } from '@/types/saved-place';
import type { StoredTrip } from '@/lib/db/indexed-db';
import dynamic from 'next/dynamic';

const ExploreMap = dynamic(() => import('@/components/explore/ExploreMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
    </div>
  ),
});

const CATEGORIES: { label: string; value: PlaceCategory; icon: string }[] = [
  { label: 'All', value: 'all', icon: '✨' },
  { label: 'Things to do', value: 'attraction', icon: '🎯' },
  { label: 'Food', value: 'restaurant', icon: '🍜' },
  { label: 'Cafes', value: 'cafe', icon: '☕' },
  { label: 'Nightlife', value: 'nightlife', icon: '🌙' },
];

const INTERESTS: { value: TravelInterest; label: string; icon: string }[] = [
  { value: 'food', label: 'Food', icon: '🍜' },
  { value: 'history', label: 'History', icon: '🏛️' },
  { value: 'art', label: 'Art', icon: '🎨' },
  { value: 'nature', label: 'Nature', icon: '🌿' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌙' },
  { value: 'adventure', label: 'Adventure', icon: '🧗' },
  { value: 'shopping', label: 'Shopping', icon: '🛍️' },
  { value: 'local-culture', label: 'Local', icon: '🎭' },
];

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || '';

  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');
  const [searchCity, setSearchCity] = useState(initialCity);
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategory>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Data states
  const [browsePlaces, setBrowsePlaces] = useState<BrowsePlace[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedInterests, setSelectedInterests] = useState<TravelInterest[]>([]);

  // Load data on mount
  useEffect(() => {
    loadSavedPlaces();
    loadTrips();
    loadUserInterests();
  }, []);

  const loadUserInterests = async () => {
    const prefs = await preferencesDb.get();
    if (prefs.travelInterests && prefs.travelInterests.length > 0) {
      setSelectedInterests(prefs.travelInterests);
    }
  };

  const toggleInterest = (interest: TravelInterest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const loadSavedPlaces = async () => {
    const places = await savedPlacesDb.getAll();
    setSavedPlaces(places);
    const ids = new Set(places.map(p => `${p.name.toLowerCase()}-${p.city.toLowerCase()}`));
    setSavedIds(ids);
  };

  const loadTrips = async () => {
    const allTrips = await tripDb.getAll();
    // Filter to trips that are in planning (draft or generated, not completed/archived)
    const planningTrips = allTrips.filter(t => t.status === 'draft' || t.status === 'generated' || t.status === 'active');
    setTrips(planningTrips);
  };

  // Group saved places by country, then by city
  const groupedSavedPlaces = useMemo(() => {
    const groups: Record<string, { flag: string; name: string; cities: Record<string, SavedPlace[]> }> = {};

    savedPlaces.forEach(place => {
      const countryInfo = getCountryInfoForCity(place.city);
      const countryCode = countryInfo?.code || 'XX';
      const countryName = countryInfo?.name || 'Other';
      const flag = countryInfo?.flag || '🌍';

      if (!groups[countryCode]) {
        groups[countryCode] = { flag, name: countryName, cities: {} };
      }

      const cityKey = place.city.toLowerCase();
      if (!groups[countryCode].cities[cityKey]) {
        groups[countryCode].cities[cityKey] = [];
      }
      groups[countryCode].cities[cityKey].push(place);
    });

    return groups;
  }, [savedPlaces]);

  // Match saved places to trips
  const tripsWithSavedPlaces = useMemo(() => {
    return trips.map(trip => {
      const destinations = trip.tripDna?.interests?.destinations || [];
      const matchingPlaces: SavedPlace[] = [];

      destinations.forEach(dest => {
        const destLower = dest.toLowerCase();
        savedPlaces.forEach(place => {
          const cityLower = place.city.toLowerCase();
          // Check if place city matches or is contained in destination
          if (cityLower.includes(destLower) || destLower.includes(cityLower)) {
            if (!matchingPlaces.find(p => p.id === place.id)) {
              matchingPlaces.push(place);
            }
          }
        });
      });

      return { trip, places: matchingPlaces };
    }).filter(t => t.places.length > 0);
  }, [trips, savedPlaces]);

  // Search for places
  const handleSearch = async () => {
    if (!searchCity.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSearchError(null);

    try {
      const response = await fetch('/api/explore/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: searchCity,
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          interests: selectedInterests.length > 0 ? selectedInterests : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSearchError(data.error || 'Failed to fetch recommendations');
        setBrowsePlaces([]);
        return;
      }

      const placesWithSaved = (data.places || []).map((p: BrowsePlace) => ({
        ...p,
        isSaved: savedIds.has(`${p.name.toLowerCase()}-${p.city.toLowerCase()}`),
      }));
      setBrowsePlaces(placesWithSaved);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setSearchError(error instanceof Error ? error.message : 'Network error');
      setBrowsePlaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle save/unsave
  const handleToggleSave = async (place: BrowsePlace) => {
    const key = `${place.name.toLowerCase()}-${place.city.toLowerCase()}`;

    if (savedIds.has(key)) {
      await savedPlacesDb.deleteByNameAndCity(place.name, place.city);
      setSavedIds(prev => { const next = new Set(prev); next.delete(key); return next; });
      setBrowsePlaces(prev => prev.map(p => p.id === place.id ? { ...p, isSaved: false } : p));
    } else {
      await savedPlacesDb.save({
        name: place.name,
        type: place.type,
        city: place.city,
        neighborhood: place.neighborhood,
        address: place.address,
        coordinates: place.coordinates,
        description: place.description,
        imageUrl: place.imageUrl,
        rating: place.rating,
        reviewCount: place.reviewCount,
        priceRange: place.priceRange,
        tags: place.tags,
        source: 'browse',
      });
      setSavedIds(prev => new Set(prev).add(key));
      setBrowsePlaces(prev => prev.map(p => p.id === place.id ? { ...p, isSaved: true } : p));
    }
    await loadSavedPlaces();
  };

  // Delete from saved
  const handleDeleteSaved = async (place: SavedPlace) => {
    await savedPlacesDb.delete(place.id);
    await loadSavedPlaces();
    const key = `${place.name.toLowerCase()}-${place.city.toLowerCase()}`;
    setBrowsePlaces(prev => prev.map(p => {
      const pKey = `${p.name.toLowerCase()}-${p.city.toLowerCase()}`;
      return pKey === key ? { ...p, isSaved: false } : p;
    }));
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Filter saved places by category
  const filteredSavedPlaces = selectedCategory === 'all'
    ? savedPlaces
    : savedPlaces.filter(p => p.type === selectedCategory);

  const mapPlaces = activeTab === 'browse' ? browsePlaces : filteredSavedPlaces;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      <div className="flex flex-col md:flex-row h-[calc(100vh-56px)]">
        {/* Map */}
        <div className="w-full md:w-1/2 h-[35vh] md:h-full">
          <ExploreMap places={mapPlaces} onPlaceClick={(p) => console.log('Clicked:', p.name)} />
        </div>

        {/* List */}
        <div className="w-full md:w-1/2 h-[65vh] md:h-full flex flex-col overflow-hidden bg-white">
          {/* Header */}
          <div className="p-3 border-b space-y-2">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === 'browse' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Browse
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                  activeTab === 'saved' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className="w-3 h-3" />
                Saved ({savedPlaces.length})
              </button>
            </div>

            {/* Search (Browse tab only) */}
            {activeTab === 'browse' && (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search city..."
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-8 h-9"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isLoading} size="sm">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                </Button>
              </div>
            )}

            {/* Category filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>

            {/* Interest filters (Browse tab only) */}
            {activeTab === 'browse' && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <span className="text-xs text-gray-400 self-center pr-1">Interests:</span>
                {INTERESTS.map((interest) => (
                  <button
                    key={interest.value}
                    onClick={() => toggleInterest(interest.value)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedInterests.includes(interest.value)
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    {interest.icon} {interest.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'browse' ? (
              <BrowseTab
                places={browsePlaces}
                selectedCategory={selectedCategory}
                isLoading={isLoading}
                hasSearched={hasSearched}
                searchCity={searchCity}
                searchError={searchError}
                onToggleSave={handleToggleSave}
              />
            ) : (
              <SavedTab
                tripsWithPlaces={tripsWithSavedPlaces}
                groupedPlaces={groupedSavedPlaces}
                selectedCategory={selectedCategory}
                expandedGroups={expandedGroups}
                onToggleGroup={toggleGroup}
                onDelete={handleDeleteSaved}
              />
            )}
          </div>

          {/* Add button (Saved tab) */}
          {activeTab === 'saved' && (
            <div className="p-3 border-t">
              <Button className="w-full gap-2" variant="outline" size="sm">
                <Plus className="w-4 h-4" />
                Add a place
              </Button>
            </div>
          )}
        </div>
      </div>

      <TripDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} trips={trips} onRefresh={loadTrips} />
      <ProfileSettings open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
}

// Browse tab - compact list
function BrowseTab({
  places,
  selectedCategory,
  isLoading,
  hasSearched,
  searchCity,
  searchError,
  onToggleSave,
}: {
  places: BrowsePlace[];
  selectedCategory: PlaceCategory;
  isLoading: boolean;
  hasSearched: boolean;
  searchCity: string;
  searchError: string | null;
  onToggleSave: (place: BrowsePlace) => void;
}) {
  const filtered = selectedCategory === 'all' ? places : places.filter(p => p.type === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Finding recommendations...</span>
      </div>
    );
  }

  if (filtered.length > 0) {
    return (
      <div className="divide-y">
        {filtered.map((place) => (
          <CompactPlaceRow
            key={place.id}
            name={place.name}
            type={place.type}
            rating={place.rating}
            neighborhood={place.neighborhood}
            priceRange={place.priceRange}
            imageUrl={place.imageUrl}
            isSaved={place.isSaved || false}
            onToggleSave={() => onToggleSave(place)}
          />
        ))}
      </div>
    );
  }

  if (hasSearched) {
    return (
      <div className="text-center py-12 text-gray-500">
        <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No places found for &quot;{searchCity}&quot;</p>
        {searchError && (
          <p className="text-xs mt-2 text-red-500 max-w-xs mx-auto">{searchError}</p>
        )}
        <p className="text-xs mt-1">Try a different city</p>
      </div>
    );
  }

  return (
    <div className="text-center py-12 text-gray-500">
      <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p>Search a city to discover places</p>
      <p className="text-xs mt-1">Try Tokyo, Paris, Bangkok...</p>
    </div>
  );
}

// Saved tab with groupings
function SavedTab({
  tripsWithPlaces,
  groupedPlaces,
  selectedCategory,
  expandedGroups,
  onToggleGroup,
  onDelete,
}: {
  tripsWithPlaces: { trip: StoredTrip; places: SavedPlace[] }[];
  groupedPlaces: Record<string, { flag: string; name: string; cities: Record<string, SavedPlace[]> }>;
  selectedCategory: PlaceCategory;
  expandedGroups: Set<string>;
  onToggleGroup: (id: string) => void;
  onDelete: (place: SavedPlace) => void;
}) {
  const filterPlaces = (places: SavedPlace[]) =>
    selectedCategory === 'all' ? places : places.filter(p => p.type === selectedCategory);

  const hasTrips = tripsWithPlaces.length > 0;
  const hasCountries = Object.keys(groupedPlaces).length > 0;

  if (!hasTrips && !hasCountries) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No saved places yet</p>
        <p className="text-xs mt-1">Browse and save places you want to visit</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {/* Trips You're Planning */}
      {hasTrips && (
        <div className="pb-2">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
            Trips You&apos;re Planning
          </div>
          {tripsWithPlaces.map(({ trip, places }) => {
            const filteredPlaces = filterPlaces(places);
            if (filteredPlaces.length === 0) return null;

            const destinations = trip.tripDna?.interests?.destinations || [];
            const countryInfo = destinations[0] ? getCountryInfoForCity(destinations[0]) : null;
            const isExpanded = expandedGroups.has(`trip-${trip.id}`);
            const cityCounts = getCityCounts(filteredPlaces);

            return (
              <div key={trip.id}>
                <button
                  onClick={() => onToggleGroup(`trip-${trip.id}`)}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{countryInfo?.flag || '🌍'}</span>
                    <span className="font-medium text-sm">{destinations.join(' → ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{cityCounts}</span>
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="divide-y border-l-2 border-primary/20 ml-5">
                    {filteredPlaces.map(place => (
                      <CompactPlaceRow
                        key={place.id}
                        name={place.name}
                        type={place.type}
                        rating={place.rating}
                        neighborhood={place.neighborhood || place.city}
                        priceRange={place.priceRange}
                        isSaved={true}
                        onToggleSave={() => onDelete(place)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* All Saved */}
      <div>
        <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
          All Saved
        </div>
        {Object.entries(groupedPlaces).map(([code, { flag, name, cities }]) => {
          const allPlaces = Object.values(cities).flat();
          const filteredPlaces = filterPlaces(allPlaces);
          if (filteredPlaces.length === 0) return null;

          const isExpanded = expandedGroups.has(`country-${code}`);
          const cityCounts = getCityCounts(filteredPlaces);

          return (
            <div key={code}>
              <button
                onClick={() => onToggleGroup(`country-${code}`)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{flag}</span>
                  <span className="font-medium text-sm">{name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{cityCounts}</span>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </button>
              {isExpanded && (
                <div className="divide-y border-l-2 border-gray-200 ml-5">
                  {filteredPlaces.map(place => (
                    <CompactPlaceRow
                      key={place.id}
                      name={place.name}
                      type={place.type}
                      rating={place.rating}
                      neighborhood={place.neighborhood || place.city}
                      priceRange={place.priceRange}
                      isSaved={true}
                      onToggleSave={() => onDelete(place)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Helper to get city counts string like "Bangkok (2) · Chiang Mai (1)"
function getCityCounts(places: SavedPlace[]): string {
  const counts: Record<string, number> = {};
  places.forEach(p => {
    const city = p.city;
    counts[city] = (counts[city] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([city, count]) => `${city} (${count})`)
    .join(' · ');
}

// Compact place row (~50px height)
function CompactPlaceRow({
  name,
  type,
  rating,
  neighborhood,
  priceRange,
  imageUrl,
  isSaved,
  onToggleSave,
}: {
  name: string;
  type: string;
  rating?: number;
  neighborhood?: string;
  priceRange?: string;
  imageUrl?: string;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 transition-colors">
      {/* Thumbnail */}
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{name}</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          {rating && (
            <span className="flex items-center gap-0.5">
              <span className="text-yellow-500">★</span>
              {rating.toFixed(1)}
            </span>
          )}
          <span className="capitalize">{type}</span>
          {priceRange && <span>{priceRange}</span>}
          {neighborhood && (
            <>
              <span>·</span>
              <span className="truncate">{neighborhood}</span>
            </>
          )}
        </div>
      </div>

      {/* Heart */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
        className={`p-1.5 rounded-full transition-colors flex-shrink-0 ${
          isSaved ? 'text-red-500 hover:bg-red-50' : 'text-gray-400 hover:bg-gray-100'
        }`}
      >
        <Heart className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    }>
      <ExploreContent />
    </Suspense>
  );
}
