'use strict'

/**
 * Migration 001 – Error events table
 * Creates the error_events table for Sentry-style error tracking.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'error_events.sql'), 'utf8')
  await db.none(sql)
  console.log('[001_error_events] applied schema: error_events')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS error_events CASCADE')
  console.log('[001_error_events] rolled back: error_events')
}
