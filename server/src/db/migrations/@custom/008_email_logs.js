'use strict'

/**
 * Migration 004 – Email logs table
 * Creates the email_logs table for transactional email tracking.
 */

const path = require('path')
const fs = require('fs')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'email_logs.sql'), 'utf8')
  await db.none(sql)
  console.log('[004_email_logs] applied schema: email_logs')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS email_logs CASCADE')
  console.log('[004_email_logs] rolled back: email_logs')
}
