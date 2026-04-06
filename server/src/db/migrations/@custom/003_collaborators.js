'use strict'

/**
 * Migration 002 – Collaborators
 * Creates the collaborators table for invitation-based workspace access.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'collaborators.sql'), 'utf8')
  await db.none(sql)
  console.log('[002_collaborators] applied schema: collaborators')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS collaborators CASCADE')
  console.log('[002_collaborators] rolled back collaborators schema')
}
