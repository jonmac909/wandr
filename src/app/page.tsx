'use client';

import { useState, useMemo } from 'react';
import {
  DashboardHeader,
  MonthCalendar,
  RecentTripsSidebar,
  FeaturedTripCard,
  StatsPanel,
  WorldMap,
  CountryBreakdown,
  WeatherWidget,
  PlanNewTripButton,
  TripDrawer,
  ImportModal,
  BucketList,
  ProfileSettings,
  TravelHighlights,
  DestinationInspiration,
} from '@/components/dashboard';
import { useDashboardData, getFeaturedTrip, getRecentTrips } from '@/hooks/useDashboardData';
import { useTripStats } from '@/hooks/useTripStats';

export default function Home() {
  const { trips, loading } = useDashboardData();
  const stats = useTripStats(trips);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Derived data
  const featuredTrip = useMemo(() => getFeaturedTrip(trips), [trips]);
  const recentTrips = useMemo(() => getRecentTrips(trips, 5), [trips]);

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

      <main className="flex-1 max-w-7xl w-full mx-auto px-2 py-1 min-h-0 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-1.5">
          {/* Left Column: Weather + Calendar + Recent Trips */}
          <aside className="hidden lg:flex lg:flex-col lg:col-span-3 gap-1.5 min-h-0">
            <WeatherWidget location="West Kelowna, Canada" />
            <MonthCalendar trips={trips} />
            <div className="flex-1 min-h-0">
              <RecentTripsSidebar trips={trips} excludeTripId={featuredTrip?.id} maxTrips={5} />
            </div>
          </aside>

          {/* Center Column: Featured Trip + Travel Highlights + Inspiration */}
          <section className="lg:col-span-6 flex flex-col gap-1.5 min-h-0">
            <FeaturedTripCard trip={featuredTrip} />
            <TravelHighlights stats={stats} trips={trips} />
            <div className="flex-1 min-h-0">
              <DestinationInspiration trips={trips} />
            </div>
          </section>

          {/* Right Column: Stats + Map + Bucket List */}
          <aside className="hidden lg:flex lg:flex-col lg:col-span-3 gap-1.5 min-h-0">
            <StatsPanel stats={stats} />
            <WorldMap trips={trips} />
            <div className="flex-1 min-h-0">
              <BucketList maxItems={6} />
            </div>
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

      <ProfileSettings
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </div>
  );
}
