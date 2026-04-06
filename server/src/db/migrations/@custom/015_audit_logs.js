'use strict'

/**
 * Migration 009 – Audit log table
 * Records who changed what, when across all resources.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'audit_logs.sql'), 'utf8')
  await db.none(sql)
  console.log('[009_audit_logs] applied schema: audit_logs')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS audit_logs CASCADE')
  console.log('[009_audit_logs] rolled back: audit_logs')
}
