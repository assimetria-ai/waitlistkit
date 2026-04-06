-- @custom brands table
CREATE TABLE IF NOT EXISTS brands (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  description      TEXT,
  logo_url         TEXT,
  website_url      TEXT,
  primary_color    TEXT,
  secondary_color  TEXT,
  status           TEXT NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'archived'
  settings         JSONB,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
CREATE INDEX IF NOT EXISTS idx_brands_status ON brands(status);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
