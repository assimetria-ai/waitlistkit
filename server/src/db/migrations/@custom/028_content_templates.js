'use strict'

/**
 * Migration 020 – Content Templates table
 * Creates the content_templates table for reusable post templates.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'content_templates.sql'), 'utf8')
  await db.none(sql)
  console.log('[020_content_templates] applied schema: content_templates')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS content_templates CASCADE')
  console.log('[020_content_templates] rolled back: content_templates')
}
