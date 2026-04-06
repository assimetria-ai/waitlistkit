/**
 * @custom Migration: Schedules
 * Scheduling slots and queue management for LinkedIn posts.
 * Users define weekly time slots; the scheduler fills them from the post queue.
 */
async function up(db) {
  await db.none(`
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

    CREATE INDEX IF NOT EXISTS idx_schedules_user_id
      ON schedules(user_id);

    -- Weekly time slots for a schedule (e.g. Monday 09:00, Wednesday 14:30)
    CREATE TABLE IF NOT EXISTS schedule_slots (
      id          SERIAL PRIMARY KEY,
      schedule_id INTEGER NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
      day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
      time_of_day TIME NOT NULL,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_schedule_slots_schedule_id
      ON schedule_slots(schedule_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_schedule_slots_unique
      ON schedule_slots(schedule_id, day_of_week, time_of_day);

    -- Add linkedin_account_id to posts for multi-account support
    ALTER TABLE posts
      ADD COLUMN IF NOT EXISTS linkedin_account_id INTEGER REFERENCES linkedin_accounts(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS linkedin_post_id TEXT,
      ADD COLUMN IF NOT EXISTS schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_posts_linkedin_account_id
      ON posts(linkedin_account_id);
    CREATE INDEX IF NOT EXISTS idx_posts_linkedin_post_id
      ON posts(linkedin_post_id) WHERE linkedin_post_id IS NOT NULL;

    COMMENT ON TABLE schedules IS 'User-defined publishing schedules with timezone support';
    COMMENT ON TABLE schedule_slots IS 'Recurring weekly time slots within a schedule';
    COMMENT ON COLUMN posts.linkedin_post_id IS 'LinkedIn URN/ID after publishing';
  `)
  console.log('  ✓ schedules + schedule_slots tables created, posts extended')
}

async function down(db) {
  await db.none(`
    ALTER TABLE posts DROP COLUMN IF EXISTS schedule_id;
    ALTER TABLE posts DROP COLUMN IF EXISTS linkedin_post_id;
    ALTER TABLE posts DROP COLUMN IF EXISTS linkedin_account_id;
    DROP TABLE IF EXISTS schedule_slots CASCADE;
    DROP TABLE IF EXISTS schedules CASCADE;
  `)
}

module.exports = { up, down }
