'use strict'

/**
 * Migration 019 – Post Metrics table
 * Creates the post_metrics table for tracking engagement data per post.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'post_metrics.sql'), 'utf8')
  await db.none(sql)
  console.log('[019_post_metrics] applied schema: post_metrics')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS post_metrics CASCADE')
  console.log('[019_post_metrics] rolled back: post_metrics')
}
