-- Add source column to saved_places table
ALTER TABLE saved_places ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';
