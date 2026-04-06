const db = require('../../../lib/@system/PostgreSQL')

const CLIP_FIELDS = `
  id, user_id, name, description, file_key, file_url, thumbnail_url,
  duration, size_bytes, mime_type, type, tags, color,
  created_at, updated_at
`

const ClipRepo = {
  async findAll({ user_id, type, tags, search, limit = 50, offset = 0 } = {}) {
    const conditions = ['deleted_at IS NULL']
    const values = []
    let idx = 1

    if (user_id !== undefined) {
      conditions.push(`user_id = $${idx++}`)
      values.push(user_id)
    }
    if (type) {
      conditions.push(`type = $${idx++}`)
      values.push(type)
    }
    // Tag filter: clip must contain ALL requested tags
    if (tags && tags.length > 0) {
      conditions.push(`tags @> $${idx++}`)
      values.push(tags)
    }
    if (search) {
      conditions.push(`(name ILIKE $${idx++} OR description ILIKE $${idx++})`)
      const pattern = `%${search}%`
      values.push(pattern, pattern)
      idx++
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    values.push(limit, offset)

    return db.any(
      `SELECT ${CLIP_FIELDS}
       FROM clips
       ${where}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      values,
    )
  },

  async count({ user_id, type, tags, search } = {}) {
    const conditions = ['deleted_at IS NULL']
    const values = []
    let idx = 1

    if (user_id !== undefined) {
      conditions.push(`user_id = $${idx++}`)
      values.push(user_id)
    }
    if (type) {
      conditions.push(`type = $${idx++}`)
      values.push(type)
    }
    if (tags && tags.length > 0) {
      conditions.push(`tags @> $${idx++}`)
      values.push(tags)
      idx++
    }
    if (search) {
      conditions.push(`(name ILIKE $${idx++} OR description ILIKE $${idx++})`)
      const pattern = `%${search}%`
      values.push(pattern, pattern)
      idx++
    }

    const where = `WHERE ${conditions.join(' AND ')}`
    const row = await db.one(`SELECT COUNT(*)::int AS total FROM clips ${where}`, values)
    return row.total
  },

  async findById(id) {
    return db.oneOrNone(
      `SELECT ${CLIP_FIELDS} FROM clips WHERE id = $1 AND deleted_at IS NULL`,
      [id],
    )
  },

  async create({ user_id, name, description, file_key, file_url, thumbnail_url, duration, size_bytes, mime_type, type = 'video', tags = [], color }) {
    return db.one(
      `INSERT INTO clips
         (user_id, name, description, file_key, file_url, thumbnail_url,
          duration, size_bytes, mime_type, type, tags, color)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING ${CLIP_FIELDS}`,
      [user_id, name, description ?? null, file_key ?? null, file_url ?? null,
       thumbnail_url ?? null, duration ?? null, size_bytes ?? null,
       mime_type ?? null, type, tags, color ?? null],
    )
  },

  async update(id, { name, description, tags, color }) {
    const sets = []
    const values = []
    let idx = 1

    if (name !== undefined) { sets.push(`name = $${idx++}`); values.push(name) }
    if (description !== undefined) { sets.push(`description = $${idx++}`); values.push(description) }
    if (tags !== undefined) { sets.push(`tags = $${idx++}`); values.push(tags) }
    if (color !== undefined) { sets.push(`color = $${idx++}`); values.push(color) }
    if (!sets.length) return this.findById(id)

    sets.push(`updated_at = now()`)
    values.push(id)

    return db.oneOrNone(
      `UPDATE clips SET ${sets.join(', ')} WHERE id = $${idx} AND deleted_at IS NULL RETURNING ${CLIP_FIELDS}`,
      values,
    )
  },

  async softDelete(id) {
    return db.oneOrNone(
      `UPDATE clips SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id],
    )
  },

  // Returns all distinct tags used by a user's clips, sorted alphabetically
  async allTags(user_id) {
    const rows = await db.any(
      `SELECT DISTINCT unnest(tags) AS tag FROM clips WHERE user_id = $1 AND deleted_at IS NULL ORDER BY tag`,
      [user_id],
    )
    return rows.map((r) => r.tag)
  },
}

module.exports = ClipRepo
