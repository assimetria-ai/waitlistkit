-- @custom clips table — media asset library for Splice
-- Tags stored as TEXT[] for efficient array operations and GIN-indexed search
CREATE TABLE IF NOT EXISTS clips (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  file_key     TEXT,                          -- storage object key
  file_url     TEXT,                          -- resolved URL
  thumbnail_url TEXT,
  duration     NUMERIC(10,3),                 -- seconds, nullable for non-video
  size_bytes   BIGINT,
  mime_type    TEXT,
  type         TEXT NOT NULL DEFAULT 'video', -- 'video' | 'audio' | 'image'
  tags         TEXT[] NOT NULL DEFAULT '{}',
  color        TEXT,                          -- dominant colour hex for UI
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clips_user_id    ON clips(user_id);
CREATE INDEX IF NOT EXISTS idx_clips_type       ON clips(type);
CREATE INDEX IF NOT EXISTS idx_clips_tags       ON clips USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_clips_created    ON clips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clips_deleted    ON clips(deleted_at) WHERE deleted_at IS NULL;
