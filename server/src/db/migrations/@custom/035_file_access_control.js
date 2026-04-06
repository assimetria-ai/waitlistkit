'use strict'

/**
 * Migration 027 — File access control, sharing, and soft delete enhancements
 *
 * Adds:
 *   1. is_public BOOLEAN on file_uploads — public/private toggle
 *   2. access_url TEXT on file_uploads — separate shareable URL
 *   3. file_shares table — email-based file sharing with tokens
 *
 * Note: deleted_at (soft delete) was already added in migration 009_soft_delete.
 */

const fs = require('fs')
const path = require('path')

exports.up = async (db) => {
  // 1. Add is_public and access_url to file_uploads
  await db.none(`
    ALTER TABLE file_uploads
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

    ALTER TABLE file_uploads
      ADD COLUMN IF NOT EXISTS access_url TEXT;

    CREATE INDEX IF NOT EXISTS idx_file_uploads_is_public
      ON file_uploads (id)
      WHERE is_public = true;
  `)

  // 2. Create file_shares table
  const sql = fs.readFileSync(
    path.join(__dirname, '../../schemas/@custom/file_shares.sql'),
    'utf8',
  )
  await db.none(sql)

  console.log('[027_file_access_control] applied — is_public, access_url added to file_uploads; file_shares table created')
}

exports.down = async (db) => {
  await db.none(`
    DROP TABLE IF EXISTS file_shares CASCADE;
    DROP INDEX IF EXISTS idx_file_uploads_is_public;
    ALTER TABLE file_uploads DROP COLUMN IF EXISTS access_url;
    ALTER TABLE file_uploads DROP COLUMN IF EXISTS is_public;
  `)

  console.log('[027_file_access_control] rolled back')
}
