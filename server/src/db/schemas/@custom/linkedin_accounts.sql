-- @custom linkedin_accounts table
-- Connected LinkedIn profiles for publishing and analytics

CREATE TABLE IF NOT EXISTS linkedin_accounts (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_id     TEXT NOT NULL,
  access_token    TEXT NOT NULL,
  refresh_token   TEXT,
  token_expires_at TIMESTAMPTZ,
  profile_name    TEXT,
  profile_url     TEXT,
  profile_image   TEXT,
  headline        TEXT,
  follower_count  INTEGER DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  last_synced_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_linkedin_accounts_linkedin_id
  ON linkedin_accounts(linkedin_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_user_id
  ON linkedin_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_active
  ON linkedin_accounts(user_id) WHERE is_active = true;

COMMENT ON TABLE linkedin_accounts IS 'Connected LinkedIn profiles for publishing and analytics';
COMMENT ON COLUMN linkedin_accounts.access_token IS 'OAuth2 access token (encrypted at app level)';
COMMENT ON COLUMN linkedin_accounts.follower_count IS 'Cached follower count, updated on sync';
