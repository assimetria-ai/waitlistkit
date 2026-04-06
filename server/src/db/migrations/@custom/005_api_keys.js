'use strict'

/**
 * Migration 003 (custom) — api_keys table with full schema.
 *
 * The @system 004_api_keys.js creates a minimal api_keys table.
 * This migration adds the additional columns (scopes, is_active, updated_at)
 * that the application layer expects. It handles both cases:
 *   1. Table doesn't exist yet → created with all columns
 *   2. Table already exists (from system migration) → columns are added via ALTER TABLE
 */

exports.up = async (db) => {
  // Create table with all columns (handles fresh DB)
  await db.none(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id           SERIAL PRIMARY KEY,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT NOT NULL,
      key_prefix   TEXT NOT NULL,
      key_hash     TEXT NOT NULL UNIQUE,
      scopes       TEXT[] NOT NULL DEFAULT '{}',
      last_used_at TIMESTAMPTZ,
      expires_at   TIMESTAMPTZ,
      is_active    BOOLEAN NOT NULL DEFAULT TRUE,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // Add columns in case table already existed without them (handles system migration ran first)
  await db.none(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes TEXT[] NOT NULL DEFAULT '{}'`)
  await db.none(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE`)
  await db.none(`ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`)

  // Ensure indexes exist
  await db.none(`CREATE INDEX IF NOT EXISTS idx_api_keys_user_id   ON api_keys(user_id)`)
  await db.none(`CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash  ON api_keys(key_hash)`)
  await db.none(`CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active)`)

  console.log('[003_api_keys] applied schema: api_keys')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS api_keys CASCADE')
  console.log('[003_api_keys] rolled back: api_keys')
}
