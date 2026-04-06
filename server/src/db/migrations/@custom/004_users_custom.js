'use strict'

/**
 * Migration 002 – Custom user profile extensions
 * Adds product-specific columns to the @system users table:
 *   - avatar_url, bio, preferences (JSONB), last_login_at, is_active
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'users_custom.sql'), 'utf8')
  await db.none(sql)
  console.log('[002_users_custom] applied custom user profile extensions')
}

exports.down = async (db) => {
  await db.none('DROP INDEX IF EXISTS idx_users_last_login')
  await db.none('DROP INDEX IF EXISTS idx_users_is_active')
  await db.none(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS is_active,
      DROP COLUMN IF EXISTS last_login_at,
      DROP COLUMN IF EXISTS preferences,
      DROP COLUMN IF EXISTS bio,
      DROP COLUMN IF EXISTS avatar_url
  `)
  console.log('[002_users_custom] rolled back custom user profile extensions')
}
