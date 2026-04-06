'use strict'

/**
 * Migration – add email_notifications JSONB column to users table
 *
 * Stores per-user email notification preferences as a JSON object.
 * Default: all categories enabled except marketing.
 */

exports.up = async (db) => {
  await db.none(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_notifications JSONB NOT NULL DEFAULT '{
      "security": true,
      "billing": true,
      "activity": false,
      "marketing": false
    }'::jsonb
  `)
  console.log('[010_email_notification_prefs] applied')
}

exports.down = async (db) => {
  await db.none('ALTER TABLE users DROP COLUMN IF EXISTS email_notifications')
  console.log('[010_email_notification_prefs] rolled back')
}
