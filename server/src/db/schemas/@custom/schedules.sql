-- @custom schedules table
-- Publishing schedules with recurring weekly time slots

CREATE TABLE IF NOT EXISTS schedules (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linkedin_account_id INTEGER REFERENCES linkedin_accounts(id) ON DELETE SET NULL,
  name                TEXT NOT NULL DEFAULT 'Default',
  timezone            TEXT NOT NULL DEFAULT 'UTC',
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules(user_id);

-- Weekly time slots for a schedule
CREATE TABLE IF NOT EXISTS schedule_slots (
  id          SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_of_day TIME NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_slots_schedule_id ON schedule_slots(schedule_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_slots_unique
  ON schedule_slots(schedule_id, day_of_week, time_of_day);

COMMENT ON TABLE schedules IS 'User-defined publishing schedules with timezone support';
COMMENT ON TABLE schedule_slots IS 'Recurring weekly time slots (0=Sun..6=Sat)';
