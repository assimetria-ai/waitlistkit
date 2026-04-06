'use strict'

/**
 * Migration 019 – Hashtag research tables
 * Creates hashtags, hashtag_sets, hashtag_set_items, and hashtag_performance tables.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'hashtags.sql'), 'utf8')
  await db.none(sql)
  console.log('[019_hashtags] applied schema: hashtags, hashtag_sets, hashtag_set_items, hashtag_performance')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS hashtag_performance CASCADE')
  await db.none('DROP TABLE IF EXISTS hashtag_set_items CASCADE')
  await db.none('DROP TABLE IF EXISTS hashtag_sets CASCADE')
  await db.none('DROP TABLE IF EXISTS hashtags CASCADE')
  console.log('[019_hashtags] rolled back: all hashtag tables')
}
