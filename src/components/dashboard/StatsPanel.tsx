'use client';

import type { TripStats } from '@/hooks/useTripStats';
import { StatCard } from './StatCard';

interface StatsPanelProps {
  stats: TripStats;
}

export function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label="Trips this year"
        value={stats.tripsThisYear}
        trend={stats.tripsThisYearTrend}
      />
      <StatCard
        label="Countries visited"
        value={stats.countriesVisited}
        trend={stats.countriesVisitedNew > 0 ? stats.countriesVisitedNew : undefined}
        suffix={stats.countriesVisitedNew > 0 ? `+${stats.countriesVisitedNew}` : undefined}
      />
    </div>
  );
}
