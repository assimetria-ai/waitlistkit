-- @custom leads table
-- Lead generation from LinkedIn post engagement

CREATE TABLE IF NOT EXISTS leads (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_account_id INTEGER REFERENCES linkedin_accounts(id) ON DELETE SET NULL,
  linkedin_id         TEXT,
  name                TEXT NOT NULL,
  headline            TEXT,
  profile_url         TEXT,
  profile_image       TEXT,
  company             TEXT,
  job_title           TEXT,
  location            TEXT,
  source              TEXT NOT NULL DEFAULT 'engagement',
  source_post_id      INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  score               INTEGER NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'new',
  notes               TEXT,
  tags                TEXT[] DEFAULT '{}',
  engagement_count    INTEGER NOT NULL DEFAULT 1,
  first_engaged_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_engaged_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_linkedin_id ON leads(linkedin_id) WHERE linkedin_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_leads_last_engaged ON leads(user_id, last_engaged_at DESC);

-- Lead lists for outreach campaigns
CREATE TABLE IF NOT EXISTS lead_lists (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_lists_user_id ON lead_lists(user_id);

CREATE TABLE IF NOT EXISTS lead_list_members (
  id          SERIAL PRIMARY KEY,
  lead_list_id INTEGER NOT NULL REFERENCES lead_lists(id) ON DELETE CASCADE,
  lead_id     INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_list_members_unique
  ON lead_list_members(lead_list_id, lead_id);

COMMENT ON TABLE leads IS 'Potential leads captured from LinkedIn post engagement and profile visits';
COMMENT ON COLUMN leads.score IS 'Lead score 0-100 based on engagement frequency and profile match';
COMMENT ON COLUMN leads.source IS 'engagement | profile_visit | comment | like | manual';
COMMENT ON COLUMN leads.status IS 'new | contacted | qualified | converted | archived';
COMMENT ON TABLE lead_lists IS 'User-created lists for organizing leads into outreach campaigns';
