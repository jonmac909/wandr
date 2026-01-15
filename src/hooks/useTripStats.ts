'use client';

import { useMemo } from 'react';
import type { StoredTrip } from '@/lib/db/indexed-db';
import { getCountryCode, getCountryFlag, getCountryName, extractCountryFromLocation } from '@/lib/dashboard/country-utils';
import { parseIsoDate } from '@/lib/dates';

export interface CountryStat {
  code: string;
  name: string;
  flag: string;
  count: number;
}

export interface TripStats {
  tripsThisYear: number;
  tripsThisYearTrend: number; // percentage change from last year
  countriesVisited: number;
  countriesVisitedNew: number; // new countries this year
  totalCities: number;
  totalDays: number;
  countryBreakdown: CountryStat[];
}

/**
 * Calculate trip statistics from stored trips
 */
export function useTripStats(trips: StoredTrip[]): TripStats {
  return useMemo(() => {
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Filter trips by year based on start date
    const tripsThisYear = trips.filter(t => {
      const date = t.itinerary?.meta?.startDate;
      return date && parseIsoDate(date).getFullYear() === currentYear;
    }).length;

    const tripsLastYear = trips.filter(t => {
      const date = t.itinerary?.meta?.startDate;
      return date && parseIsoDate(date).getFullYear() === lastYear;
    }).length;

    // Calculate trend (percentage change)
    const tripsThisYearTrend = tripsLastYear > 0
      ? Math.round(((tripsThisYear - tripsLastYear) / tripsLastYear) * 100)
      : (tripsThisYear > 0 ? 100 : 0);

    // Extract all countries with counts
    const countryMap = new Map<string, number>();
    const countriesThisYear = new Set<string>();
    const countriesBeforeThisYear = new Set<string>();

    trips.forEach(trip => {
      const tripYear = trip.itinerary?.meta?.startDate
        ? parseIsoDate(trip.itinerary.meta.startDate).getFullYear()
        : null;

      trip.itinerary?.route?.bases?.forEach(base => {
        const countryName = extractCountryFromLocation(base.location);
        if (countryName) {
          countryMap.set(countryName, (countryMap.get(countryName) || 0) + 1);

          if (tripYear === currentYear) {
            countriesThisYear.add(countryName);
          } else if (tripYear && tripYear < currentYear) {
            countriesBeforeThisYear.add(countryName);
          }
        }
      });
    });

    // Calculate new countries this year
    const newCountriesThisYear = [...countriesThisYear].filter(
      c => !countriesBeforeThisYear.has(c)
    ).length;

    // Build country breakdown with flags
    const countryBreakdown: CountryStat[] = Array.from(countryMap.entries())
      .map(([name, count]) => {
        const code = getCountryCode(name) || '';
        return {
          code,
          name: code ? getCountryName(code) : name,
          flag: getCountryFlag(code || name),
          count,
        };
      })
      .sort((a, b) => b.count - a.count);

    // Calculate total cities and days
    const totalCities = trips.reduce((acc, t) =>
      acc + (t.itinerary?.route?.bases?.length || 0), 0
    );

    const totalDays = trips.reduce((acc, t) =>
      acc + (t.itinerary?.meta?.totalDays || 0), 0
    );

    return {
      tripsThisYear,
      tripsThisYearTrend,
      countriesVisited: countryMap.size,
      countriesVisitedNew: newCountriesThisYear,
      totalCities,
      totalDays,
      countryBreakdown,
    };
  }, [trips]);
}

/**
 * Get trip dates for calendar highlighting
 */
export interface TripDateRange {
  tripId: string;
  tripTitle: string;
  startDate: Date;
  endDate: Date;
  color?: string;
}

export function getTripDateRanges(trips: StoredTrip[]): TripDateRange[] {
  const colors = [
    'bg-primary/20',
    'bg-chart-2/20',
    'bg-chart-3/20',
    'bg-chart-4/20',
    'bg-chart-5/20',
  ];

  return trips
    .filter(t => t.itinerary?.meta?.startDate && t.itinerary?.meta?.endDate)
    .map((t, i) => ({
      tripId: t.id,
      tripTitle: t.itinerary!.meta.title || 'Trip',
      startDate: parseIsoDate(t.itinerary!.meta.startDate),
      endDate: parseIsoDate(t.itinerary!.meta.endDate),
      color: colors[i % colors.length],
    }));
}

/**
 * Check if a date falls within any trip range
 */
export function isDateInTrip(date: Date, tripRanges: TripDateRange[]): TripDateRange | null {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  for (const range of tripRanges) {
    const start = new Date(range.startDate.getFullYear(), range.startDate.getMonth(), range.startDate.getDate());
    const end = new Date(range.endDate.getFullYear(), range.endDate.getMonth(), range.endDate.getDate());

    if (dateOnly >= start && dateOnly <= end) {
      return range;
    }
  }

  return null;
}
