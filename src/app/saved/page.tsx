'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronRight, MapPin, Utensils, Building2, Ticket } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { tripDb, savedPlacesDb } from '@/lib/db/indexed-db';
import { getFlagForLocation, getCountryForCity } from '@/lib/geo/city-country';
import type { SavedPlace } from '@/types/saved-place';

interface TripSavedSummary {
  tripId: string;
  tripTitle: string;
  destinations: string[];
  savedCount: number;
  heroImage?: string;
}

export default function SavedPage() {
  const router = useRouter();
  const { trips, loading, refresh } = useDashboardData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tripSummaries, setTripSummaries] = useState<TripSavedSummary[]>([]);
  const [allFavorites, setAllFavorites] = useState<SavedPlace[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(true);

  // Load saved places data
  useEffect(() => {
    async function loadSavedData() {
      setLoadingSaved(true);
      try {
        // Get all saved places
        const places = await savedPlacesDb.getAll();

        // Group by trip
        const tripPlacesMap = new Map<string, SavedPlace[]>();
        const unassigned: SavedPlace[] = [];

        places.forEach(place => {
          // Places might have a tripId field - for now treat all as unassigned
          // until we implement trip-specific saves
          unassigned.push(place);
        });

        // Build trip summaries from actual trips
        const summaries: TripSavedSummary[] = [];
        for (const trip of trips) {
          const destinations = trip.tripDna?.interests?.destinations ||
            (trip.tripDna?.interests?.destination ? [trip.tripDna.interests.destination] : []);

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
              tripTitle: (trip.tripDna as any)?.meta?.title || destinations.join(', '),
              destinations,
              savedCount: tripPlaces.length,
              heroImage,
            });
          }
        }

        setTripSummaries(summaries);
        setAllFavorites(unassigned);
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

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
      case 'cafe':
        return <Utensils className="w-4 h-4" />;
      case 'activity':
      case 'attraction':
        return <Ticket className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading || loadingSaved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        activeTab="saved"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Saved</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your saved places and collections
          </p>
        </div>

        {/* Trip Collections */}
        {tripSummaries.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">Upcoming trips</h2>
            <div className="grid grid-cols-2 gap-3">
              {tripSummaries.map((summary) => (
                <button
                  key={summary.tripId}
                  onClick={() => router.push(`/trip/${summary.tripId}`)}
                  className="text-left"
                >
                  <Card className="overflow-hidden hover:border-primary/50 hover:shadow-md transition-all">
                    <div className="aspect-[4/3] relative bg-muted">
                      {summary.heroImage ? (
                        <img
                          src={summary.heroImage}
                          alt={summary.tripTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center gap-1">
                          {summary.destinations.slice(0, 2).map((dest) => (
                            <span key={dest} className="text-lg">
                              {getFlagForLocation(dest)}
                            </span>
                          ))}
                        </div>
                        <h3 className="text-white font-semibold text-sm truncate">
                          {summary.tripTitle}
                        </h3>
                        <p className="text-white/80 text-xs">
                          {summary.savedCount} saved
                        </p>
                      </div>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* All Favorites */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">All Favorites</h2>
          {allFavorites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No saved places yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Explore destinations and save places you want to visit
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {allFavorites.map((place) => (
                <Card key={place.id} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center gap-3">
                    {place.imageUrl ? (
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(place.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{place.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {place.city}
                        {place.neighborhood && ` · ${place.neighborhood}`}
                      </p>
                    </div>
                    <Heart className="w-4 h-4 text-primary flex-shrink-0 fill-current" />
                  </CardContent>
                </Card>
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
