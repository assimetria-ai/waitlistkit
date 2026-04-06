const db = require('../../../lib/@system/PostgreSQL')

const AuditLogRepo = {
  /**
   * Record an audit event. Called internally by other repos/middleware.
   */
  async create({ user_id, actor_email, action, resource_type, resource_id, old_data, new_data, ip_address, user_agent, metadata } = {}) {
    return db.one(
      `INSERT INTO audit_logs
         (user_id, actor_email, action, resource_type, resource_id, old_data, new_data, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user_id ?? null,
        actor_email ?? null,
        action,
        resource_type,
        resource_id ? String(resource_id) : null,
        old_data ? JSON.stringify(old_data) : null,
        new_data ? JSON.stringify(new_data) : null,
        ip_address ?? null,
        user_agent ?? null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    )
  },

  async findAll({ user_id, action, resource_type, resource_id, from, to, limit = 50, offset = 0 } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (user_id) { conditions.push(`user_id = $${idx++}`); values.push(user_id) }
    if (action) { conditions.push(`action = $${idx++}`); values.push(action) }
    if (resource_type) { conditions.push(`resource_type = $${idx++}`); values.push(resource_type) }
    if (resource_id) { conditions.push(`resource_id = $${idx++}`); values.push(String(resource_id)) }
    if (from) { conditions.push(`created_at >= $${idx++}`); values.push(from) }
    if (to) { conditions.push(`created_at <= $${idx++}`); values.push(to) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    values.push(limit, offset)

    return db.any(
      `SELECT id, user_id, actor_email, action, resource_type, resource_id,
              old_data, new_data, ip_address, user_agent, metadata, created_at
       FROM audit_logs
       ${where}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  async count({ user_id, action, resource_type, resource_id, from, to } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (user_id) { conditions.push(`user_id = $${idx++}`); values.push(user_id) }
    if (action) { conditions.push(`action = $${idx++}`); values.push(action) }
    if (resource_type) { conditions.push(`resource_type = $${idx++}`); values.push(resource_type) }
    if (resource_id) { conditions.push(`resource_id = $${idx++}`); values.push(String(resource_id)) }
    if (from) { conditions.push(`created_at >= $${idx++}`); values.push(from) }
    if (to) { conditions.push(`created_at <= $${idx++}`); values.push(to) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const row = await db.one(`SELECT COUNT(*) FROM audit_logs ${where}`, values)
    return parseInt(row.count, 10)
  },

  async findById(id) {
    return db.oneOrNone('SELECT * FROM audit_logs WHERE id = $1', [id])
  },

  async findByResource(resource_type, resource_id, { limit = 50 } = {}) {
    return db.any(
      `SELECT * FROM audit_logs
       WHERE resource_type = $1 AND resource_id = $2
       ORDER BY created_at DESC
       LIMIT $3`,
      [resource_type, String(resource_id), limit],
    )
  },

  async findByUser(user_id, { limit = 50 } = {}) {
    return db.any(
      `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [user_id, limit],
    )
  },
}

module.exports = AuditLogRepo
