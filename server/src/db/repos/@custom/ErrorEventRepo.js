const db = require('../../../lib/@system/PostgreSQL')

const ErrorEventRepo = {
  async findAll({ status, level, environment, limit = 50, offset = 0, include_deleted = false } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (!include_deleted) conditions.push('deleted_at IS NULL')
    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    if (level) { conditions.push(`level = $${idx++}`); values.push(level) }
    if (environment) { conditions.push(`environment = $${idx++}`); values.push(environment) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    values.push(limit, offset)

    return db.any(
      `SELECT id, fingerprint, title, message, level, platform, environment, release,
              status, times_seen, first_seen, last_seen, user_id, created_at, deleted_at
       FROM error_events
       ${where}
       ORDER BY last_seen DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  async count({ status, level, environment, include_deleted = false } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (!include_deleted) conditions.push('deleted_at IS NULL')
    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    if (level) { conditions.push(`level = $${idx++}`); values.push(level) }
    if (environment) { conditions.push(`environment = $${idx++}`); values.push(environment) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const row = await db.one(`SELECT COUNT(*) FROM error_events ${where}`, values)
    return parseInt(row.count, 10)
  },

  async findById(id) {
    return db.oneOrNone('SELECT * FROM error_events WHERE id = $1 AND deleted_at IS NULL', [id])
  },

  async findByIdIncludingDeleted(id) {
    return db.oneOrNone('SELECT * FROM error_events WHERE id = $1', [id])
  },

  async findByFingerprint(fingerprint, environment = 'production') {
    return db.oneOrNone(
      'SELECT * FROM error_events WHERE fingerprint = $1 AND environment = $2 AND deleted_at IS NULL',
      [fingerprint, environment],
    )
  },

  async create({ fingerprint, title, message, level = 'error', platform, environment = 'production', release, stack_trace, extra, user_id }) {
    return db.one(
      `INSERT INTO error_events (fingerprint, title, message, level, platform, environment, release, stack_trace, extra, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [fingerprint, title, message, level, platform, environment, release, stack_trace, extra ? JSON.stringify(extra) : null, user_id ?? null],
    )
  },

  async upsertByFingerprint({ fingerprint, title, message, level = 'error', platform, environment = 'production', release, stack_trace, extra, user_id }) {
    const existing = await this.findByFingerprint(fingerprint, environment)
    if (existing) {
      return db.one(
        `UPDATE error_events
         SET times_seen = times_seen + 1,
             last_seen = now(),
             updated_at = now(),
             message = $2,
             stack_trace = COALESCE($3, stack_trace),
             extra = COALESCE($4::jsonb, extra)
         WHERE id = $1
         RETURNING *`,
        [existing.id, message, stack_trace, extra ? JSON.stringify(extra) : null],
      )
    }
    return this.create({ fingerprint, title, message, level, platform, environment, release, stack_trace, extra, user_id })
  },

  async updateStatus(id, status) {
    return db.oneOrNone(
      `UPDATE error_events SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, status],
    )
  },

  async getStats(environment) {
    const conditions = ['deleted_at IS NULL']
    const values = []
    if (environment) { conditions.push('environment = $1'); values.push(environment) }
    const where = `WHERE ${conditions.join(' AND ')}`
    return db.one(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'unresolved') AS unresolved,
         COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
         COUNT(*) FILTER (WHERE status = 'ignored') AS ignored,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE level = 'fatal') AS fatal,
         COUNT(*) FILTER (WHERE level = 'error') AS errors,
         COUNT(*) FILTER (WHERE level = 'warning') AS warnings,
         COUNT(*) FILTER (WHERE last_seen >= now() - interval '24 hours') AS last_24h
       FROM error_events ${where}`,
      values,
    )
  },

  // ── Soft delete ──────────────────────────────────────────────────────────────

  async softDelete(id) {
    return db.oneOrNone(
      `UPDATE error_events SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING *`,
      [id],
    )
  },

  async restore(id) {
    return db.oneOrNone(
      `UPDATE error_events SET deleted_at = NULL, updated_at = now()
       WHERE id = $1 AND deleted_at IS NOT NULL
       RETURNING *`,
      [id],
    )
  },

  async findDeleted({ limit = 50, offset = 0 } = {}) {
    return db.any(
      `SELECT id, fingerprint, title, level, environment, status, times_seen, last_seen, created_at, deleted_at
       FROM error_events
       WHERE deleted_at IS NOT NULL
       ORDER BY deleted_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    )
  },

  async search(query, { limit = 20 } = {}) {
    return db.any(
      `SELECT id, fingerprint, title, message, level, environment, status, times_seen, last_seen,
              ts_rank(
                to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(message, '') || ' ' || COALESCE(fingerprint, '')),
                plainto_tsquery('english', $1)
              ) AS rank
       FROM error_events
       WHERE deleted_at IS NULL
         AND to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(message, '') || ' ' || COALESCE(fingerprint, ''))
             @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      [query, limit],
    )
  },
}

module.exports = ErrorEventRepo
