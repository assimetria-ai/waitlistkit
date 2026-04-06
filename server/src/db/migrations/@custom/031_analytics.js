/**
 * @custom Migration: Analytics
 * Daily aggregated analytics and profile-level metrics.
 * post_metrics (019) handles per-post metrics; this covers account-level trends.
 */
async function up(db) {
  await db.none(`
    -- Daily account-level analytics snapshot
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

    -- Extend post_metrics with richer LinkedIn data
    ALTER TABLE post_metrics
      ADD COLUMN IF NOT EXISTS clicks     INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS saves      INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS reposts    INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS video_views INTEGER NOT NULL DEFAULT 0;

    COMMENT ON TABLE analytics_daily IS 'Daily aggregated account-level LinkedIn analytics';
    COMMENT ON COLUMN analytics_daily.engagement_rate IS 'Daily engagement rate as decimal (0.0523 = 5.23%)';
  `)
  console.log('  ✓ analytics_daily table created, post_metrics extended')
}

async function down(db) {
  await db.none(`
    ALTER TABLE post_metrics DROP COLUMN IF EXISTS video_views;
    ALTER TABLE post_metrics DROP COLUMN IF EXISTS reposts;
    ALTER TABLE post_metrics DROP COLUMN IF EXISTS saves;
    ALTER TABLE post_metrics DROP COLUMN IF EXISTS clicks;
    DROP TABLE IF EXISTS analytics_daily CASCADE;
  `)
}

module.exports = { up, down }
