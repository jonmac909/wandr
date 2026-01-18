import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StoredTrip, PlanningState, PackingState, UserPreferences } from './indexed-db';
import type { SavedPlace } from '@/types/saved-place';

// Lazy initialization to avoid build-time errors
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}

// Database row type
interface TripRow {
  id: string;
  trip_dna: Record<string, unknown>;
  itinerary: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  status: string;
}

// Convert database row to StoredTrip
function rowToStoredTrip(row: TripRow): StoredTrip {
  return {
    id: row.id,
    tripDna: row.trip_dna as unknown as StoredTrip['tripDna'],
    itinerary: row.itinerary as unknown as StoredTrip['itinerary'],
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    syncedAt: new Date(),
    status: row.status as StoredTrip['status'],
  };
}

// Convert StoredTrip to database row format
function storedTripToRow(trip: StoredTrip): Omit<TripRow, 'created_at'> & { created_at?: string } {
  return {
    id: trip.id,
    trip_dna: trip.tripDna as unknown as Record<string, unknown>,
    itinerary: trip.itinerary as unknown as Record<string, unknown> | null,
    updated_at: new Date().toISOString(),
    status: trip.status,
  };
}

// Cached place data
export interface CachedPlace {
  id: string;
  google_place_id: string;
  name: string;
  city: string;
  place_type: string;
  place_data: Record<string, unknown>;
  image_url: string | null;
  created_at: string;
}

// Cached city info
export interface CachedCity {
  id: string;
  city_name: string;
  country: string | null;
  city_info: Record<string, unknown>;
  image_url: string | null;
  created_at: string;
}

// Place caching functions
export const supabasePlaces = {
  // Get cached place by Google Place ID
  async get(googlePlaceId: string): Promise<CachedPlace | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('cached_places')
      .select('*')
      .eq('google_place_id', googlePlaceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Supabase cached_places get error:', error);
      return null;
    }

    return data as CachedPlace;
  },

  // Get cached places for a city
  async getByCity(city: string, placeType?: string): Promise<CachedPlace[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase
      .from('cached_places')
      .select('*')
      .eq('city', city);

    if (placeType) {
      query = query.eq('place_type', placeType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase cached_places getByCity error:', error);
      return [];
    }

    return (data || []) as CachedPlace[];
  },

  // Save a cached place
  async save(place: Omit<CachedPlace, 'id' | 'created_at'>): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('cached_places')
      .upsert(place, { onConflict: 'google_place_id' });

    if (error) {
      console.error('Supabase cached_places save error:', error);
    }
  },

  // Check if Supabase is configured
  isConfigured(): boolean {
    return getSupabase() !== null;
  },
};

// City info caching functions
export const supabaseCities = {
  // Get cached city info
  async get(cityName: string, country?: string): Promise<CachedCity | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    let query = supabase
      .from('cached_cities')
      .select('*')
      .eq('city_name', cityName);

    if (country) {
      query = query.eq('country', country);
    }

    const { data, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      console.error('Supabase cached_cities get error:', error);
      return null;
    }

    return data as CachedCity;
  },

  // Save cached city info
  async save(city: Omit<CachedCity, 'id' | 'created_at'>): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('cached_cities')
      .upsert(city, { onConflict: 'city_name,country' });

    if (error) {
      console.error('Supabase cached_cities save error:', error);
    }
  },

  // Check if Supabase is configured
  isConfigured(): boolean {
    return getSupabase() !== null;
  },
};

// Image storage functions
export const supabaseStorage = {
  // Upload an image to Supabase storage
  async uploadImage(bucket: string, path: string, imageBuffer: ArrayBuffer, contentType: string = 'image/jpeg'): Promise<string | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return null;
    }

    // Get public URL
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Check if an image exists
  async exists(bucket: string, path: string): Promise<boolean> {
    const supabase = getSupabase();
    if (!supabase) return false;

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split('/').slice(0, -1).join('/'), {
        search: path.split('/').pop(),
      });

    if (error) return false;
    return data && data.length > 0;
  },

  // Get public URL for an image
  getPublicUrl(bucket: string, path: string): string | null {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },
};

