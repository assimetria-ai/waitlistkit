-- @custom collaborators table
-- Represents users who have been invited to collaborate on an account/workspace.
-- Supports invitation flow (pending → active) with role-based access.
CREATE TABLE IF NOT EXISTS collaborators (
  id            SERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  name          TEXT,
  role          TEXT NOT NULL DEFAULT 'member',    -- 'owner' | 'admin' | 'member' | 'viewer'
  status        TEXT NOT NULL DEFAULT 'pending',   -- 'pending' | 'active' | 'revoked'
  invited_by    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  brand_id      INTEGER REFERENCES brands(id) ON DELETE CASCADE,
  invite_token  TEXT UNIQUE,
  accepted_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collaborators_email ON collaborators(email);
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON collaborators(status);
CREATE INDEX IF NOT EXISTS idx_collaborators_user_id ON collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_invite_token ON collaborators(invite_token);
CREATE INDEX IF NOT EXISTS idx_collaborators_brand_id ON collaborators(brand_id);
