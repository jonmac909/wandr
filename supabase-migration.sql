-- Supabase Migration: Create caching tables for Google Places data
-- Run this in the SQL Editor at: https://supabase.com/dashboard/project/flkcfzlhnwmfeqtbqzsr/sql/new

-- =============================================
-- Table: cached_places
-- Stores Google Places API data for attractions, restaurants, hotels, etc.
-- =============================================
CREATE TABLE IF NOT EXISTS cached_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  place_type TEXT,  -- 'attraction', 'restaurant', 'cafe', 'hotel', etc.
  place_data JSONB NOT NULL,  -- Full Google Places response
  image_url TEXT,  -- Cached image URL in Supabase storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups by city and type
CREATE INDEX IF NOT EXISTS idx_cached_places_city_type ON cached_places(city, place_type);

-- Index for Google Place ID lookups
CREATE INDEX IF NOT EXISTS idx_cached_places_google_id ON cached_places(google_place_id);

-- =============================================
-- Table: cached_cities (optional, for city info caching)
-- Stores city metadata and info
-- =============================================
CREATE TABLE IF NOT EXISTS cached_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_name TEXT NOT NULL,
  country TEXT,
  city_info JSONB NOT NULL,  -- bestFor, crowdLevel, topSites, etc.
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city_name, country)
);

-- Index for city lookups
CREATE INDEX IF NOT EXISTS idx_cached_cities_name ON cached_cities(city_name);

-- =============================================
-- Enable RLS (Row Level Security)
-- =============================================
ALTER TABLE cached_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE cached_cities ENABLE ROW LEVEL SECURITY;

-- Allow public read access (since this is cached public data)
CREATE POLICY "Allow public read access on cached_places"
  ON cached_places FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access on cached_cities"
  ON cached_cities FOR SELECT
  USING (true);

-- Allow service role to insert/update (for API routes)
CREATE POLICY "Allow service role insert on cached_places"
  ON cached_places FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role update on cached_places"
  ON cached_places FOR UPDATE
  USING (true);

CREATE POLICY "Allow service role insert on cached_cities"
  ON cached_cities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow service role update on cached_cities"
  ON cached_cities FOR UPDATE
  USING (true);

-- =============================================
-- Success message
-- =============================================
SELECT 'Tables created successfully!' as status;
