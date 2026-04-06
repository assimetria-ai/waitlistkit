'use strict'

/**
 * Migration 016 – Permissions
 * Creates granular permissions system:
 * - permissions: registry of all available permissions
 * - role_permissions: default permissions for each role
 * - user_permissions: per-user permission overrides
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'permissions.sql'), 'utf8')
  await db.none(sql)
  console.log('[016_permissions] applied schema: permissions, role_permissions, user_permissions')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS user_permissions CASCADE')
  await db.none('DROP TABLE IF EXISTS role_permissions CASCADE')
  await db.none('DROP TABLE IF EXISTS permissions CASCADE')
  console.log('[016_permissions] rolled back permissions schema')
}
