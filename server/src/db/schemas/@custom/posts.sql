-- @custom posts table
-- Stores LinkedIn-style posts with scheduling and publishing support
CREATE TABLE IF NOT EXISTS posts (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  scheduled_for   TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'scheduled' | 'published' | 'failed'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id       ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status         ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for  ON posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_published_at   ON posts(published_at DESC) WHERE status = 'published';

COMMENT ON TABLE posts IS 'User posts with scheduling and publishing workflow';
COMMENT ON COLUMN posts.status IS 'Post lifecycle: draft → scheduled → published (or failed)';
