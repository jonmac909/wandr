'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ChevronRight,
  Plus,
  Plane,
  Globe,
  CheckSquare,
  Trash2,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTripStats } from '@/hooks/useTripStats';
import { BucketList, DashboardHeader, TripDrawer, ProfileSettings } from '@/components/dashboard';
import { tripDb, type StoredTrip } from '@/lib/db/indexed-db';

export default function MyTripsPage() {
  const router = useRouter();
  const { trips, loading, refresh } = useDashboardData();
  const stats = useTripStats(trips);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Split trips into upcoming, past, and archived
  const { upcomingTrips, pastTrips, archivedTrips } = useMemo(() => {
    const now = new Date();
    const upcoming: StoredTrip[] = [];
    const past: StoredTrip[] = [];
    const archived: StoredTrip[] = [];

    trips.forEach((trip) => {
      // Separate archived trips first
      if (trip.status === 'archived') {
        archived.push(trip);
        return;
      }

      const endDate = trip.itinerary?.meta?.endDate;
      if (endDate) {
        const tripEnd = new Date(endDate);
        if (tripEnd >= now) {
          upcoming.push(trip);
        } else {
          past.push(trip);
        }
      } else {
        // No end date = treat as upcoming/draft
        upcoming.push(trip);
      }
    });

    // Sort upcoming by start date (soonest first)
    upcoming.sort((a, b) => {
      const dateA = a.itinerary?.meta?.startDate || '';
      const dateB = b.itinerary?.meta?.startDate || '';
      return dateA.localeCompare(dateB);
    });

    // Sort past by end date (most recent first)
    past.sort((a, b) => {
      const dateA = a.itinerary?.meta?.endDate || '';
      const dateB = b.itinerary?.meta?.endDate || '';
      return dateB.localeCompare(dateA);
    });

    // Sort archived by updated date (most recent first)
    archived.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return dateB - dateA;
    });

    return { upcomingTrips: upcoming, pastTrips: past, archivedTrips: archived };
  }, [trips]);

  // Count active trips (non-archived)
  const activeTripsCount = upcomingTrips.length + pastTrips.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold">My Trips</h1>
            <p className="text-xs text-muted-foreground">
              {activeTripsCount} trips
              {archivedTrips.length > 0 && ` · ${archivedTrips.length} archived`}
            </p>
          </div>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Plane className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalDays}</div>
              <div className="text-xs text-muted-foreground">Days Traveled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.countriesVisited}</div>
              <div className="text-xs text-muted-foreground">Countries</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckSquare className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-bold">{trips.length}</div>
              <div className="text-xs text-muted-foreground">Trips</div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Upcoming</h2>
            <div className="space-y-3">
              {upcomingTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={refresh} />
              ))}
            </div>
          </div>
        )}

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Past</h2>
            <div className="space-y-3">
              {pastTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={refresh} />
              ))}
            </div>
          </div>
        )}

        {/* Archived Trips */}
        {archivedTrips.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold mb-3 text-muted-foreground flex items-center gap-2">
              <Archive className="w-4 h-4" />
              Archived
            </h2>
            <div className="space-y-3">
              {archivedTrips.map((trip) => (
                <TripCard key={trip.id} trip={trip} onDelete={refresh} isArchived onRestore={refresh} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeTripsCount === 0 && archivedTrips.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">✈️</div>
            <p className="text-muted-foreground mb-4">No trips yet</p>
            <Link href="/plan">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Plan Your First Trip
              </Button>
            </Link>
          </div>
        )}

        {/* Divider */}
        <div className="border-t pt-6">
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground">Bucket List</h2>
          <BucketList maxItems={10} />
        </div>

        {/* Plan New Trip Button */}
        {trips.length > 0 && (
          <div className="pt-4">
            <Link href="/plan" className="block">
              <Button className="w-full gap-2">
                <Plus className="w-4 h-4" />
                Plan New Trip
              </Button>
            </Link>
          </div>
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

function TripCard({ 
  trip, 
  onDelete, 
  isArchived = false,
  onRestore,
}: { 
  trip: StoredTrip; 
  onDelete: () => void;
  isArchived?: boolean;
  onRestore?: () => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const title = trip.itinerary?.meta?.title ||
    trip.tripDna?.interests?.destination ||
    'Untitled Trip';

  const destination = trip.itinerary?.meta?.destination ||
    trip.itinerary?.route?.bases?.[0]?.location ||
    trip.tripDna?.interests?.destination ||
    '';

  const isDraft = trip.status === 'draft' || !trip.itinerary;
  const photoQuery = destination.split(',')[0]?.trim() || 'travel';

  useEffect(() => {
    if (!photoQuery) return;
    fetch(`/api/city-image?city=${encodeURIComponent(photoQuery)}`)
      .then(res => res.json())
      .then(data => { if (data.imageUrl) setImageUrl(data.imageUrl); })
      .catch(() => {});
  }, [photoQuery]);

  const startDate = trip.itinerary?.meta?.startDate;
  const endDate = trip.itinerary?.meta?.endDate;
  const totalDays = trip.itinerary?.meta?.totalDays;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete "${title}"?`)) return;

    setIsDeleting(true);
    try {
      await tripDb.delete(trip.id);
      onDelete();
    } catch (error) {
      console.error('Failed to delete trip:', error);
      alert('Failed to delete trip');
    }
    setIsDeleting(false);
  };

  const handleRestore = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await tripDb.updateStatus(trip.id, 'completed');
      onRestore?.();
    } catch (error) {
      console.error('Failed to restore trip:', error);
    }
  };

  return (
    <Link href={`/trip/${trip.id}`}>
      <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
        <CardContent className="p-0">
          <div className="flex items-stretch">
            {/* Image */}
            <div className="w-24 h-24 flex-shrink-0 bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center">
                  <span className="text-2xl">✈️</span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 p-3 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{title}</h3>
                {isArchived ? (
                  <Badge variant="secondary" className="text-xs">Archived</Badge>
                ) : isDraft ? (
                  <Badge variant="outline" className="text-xs">Draft</Badge>
                ) : null}
              </div>

              {destination && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{destination}</span>
                </div>
              )}

              {startDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {new Date(startDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                    {endDate && (
                      <> – {new Date(endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}</>
                    )}
                    {totalDays && <> · {totalDays} days</>}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center">
              {isArchived && (
                <button
                  onClick={handleRestore}
                  className="flex items-center px-2 hover:bg-green-50 transition-colors group"
                  title="Restore trip"
                >
                  <RotateCcw className="w-4 h-4 text-muted-foreground group-hover:text-green-600" />
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-3 hover:bg-red-50 transition-colors group"
                title="Delete trip"
              >
                <Trash2 className={`w-4 h-4 text-muted-foreground group-hover:text-red-500 ${isDeleting ? 'animate-pulse' : ''}`} />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