export const supabaseTrips = {
  // Get all trips from Supabase
  async getAll(): Promise<StoredTrip[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase getAll error:', error);
      return [];
    }

    return (data || []).map(rowToStoredTrip);
  },

  // Get a single trip by ID
  async get(id: string): Promise<StoredTrip | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Supabase get error:', error);
      return null;
    }

    return rowToStoredTrip(data);
  },

  // Save (upsert) a trip
  async save(trip: StoredTrip): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const row = storedTripToRow(trip);

    const { error } = await supabase
      .from('trips')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Supabase save error:', error);
      throw error;
    }
  },

  // Delete a trip
  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('trips')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      throw error;
    }
  },

  // Sync local trips to cloud (upload all)
  async syncToCloud(localTrips: StoredTrip[]): Promise<void> {
    for (const trip of localTrips) {
      await this.save(trip);
    }
  },

  // Check if Supabase is configured
  isConfigured(): boolean {
    return getSupabase() !== null;
  },
};

// ============================================
// Planning States Sync
// ============================================
interface PlanningStateRow {
  trip_id: string;
  selected_ids: string[];
  selected_cities: string[];
  route_order: string[];
  country_order: string[];
  allocations: unknown;
  generated_days: unknown;
  phase: string;
  current_step_index: number;
  updated_at: string;
}

function rowToPlanningState(row: PlanningStateRow): PlanningState {
  return {
    tripId: row.trip_id,
    selectedIds: row.selected_ids || [],
    selectedCities: row.selected_cities || [],
    routeOrder: row.route_order || [],
    countryOrder: row.country_order || [],
    allocations: row.allocations as PlanningState['allocations'],
    generatedDays: row.generated_days as PlanningState['generatedDays'],
    phase: row.phase as PlanningState['phase'],
    currentStepIndex: row.current_step_index || 0,
    updatedAt: new Date(row.updated_at),
  };
}

function planningStateToRow(state: PlanningState): PlanningStateRow {
  return {
    trip_id: state.tripId,
    selected_ids: state.selectedIds || [],
    selected_cities: state.selectedCities || [],
    route_order: state.routeOrder || [],
    country_order: state.countryOrder || [],
    allocations: state.allocations,
    generated_days: state.generatedDays,
    phase: state.phase,
    current_step_index: state.currentStepIndex,
    updated_at: new Date().toISOString(),
  };
}

export const supabasePlanningStates = {
  async get(tripId: string): Promise<PlanningState | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('planning_states')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Supabase planning state get error:', error);
      return null;
    }

    return rowToPlanningState(data);
  },

  async save(state: PlanningState): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('planning_states')
      .upsert(planningStateToRow(state), { onConflict: 'trip_id' });

    if (error) {
      console.error('Supabase planning state save error:', error);
    }
  },

  async delete(tripId: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.from('planning_states').delete().eq('trip_id', tripId);
  },

  isConfigured(): boolean {
    return getSupabase() !== null;
  },
};

// ============================================
// Saved Places Sync
// ============================================
interface SavedPlaceRow {
  id: string;
  name: string;
  city: string;
  type: string;
  address: string | null;
  rating: number | null;
  price_level: string | null;
  image_url: string | null;
  description: string | null;
  tags: string[];
  notes: string | null;
  saved_at: string;
  source: string | null;
}

function rowToSavedPlace(row: SavedPlaceRow): SavedPlace {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    type: row.type as SavedPlace['type'],
    address: row.address || undefined,
    rating: row.rating || undefined,
    priceRange: row.price_level || undefined,
    imageUrl: row.image_url || undefined,
    description: row.description || undefined,
    tags: row.tags || [],
    notes: row.notes || undefined,
    savedAt: row.saved_at,
    source: (row.source as SavedPlace['source']) || 'manual',
  };
}

