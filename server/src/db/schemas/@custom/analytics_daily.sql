-- @custom analytics_daily table
-- Daily aggregated account-level LinkedIn analytics

CREATE TABLE IF NOT EXISTS analytics_daily (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_account_id INTEGER REFERENCES linkedin_accounts(id) ON DELETE CASCADE,
  date                DATE NOT NULL,
  impressions         INTEGER NOT NULL DEFAULT 0,
  engagements         INTEGER NOT NULL DEFAULT 0,
  followers_gained    INTEGER NOT NULL DEFAULT 0,
  followers_lost      INTEGER NOT NULL DEFAULT 0,
  profile_views       INTEGER NOT NULL DEFAULT 0,
  posts_published     INTEGER NOT NULL DEFAULT 0,
  engagement_rate     NUMERIC(7, 4) DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_daily_unique
  ON analytics_daily(user_id, linkedin_account_id, date);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_user_date
  ON analytics_daily(user_id, date DESC);

COMMENT ON TABLE analytics_daily IS 'Daily aggregated account-level LinkedIn analytics';
COMMENT ON COLUMN analytics_daily.engagement_rate IS 'Daily engagement rate as decimal (0.0523 = 5.23%)';
