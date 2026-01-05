import { createClient } from '@supabase/supabase-js';
import type { StoredTrip } from './indexed-db';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

export const supabaseTrips = {
  // Get all trips from Supabase
  async getAll(): Promise<StoredTrip[]> {
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
    return Boolean(supabaseUrl && supabaseAnonKey);
  },
};
