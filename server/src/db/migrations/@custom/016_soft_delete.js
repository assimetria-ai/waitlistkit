'use strict'

/**
 * Migration 009 — Soft delete support on all primary models
 *
 * Adds a `deleted_at TIMESTAMPTZ` column to every entity table that
 * participates in the soft-delete pattern. A NULL value means the record
 * is active; a non-NULL value means it has been soft-deleted.
 *
 * Tables covered:
 *   1. users          – already has is_active; deleted_at is a stronger signal
 *   2. brands         – primary entity, needs full soft-delete
 *   3. collaborators  – workspace members
 *   4. error_events   – error tracking, archivable
 *   5. file_uploads   – user files, removable without S3 purge
 *
 * For each table we also create a partial index on `deleted_at IS NULL`
 * to keep common read queries fast.
 */

exports.up = async (db) => {
  await db.none(`
    -- 1. users
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_users_not_deleted
      ON users (id)
      WHERE deleted_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_users_deleted_at
      ON users (deleted_at)
      WHERE deleted_at IS NOT NULL;

    -- 2. brands
    ALTER TABLE brands
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_brands_not_deleted
      ON brands (id)
      WHERE deleted_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_brands_deleted_at
      ON brands (deleted_at)
      WHERE deleted_at IS NOT NULL;

    -- 3. collaborators
    ALTER TABLE collaborators
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_collaborators_not_deleted
      ON collaborators (id)
      WHERE deleted_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_collaborators_deleted_at
      ON collaborators (deleted_at)
      WHERE deleted_at IS NOT NULL;

    -- 4. error_events
    ALTER TABLE error_events
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_error_events_not_deleted
      ON error_events (id)
      WHERE deleted_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_error_events_deleted_at
      ON error_events (deleted_at)
      WHERE deleted_at IS NOT NULL;

    -- 5. file_uploads
    ALTER TABLE file_uploads
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

    CREATE INDEX IF NOT EXISTS idx_file_uploads_not_deleted
      ON file_uploads (id)
      WHERE deleted_at IS NULL;

    CREATE INDEX IF NOT EXISTS idx_file_uploads_deleted_at
      ON file_uploads (deleted_at)
      WHERE deleted_at IS NOT NULL;
  `)

  console.log('[009_soft_delete] applied — deleted_at added to 5 tables with partial indexes')
}

exports.down = async (db) => {
  await db.none(`
    -- Drop indexes first
    DROP INDEX IF EXISTS idx_users_not_deleted;
    DROP INDEX IF EXISTS idx_users_deleted_at;
    DROP INDEX IF EXISTS idx_brands_not_deleted;
    DROP INDEX IF EXISTS idx_brands_deleted_at;
    DROP INDEX IF EXISTS idx_collaborators_not_deleted;
    DROP INDEX IF EXISTS idx_collaborators_deleted_at;
    DROP INDEX IF EXISTS idx_error_events_not_deleted;
    DROP INDEX IF EXISTS idx_error_events_deleted_at;
    DROP INDEX IF EXISTS idx_file_uploads_not_deleted;
    DROP INDEX IF EXISTS idx_file_uploads_deleted_at;

    -- Drop columns
    ALTER TABLE users         DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE brands        DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE collaborators DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE error_events  DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE file_uploads  DROP COLUMN IF EXISTS deleted_at;
  `)

  console.log('[009_soft_delete] rolled back — deleted_at removed from 5 tables')
}
