'use strict'

/**
 * Migration 007 – file_uploads
 * Creates the file_uploads table for tracking S3 presigned URL uploads.
 */

const fs = require('fs')
const path = require('path')

exports.up = async (db) => {
  const sql = fs.readFileSync(
    path.join(__dirname, '../../schemas/@custom/file_uploads.sql'),
    'utf8',
  )
  await db.none(sql)
  console.log('[007_file_uploads] applied schema: file_uploads')
}

exports.down = async (db) => {
  await db.none('DROP TABLE IF EXISTS file_uploads CASCADE')
  console.log('[007_file_uploads] rolled back: file_uploads')
}
