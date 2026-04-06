// @custom EmailLogRepo — transactional email tracking

const db = require('../../../lib/@system/PostgreSQL')

const EmailLogRepo = {
  async findAll({ status, template, search, limit = 50, offset = 0 } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    if (template) { conditions.push(`template = $${idx++}`); values.push(template) }
    if (search) {
      conditions.push(`(to_address ILIKE $${idx} OR subject ILIKE $${idx})`)
      values.push(`%${search}%`)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    values.push(limit, offset)

    return db.any(
      `SELECT id, to_address, subject, template, status, message_id, provider, error, metadata,
              user_id, sent_at, created_at
       FROM email_logs
       ${where}
       ORDER BY sent_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  async count({ status, template, search } = {}) {
    const conditions = []
    const values = []
    let idx = 1

    if (status) { conditions.push(`status = $${idx++}`); values.push(status) }
    if (template) { conditions.push(`template = $${idx++}`); values.push(template) }
    if (search) {
      conditions.push(`(to_address ILIKE $${idx} OR subject ILIKE $${idx})`)
      values.push(`%${search}%`)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const row = await db.one(`SELECT COUNT(*) FROM email_logs ${where}`, values)
    return parseInt(row.count, 10)
  },

  async findById(id) {
    return db.oneOrNone('SELECT * FROM email_logs WHERE id = $1', [id])
  },

  async create({ to_address, subject, template, status = 'sent', message_id, provider, error, metadata, user_id }) {
    return db.one(
      `INSERT INTO email_logs (to_address, subject, template, status, message_id, provider, error, metadata, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        to_address,
        subject,
        template ?? null,
        status,
        message_id ?? null,
        provider ?? null,
        error ?? null,
        metadata ? JSON.stringify(metadata) : null,
        user_id ?? null,
      ],
    )
  },

  async updateStatus(id, status, error = null) {
    return db.oneOrNone(
      `UPDATE email_logs
       SET status = $2, error = COALESCE($3, error), updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [id, status, error],
    )
  },

  async getStats() {
    return db.one(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'sent')      AS sent,
         COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
         COUNT(*) FILTER (WHERE status = 'bounced')   AS bounced,
         COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
         COUNT(*) FILTER (WHERE sent_at >= now() - interval '24 hours') AS last_24h,
         COUNT(*) FILTER (WHERE sent_at >= now() - interval '7 days')   AS last_7d,
         COUNT(DISTINCT to_address) AS unique_recipients
       FROM email_logs`,
    )
  },

  async getVolumeByDay({ days = 30 } = {}) {
    return db.any(
      `SELECT
         DATE_TRUNC('day', sent_at) AS day,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'sent')      AS sent,
         COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
         COUNT(*) FILTER (WHERE status = 'failed')    AS failed,
         COUNT(*) FILTER (WHERE status = 'bounced')   AS bounced
       FROM email_logs
       WHERE sent_at >= now() - ($1 || ' days')::interval
       GROUP BY DATE_TRUNC('day', sent_at)
       ORDER BY day DESC`,
      [days],
    )
  },

  async getTemplateBreakdown() {
    return db.any(
      `SELECT
         COALESCE(template, 'unknown') AS template,
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE status = 'failed')  AS failed,
         COUNT(*) FILTER (WHERE status = 'bounced') AS bounced
       FROM email_logs
       GROUP BY template
       ORDER BY total DESC`,
    )
  },
}

module.exports = EmailLogRepo
