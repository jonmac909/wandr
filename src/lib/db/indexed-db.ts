// IndexedDB wrapper using Dexie.js for offline storage with Supabase cloud sync

import Dexie, { type EntityTable } from 'dexie';
import { TripDNA } from '@/types/trip-dna';
import { Itinerary } from '@/types/itinerary';
import { SavedPlace, PlaceCategory } from '@/types/saved-place';
import { 
  supabaseTrips, 
  supabasePlanningStates, 
  supabaseSavedPlaces, 
  supabasePackingStates, 
  supabasePreferences 
} from './supabase';

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

// Generated activity type for persistence
export interface PersistedActivity {
  id: string;
  name: string;
  type: 'attraction' | 'restaurant' | 'cafe' | 'activity' | 'nightlife' | 'flight' | 'train' | 'bus' | 'drive' | 'transit';
  description?: string;
  imageUrl?: string | null;
  suggestedTime?: string;
  duration?: number;
  openingHours?: string;
  neighborhood?: string;
  matchScore?: number;
  matchReasons?: string[];
  priceRange?: string;
  tags?: string[];
  walkingTimeToNext?: number;
  transportDetails?: {
    from: string;
    to: string;
    departureTime?: string;
    arrivalTime?: string;
    operator?: string;
    bookingRef?: string;
    distance?: number;
  };
}

// Generated day type for persistence
export interface PersistedDay {
  dayNumber: number;
  date: string;
  city: string;
  theme?: string;
  activities: PersistedActivity[];
}

// Planning state (for trip curation progress)
export interface PlanningState {
  tripId: string;
  selectedIds: string[]; // IDs of selected/favorited items
  selectedCities: string[];
  routeOrder: string[];
  countryOrder: string[]; // Order of countries to visit (for multi-country trips)
  allocations?: Array<{ city: string; nights: number; startDay: number; endDay: number; startDate?: string; endDate?: string }>; // City night allocations
  generatedDays?: PersistedDay[]; // Auto-filled day activities
  phase: 'picking' | 'route-planning' | 'auto-itinerary' | 'favorites-library' | 'day-planning';
  currentStepIndex: number;
  updatedAt: Date;
}

// Travel interest types for personalized recommendations
export type TravelInterest = 'food' | 'history' | 'art' | 'nature' | 'nightlife' | 'adventure' | 'shopping' | 'local-culture';

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
  // Travel preferences (for Explore personalization)
  travelInterests?: TravelInterest[];
}

// Database definition
class TravelerDatabase extends Dexie {
  trips!: EntityTable<StoredTrip, 'id'>;
  documents!: EntityTable<StoredDocument, 'id'>;
  packingStates!: EntityTable<PackingState, 'tripId'>;
  planningStates!: EntityTable<PlanningState, 'tripId'>;
  preferences!: EntityTable<UserPreferences, 'id'>;
  savedPlaces!: EntityTable<SavedPlace, 'id'>;

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

