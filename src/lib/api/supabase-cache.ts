/**
 * Supabase-based persistent cache for API responses
 * Stores city info, images, and places data to avoid repeated API calls
 * 
 * Required Supabase table:
 * 
 * CREATE TABLE api_cache (
 *   id TEXT PRIMARY KEY,
 *   cache_type TEXT NOT NULL,
 *   data JSONB NOT NULL,
 *   created_at TIMESTAMPTZ DEFAULT NOW(),
 *   expires_at TIMESTAMPTZ NOT NULL
 * );
 * 
 * CREATE INDEX idx_api_cache_type ON api_cache(cache_type);
 * CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache TTLs in milliseconds
export const CACHE_TTL = {
  CITY_INFO: 7 * 24 * 60 * 60 * 1000,      // 7 days - city info rarely changes
  CITY_IMAGE: 365 * 24 * 60 * 60 * 1000,   // 365 days - images are stable
  PLACE_DETAILS: 7 * 24 * 60 * 60 * 1000,  // 7 days
  RESTAURANTS: 24 * 60 * 60 * 1000,        // 1 day - restaurants change more often
  RECOMMENDATIONS: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export type CacheType = 'city_info' | 'city_image' | 'place_details' | 'restaurants' | 'recommendations';

// Lazy initialization
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

/**
 * Generate a cache key from type and identifier
 */
export function getCacheKey(type: CacheType, identifier: string): string {
  return `${type}:${identifier.toLowerCase().trim()}`;
}

/**
 * Get cached data from Supabase
 */
export async function getFromCache<T>(type: CacheType, identifier: string): Promise<T | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const cacheKey = getCacheKey(type, identifier);

  try {
    const { data, error } = await supabase
      .from('api_cache')
      .select('data, expires_at')
      .eq('id', cacheKey)
      .single();

    if (error || !data) {
      return null;
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired entry (fire and forget)
      supabase.from('api_cache').delete().eq('id', cacheKey).then(() => {});
      return null;
    }

    return data.data as T;
  } catch (err) {
    console.error('[Cache] Error reading from cache:', err);
    return null;
  }
}

/**
 * Save data to Supabase cache
 */
export async function saveToCache(
  type: CacheType,
  identifier: string,
  data: unknown,
  ttlMs?: number
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const cacheKey = getCacheKey(type, identifier);
  const ttl = ttlMs || getTTLForType(type);
  const expiresAt = new Date(Date.now() + ttl).toISOString();

  try {
    await supabase
      .from('api_cache')
      .upsert({
        id: cacheKey,
        cache_type: type,
        data,
        expires_at: expiresAt,
      }, { onConflict: 'id' });
  } catch (err) {
    console.error('[Cache] Error saving to cache:', err);
  }
}

/**
 * Get TTL for a cache type
 */
function getTTLForType(type: CacheType): number {
  switch (type) {
    case 'city_info': return CACHE_TTL.CITY_INFO;
    case 'city_image': return CACHE_TTL.CITY_IMAGE;
    case 'place_details': return CACHE_TTL.PLACE_DETAILS;
    case 'restaurants': return CACHE_TTL.RESTAURANTS;
    case 'recommendations': return CACHE_TTL.RECOMMENDATIONS;
    default: return CACHE_TTL.CITY_INFO;
  }
}
