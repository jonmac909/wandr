// IndexedDB wrapper using Dexie.js for offline storage with Supabase cloud sync

import Dexie, { type EntityTable } from 'dexie';
import { TripDNA } from '@/types/trip-dna';
import { Itinerary } from '@/types/itinerary';
import { supabaseTrips } from './supabase';

// Stored trip with metadata
export interface StoredTrip {
  id: string;
  tripDna: TripDNA;
  itinerary: Itinerary | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
  status: 'draft' | 'generated' | 'active' | 'completed' | 'archived';
}

// Document attachment (photos, PDFs, bookings)
export interface StoredDocument {
  id: string;
  tripId: string;
  name: string;
  type: 'photo' | 'pdf' | 'booking' | 'other';
  mimeType: string;
  data: Blob;
  createdAt: Date;
}

// Packing checklist state (separate from itinerary for quick updates)
export interface PackingState {
  tripId: string;
  checkedItems: string[]; // List of checked item keys
  updatedAt: Date;
}

// Planning state (for trip curation progress)
export interface PlanningState {
  tripId: string;
  selectedIds: string[]; // IDs of selected/favorited items
  selectedCities: string[];
  routeOrder: string[];
  countryOrder: string[]; // Order of countries to visit (for multi-country trips)
  allocations?: Array<{ city: string; nights: number; startDay: number; endDay: number; startDate?: string; endDate?: string }>; // City night allocations
  phase: 'picking' | 'route-planning' | 'auto-itinerary' | 'favorites-library' | 'day-planning';
  currentStepIndex: number;
  updatedAt: Date;
}

// User preferences
export interface UserPreferences {
  id: string;
  theme: 'light' | 'dark' | 'system';
  defaultCurrency: string;
  measurementSystem: 'metric' | 'imperial';
  notifications: boolean;
  // User profile
  name?: string;
  location?: string; // e.g., "Kelowna, Canada"
  timezone?: string;
  homeAirport?: string; // e.g., "YLW"
}

// Database definition
class TravelerDatabase extends Dexie {
  trips!: EntityTable<StoredTrip, 'id'>;
  documents!: EntityTable<StoredDocument, 'id'>;
  packingStates!: EntityTable<PackingState, 'tripId'>;
  planningStates!: EntityTable<PlanningState, 'tripId'>;
  preferences!: EntityTable<UserPreferences, 'id'>;

  constructor() {
    super('TravelerDB');

    this.version(1).stores({
      trips: 'id, status, createdAt, updatedAt',
      documents: 'id, tripId, type, createdAt',
      packingStates: 'tripId, updatedAt',
      preferences: 'id',
    });

    // Add planning states in version 2
    this.version(2).stores({
      trips: 'id, status, createdAt, updatedAt',
      documents: 'id, tripId, type, createdAt',
      packingStates: 'tripId, updatedAt',
      planningStates: 'tripId, updatedAt',
      preferences: 'id',
    });
  }
}

// Singleton database instance
export const db = new TravelerDatabase();

// Trip operations with cloud sync
export const tripDb = {
  // Get all trips (cloud-first, fallback to local)
  async getAll(): Promise<StoredTrip[]> {
    try {
      // Try cloud first
      if (supabaseTrips.isConfigured()) {
        const cloudTrips = await supabaseTrips.getAll();
        if (cloudTrips.length > 0) {
          // Cache to local
          for (const trip of cloudTrips) {
            await db.trips.put(trip);
          }
          return cloudTrips;
        }
      }
    } catch (error) {
      console.warn('Cloud fetch failed, using local:', error);
    }
    // Fallback to local
    return db.trips.orderBy('updatedAt').reverse().toArray();
  },

  // Get single trip (cloud-first)
  async get(id: string): Promise<StoredTrip | undefined> {
    try {
      if (supabaseTrips.isConfigured()) {
        const cloudTrip = await supabaseTrips.get(id);
        if (cloudTrip) {
          await db.trips.put(cloudTrip);
          return cloudTrip;
        }
      }
    } catch (error) {
      console.warn('Cloud get failed, using local:', error);
    }
    return db.trips.get(id);
  },

  // Create new trip (saves to both local and cloud)
  async create(tripDna: TripDNA): Promise<StoredTrip> {
    const now = new Date();
    const trip: StoredTrip = {
      id: tripDna.id,
      tripDna,
      itinerary: null,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      status: 'draft',
    };
    await db.trips.add(trip);
    // Sync to cloud
    this.syncToCloud(trip);
    return trip;
  },

  // Update trip DNA
  async updateTripDna(id: string, tripDna: TripDNA): Promise<void> {
    await db.trips.update(id, {
      tripDna,
      updatedAt: new Date(),
    });
    // Sync to cloud
    const trip = await db.trips.get(id);
    if (trip) this.syncToCloud(trip);
  },

  // Update itinerary
  async updateItinerary(id: string, itinerary: Itinerary): Promise<void> {
    await db.trips.update(id, {
      itinerary,
      status: 'generated',
      updatedAt: new Date(),
    });
    // Sync to cloud
    const trip = await db.trips.get(id);
    if (trip) this.syncToCloud(trip);
  },

  // Update status
  async updateStatus(id: string, status: StoredTrip['status']): Promise<void> {
    await db.trips.update(id, {
      status,
      updatedAt: new Date(),
    });
    // Sync to cloud
    const trip = await db.trips.get(id);
    if (trip) this.syncToCloud(trip);
  },

  // Delete trip (from both local and cloud)
  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.trips, db.documents, db.packingStates], async () => {
      await db.trips.delete(id);
      await db.documents.where('tripId').equals(id).delete();
      await db.packingStates.delete(id);
    });
    // Delete from cloud
    try {
      if (supabaseTrips.isConfigured()) {
        await supabaseTrips.delete(id);
      }
    } catch (error) {
      console.warn('Cloud delete failed:', error);
    }
  },

  // Save or update a complete trip (upsert to both local and cloud)
  async save(trip: StoredTrip): Promise<void> {
    await db.trips.put({
      ...trip,
      updatedAt: new Date(),
    });
    // Sync to cloud
    this.syncToCloud(trip);
  },

  // Sync a single trip to cloud (fire and forget)
  syncToCloud(trip: StoredTrip): void {
    if (!supabaseTrips.isConfigured()) return;
    supabaseTrips.save(trip).catch((error) => {
      console.warn('Cloud sync failed:', error);
    });
  },

  // Force sync all local trips to cloud
  async syncAllToCloud(): Promise<number> {
    if (!supabaseTrips.isConfigured()) return 0;
    const localTrips = await db.trips.toArray();
    let synced = 0;
    for (const trip of localTrips) {
      try {
        await supabaseTrips.save(trip);
        synced++;
      } catch (error) {
        console.warn(`Failed to sync trip ${trip.id}:`, error);
      }
    }
    return synced;
  },

  // Import from localStorage (migration helper)
  async importFromLocalStorage(): Promise<number> {
    let imported = 0;
    const keys = Object.keys(localStorage);

    for (const key of keys) {
      if (key.startsWith('trip-dna-')) {
        const tripId = key.replace('trip-dna-', '');
        const tripDnaStr = localStorage.getItem(key);
        const itineraryStr = localStorage.getItem(`itinerary-${tripId}`);

        if (tripDnaStr) {
          const tripDna = JSON.parse(tripDnaStr) as TripDNA;
          const itinerary = itineraryStr ? JSON.parse(itineraryStr) as Itinerary : null;

          const exists = await db.trips.get(tripId);
          if (!exists) {
            const now = new Date();
            await db.trips.add({
              id: tripId,
              tripDna,
              itinerary,
              createdAt: now,
              updatedAt: now,
              syncedAt: null,
              status: itinerary ? 'generated' : 'draft',
            });
            imported++;
          }
        }
      }
    }

    return imported;
  },
};

