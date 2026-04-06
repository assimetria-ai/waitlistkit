-- @custom hashtags tables
-- Stores hashtag research data: industry hashtags, saved sets, and performance tracking

-- Main hashtags table — stores individual hashtag data
CREATE TABLE IF NOT EXISTS hashtags (
  id              SERIAL PRIMARY KEY,
  tag             TEXT NOT NULL UNIQUE,
  industry        TEXT,
  topic           TEXT,
  reach           INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5,2) DEFAULT 0.00,
  trending        BOOLEAN DEFAULT false,
  post_count      INTEGER DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hashtags_tag ON hashtags(tag);
CREATE INDEX IF NOT EXISTS idx_hashtags_industry ON hashtags(industry);
CREATE INDEX IF NOT EXISTS idx_hashtags_topic ON hashtags(topic);
CREATE INDEX IF NOT EXISTS idx_hashtags_trending ON hashtags(trending) WHERE trending = true;
CREATE INDEX IF NOT EXISTS idx_hashtags_reach ON hashtags(reach DESC);

-- Hashtag sets — user-curated groups of hashtags
CREATE TABLE IF NOT EXISTS hashtag_sets (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hashtag_sets_user_id ON hashtag_sets(user_id);

-- Join table linking sets to hashtags
CREATE TABLE IF NOT EXISTS hashtag_set_items (
  id             SERIAL PRIMARY KEY,
  hashtag_set_id INTEGER NOT NULL REFERENCES hashtag_sets(id) ON DELETE CASCADE,
  hashtag_id     INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  added_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hashtag_set_id, hashtag_id)
);

CREATE INDEX IF NOT EXISTS idx_hashtag_set_items_set ON hashtag_set_items(hashtag_set_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_set_items_tag ON hashtag_set_items(hashtag_id);

-- Hashtag performance tracking — per-user usage analytics
CREATE TABLE IF NOT EXISTS hashtag_performance (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hashtag_id   INTEGER NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  post_id      INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  impressions  INTEGER DEFAULT 0,
  engagements  INTEGER DEFAULT 0,
  tracked_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hashtag_perf_user ON hashtag_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_perf_hashtag ON hashtag_performance(hashtag_id);
CREATE INDEX IF NOT EXISTS idx_hashtag_perf_tracked ON hashtag_performance(tracked_at DESC);

COMMENT ON TABLE hashtags IS 'LinkedIn hashtag research data with reach and engagement metrics';
COMMENT ON TABLE hashtag_sets IS 'User-curated sets of hashtags for quick reuse';
COMMENT ON TABLE hashtag_performance IS 'Per-user hashtag performance tracking over time';
