'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, Upload, Plane, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DashboardHeader,
  TripDrawer,
  ImportModal,
  ProfileSettings,
  DestinationInspiration,
} from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { tripDb } from '@/lib/db/indexed-db';

export default function Home() {
  const router = useRouter();
  const { trips, loading, refresh } = useDashboardData();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // New trip modal state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTrip = async () => {
    if (!destination.trim()) return;

    setIsCreating(true);
    try {
      const id = crypto.randomUUID();
      const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();

      // Parse comma-separated destinations into an array
      const destinations = destination
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0)
        .map(d => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase()); // Capitalize

      // Generate title based on number of destinations
      const title = destinations.length > 1
        ? `Multi-country ${year}`
        : `${destinations[0]} ${year}`;

      // Create minimal tripDna - using 'as any' since we have a simplified structure
      // that will be fleshed out in the Trip Hub
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tripDna: any = {
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
        interests: {
          destination: destinations[0], // Primary destination for backwards compat
          destinations: destinations,   // Full array of destinations
        },
        constraints: {
          dates: {
            type: 'flexible',
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          },
        },
        meta: {
          title,
        },
      };

      await tripDb.save({
        id,
        tripDna,
        itinerary: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncedAt: null,
        status: 'draft',
      });

      // Reset modal state
      setDestination('');
      setStartDate('');
      setEndDate('');
      setPlanModalOpen(false);

      // Navigate to trip hub
      router.push(`/trip/${id}`);
    } catch (error) {
      console.error('Failed to create trip:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader
        activeTab="trips"
        onOpenDrawer={() => setDrawerOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 overflow-auto">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Plane className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Where to next?</h1>
          <p className="text-muted-foreground">Plan your next adventure</p>
        </div>

        {/* CTAs */}
        <div className="space-y-3 mb-8">
          <button onClick={() => setPlanModalOpen(true)} className="w-full text-left">
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Plan New Trip</h3>
                  <p className="text-sm text-muted-foreground">AI-powered itinerary planning</p>
                </div>
              </CardContent>
            </Card>
          </button>

          <button onClick={() => setImportModalOpen(true)} className="w-full text-left">
            <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Import Trip</h3>
                  <p className="text-sm text-muted-foreground">Upload or paste existing itinerary</p>
                </div>
              </CardContent>
            </Card>
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-muted-foreground">Inspiration</span>
          </div>
        </div>

        {/* Destination Inspiration */}
        <DestinationInspiration trips={trips} />
      </main>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
        onRefresh={refresh}
      />

      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />

      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />

      {/* Plan New Trip Modal */}
      <Dialog open={planModalOpen} onOpenChange={setPlanModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Plan New Trip</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Destination Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Where to?</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="e.g. Thailand, Vietnam, Japan"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple destinations with commas</p>
              </div>
            </div>

            {/* Date Inputs (Optional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Dates <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Start</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">End</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setPlanModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTrip}
              disabled={!destination.trim() || isCreating}
              className="bg-primary hover:bg-primary/90"
            >
              {isCreating ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Trip'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
