'use strict'

/**
 * Migration 006 – Chatbase settings table
 * Creates the chatbase_settings table for per-user Chatbase integration config.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'chatbase_settings.sql'), 'utf8')
  await db.none(sql)
  console.log('[006_chatbase] applied schema: chatbase_settings')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS chatbase_settings CASCADE')
  console.log('[006_chatbase] rolled back: chatbase_settings')
}
