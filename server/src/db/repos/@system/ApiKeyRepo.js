const db = require('../../../lib/@system/PostgreSQL')

const ApiKeyRepo = {
  async findAllByUser(userId) {
    return db.any(
      `SELECT id, user_id, name, key_prefix, last_used_at, expires_at, created_at
       FROM api_keys
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId],
    )
  },

  async findByHash(keyHash) {
    return db.oneOrNone('SELECT * FROM api_keys WHERE key_hash = $1', [keyHash])
  },

  async create({ userId, name, keyHash, keyPrefix, expiresAt }) {
    return db.one(
      `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, name, key_prefix, expires_at, created_at`,
      [userId, name, keyHash, keyPrefix, expiresAt ?? null],
    )
  },

  async touchLastUsed(id) {
    return db.none('UPDATE api_keys SET last_used_at = now() WHERE id = $1', [id])
  },

  async deleteById(id, userId) {
    const result = await db.result(
      'DELETE FROM api_keys WHERE id = $1 AND user_id = $2',
      [id, userId],
    )
    return result.rowCount > 0
  },
}

module.exports = ApiKeyRepo
