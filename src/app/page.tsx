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
  CountryBreakdown,
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
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Left Column: Calendar + Recent Trips (hidden on mobile) */}
          <aside className="hidden lg:flex lg:flex-col lg:col-span-3 gap-3 overflow-hidden">
            <MonthCalendar trips={trips} />
            <div className="flex-1 min-h-0">
              <RecentTripsSidebar trips={trips} excludeTripId={featuredTrip?.id} maxTrips={3} />
            </div>
          </aside>

          {/* Center Column: Featured Trip + Housing (horizontal) + Transport (below) */}
          <section className="lg:col-span-6 flex flex-col gap-3 overflow-hidden">
            <FeaturedTripCard trip={featuredTrip} />
            {/* Housing - horizontal layout */}
            <HousingSection bases={featuredTrip?.itinerary?.route?.bases?.slice(0, 2)} />
            {/* Transport - below housing */}
            <TransportSection transport={transport.slice(0, 2)} />
          </section>

          {/* Right Column: Weather + Stats + Map + Countries + Plan Button */}
          <aside className="hidden lg:flex lg:flex-col lg:col-span-3 gap-3 overflow-hidden">
            <WeatherWidget location={featuredTrip?.itinerary?.meta?.destination || featuredTrip?.itinerary?.route?.bases?.[0]?.location} />
            <StatsPanel stats={stats} />
            <WorldMap trips={trips} />
            <CountryBreakdown countries={stats.countryBreakdown} maxCountries={3} />
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
