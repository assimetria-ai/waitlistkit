-- @custom file_uploads table
-- Tracks files uploaded via presigned S3 URLs
CREATE TABLE IF NOT EXISTS file_uploads (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  key           TEXT NOT NULL UNIQUE,          -- S3 object key
  filename      TEXT NOT NULL,                 -- original filename from client
  content_type  TEXT NOT NULL,                 -- MIME type
  size_bytes    BIGINT,                        -- file size in bytes (set on confirm)
  bucket        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'uploaded' | 'failed'
  is_public     BOOLEAN NOT NULL DEFAULT false,  -- public/private toggle
  access_url    TEXT,                            -- separate shareable access URL
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at  TIMESTAMPTZ,
  deleted_at    TIMESTAMPTZ                      -- soft delete
);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id   ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status    ON file_uploads(status);
CREATE INDEX IF NOT EXISTS idx_file_uploads_key       ON file_uploads(key);
CREATE INDEX IF NOT EXISTS idx_file_uploads_is_public ON file_uploads(id) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_file_uploads_not_deleted ON file_uploads(id) WHERE deleted_at IS NULL;
