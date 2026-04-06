-- @custom error_events table for Sentry-style error tracking
CREATE TABLE IF NOT EXISTS error_events (
  id            SERIAL PRIMARY KEY,
  fingerprint   TEXT NOT NULL,
  title         TEXT NOT NULL,
  message       TEXT,
  level         TEXT NOT NULL DEFAULT 'error', -- 'fatal' | 'error' | 'warning' | 'info'
  platform      TEXT,                           -- 'node' | 'browser' | 'python' etc.
  environment   TEXT NOT NULL DEFAULT 'production',
  release       TEXT,
  status        TEXT NOT NULL DEFAULT 'unresolved', -- 'unresolved' | 'resolved' | 'ignored'
  times_seen    INTEGER NOT NULL DEFAULT 1,
  first_seen    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen     TIMESTAMPTZ NOT NULL DEFAULT now(),
  stack_trace   TEXT,
  extra         JSONB,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_events_fingerprint ON error_events(fingerprint);
CREATE INDEX IF NOT EXISTS idx_error_events_status ON error_events(status);
CREATE INDEX IF NOT EXISTS idx_error_events_level ON error_events(level);
CREATE INDEX IF NOT EXISTS idx_error_events_last_seen ON error_events(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_error_events_environment ON error_events(environment);
