-- @custom api_keys table
-- Stores API keys for programmatic access to the platform.
-- Keys are stored as a SHA-256 hash; only the prefix is stored in plain text
-- so users can identify which key is which without exposing the secret.
CREATE TABLE IF NOT EXISTS api_keys (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,                        -- human-readable label, e.g. "Production key"
  key_prefix  TEXT NOT NULL,                        -- first 8 chars of the raw key, e.g. "ak_live_"
  key_hash    TEXT NOT NULL UNIQUE,                 -- SHA-256 hex of the full raw key
  scopes      TEXT[] NOT NULL DEFAULT '{}',         -- e.g. ARRAY['read', 'write']
  last_used_at TIMESTAMPTZ,
  expires_at  TIMESTAMPTZ,                          -- NULL = never expires
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id   ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash   ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active  ON api_keys(is_active);
