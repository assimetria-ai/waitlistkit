'use strict'

/**
 * Migration 003 – Invitation Tokens
 * Creates the invitation_tokens table for collaborator invite lifecycle management.
 * Decouples token expiry, revocation and reuse tracking from the collaborators table.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'invitation_tokens.sql'), 'utf8')
  await db.none(sql)
  console.log('[003_invitation_tokens] applied schema: invitation_tokens')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS invitation_tokens CASCADE')
  console.log('[003_invitation_tokens] rolled back invitation_tokens schema')
}
