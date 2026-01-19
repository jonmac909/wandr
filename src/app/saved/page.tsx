'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, ChevronDown, MoreHorizontal, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { savedPlacesDb } from '@/lib/db/indexed-db';
import { getFlagForLocation } from '@/lib/geo/city-country';
import type { SavedPlace } from '@/types/saved-place';

interface TripSavedSummary {
  tripId: string;
  tripTitle: string;
  destinations: string[];
  cities: string[];
  savedCount: number;
  heroImage?: string;
}

interface FavoriteCollection {
  name: string;
  description: string;
  imageUrl?: string;
  savedCount: number;
  timeEstimate: string;
}

export default function SavedPage() {
  const router = useRouter();
  const { trips, loading, refresh } = useDashboardData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tripSummaries, setTripSummaries] = useState<TripSavedSummary[]>([]);
  const [allFavorites, setAllFavorites] = useState<SavedPlace[]>([]);
  const [favoriteCollections, setFavoriteCollections] = useState<FavoriteCollection[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Load saved places data
  useEffect(() => {
    async function loadSavedData() {
      setLoadingSaved(true);
      try {
        // Get all saved places
        const places = await savedPlacesDb.getAll();
        const unassigned: SavedPlace[] = [...places];

        // Build trip summaries from actual trips
        const summaries: TripSavedSummary[] = [];
        for (const trip of trips) {
          const destinations = trip.tripDna?.interests?.destinations ||
            (trip.tripDna?.interests?.destination ? [trip.tripDna.interests.destination] : []);

          // Get cities from trip's selected cities or route
          const cities = (trip.tripDna as any)?.planning?.selectedCities ||
            (trip.tripDna as any)?.planning?.routeOrder || [];

          // Count saved places that might be associated with this trip's destinations
          const tripPlaces = unassigned.filter(p =>
            destinations.some(d =>
              p.city?.toLowerCase().includes(d.toLowerCase()) ||
              d.toLowerCase().includes(p.city?.toLowerCase() || '')
            )
          );

          if (destinations.length > 0) {
            // Fetch hero image for first destination
            let heroImage: string | undefined;
            try {
              const res = await fetch(`/api/city-image?city=${encodeURIComponent(destinations[0])}`);
              if (res.ok) {
                const data = await res.json();
                heroImage = data.imageUrl;
              }
            } catch { /* ignore */ }

            summaries.push({
              tripId: trip.id,
              tripTitle: `${destinations[0]} Trip`,
              destinations,
              cities: cities.length > 0 ? cities.slice(0, 3) : destinations.slice(0, 3),
              savedCount: tripPlaces.length,
              heroImage,
            });
          }
        }

        // Build favorite collections by grouping saved places by city/region
        const cityGroups = new Map<string, SavedPlace[]>();
        unassigned.forEach(place => {
          const city = place.city || 'Other';
          if (!cityGroups.has(city)) cityGroups.set(city, []);
          cityGroups.get(city)!.push(place);
        });

        const collections: FavoriteCollection[] = [];
        for (const [city, places] of cityGroups) {
          if (places.length > 0) {
            // Fetch image for the city
            let imageUrl: string | undefined;
            try {
              const res = await fetch(`/api/city-image?city=${encodeURIComponent(city)}`);
              if (res.ok) {
                const data = await res.json();
                imageUrl = data.imageUrl;
              }
            } catch { /* ignore */ }

            collections.push({
              name: city,
              description: places.map(p => p.type).filter((v, i, a) => a.indexOf(v) === i).slice(0, 3).join(', '),
              imageUrl,
              savedCount: places.length,
              timeEstimate: `${Math.ceil(places.length * 0.5)}-${places.length} hrs`,
            });
          }
        }

        setTripSummaries(summaries);
        setAllFavorites(unassigned);
        setFavoriteCollections(collections);
      } catch (error) {
        console.error('Failed to load saved places:', error);
      } finally {
        setLoadingSaved(false);
      }
    }

    if (!loading) {
      loadSavedData();
    }
  }, [trips, loading]);

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
        {tripSummaries.length === 0 && allFavorites.length === 0 && (
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

        {/* Upcoming Trips */}
        {tripSummaries.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Upcoming trips</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tripSummaries.map((summary) => (
                <button
                  key={summary.tripId}
                  onClick={() => router.push(`/trip/${summary.tripId}`)}
                  className="text-left w-full"
                >
                  <Card className="bg-white hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Image */}
                        <div className="w-32 h-28 flex-shrink-0 relative">
                          {summary.heroImage ? (
                            <img
                              src={summary.heroImage}
                              alt={summary.tripTitle}
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
                                {summary.tripTitle}
                              </h3>
                              <span className="text-base flex-shrink-0">
                                {getFlagForLocation(summary.destinations[0])}
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Menu action
                              }}
                              className="p-1 hover:bg-slate-100 rounded flex-shrink-0"
                            >
                              <MoreHorizontal className="w-4 h-4 text-slate-400" />
                            </button>
                          </div>

                          <p className="text-xs text-muted-foreground truncate mb-2">
                            {summary.cities.join(', ')}
                          </p>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{summary.savedCount} saved items</span>
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

        {/* All Favorites */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">All Favorites</h2>
            <button className="p-1 hover:bg-slate-200 rounded">
              <MoreHorizontal className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {favoriteCollections.length === 0 && allFavorites.length === 0 ? (
            <Card className="bg-white/80">
              <CardContent className="py-8 text-center">
                <Heart className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                <p className="text-muted-foreground text-sm">No favorites yet</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Tap the heart on any place to save it here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
              {favoriteCollections.map((collection, idx) => (
                <div key={idx} className="flex-shrink-0 w-48">
                  <Card className="bg-white overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative aspect-[4/3]">
                        {collection.imageUrl ? (
                          <img
                            src={collection.imageUrl}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                        )}
                        {/* Heart icon */}
                        <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>

                      {/* Content */}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm truncate">{collection.name}</h3>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {collection.description || `${collection.savedCount} saved items`}
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{collection.timeEstimate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* If no collections but have favorites, show them directly */}
              {favoriteCollections.length === 0 && allFavorites.length > 0 && (
                allFavorites.slice(0, 6).map((place) => (
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
                            <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                          )}
                          <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                            <Heart className="w-4 h-4 text-red-500 fill-current" />
                          </button>
                        </div>
                        <div className="p-3">
                          <h3 className="font-semibold text-sm truncate">{place.name}</h3>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {place.city}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
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
