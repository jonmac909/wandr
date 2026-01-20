'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, ChevronDown, MoreHorizontal } from 'lucide-react';
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

        {/* All Lists Dropdown */}
        <div className="mb-6">
          <Button variant="outline" className="rounded-full px-4 h-9 text-sm font-medium">
            All lists
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Empty State */}
        {countryCollections.length === 0 && uncategorizedPlaces.length === 0 && (
          <Card className="bg-white">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Bookmark className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No saved places yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Start exploring destinations and save the places you want to visit
              </p>
              <Button onClick={() => router.push('/explore')}>
                Explore Places
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Country Collections */}
        {countryCollections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Trip collections</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {countryCollections.map((collection) => (
                <button
                  key={collection.countryCode}
                  onClick={() => {
                    // TODO: Navigate to country collection detail page
                  }}
                  className="text-left w-full"
                >
                  <Card className="bg-white hover:shadow-md transition-shadow overflow-hidden">
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="p-1 hover:bg-slate-100 rounded flex-shrink-0"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </button>
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
              ))}
            </div>
          </section>
        )}

        {/* All Saved (uncategorized) */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Saved</h2>
            <button className="p-1 hover:bg-slate-200 rounded">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {uncategorizedPlaces.length === 0 ? (
            <Card className="bg-white/80">
              <CardContent className="py-8 text-center">
                <Heart className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-muted-foreground text-sm">No uncategorized saves yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Items saved without a recognized city will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
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
