'use client';

import { useState, useEffect, useCallback } from 'react';
import { tripDb, packingDb, StoredTrip } from './indexed-db';
import { TripDNA } from '@/types/trip-dna';
import { Itinerary } from '@/types/itinerary';

// Hook to load all trips
export function useTrips() {
  const [trips, setTrips] = useState<StoredTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const allTrips = await tripDb.getAll();
      setTrips(allTrips);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load trips'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { trips, loading, error, refresh };
}

// Hook to load single trip
export function useTrip(tripId: string) {
  const [trip, setTrip] = useState<StoredTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    if (!tripId) return;

    try {
      setLoading(true);
      const storedTrip = await tripDb.get(tripId);
      setTrip(storedTrip || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load trip'));
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateTripDna = useCallback(async (tripDna: TripDNA) => {
    await tripDb.updateTripDna(tripId, tripDna);
    await refresh();
  }, [tripId, refresh]);

  const updateItinerary = useCallback(async (itinerary: Itinerary) => {
    await tripDb.updateItinerary(tripId, itinerary);
    await refresh();
  }, [tripId, refresh]);

  return { trip, loading, error, refresh, updateTripDna, updateItinerary };
}

// Hook for packing list state
export function usePackingState(tripId: string) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    packingDb.get(tripId).then(state => {
      if (state) {
        setCheckedItems(new Set(state.checkedItems));
      }
      setLoading(false);
    });
  }, [tripId]);

  const toggleItem = useCallback(async (itemKey: string) => {
    const updated = await packingDb.toggleItem(tripId, itemKey);
    setCheckedItems(new Set(updated));
  }, [tripId]);

  const isChecked = useCallback((itemKey: string) => {
    return checkedItems.has(itemKey);
  }, [checkedItems]);

  return { checkedItems, loading, toggleItem, isChecked };
}

// Hook to create new trip
export function useCreateTrip() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createTrip = useCallback(async (tripDna: TripDNA): Promise<StoredTrip | null> => {
    try {
      setCreating(true);
      setError(null);
      const trip = await tripDb.create(tripDna);
      return trip;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create trip'));
      return null;
    } finally {
      setCreating(false);
    }
  }, []);

  return { createTrip, creating, error };
}

// Hook to import from localStorage
export function useImportFromLocalStorage() {
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);

  const importTrips = useCallback(async () => {
    setImporting(true);
    const count = await tripDb.importFromLocalStorage();
    setImported(count);
    setImporting(false);
    return count;
  }, []);

  return { importTrips, importing, imported };
}
