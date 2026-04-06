-- @custom — Chatbase integration settings per user
CREATE TABLE IF NOT EXISTS chatbase_settings (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chatbot_id  TEXT NOT NULL DEFAULT '',
  api_key     TEXT NOT NULL DEFAULT '',
  config      JSONB NOT NULL DEFAULT '{}',
  -- config fields: position, initial_message, theme_color, visibility
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS chatbase_settings_user_id_idx ON chatbase_settings(user_id);
