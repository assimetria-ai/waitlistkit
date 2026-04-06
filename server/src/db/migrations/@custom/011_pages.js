'use strict'

/**
 * Migration 005 – Pages table
 * Creates the pages table for CMS-style content management.
 */

const path = require('path')
const fs = require('fs')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'pages.sql'), 'utf8')
  await db.none(sql)
  console.log('[005_pages] applied schema: pages')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS pages CASCADE')
  console.log('[005_pages] rolled back: pages')
}
