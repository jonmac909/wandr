-- Migration: Add tables for full data sync across devices
-- Run this in Supabase SQL Editor or via CLI

-- Planning States table (trip curation progress)
CREATE TABLE IF NOT EXISTS planning_states (
  trip_id TEXT PRIMARY KEY,
  selected_ids TEXT[] DEFAULT '{}',
  selected_cities TEXT[] DEFAULT '{}',
  route_order TEXT[] DEFAULT '{}',
  country_order TEXT[] DEFAULT '{}',
  allocations JSONB,
  generated_days JSONB,
  phase TEXT DEFAULT 'picking',
  current_step_index INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved Places table (Explore feature bookmarks)
CREATE TABLE IF NOT EXISTS saved_places (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  type TEXT NOT NULL,
  address TEXT,
  rating REAL,
  price_level TEXT,
  image_url TEXT,
  description TEXT,
  opening_hours TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Packing States table (checklist progress)
CREATE TABLE IF NOT EXISTS packing_states (
  trip_id TEXT PRIMARY KEY,
  checked_items TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY DEFAULT 'user',
  theme TEXT DEFAULT 'system',
  default_currency TEXT DEFAULT 'USD',
  measurement_system TEXT DEFAULT 'metric',
  notifications BOOLEAN DEFAULT true,
  name TEXT,
  location TEXT,
  timezone TEXT,
  home_airport TEXT,
  travel_interests TEXT[] DEFAULT '{}'
);

-- Enable Row Level Security (optional - for multi-user support later)
-- ALTER TABLE planning_states ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_places ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE packing_states ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_saved_places_city ON saved_places(city);
CREATE INDEX IF NOT EXISTS idx_saved_places_type ON saved_places(type);
CREATE INDEX IF NOT EXISTS idx_planning_states_updated ON planning_states(updated_at);
