'use strict'

/**
 * Migration 002 – Brands table
 * Creates the brands table for multi-brand workspace management.
 */

const fs = require('fs')
const path = require('path')

const SCHEMAS_DIR = path.join(__dirname, '../../schemas/@custom')

exports.up = async (db) => {
  const sql = fs.readFileSync(path.join(SCHEMAS_DIR, 'brands.sql'), 'utf8')
  await db.none(sql)
  console.log('[002_brands] applied schema: brands')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS brands CASCADE')
  console.log('[002_brands] rolled back: brands')
}
