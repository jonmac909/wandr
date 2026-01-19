-- API Cache table for storing cached API responses
-- Used by city-image, site-image, recommendations, etc.

CREATE TABLE IF NOT EXISTS api_cache (
  id TEXT PRIMARY KEY,
  cache_type TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Indexes for faster lookups and cache cleanup
CREATE INDEX IF NOT EXISTS idx_api_cache_type ON api_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires ON api_cache(expires_at);

-- Enable Row Level Security
ALTER TABLE api_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access (cached data is not sensitive)
CREATE POLICY "Allow public read on api_cache"
  ON api_cache FOR SELECT
  USING (true);

-- Allow insert for caching
CREATE POLICY "Allow insert on api_cache"
  ON api_cache FOR INSERT
  WITH CHECK (true);

-- Allow update for cache refresh
CREATE POLICY "Allow update on api_cache"
  ON api_cache FOR UPDATE
  USING (true);

-- Allow delete for cache cleanup
CREATE POLICY "Allow delete on api_cache"
  ON api_cache FOR DELETE
  USING (true);

-- Function to clean up expired cache entries (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_api_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM api_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
