'use strict'

/**
 * Migration 014 – Clips table
 * Creates the clips table for the media asset library (tag-based search).
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'clips.sql'), 'utf8')
  await db.none(sql)
  console.log('[014_clips] applied schema: clips')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS clips CASCADE')
  console.log('[014_clips] rolled back: clips')
}
