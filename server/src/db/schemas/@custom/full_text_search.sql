-- @custom full-text search: GIN indexes on key fields
-- Enables fast FTS queries via to_tsvector across users, brands, collaborators, error_events.

-- users: search by name + email
CREATE INDEX IF NOT EXISTS idx_users_fts
  ON users USING GIN (
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(email, ''))
  );

-- brands: search by name + slug + description
CREATE INDEX IF NOT EXISTS idx_brands_fts
  ON brands USING GIN (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(slug, '') || ' ' || COALESCE(description, ''))
  );

-- collaborators: search by name + email
CREATE INDEX IF NOT EXISTS idx_collaborators_fts
  ON collaborators USING GIN (
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(email, ''))
  );

-- error_events: search by title + message + fingerprint
CREATE INDEX IF NOT EXISTS idx_error_events_fts
  ON error_events USING GIN (
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(message, '') || ' ' || COALESCE(fingerprint, ''))
  );
