'use strict'

/**
 * Migration 015 – Teams
 * Creates tables for multi-tenant team/workspace management:
 * - teams: workspaces that users can create and own
 * - team_members: many-to-many relationship between users and teams
 * - team_invitations: pending invites scoped to specific teams
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'teams.sql'), 'utf8')
  await db.none(sql)
  console.log('[015_teams] applied schema: teams, team_members, team_invitations')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS team_invitations CASCADE')
  await db.none('DROP TABLE IF EXISTS team_members CASCADE')
  await db.none('DROP TABLE IF EXISTS teams CASCADE')
  console.log('[015_teams] rolled back teams schema')
}
