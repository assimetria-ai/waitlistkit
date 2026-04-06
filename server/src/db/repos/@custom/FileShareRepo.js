// @custom — FileShareRepo
// Manages file sharing records (email-based access control)

const crypto = require('crypto')
const db = require('../../../lib/@system/PostgreSQL')

const FileShareRepo = {
  /**
   * Share a file with an email address.
   * Generates a unique token for share-link access.
   */
  async create({ file_id, shared_by, shared_with_email, permission = 'view', expires_at = null }) {
    const token = crypto.randomBytes(32).toString('hex')

    // Try to resolve email to a user_id
    const user = await db.oneOrNone('SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL', [shared_with_email])

    return db.one(
      `INSERT INTO file_shares (file_id, shared_by, shared_with_email, shared_with_user_id, permission, token, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [file_id, shared_by, shared_with_email.toLowerCase(), user?.id ?? null, permission, token, expires_at],
    )
  },

  /** Find a share record by token (for accessing shared files) */
  async findByToken(token) {
    return db.oneOrNone(
      `SELECT fs.*, fu.key, fu.filename, fu.content_type, fu.size_bytes, fu.bucket, fu.status, fu.is_public, fu.access_url
       FROM file_shares fs
       JOIN file_uploads fu ON fu.id = fs.file_id
       WHERE fs.token = $1
         AND fs.revoked_at IS NULL
         AND fu.deleted_at IS NULL
         AND (fs.expires_at IS NULL OR fs.expires_at > now())`,
      [token],
    )
  },

  /** List all active shares for a file */
  async findByFileId(file_id) {
    return db.any(
      `SELECT id, file_id, shared_by, shared_with_email, shared_with_user_id, permission, token, expires_at, created_at
       FROM file_shares
       WHERE file_id = $1 AND revoked_at IS NULL
       ORDER BY created_at DESC`,
      [file_id],
    )
  },

  /** List all files shared with a given email */
  async findByEmail(email, { limit = 50, offset = 0 } = {}) {
    return db.any(
      `SELECT fs.*, fu.filename, fu.content_type, fu.size_bytes, fu.is_public
       FROM file_shares fs
       JOIN file_uploads fu ON fu.id = fs.file_id
       WHERE fs.shared_with_email = $1
         AND fs.revoked_at IS NULL
         AND fu.deleted_at IS NULL
         AND (fs.expires_at IS NULL OR fs.expires_at > now())
       ORDER BY fs.created_at DESC
       LIMIT $2 OFFSET $3`,
      [email.toLowerCase(), limit, offset],
    )
  },

  /** List all files shared with a given user ID */
  async findByUserId(user_id, { limit = 50, offset = 0 } = {}) {
    return db.any(
      `SELECT fs.*, fu.filename, fu.content_type, fu.size_bytes, fu.is_public
       FROM file_shares fs
       JOIN file_uploads fu ON fu.id = fs.file_id
       WHERE fs.shared_with_user_id = $1
         AND fs.revoked_at IS NULL
         AND fu.deleted_at IS NULL
         AND (fs.expires_at IS NULL OR fs.expires_at > now())
       ORDER BY fs.created_at DESC
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset],
    )
  },

  /** Get emails with access to a specific file (like Simtria's emailsWithAccess) */
  async getEmailsWithAccess(file_id) {
    return db.any(
      `SELECT shared_with_email, permission, created_at
       FROM file_shares
       WHERE file_id = $1 AND revoked_at IS NULL
         AND (expires_at IS NULL OR expires_at > now())
       ORDER BY created_at ASC`,
      [file_id],
    )
  },

  /** Revoke a specific share */
  async revoke(id) {
    return db.oneOrNone(
      `UPDATE file_shares SET revoked_at = now()
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [id],
    )
  },

  /** Revoke all shares for a file */
  async revokeAllForFile(file_id) {
    return db.result(
      `UPDATE file_shares SET revoked_at = now()
       WHERE file_id = $1 AND revoked_at IS NULL`,
      [file_id],
    )
  },

  /** Update permission on an existing share */
  async updatePermission(id, permission) {
    return db.oneOrNone(
      `UPDATE file_shares SET permission = $2
       WHERE id = $1 AND revoked_at IS NULL
       RETURNING *`,
      [id, permission],
    )
  },

  /** Check if a user (by email or user_id) has access to a file */
  async hasAccess(file_id, { email, user_id }) {
    const conditions = ['file_id = $1', 'revoked_at IS NULL', '(expires_at IS NULL OR expires_at > now())']
    const values = [file_id]
    let idx = 2

    if (email && user_id) {
      conditions.push(`(shared_with_email = $${idx++} OR shared_with_user_id = $${idx++})`)
      values.push(email.toLowerCase(), user_id)
    } else if (email) {
      conditions.push(`shared_with_email = $${idx++}`)
      values.push(email.toLowerCase())
    } else if (user_id) {
      conditions.push(`shared_with_user_id = $${idx++}`)
      values.push(user_id)
    } else {
      return null
    }

    return db.oneOrNone(
      `SELECT * FROM file_shares WHERE ${conditions.join(' AND ')} LIMIT 1`,
      values,
    )
  },
}

module.exports = FileShareRepo
