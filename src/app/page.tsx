'use client';

import { useState, useMemo } from 'react';
import {
  DashboardHeader,
  MonthCalendar,
  RecentTripsSidebar,
  FeaturedTripCard,
  HousingSection,
  TransportSection,
  StatsPanel,
  WorldMap,
  PlanNewTripButton,
  TripDrawer,
  ImportModal,
} from '@/components/dashboard';
import { useDashboardData, getFeaturedTrip, getRecentTrips } from '@/hooks/useDashboardData';
import { useTripStats } from '@/hooks/useTripStats';
import { extractTransportFromItinerary } from '@/lib/dashboard/transport-extractor';

export default function Home() {
  const { trips, loading } = useDashboardData();
  const stats = useTripStats(trips);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Derived data
  const featuredTrip = useMemo(() => getFeaturedTrip(trips), [trips]);
  const recentTrips = useMemo(() => getRecentTrips(trips, 5), [trips]);
  const transport = useMemo(
    () => extractTransportFromItinerary(featuredTrip?.itinerary),
    [featuredTrip]
  );

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
        activeTab="trips"
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Calendar + Recent Trips (hidden on mobile) */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <MonthCalendar trips={trips} />
            <RecentTripsSidebar trips={recentTrips} />
          </aside>

          {/* Center Column: Featured Trip + Details */}
          <section className="lg:col-span-6 space-y-6">
            <FeaturedTripCard trip={featuredTrip} />
            <HousingSection bases={featuredTrip?.itinerary?.route?.bases} />
            <TransportSection transport={transport} />
          </section>

          {/* Right Column: Stats + Map + Plan Button */}
          <aside className="lg:col-span-3 space-y-6">
            <StatsPanel stats={stats} />
            <WorldMap trips={trips} />
            <PlanNewTripButton />
          </aside>
        </div>
      </main>

      {/* Overlays */}
      <TripDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        trips={trips}
      />

      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
