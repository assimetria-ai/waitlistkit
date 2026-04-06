'use strict'

/**
 * Migration 028 – Add brand_id FK to collaborators
 *
 * @system/012_brands_full_system_upgrade.js attempts to add brand_id to collaborators,
 * but collaborators is created by @custom/002_collaborators.js which runs after all
 * @system migrations. This migration ensures the column is added after the table exists.
 */

exports.up = async (db) => {
  await db.none(`
    ALTER TABLE collaborators
      ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE;
  `)
  await db.none('CREATE INDEX IF NOT EXISTS idx_collaborators_brand_id ON collaborators(brand_id)')
  console.log('[028] ✓ collaborators: added brand_id FK to brands')
}

exports.down = async (db) => {
  await db.none('DROP INDEX IF EXISTS idx_collaborators_brand_id')
  await db.none('ALTER TABLE collaborators DROP COLUMN IF EXISTS brand_id')
  console.log('[028] ✗ reverted collaborators.brand_id')
}
