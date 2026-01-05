// IndexedDB wrapper using Dexie.js for offline storage

import Dexie, { type EntityTable } from 'dexie';
import { TripDNA } from '@/types/trip-dna';
import { Itinerary } from '@/types/itinerary';

// Stored trip with metadata
export interface StoredTrip {
  id: string;
  tripDna: TripDNA;
  itinerary: Itinerary | null;
  createdAt: Date;
  updatedAt: Date;
  syncedAt: Date | null;
  status: 'draft' | 'generated' | 'active' | 'completed';
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

// User preferences
export interface UserPreferences {
  id: string;
  theme: 'light' | 'dark' | 'system';
  defaultCurrency: string;
  measurementSystem: 'metric' | 'imperial';
  notifications: boolean;
}

// Database definition
class TravelerDatabase extends Dexie {
  trips!: EntityTable<StoredTrip, 'id'>;
  documents!: EntityTable<StoredDocument, 'id'>;
  packingStates!: EntityTable<PackingState, 'tripId'>;
  preferences!: EntityTable<UserPreferences, 'id'>;

  constructor() {
    super('TravelerDB');

    this.version(1).stores({
      trips: 'id, status, createdAt, updatedAt',
      documents: 'id, tripId, type, createdAt',
      packingStates: 'tripId, updatedAt',
      preferences: 'id',
    });
  }
}

// Singleton database instance
export const db = new TravelerDatabase();

// Trip operations
export const tripDb = {
  // Get all trips
  async getAll(): Promise<StoredTrip[]> {
    return db.trips.orderBy('updatedAt').reverse().toArray();
  },

  // Get single trip
  async get(id: string): Promise<StoredTrip | undefined> {
    return db.trips.get(id);
  },

  // Create new trip
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
    return trip;
  },

  // Update trip DNA
  async updateTripDna(id: string, tripDna: TripDNA): Promise<void> {
    await db.trips.update(id, {
      tripDna,
      updatedAt: new Date(),
    });
  },

  // Update itinerary
  async updateItinerary(id: string, itinerary: Itinerary): Promise<void> {
    await db.trips.update(id, {
      itinerary,
      status: 'generated',
      updatedAt: new Date(),
    });
  },

  // Update status
  async updateStatus(id: string, status: StoredTrip['status']): Promise<void> {
    await db.trips.update(id, {
      status,
      updatedAt: new Date(),
    });
  },

  // Delete trip
  async delete(id: string): Promise<void> {
    await db.transaction('rw', [db.trips, db.documents, db.packingStates], async () => {
      await db.trips.delete(id);
      await db.documents.where('tripId').equals(id).delete();
      await db.packingStates.delete(id);
    });
  },

  // Save or update a complete trip (upsert)
  async save(trip: StoredTrip): Promise<void> {
    await db.trips.put({
      ...trip,
      updatedAt: new Date(),
    });
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
