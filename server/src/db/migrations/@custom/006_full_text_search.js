'use strict'

/**
 * Migration 003 – Full-text search GIN indexes
 *
 * Adds GIN indexes using to_tsvector on key searchable fields across:
 *   - users      (name, email)
 *   - brands     (name, slug, description)
 *   - collaborators (name, email)
 *   - error_events  (title, message, fingerprint)
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'full_text_search.sql'), 'utf8')
  await db.none(sql)
  console.log('[003_full_text_search] GIN indexes created on users, brands, collaborators, error_events')
}

exports.down = async (db) => {
  await db.none('DROP INDEX IF EXISTS idx_users_fts')
  await db.none('DROP INDEX IF EXISTS idx_brands_fts')
  await db.none('DROP INDEX IF EXISTS idx_collaborators_fts')
  await db.none('DROP INDEX IF EXISTS idx_error_events_fts')
  console.log('[003_full_text_search] GIN indexes dropped')
}
