'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, ChevronDown, ChevronUp, MoreHorizontal, MapPin, Utensils, Landmark, TreePine, Hotel, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { savedPlacesDb } from '@/lib/db/indexed-db';
import { getCountryForCity, getCountryName, getFlagForLocation } from '@/lib/geo/city-country';
import type { SavedPlace } from '@/types/saved-place';

interface CountryCollection {
  countryCode: string;
  countryName: string;
  flag: string;
  cities: string[];
  places: SavedPlace[];
  heroImage?: string;
}

export default function SavedPage() {
  const router = useRouter();
  const { trips, loading, refresh } = useDashboardData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [countryCollections, setCountryCollections] = useState<CountryCollection[]>([]);
  const [uncategorizedPlaces, setUncategorizedPlaces] = useState<SavedPlace[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [linkInput, setLinkInput] = useState('');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null);

  // Category configuration
  const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    attraction: { label: 'Sites & Attractions', icon: <Landmark className="w-4 h-4" />, color: 'text-coral-500 bg-coral-50' },
    restaurant: { label: 'Food & Dining', icon: <Utensils className="w-4 h-4" />, color: 'text-orange-500 bg-orange-50' },
    cafe: { label: 'Cafes', icon: <Utensils className="w-4 h-4" />, color: 'text-amber-500 bg-amber-50' },
    activity: { label: 'Activities', icon: <Sparkles className="w-4 h-4" />, color: 'text-purple-500 bg-purple-50' },
    nightlife: { label: 'Nightlife', icon: <Sparkles className="w-4 h-4" />, color: 'text-pink-500 bg-pink-50' },
    hotel: { label: 'Places to Stay', icon: <Hotel className="w-4 h-4" />, color: 'text-blue-500 bg-blue-50' },
  };

  // Group places by type
  const groupPlacesByType = (places: SavedPlace[]) => {
    const groups: Record<string, SavedPlace[]> = {};
    places.forEach(place => {
      const type = place.type || 'attraction';
      if (!groups[type]) groups[type] = [];
      groups[type].push(place);
    });
    return groups;
  };

  // Load saved places and group by country
  useEffect(() => {
    async function loadSavedData() {
      setLoadingSaved(true);
      try {
        const places = await savedPlacesDb.getAll();

        // Group places by country
        const countryMap = new Map<string, { cities: Set<string>; places: SavedPlace[] }>();
        const uncategorized: SavedPlace[] = [];

        for (const place of places) {
          const countryCode = getCountryForCity(place.city);
          if (countryCode) {
            if (!countryMap.has(countryCode)) {
              countryMap.set(countryCode, { cities: new Set(), places: [] });
            }
            const group = countryMap.get(countryCode)!;
            group.cities.add(place.city);
            group.places.push(place);
          } else {
            uncategorized.push(place);
          }
        }

        // Convert to collections array and fetch hero images
        const collections: CountryCollection[] = [];
        for (const [code, data] of countryMap) {
          const countryName = getCountryName(code);
          const citiesArray = Array.from(data.cities);

          // Fetch hero image for first city
          let heroImage: string | undefined;
          try {
            const res = await fetch(`/api/city-image?city=${encodeURIComponent(citiesArray[0])}`);
            if (res.ok) {
              const json = await res.json();
              heroImage = json.imageUrl;
            }
          } catch { /* ignore */ }

          // Get flag emoji
          const flag = getFlagForLocation(citiesArray[0]);

          collections.push({
            countryCode: code,
            countryName,
            flag,
            cities: citiesArray,
            places: data.places,
            heroImage,
          });
        }

        // Sort by number of places (most saved first)
        collections.sort((a, b) => b.places.length - a.places.length);

        setCountryCollections(collections);
        setUncategorizedPlaces(uncategorized);
      } catch (error) {
        console.error('Failed to load saved places:', error);
      } finally {
        setLoadingSaved(false);
      }
    }

    if (!loading) {
      loadSavedData();
    }
  }, [loading]);

  if (loading || loadingSaved) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your saves...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardHeader
        activeTab="saved"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Saved</h1>
        </div>

        {/* Import from Social Media */}
        <Card className="bg-white mb-6">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span>Paste your link</span>
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
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary"
              />
              <Button
                size="sm"
                className="rounded-lg px-4 bg-primary/20 text-primary hover:bg-primary/30"
                disabled={!linkInput.trim()}
                onClick={() => {
                  alert('Link import coming soon!');
                }}
              >
                Paste
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Empty State - only when completely empty */}
        {countryCollections.length === 0 && uncategorizedPlaces.length === 0 && (
          <div className="space-y-4">
            {/* Create collection prompt */}
            <button className="w-full p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">✈️</span>
                </div>
                <div>
                  <p className="font-medium text-sm">Create a trip collection</p>
                  <p className="text-xs text-muted-foreground">Organize saved places by destination</p>
                </div>
              </div>
            </button>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-10 h-10 mb-3 rounded-full bg-slate-100 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold mb-1">No saved places yet</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Save places from Explore to see them here
              </p>
              <Button size="sm" onClick={() => router.push('/explore')} className="rounded-full text-xs h-8">
                Explore Places
              </Button>
            </div>
          </div>
        )}

        {/* Country Collections */}
        {countryCollections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Trip collections</h2>
            <div className="space-y-4">
              {countryCollections.map((collection) => {
                const isExpanded = expandedCountry === collection.countryCode;
                const groupedPlaces = groupPlacesByType(collection.places);
                
                return (
                  <div key={collection.countryCode}>
                    <button
                      onClick={() => setExpandedCountry(isExpanded ? null : collection.countryCode)}
                      className="text-left w-full"
                    >
                      <Card className={`bg-white hover:shadow-md transition-shadow overflow-hidden ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
                        <CardContent className="p-0">
                          <div className="flex">
                            {/* Image */}
                            <div className="w-32 h-28 flex-shrink-0 relative">
                              {collection.heroImage ? (
                                <img
                                  src={collection.heroImage}
                                  alt={collection.countryName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h3 className="font-semibold text-sm truncate">
                                    {collection.countryName}
                                  </h3>
                                  <span className="text-base flex-shrink-0">
                                    {collection.flag}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400" />
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-muted-foreground truncate mb-2">
                                {collection.cities.slice(0, 3).join(', ')}
                                {collection.cities.length > 3 && ` +${collection.cities.length - 3} more`}
                              </p>

                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>{collection.places.length} saved items</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>

                    {/* Expanded Content - Category Sections */}
                    {isExpanded && (
                      <div className="mt-3 space-y-4 pl-2">
                        {Object.entries(groupedPlaces).map(([type, places]) => {
                          const config = categoryConfig[type] || categoryConfig.attraction;
                          return (
                            <div key={type} className="bg-white rounded-xl p-4 border border-slate-100">
                              <div className="flex items-center gap-2 mb-3">
                                <div className={`p-1.5 rounded-lg ${config.color}`}>
                                  {config.icon}
                                </div>
                                <h4 className="font-medium text-sm">{config.label}</h4>
                                <span className="text-xs text-muted-foreground">({places.length})</span>
                              </div>
                              
                              <div className="space-y-2">
                                {places.slice(0, 3).map((place) => (
                                  <div
                                    key={place.id}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                                  >
                                    {/* Thumbnail */}
                                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                                      {place.imageUrl ? (
                                        <img
                                          src={place.imageUrl}
                                          alt={place.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <MapPin className="w-4 h-4 text-slate-300" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-sm truncate">{place.name}</h5>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {place.city}
                                        {place.rating && ` · ⭐ ${place.rating}`}
                                      </p>
                                    </div>
                                    
                                    {/* Heart */}
                                    <Heart className="w-4 h-4 text-primary fill-current flex-shrink-0" />
                                  </div>
                                ))}
                                
                                {/* See all link if more than 3 */}
                                {places.length > 3 && (
                                  <button className="w-full py-2 text-xs text-primary font-medium hover:bg-primary/5 rounded-lg transition-colors">
                                    See all {places.length} places →
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* All Saved (uncategorized) - only show if there are uncategorized places */}
        {uncategorizedPlaces.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Saved</h2>
              <button className="p-1 hover:bg-slate-200 rounded">
                <MoreHorizontal className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            {(
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {uncategorizedPlaces.map((place) => (
                <div key={place.id} className="flex-shrink-0 w-48">
                  <Card className="bg-white overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3]">
                        {place.imageUrl ? (
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                            <Bookmark className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                        <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>
                      <div className="p-3">
                        <h3 className="font-semibold text-sm truncate">{place.name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {place.city || 'Unknown location'}
                        </p>
                        {place.sourceUrl && (
                          <p className="text-xs text-blue-500 truncate mt-1">
                            {new URL(place.sourceUrl).hostname.replace('www.', '')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            )}
          </section>
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
    </div>
  );
}
