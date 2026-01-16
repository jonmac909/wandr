-- Image cache table for Google Places Photos
-- Caches photo URLs to reduce API costs

CREATE TABLE IF NOT EXISTS image_cache (
  id TEXT PRIMARY KEY,  -- Format: "city:Paris" or "site:Eiffel Tower-Paris"
  photo_url TEXT NOT NULL,
  photo_urls TEXT[],  -- Array of multiple photo URLs for variety
  place_id TEXT,
  source TEXT DEFAULT 'google',  -- 'google', 'pexels', 'fallback'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Index for faster lookups and cache cleanup
CREATE INDEX IF NOT EXISTS idx_image_cache_expires ON image_cache(expires_at);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_image_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM image_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