    // Add saved places in version 3 (Explore feature)
    this.version(3).stores({
      trips: 'id, status, createdAt, updatedAt',
      documents: 'id, tripId, type, createdAt',
      packingStates: 'tripId, updatedAt',
      planningStates: 'tripId, updatedAt',
      preferences: 'id',
      savedPlaces: 'id, city, type, savedAt',
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

// Packing state operations - cloud-synced
export const packingDb = {
  // Get packing state (cloud-first)
  async get(tripId: string): Promise<PackingState | undefined> {
    try {
      if (supabasePackingStates.isConfigured()) {
        const cloudState = await supabasePackingStates.get(tripId);
        if (cloudState) {
          await db.packingStates.put(cloudState);
          return cloudState;
        }
      }
    } catch (error) {
      console.warn('Cloud packing state fetch failed:', error);
    }
    return db.packingStates.get(tripId);
  },

  // Update packing state (save to both local and cloud)
  async update(tripId: string, checkedItems: string[]): Promise<void> {
    const state: PackingState = {
      tripId,
      checkedItems,
      updatedAt: new Date(),
    };
    await db.packingStates.put(state);
    // Sync to cloud
    if (supabasePackingStates.isConfigured()) {
      supabasePackingStates.save(state).catch(err => console.warn('Cloud sync failed:', err));
    }
  },

  // Toggle item (with cloud sync)
  async toggleItem(tripId: string, itemKey: string): Promise<string[]> {
    const state = await db.packingStates.get(tripId);
    const current = state?.checkedItems || [];

    const updated = current.includes(itemKey)
      ? current.filter(k => k !== itemKey)
      : [...current, itemKey];

    await this.update(tripId, updated);
    return updated;
  },
};

// Preferences operations - cloud-synced
export const preferencesDb = {
  // Get preferences (cloud-first)
  async get(): Promise<UserPreferences> {
    const defaultPrefs: UserPreferences = {
      id: 'user',
      theme: 'system',
      defaultCurrency: 'USD',
      measurementSystem: 'metric',
      notifications: true,
      name: '',
      location: '',
      timezone: '',
      homeAirport: '',
      travelInterests: [],
    };

    try {
      if (supabasePreferences.isConfigured()) {
        const cloudPrefs = await supabasePreferences.get();
        if (cloudPrefs) {
          await db.preferences.put(cloudPrefs);
          return cloudPrefs;
        }
      }
    } catch (error) {
      console.warn('Cloud preferences fetch failed:', error);
    }

    const prefs = await db.preferences.get('user');
    return prefs || defaultPrefs;
  },

  // Update preferences (save to both local and cloud)
  async update(updates: Partial<UserPreferences>): Promise<void> {
    const current = await db.preferences.get('user') || {
      id: 'user',
      theme: 'system',
      defaultCurrency: 'USD',
      measurementSystem: 'metric',
      notifications: true,
      travelInterests: [],
    };
    const updated: UserPreferences = {
      ...current,
      ...updates,
      id: 'user',
    };
    await db.preferences.put(updated);
    // Sync to cloud
    if (supabasePreferences.isConfigured()) {
      supabasePreferences.save(updated).catch(err => console.warn('Cloud sync failed:', err));
    }
  },
};

// Planning state operations (for trip curation progress) - cloud-synced
export const planningDb = {
  // Get planning state for a trip (cloud-first)
  async get(tripId: string): Promise<PlanningState | undefined> {
    try {
      if (supabasePlanningStates.isConfigured()) {
        const cloudState = await supabasePlanningStates.get(tripId);
        if (cloudState) {
          await db.planningStates.put(cloudState);
          return cloudState;
        }
      }
    } catch (error) {
      console.warn('Cloud planning state fetch failed:', error);
    }
    return db.planningStates.get(tripId);
  },

  // Update planning state (save to both local and cloud)
  async update(tripId: string, updates: Partial<Omit<PlanningState, 'tripId' | 'updatedAt'>>): Promise<void> {
    const existing = await db.planningStates.get(tripId);
    const state: PlanningState = {
      tripId,
      selectedIds: updates.selectedIds ?? existing?.selectedIds ?? [],
      selectedCities: updates.selectedCities ?? existing?.selectedCities ?? [],
      routeOrder: updates.routeOrder ?? existing?.routeOrder ?? [],
      countryOrder: updates.countryOrder ?? existing?.countryOrder ?? [],
      phase: updates.phase ?? existing?.phase ?? 'picking',
      currentStepIndex: updates.currentStepIndex ?? existing?.currentStepIndex ?? 0,
      allocations: updates.allocations ?? existing?.allocations,
      generatedDays: updates.generatedDays ?? existing?.generatedDays,
      updatedAt: new Date(),
    };
    await db.planningStates.put(state);
    // Sync to cloud (fire and forget)
    if (supabasePlanningStates.isConfigured()) {
      supabasePlanningStates.save(state).catch(err => console.warn('Cloud sync failed:', err));
    }
  },

  // Delete planning state (from both local and cloud)
  async delete(tripId: string): Promise<void> {
    await db.planningStates.delete(tripId);
    if (supabasePlanningStates.isConfigured()) {
      supabasePlanningStates.delete(tripId).catch(err => console.warn('Cloud delete failed:', err));
    }
  },
};

// Saved places operations (Explore feature)
// Saved places operations (Explore feature) - cloud-synced
export const savedPlacesDb = {
  // Get all saved places (cloud-first)
  async getAll(): Promise<SavedPlace[]> {
    try {
      if (supabaseSavedPlaces.isConfigured()) {
        const cloudPlaces = await supabaseSavedPlaces.getAll();
        if (cloudPlaces.length > 0) {
          // Cache to local
          for (const place of cloudPlaces) {
            await db.savedPlaces.put(place);
          }
          return cloudPlaces;
        }
      }
    } catch (error) {
      console.warn('Cloud saved places fetch failed:', error);
    }
    return db.savedPlaces.orderBy('savedAt').reverse().toArray();
  },

  // Get saved places by city
  async getByCity(city: string): Promise<SavedPlace[]> {
    const normalizedCity = city.toLowerCase();
    const all = await this.getAll();
    return all.filter(p => p.city.toLowerCase().includes(normalizedCity));
  },

  // Get saved places by category
  async getByCategory(category: PlaceCategory): Promise<SavedPlace[]> {
    if (category === 'all') {
      return this.getAll();
    }
    const all = await this.getAll();
    return all.filter(p => p.type === category);
  },

  // Get saved places by city and category
  async getByCityAndCategory(city: string, category: PlaceCategory): Promise<SavedPlace[]> {
    const normalizedCity = city.toLowerCase();
    const all = await this.getAll();
    return all.filter(p => 
      p.city.toLowerCase().includes(normalizedCity) &&
      (category === 'all' || p.type === category)
    );
  },

  // Get single saved place
  async get(id: string): Promise<SavedPlace | undefined> {
    return db.savedPlaces.get(id);
  },

  // Check if a place is saved (by name and city)
  async isSaved(name: string, city: string): Promise<boolean> {
    const normalizedName = name.toLowerCase();
    const normalizedCity = city.toLowerCase();
    const all = await db.savedPlaces.toArray(); // Use local for quick check
    return all.some(p =>
      p.name.toLowerCase() === normalizedName &&
      p.city.toLowerCase().includes(normalizedCity)
    );
  },

  // Save a new place (to both local and cloud)
  async save(place: Omit<SavedPlace, 'id' | 'savedAt'>): Promise<SavedPlace> {
    const savedPlace: SavedPlace = {
      ...place,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    await db.savedPlaces.add(savedPlace);
    // Sync to cloud
    if (supabaseSavedPlaces.isConfigured()) {
      supabaseSavedPlaces.save(savedPlace).catch(err => console.warn('Cloud sync failed:', err));
    }
    return savedPlace;
  },

  // Update a saved place (both local and cloud)
  async update(id: string, updates: Partial<Omit<SavedPlace, 'id' | 'savedAt'>>): Promise<void> {
    await db.savedPlaces.update(id, updates);
    // Sync to cloud
    const updated = await db.savedPlaces.get(id);
    if (updated && supabaseSavedPlaces.isConfigured()) {
      supabaseSavedPlaces.save(updated).catch(err => console.warn('Cloud sync failed:', err));
    }
  },

  // Delete a saved place (from both local and cloud)
  async delete(id: string): Promise<void> {
    await db.savedPlaces.delete(id);
    if (supabaseSavedPlaces.isConfigured()) {
      supabaseSavedPlaces.delete(id).catch(err => console.warn('Cloud delete failed:', err));
    }
  },

  // Delete by name and city (for unsaving from browse)
  async deleteByNameAndCity(name: string, city: string): Promise<void> {
    const normalizedName = name.toLowerCase();
    const normalizedCity = city.toLowerCase();
    const all = await db.savedPlaces.toArray();
    const toDelete = all.find(p =>
      p.name.toLowerCase() === normalizedName &&
      p.city.toLowerCase().includes(normalizedCity)
    );
    if (toDelete) {
      await this.delete(toDelete.id);
    }
  },

  // Get unique cities from saved places
  async getCities(): Promise<string[]> {
    const all = await this.getAll();
    const cities = [...new Set(all.map(p => p.city))];
    return cities.sort();
  },

  // Get count by city
  async getCountByCity(city: string): Promise<number> {
    const places = await this.getByCity(city);
    return places.length;
  },
};
