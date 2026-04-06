-- @custom invitation_tokens table
-- Dedicated token store for collaborator invitations.
-- Decouples token lifecycle (expiry, revocation, reuse) from the collaborators table.
CREATE TABLE IF NOT EXISTS invitation_tokens (
  id               SERIAL PRIMARY KEY,
  token            TEXT        NOT NULL UNIQUE,
  email            TEXT        NOT NULL,
  role             TEXT        NOT NULL DEFAULT 'member',   -- 'admin' | 'member' | 'viewer'
  invited_by       INTEGER     REFERENCES users(id) ON DELETE SET NULL,
  collaborator_id  INTEGER     REFERENCES collaborators(id) ON DELETE CASCADE,
  expires_at       TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at      TIMESTAMPTZ,
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token          ON invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_email          ON invitation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_collaborator   ON invitation_tokens(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_invited_by     ON invitation_tokens(invited_by);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_expires_at     ON invitation_tokens(expires_at);
