'use client';

import { useEffect, useState, useCallback } from 'react';
import { tripDb, StoredTrip } from '@/lib/db/indexed-db';

interface UseDashboardDataReturn {
  trips: StoredTrip[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Load trips from localStorage fallback
 */
function loadFromLocalStorage(): StoredTrip[] {
  const localTrips: StoredTrip[] = [];
  const keys = Object.keys(localStorage);

  keys.forEach((key) => {
    if (key.startsWith('trip-dna-')) {
      const tripId = key.replace('trip-dna-', '');
      const tripDnaStr = localStorage.getItem(key);
      const itineraryStr = localStorage.getItem(`itinerary-${tripId}`);

      if (tripDnaStr) {
        try {
          const tripDna = JSON.parse(tripDnaStr);
          const itinerary = itineraryStr ? JSON.parse(itineraryStr) : null;
          localTrips.push({
            id: tripId,
            tripDna,
            itinerary,
            createdAt: new Date(),
            updatedAt: new Date(),
            syncedAt: null,
            status: itinerary ? 'generated' : 'draft',
          });
        } catch {
          // Skip invalid entries
        }
      }
    }
  });

  return localTrips;
}

/**
 * Hook to load and manage dashboard trip data
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dbTrips = await tripDb.getAll();
      const localTrips = loadFromLocalStorage();

      // Merge: prefer DB trips, add local-only trips
      const dbTripIds = new Set(dbTrips.map(t => t.id));
      const mergedTrips = [
        ...dbTrips,
        ...localTrips.filter(t => !dbTripIds.has(t.id))
      ];

      setTrips(mergedTrips);
    } catch (err) {
      console.error('Failed to load from DB, falling back to localStorage:', err);
      setTrips(loadFromLocalStorage());
      setError(err instanceof Error ? err : new Error('Failed to load trips'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    trips,
    loading,
    error,
    refresh: loadData,
  };
}

/**
 * Delete a trip
 */
export async function deleteTrip(tripId: string): Promise<void> {
  await tripDb.delete(tripId);
  localStorage.removeItem(`trip-dna-${tripId}`);
  localStorage.removeItem(`itinerary-${tripId}`);
}

/**
 * Get upcoming trips (with itinerary, start date in future)
 */
export function getUpcomingTrips(trips: StoredTrip[]): StoredTrip[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return trips
    .filter(t => {
      if (t.status !== 'generated' || !t.itinerary?.meta?.startDate) return false;
      return new Date(t.itinerary.meta.startDate) >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(a.itinerary!.meta.startDate);
      const dateB = new Date(b.itinerary!.meta.startDate);
      return dateA.getTime() - dateB.getTime();
    });
}

/**
 * Get draft trips (no itinerary)
 */
export function getDraftTrips(trips: StoredTrip[]): StoredTrip[] {
  return trips.filter(t => t.status === 'draft' || !t.itinerary);
}

/**
 * Get past trips (end date before today)
 */
export function getPastTrips(trips: StoredTrip[]): StoredTrip[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return trips
    .filter(t => {
      if (!t.itinerary?.meta?.endDate) return false;
      return new Date(t.itinerary.meta.endDate) < today;
    })
    .sort((a, b) => {
      const dateA = new Date(a.itinerary!.meta.endDate);
      const dateB = new Date(b.itinerary!.meta.endDate);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
}

/**
 * Get recent trips (most recently updated)
 */
export function getRecentTrips(trips: StoredTrip[], limit = 5): StoredTrip[] {
  return [...trips]
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, limit);
}

/**
 * Get the featured trip (next upcoming, or most recent with itinerary)
 */
export function getFeaturedTrip(trips: StoredTrip[]): StoredTrip | null {
  const upcoming = getUpcomingTrips(trips);
  if (upcoming.length > 0) return upcoming[0];

  // Fall back to most recent trip with itinerary
  const withItinerary = trips.filter(t => t.itinerary);
  if (withItinerary.length > 0) {
    return withItinerary.sort((a, b) => {
      const dateA = new Date(a.updatedAt);
      const dateB = new Date(b.updatedAt);
      return dateB.getTime() - dateA.getTime();
    })[0];
  }

  return null;
}
