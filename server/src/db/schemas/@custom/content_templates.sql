-- @custom content_templates table
-- Reusable content templates for post creation
CREATE TABLE IF NOT EXISTS content_templates (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'general', -- e.g. 'hook', 'story', 'carousel', 'general'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_templates_user_id   ON content_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_content_templates_category  ON content_templates(category);

COMMENT ON TABLE content_templates IS 'Reusable content templates organized by category';
COMMENT ON COLUMN content_templates.category IS 'Template category: hook, story, carousel, general, etc.';
