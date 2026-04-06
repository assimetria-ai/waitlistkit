-- @custom file_shares table
-- Tracks file sharing permissions by email
CREATE TABLE IF NOT EXISTS file_shares (
  id            SERIAL PRIMARY KEY,
  file_id       INTEGER NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
  shared_by     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  permission    TEXT NOT NULL DEFAULT 'view', -- 'view' | 'download' | 'edit'
  token         TEXT NOT NULL UNIQUE,          -- unique share token for access_url
  expires_at    TIMESTAMPTZ,                   -- optional expiry
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ                    -- soft-revoke
);

CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_email ON file_shares(shared_with_email);
CREATE INDEX IF NOT EXISTS idx_file_shares_shared_with_user_id ON file_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_token ON file_shares(token);
CREATE INDEX IF NOT EXISTS idx_file_shares_not_revoked ON file_shares(file_id) WHERE revoked_at IS NULL;
