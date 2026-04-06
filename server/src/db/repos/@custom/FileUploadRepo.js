// @custom — FileUploadRepo
// Tracks file uploads initiated via S3 presigned URLs.

const db = require('../../../lib/@system/PostgreSQL')

const FileUploadRepo = {
  async create({ user_id, key, filename, content_type, bucket, metadata, is_public = false }) {
    return db.one(
      `INSERT INTO file_uploads (user_id, key, filename, content_type, bucket, status, metadata, is_public)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7)
       RETURNING *`,
      [user_id ?? null, key, filename, content_type, bucket, metadata ? JSON.stringify(metadata) : null, is_public],
    )
  },

  async findById(id) {
    return db.oneOrNone('SELECT * FROM file_uploads WHERE id = $1 AND deleted_at IS NULL', [id])
  },

  async findByIdIncludingDeleted(id) {
    return db.oneOrNone('SELECT * FROM file_uploads WHERE id = $1', [id])
  },

  async findByKey(key) {
    return db.oneOrNone('SELECT * FROM file_uploads WHERE key = $1 AND deleted_at IS NULL', [key])
  },

  async confirm(id, { size_bytes } = {}) {
    return db.oneOrNone(
      `UPDATE file_uploads
       SET status = 'uploaded', confirmed_at = now(), size_bytes = COALESCE($2, size_bytes)
       WHERE id = $1
       RETURNING *`,
      [id, size_bytes ?? null],
    )
  },

  async markFailed(id) {
    return db.oneOrNone(
      `UPDATE file_uploads SET status = 'failed' WHERE id = $1 RETURNING *`,
      [id],
    )
  },

  async findByUserId(user_id, { limit = 50, offset = 0, status, include_deleted = false } = {}) {
    const conditions = ['user_id = $1']
    const values = [user_id]
    let idx = 2

    if (!include_deleted) conditions.push('deleted_at IS NULL')
    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    values.push(limit, offset)

    return db.any(
      `SELECT * FROM file_uploads
       WHERE ${conditions.join(' AND ')}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  // ── Soft delete ──────────────────────────────────────────────────────────────

  async softDelete(id) {
    return db.oneOrNone(
      `UPDATE file_uploads SET deleted_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id],
    )
  },

  async restore(id) {
    return db.oneOrNone(
      `UPDATE file_uploads SET deleted_at = NULL
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id],
    )
  },

  async findDeleted({ user_id, limit = 50, offset = 0 } = {}) {
    const conditions = ['deleted_at IS NOT NULL']
    const values = []
    let idx = 1

    if (user_id) { conditions.push(`user_id = $${idx++}`); values.push(user_id) }
    values.push(limit, offset)

    return db.any(
      `SELECT id, user_id, key, filename, content_type, size_bytes, bucket, status, created_at, deleted_at
       FROM file_uploads
       WHERE ${conditions.join(' AND ')}
       ORDER BY deleted_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  // ── Hard delete (permanent) ──────────────────────────────────────────────────

  async hardDelete(id) {
    return db.oneOrNone('DELETE FROM file_uploads WHERE id = $1 RETURNING *', [id])
  },

  // ── Access control ────────────────────────────────────────────────────────────

  async setPublic(id, is_public) {
    return db.oneOrNone(
      `UPDATE file_uploads SET is_public = $2
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id, is_public],
    )
  },

  async setAccessUrl(id, access_url) {
    return db.oneOrNone(
      `UPDATE file_uploads SET access_url = $2
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id, access_url],
    )
  },

  async findPublicFiles({ limit = 50, offset = 0 } = {}) {
    return db.any(
      `SELECT id, user_id, key, filename, content_type, size_bytes, bucket, status, is_public, access_url, created_at
       FROM file_uploads
       WHERE is_public = true AND deleted_at IS NULL AND status = 'uploaded'
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )
  },

  /** @deprecated Alias for softDelete — use softDelete() explicitly */
  async deleteById(id) {
    return this.softDelete(id)
  },
}

module.exports = FileUploadRepo