// Document operations
export const documentDb = {
  // Get all documents for a trip
  async getByTrip(tripId: string): Promise<StoredDocument[]> {
    return db.documents.where('tripId').equals(tripId).toArray();
  },

  // Add document
  async add(tripId: string, name: string, type: StoredDocument['type'], file: Blob): Promise<StoredDocument> {
    const doc: StoredDocument = {
      id: crypto.randomUUID(),
      tripId,
      name,
      type,
      mimeType: file.type,
      data: file,
      createdAt: new Date(),
    };
    await db.documents.add(doc);
    return doc;
  },

  // Delete document
  async delete(id: string): Promise<void> {
    await db.documents.delete(id);
  },
};

// Packing state operations
export const packingDb = {
  // Get packing state
  async get(tripId: string): Promise<PackingState | undefined> {
    return db.packingStates.get(tripId);
  },

  // Update packing state
  async update(tripId: string, checkedItems: string[]): Promise<void> {
    await db.packingStates.put({
      tripId,
      checkedItems,
      updatedAt: new Date(),
    });
  },

  // Toggle item
  async toggleItem(tripId: string, itemKey: string): Promise<string[]> {
    const state = await db.packingStates.get(tripId);
    const current = state?.checkedItems || [];

    const updated = current.includes(itemKey)
      ? current.filter(k => k !== itemKey)
      : [...current, itemKey];

    await db.packingStates.put({
      tripId,
      checkedItems: updated,
      updatedAt: new Date(),
    });

    return updated;
  },
};

// Preferences operations
export const preferencesDb = {
  // Get preferences
  async get(): Promise<UserPreferences> {
    const prefs = await db.preferences.get('user');
    return prefs || {
      id: 'user',
      theme: 'system',
      defaultCurrency: 'USD',
      measurementSystem: 'metric',
      notifications: true,
      name: '',
      location: '',
      timezone: '',
      homeAirport: '',
    };
  },

  // Update preferences
  async update(updates: Partial<UserPreferences>): Promise<void> {
    const current = await this.get();
    await db.preferences.put({
      ...current,
      ...updates,
      id: 'user',
    });
  },
};

// Planning state operations (for trip curation progress)
export const planningDb = {
  // Get planning state for a trip
  async get(tripId: string): Promise<PlanningState | undefined> {
    return db.planningStates.get(tripId);
  },

  // Update planning state
  async update(tripId: string, updates: Partial<Omit<PlanningState, 'tripId' | 'updatedAt'>>): Promise<void> {
    const existing = await db.planningStates.get(tripId);
    await db.planningStates.put({
      tripId,
      selectedIds: updates.selectedIds ?? existing?.selectedIds ?? [],
      selectedCities: updates.selectedCities ?? existing?.selectedCities ?? [],
      routeOrder: updates.routeOrder ?? existing?.routeOrder ?? [],
      countryOrder: updates.countryOrder ?? existing?.countryOrder ?? [],
      phase: updates.phase ?? existing?.phase ?? 'picking',
      currentStepIndex: updates.currentStepIndex ?? existing?.currentStepIndex ?? 0,
      allocations: updates.allocations ?? existing?.allocations,
      updatedAt: new Date(),
    });
  },

  // Delete planning state
  async delete(tripId: string): Promise<void> {
    await db.planningStates.delete(tripId);
  },
};