function savedPlaceToRow(place: SavedPlace): SavedPlaceRow {
  return {
    id: place.id,
    name: place.name,
    city: place.city,
    type: place.type,
    address: place.address || null,
    rating: place.rating || null,
    price_level: place.priceRange || null,
    image_url: place.imageUrl || null,
    description: place.description || null,
    tags: place.tags || [],
    notes: place.notes || null,
    saved_at: place.savedAt,
    source: place.source || 'manual',
  };
}

export const supabaseSavedPlaces = {
  async getAll(): Promise<SavedPlace[]> {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('saved_places')
      .select('*')
      .order('saved_at', { ascending: false });

    if (error) {
      console.error('Supabase saved places getAll error:', error);
      return [];
    }

    return (data || []).map(rowToSavedPlace);
  },

  async save(place: SavedPlace): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('saved_places')
      .upsert(savedPlaceToRow(place), { onConflict: 'id' });

    if (error) {
      console.error('Supabase saved place save error:', error);
    }
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.from('saved_places').delete().eq('id', id);
  },

  isConfigured(): boolean {
    return getSupabase() !== null;
  },
};

// ============================================
// Packing States Sync
// ============================================
interface PackingStateRow {
  trip_id: string;
  checked_items: string[];
  updated_at: string;
}

function rowToPackingState(row: PackingStateRow): PackingState {
  return {
    tripId: row.trip_id,
    checkedItems: row.checked_items || [],
    updatedAt: new Date(row.updated_at),
  };
}

function packingStateToRow(state: PackingState): PackingStateRow {
  return {
    trip_id: state.tripId,
    checked_items: state.checkedItems || [],
    updated_at: new Date().toISOString(),
  };
}

export const supabasePackingStates = {
  async get(tripId: string): Promise<PackingState | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('packing_states')
      .select('*')
      .eq('trip_id', tripId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Supabase packing state get error:', error);
      return null;
    }

    return rowToPackingState(data);
  },

  async save(state: PackingState): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('packing_states')
      .upsert(packingStateToRow(state), { onConflict: 'trip_id' });

    if (error) {
      console.error('Supabase packing state save error:', error);
    }
  },

  isConfigured(): boolean {
    return getSupabase() !== null;
  },
};

// ============================================
// User Preferences Sync
// ============================================
interface PreferencesRow {
  id: string;
  theme: string;
  default_currency: string;
  measurement_system: string;
  notifications: boolean;
  name: string | null;
  location: string | null;
  timezone: string | null;
  home_airport: string | null;
  travel_interests: string[];
}

function rowToPreferences(row: PreferencesRow): UserPreferences {
  return {
    id: row.id,
    theme: row.theme as UserPreferences['theme'],
    defaultCurrency: row.default_currency,
    measurementSystem: row.measurement_system as UserPreferences['measurementSystem'],
    notifications: row.notifications,
    name: row.name || undefined,
    location: row.location || undefined,
    timezone: row.timezone || undefined,
    homeAirport: row.home_airport || undefined,
    travelInterests: row.travel_interests as UserPreferences['travelInterests'],
  };
}

function preferencesToRow(prefs: UserPreferences): PreferencesRow {
  return {
    id: prefs.id || 'user',
    theme: prefs.theme,
    default_currency: prefs.defaultCurrency,
    measurement_system: prefs.measurementSystem,
    notifications: prefs.notifications,
    name: prefs.name || null,
    location: prefs.location || null,
    timezone: prefs.timezone || null,
    home_airport: prefs.homeAirport || null,
    travel_interests: prefs.travelInterests || [],
  };
}

export const supabasePreferences = {
  async get(): Promise<UserPreferences | null> {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('id', 'user')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Supabase preferences get error:', error);
      return null;
    }

    return rowToPreferences(data);
  },

  async save(prefs: UserPreferences): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    const { error } = await supabase
      .from('user_preferences')
      .upsert(preferencesToRow(prefs), { onConflict: 'id' });

    if (error) {
      console.error('Supabase preferences save error:', error);
    }
  },

  isConfigured(): boolean {
    return getSupabase() !== null;
  },
};
