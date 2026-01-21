'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, MapPin, X, Search, ChevronDown, Loader2, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { savedPlacesDb } from '@/lib/db/indexed-db';
import { getCountryForCity, getCountryName } from '@/lib/geo/city-country';
import type { SavedPlace } from '@/types/saved-place';

// Type icons based on place type
const TYPE_ICONS: Record<string, string> = {
  attraction: '📍',
  restaurant: '🍽️',
  cafe: '☕',
  bar: '🍸',
  nightlife: '🌙',
  shopping: '🛍️',
  hotel: '🏨',
  activity: '🎯',
  nature: '🌳',
  beach: '🏖️',
  temple: '🛕',
  museum: '🏛️',
  default: '📍',
};

interface CountryData {
  name: string;
  code: string;
  cities: {
    name: string;
    places: SavedPlace[];
    imageUrl?: string;
  }[];
  totalPlaces: number;
}

export default function SavedPage() {
  const router = useRouter();
  const { trips, loading: tripsLoading, refresh } = useDashboardData();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState('All');
  const [sheetPosition, setSheetPosition] = useState<'low' | 'mid' | 'full'>('mid');
  const [searchQuery, setSearchQuery] = useState('');
  const [captionInput, setCaptionInput] = useState('');
  const [isLoadingParse, setIsLoadingParse] = useState(false);
  const [parsedPlaces, setParsedPlaces] = useState<Array<{
    name: string;
    city: string;
    type: string;
    address?: string;
    rating?: number;
    imageUrl?: string;
    placeId?: string;
    selected: boolean;
  }>>([]);
  const [showParsedModal, setShowParsedModal] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Data state
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const sheetHeights = { low: 30, mid: 60, full: 90 };

  // Load saved places and group by country/city
  useEffect(() => {
    async function loadSavedPlaces() {
      setLoading(true);
      try {
        const places = await savedPlacesDb.getAll();
        
        // Group by country then city
        const countryMap = new Map<string, Map<string, SavedPlace[]>>();
        
        for (const place of places) {
          const countryCode = getCountryForCity(place.city) || 'XX';
          const countryName = getCountryName(countryCode);
          
          if (!countryMap.has(countryName)) {
            countryMap.set(countryName, new Map());
          }
          const cityMap = countryMap.get(countryName)!;
          
          if (!cityMap.has(place.city)) {
            cityMap.set(place.city, []);
          }
          cityMap.get(place.city)!.push(place);
        }
        
        // Convert to array and fetch city images
        const countriesData: CountryData[] = [];
        
        for (const [countryName, cityMap] of countryMap) {
          const cities: CountryData['cities'] = [];
          let totalPlaces = 0;
          
          for (const [cityName, cityPlaces] of cityMap) {
            // Use first place's image as city image, or fetch one
            let imageUrl = cityPlaces.find(p => p.imageUrl)?.imageUrl;
            
            if (!imageUrl) {
              try {
                const res = await fetch(`/api/city-image?city=${encodeURIComponent(cityName)}`);
                if (res.ok) {
                  const data = await res.json();
                  imageUrl = data.imageUrl;
                }
              } catch { /* ignore */ }
            }
            
            cities.push({
              name: cityName,
              places: cityPlaces,
              imageUrl,
            });
            totalPlaces += cityPlaces.length;
          }
          
          // Sort cities by place count
          cities.sort((a, b) => b.places.length - a.places.length);
          
          // Expand first city by default
          if (cities.length > 0) {
            setExpandedCities(prev => new Set([...prev, cities[0].name]));
          }
          
          countriesData.push({
            name: countryName,
            code: getCountryForCity(cities[0]?.name) || 'XX',
            cities,
            totalPlaces,
          });
        }
        
        // Sort countries by place count
        countriesData.sort((a, b) => b.totalPlaces - a.totalPlaces);
        setCountries(countriesData);
      } catch (error) {
        console.error('Failed to load saved places:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadSavedPlaces();
  }, [refreshTrigger]);

  const totalSaved = countries.reduce((sum, c) => sum + c.totalPlaces, 0);
  const totalCountries = countries.length;

  // Filter countries by search
  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.cities.some(city => city.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get icon for place type
  const getPlaceIcon = (place: SavedPlace) => {
    const type = place.type?.toLowerCase() || 'default';
    return TYPE_ICONS[type] || TYPE_ICONS.default;
  };

  // Handle paste caption
  const handleParseCaption = async () => {
    if (!captionInput.trim()) return;
    setIsLoadingParse(true);
    setParseError(null);
    
    try {
      const response = await fetch('/api/parse-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: captionInput }),
      });
      
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        setParsedPlaces(data.places.map((p: typeof data.places[0]) => ({ ...p, selected: true })));
        setShowParsedModal(true);
      } else {
        setParseError(data.error || 'No places found. Try pasting a caption with place names.');
      }
    } catch (error) {
      console.error('Parse error:', error);
      setParseError('Failed to parse caption. Please try again.');
    } finally {
      setIsLoadingParse(false);
    }
  };

  // Save selected parsed places
  const handleSaveParsedPlaces = async () => {
    const selectedPlaces = parsedPlaces.filter(p => p.selected);
    
    for (const place of selectedPlaces) {
      // Map type to valid SavedPlace type
      let placeType: 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife' | 'hotel' = 'attraction';
      const t = place.type?.toLowerCase();
      if (t === 'restaurant' || t === 'food') placeType = 'restaurant';
      else if (t === 'cafe') placeType = 'cafe';
      else if (t === 'bar' || t === 'nightlife') placeType = 'nightlife';
      else if (t === 'hotel') placeType = 'hotel';
      else if (t === 'activity') placeType = 'activity';
      
      await savedPlacesDb.save({
        name: place.name,
        city: place.city,
        type: placeType,
        address: place.address,
        rating: place.rating,
        imageUrl: place.imageUrl,
        source: 'link',
      });
    }
    
    // Reset and refresh
    setShowParsedModal(false);
    setParsedPlaces([]);
    setCaptionInput('');
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading || tripsLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your saves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <DashboardHeader
        activeTab="saved"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      {/* Map Placeholder - shows first country */}
      <div className={`relative transition-all duration-300 ${mapExpanded ? 'h-[40vh]' : 'h-[15vh]'}`}>
        <div className="w-full h-full bg-gradient-to-b from-green-100 to-blue-50 flex items-center justify-center">
          {countries.length > 0 ? (
            <div className="bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
              <span className="font-semibold">{countries[0].name}</span>
              <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full">{countries[0].totalPlaces}</span>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">No saved places yet</div>
          )}
        </div>
        <button
          onClick={() => setMapExpanded(!mapExpanded)}
          className="absolute bottom-0 left-0 right-0 h-6 bg-white rounded-t-2xl flex items-center justify-center"
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </button>
      </div>

      {/* Content */}
      <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-2xl font-bold">My Saved</h1>
              <p className="text-sm text-muted-foreground">{totalSaved} Saved • {totalCountries} Countries</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-28 focus:w-40 transition-all pl-8 pr-2 py-1.5 rounded-full border border-gray-200 text-sm outline-none focus:border-primary bg-gray-50"
              />
            </div>
          </div>
          
          {/* Paste link/caption input */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <span>Paste TikTok/IG link or caption</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="2" width="20" height="20" rx="6" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
                <circle cx="18" cy="6" r="1.5" fill="currentColor"/>
              </svg>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
              </svg>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={captionInput}
                onChange={(e) => setCaptionInput(e.target.value)}
                placeholder="https://vt.tiktok.com/... or paste caption text"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-primary bg-white"
              />
              <Button 
                size="sm" 
                className="rounded-lg px-4"
                onClick={handleParseCaption}
                disabled={isLoadingParse || !captionInput.trim()}
              >
                {isLoadingParse ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Import'}
              </Button>
            </div>
            {parseError && (
              <p className="text-xs text-red-500 mt-2">{parseError}</p>
            )}
          </div>
        </div>

        {/* Empty State */}
        {countries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bookmark className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No saved places yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Save places from Explore to see them here
            </p>
            <Button onClick={() => router.push('/explore')} className="rounded-full">
              Explore Places
            </Button>
          </div>
        )}

        {/* Country Sections */}
        {filteredCountries.map((country) => (
          <section key={country.name} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{country.name}</h2>
              <span className="text-sm text-muted-foreground">
                {country.cities.length} Cities • {country.totalPlaces} Saved
              </span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {country.cities.map((city) => (
                <button
                  key={city.name}
                  onClick={() => {
                    setSelectedCountry(country.name);
                    setExpandedCities(new Set([city.name]));
                  }}
                  className="flex-shrink-0 text-left"
                >
                  <div className="w-32 h-32 rounded-xl overflow-hidden mb-2 bg-slate-200">
                    {city.imageUrl ? (
                      <img src={city.imageUrl} alt={city.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-200 to-emerald-300 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-white/60" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate w-32">{city.name}</p>
                  <p className="text-xs text-muted-foreground">{city.places.length} Saved</p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Country Detail Modal */}
      {selectedCountry && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-gradient-to-b from-green-100 to-blue-50">
            {/* Place markers on map */}
            {countries.find(c => c.name === selectedCountry)?.cities.slice(0, 3).map((city, idx) => (
              city.places.slice(0, 2).map((place, pIdx) => (
                <div 
                  key={place.id} 
                  className="absolute flex flex-col items-center"
                  style={{ 
                    top: `${15 + idx * 12 + pIdx * 8}%`, 
                    left: `${10 + idx * 20 + pIdx * 15}%` 
                  }}
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-sm shadow">
                    {getPlaceIcon(place)}
                  </div>
                  <span className="text-[10px] mt-1 bg-white px-1.5 py-0.5 rounded shadow text-gray-700 max-w-20 truncate">
                    {place.name}
                  </span>
                </div>
              ))
            ))}
          </div>

          <div 
            className="absolute left-0 right-0 bottom-0 bg-white rounded-t-3xl flex flex-col shadow-2xl transition-all duration-300"
            style={{ height: `${sheetHeights[sheetPosition]}vh` }}
          >
            <button 
              className="flex justify-center pt-3 pb-2 cursor-pointer"
              onClick={() => {
                if (sheetPosition === 'low') setSheetPosition('mid');
                else if (sheetPosition === 'mid') setSheetPosition('full');
                else setSheetPosition('low');
              }}
            >
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </button>

            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-xl font-bold">{selectedCountry}</h2>
              <button onClick={() => setSelectedCountry(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
              <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
              {['All', 'Attractions', 'Food', 'Nightlife', 'Other'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${
                    activeFilter === filter ? 'bg-gray-100 font-medium' : 'border text-gray-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pb-24">
              {countries.find(c => c.name === selectedCountry)?.cities.map((city) => {
                const isExpanded = expandedCities.has(city.name);
                const filteredPlaces = city.places.filter(place => {
                  if (activeFilter === 'All') return true;
                  const type = place.type?.toLowerCase() || '';
                  if (activeFilter === 'Attractions') return ['attraction', 'temple', 'museum', 'nature'].includes(type);
                  if (activeFilter === 'Food') return ['restaurant', 'cafe'].includes(type);
                  if (activeFilter === 'Nightlife') return ['bar', 'nightlife'].includes(type);
                  return !['attraction', 'temple', 'museum', 'nature', 'restaurant', 'cafe', 'bar', 'nightlife'].includes(type);
                });
                
                if (filteredPlaces.length === 0 && activeFilter !== 'All') return null;
                
                return (
                  <div key={city.name}>
                    <button
                      onClick={() => {
                        const newSet = new Set(expandedCities);
                        if (isExpanded) newSet.delete(city.name);
                        else newSet.add(city.name);
                        setExpandedCities(newSet);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 border-t hover:bg-gray-50"
                    >
                      <span className="font-semibold">{city.name}</span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-2 space-y-2">
                        {filteredPlaces.map((place) => (
                          <div key={place.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg flex-shrink-0 shadow-sm">
                              {getPlaceIcon(place)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{place.name}</p>
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {place.description || place.address || `Saved from ${place.city}`}
                              </p>
                            </div>
                            {place.imageUrl && (
                              <img 
                                src={place.imageUrl} 
                                alt={place.name}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <Button 
                className="rounded-full px-6 py-3 bg-gray-900 hover:bg-gray-800 shadow-lg"
                onClick={() => {
                  router.push(`/plan?destination=${encodeURIComponent(selectedCountry)}`);
                }}
              >
                Plan Trip to {selectedCountry}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Parsed Places Modal */}
      {showParsedModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">Found {parsedPlaces.length} places</h2>
                <p className="text-xs text-gray-500">Select places to save</p>
              </div>
              <button 
                onClick={() => { setShowParsedModal(false); setParsedPlaces([]); }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Places list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {parsedPlaces.map((place, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setParsedPlaces(prev => prev.map((p, i) => 
                      i === idx ? { ...p, selected: !p.selected } : p
                    ));
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    place.selected ? 'bg-primary/5 border-primary' : 'bg-gray-50 border-transparent'
                  }`}
                >
                  {/* Checkbox */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    place.selected ? 'bg-primary border-primary' : 'border-gray-300'
                  }`}>
                    {place.selected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  
                  {/* Place info */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm">{place.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {place.city} • {place.type}
                      {place.rating && ` • ${place.rating}`}
                    </p>
                  </div>
                  
                  {/* Image */}
                  {place.imageUrl ? (
                    <img 
                      src={place.imageUrl} 
                      alt={place.name}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => { setShowParsedModal(false); setParsedPlaces([]); }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSaveParsedPlaces}
                disabled={!parsedPlaces.some(p => p.selected)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Save {parsedPlaces.filter(p => p.selected).length} places
              </Button>
            </div>
          </div>
        </div>
      )}

      <TripDrawer open={drawerOpen} onOpenChange={setDrawerOpen} trips={trips} onRefresh={refresh} />
      <ProfileSettings open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}
