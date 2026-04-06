'use strict'

/**
 * Migration 018 – Posts table
 * Creates the posts table for LinkedIn-style post scheduling and publishing.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'posts.sql'), 'utf8')
  await db.none(sql)
  console.log('[018_posts] applied schema: posts')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS posts CASCADE')
  console.log('[018_posts] rolled back: posts')
}
