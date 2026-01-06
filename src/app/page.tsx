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
  WeatherWidget,
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
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader
        activeTab="trips"
        onOpenDrawer={() => setDrawerOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Calendar + Recent Trips (hidden on mobile) */}
          <aside className="hidden lg:flex lg:flex-col lg:col-span-3 gap-4 overflow-hidden">
            <MonthCalendar trips={trips} />
            <div className="flex-1 min-h-0">
              <RecentTripsSidebar trips={trips} maxTrips={3} />
            </div>
          </aside>

          {/* Center Column: Featured Trip + Housing/Transport side by side */}
          <section className="lg:col-span-6 flex flex-col gap-4 overflow-hidden">
            <FeaturedTripCard trip={featuredTrip} />
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
              <div className="overflow-auto">
                <HousingSection bases={featuredTrip?.itinerary?.route?.bases?.slice(0, 2)} />
              </div>
              <div className="overflow-auto">
                <TransportSection transport={transport.slice(0, 2)} />
              </div>
            </div>
          </section>

          {/* Right Column: Stats + Weather + Map + Plan Button */}
          <aside className="hidden lg:flex lg:flex-col lg:col-span-3 gap-4 overflow-hidden">
            <StatsPanel stats={stats} />
            <WeatherWidget
              location={
                featuredTrip?.itinerary?.meta?.destination ||
                featuredTrip?.itinerary?.route?.bases?.[0]?.location
              }
            />
            <div className="flex-1 min-h-0">
              <WorldMap trips={trips} />
            </div>
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
