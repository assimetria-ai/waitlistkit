-- @custom post_metrics table
-- Tracks engagement metrics for published posts
CREATE TABLE IF NOT EXISTS post_metrics (
  id              SERIAL PRIMARY KEY,
  post_id         INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  likes           INTEGER NOT NULL DEFAULT 0,
  comments        INTEGER NOT NULL DEFAULT 0,
  shares          INTEGER NOT NULL DEFAULT 0,
  impressions     INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(5, 4) NOT NULL DEFAULT 0, -- e.g. 0.0523 = 5.23%
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_post_metrics_post_id ON post_metrics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_metrics_engagement     ON post_metrics(engagement_rate DESC);

COMMENT ON TABLE post_metrics IS 'Engagement metrics snapshot per post (likes, comments, shares, impressions)';
COMMENT ON COLUMN post_metrics.engagement_rate IS 'Calculated engagement rate as decimal (0.0523 = 5.23%)';
