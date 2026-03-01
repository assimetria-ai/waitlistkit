const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const db = require('../../../lib/@system/PostgreSQL')

// ─── Stat/global routes (must come before /:id) ───────────────────────────────

// GET /api/waitlists/stats — global dashboard stats for authenticated user
router.get('/waitlists/stats', authenticate, async (req, res, next) => {
  try {
    const totalSubs = await db.one(
      `SELECT COUNT(*) FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE w.user_id = $1`,
      [req.user.id]
    )
    const referrals = await db.one(
      `SELECT COALESCE(SUM(s.referral_count),0) AS total FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE w.user_id = $1`,
      [req.user.id]
    )
    const invited = await db.one(
      `SELECT COUNT(*) FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE w.user_id = $1 AND s.status = 'invited'`,
      [req.user.id]
    )
    const avgPos = await db.one(
      `SELECT COALESCE(AVG(s.position),0) AS avg FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE w.user_id = $1`,
      [req.user.id]
    )
    res.json({
      total_subscribers: parseInt(totalSubs.count),
      total_referrals: parseInt(referrals.total),
      avg_position: Math.round(parseFloat(avgPos.avg)),
      invited: parseInt(invited.count),
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/waitlists/subscribers/all — all subscribers across all user's waitlists (for SubscribersPage)
router.get('/waitlists/subscribers/all', authenticate, async (req, res, next) => {
  try {
    const subs = await db.any(
      `SELECT s.*, w.name AS waitlist_name, w.slug AS waitlist_slug
       FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id
       WHERE w.user_id = $1
       ORDER BY s.referral_count DESC, s.position ASC`,
      [req.user.id]
    )
    res.json({ subscribers: subs })
  } catch (err) {
    next(err)
  }
})

// GET /api/waitlists/subscribers — global subscribers with pagination
router.get('/waitlists/subscribers', authenticate, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, status } = req.query
    const conditions = ['w.user_id = $1']
    const params = [req.user.id]
    if (status) {
      conditions.push(`s.status = $${params.length + 1}`)
      params.push(status)
    }
    const whereClause = conditions.join(' AND ')
    const subs = await db.any(
      `SELECT s.*, w.name AS waitlist_name, w.slug AS waitlist_slug
       FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id
       WHERE ${whereClause}
       ORDER BY s.referral_count DESC, s.position ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    )
    const total = await db.one(
      `SELECT COUNT(*) FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE ${whereClause}`,
      params
    )
    res.json({ subscribers: subs, total: parseInt(total.count) })
  } catch (err) {
    next(err)
  }
})

// POST /api/waitlists/subscribers/:id/invite — invite an individual subscriber
router.post('/waitlists/subscribers/:id/invite', authenticate, async (req, res, next) => {
  try {
    const sub = await db.oneOrNone(
      `SELECT s.* FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id
       WHERE s.id = $1 AND w.user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!sub) return res.status(404).json({ error: 'Subscriber not found' })

    const updated = await db.one(
      `UPDATE waitlist_subscribers SET status = 'invited', invited_at = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    )
    res.json({ subscriber: updated })
  } catch (err) {
    next(err)
  }
})

// ─── Collection routes ─────────────────────────────────────────────────────────

// GET /api/waitlists — list waitlists owned by user
router.get('/waitlists', authenticate, async (req, res, next) => {
  try {
    const waitlists = await db.any(
      `SELECT w.*,
         (SELECT COUNT(*) FROM waitlist_subscribers s WHERE s.waitlist_id = w.id)::int AS subscriber_count
       FROM waitlists w WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    )
    res.json({ waitlists })
  } catch (err) {
    next(err)
  }
})

// POST /api/waitlists — create a waitlist
router.post('/waitlists', authenticate, async (req, res, next) => {
  try {
    const { name, description, product_url, referral_enabled } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') + '-' + Date.now()
    const waitlist = await db.one(
      `INSERT INTO waitlists (user_id, name, slug, description, product_url, referral_enabled, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW()) RETURNING *`,
      [req.user.id, name.trim(), slug, description || null, product_url || null, referral_enabled ?? true]
    )
    res.status(201).json({ waitlist })
  } catch (err) {
    next(err)
  }
})

// ─── Per-waitlist routes ───────────────────────────────────────────────────────

// GET /api/waitlists/:id — get a single waitlist with subscriber count
router.get('/waitlists/:id', authenticate, async (req, res, next) => {
  try {
    const waitlist = await db.oneOrNone(
      `SELECT w.*,
         (SELECT COUNT(*) FROM waitlist_subscribers s WHERE s.waitlist_id = w.id)::int AS subscriber_count
       FROM waitlists w WHERE w.id = $1 AND w.user_id = $2`,
      [req.params.id, req.user.id]
    )
    if (!waitlist) return res.status(404).json({ error: 'Waitlist not found' })
    res.json({ waitlist })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/waitlists/:id — update a waitlist
router.patch('/waitlists/:id', authenticate, async (req, res, next) => {
  try {
    const existing = await db.oneOrNone(
      'SELECT * FROM waitlists WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!existing) return res.status(404).json({ error: 'Waitlist not found' })

    const { name, description, product_url, referral_enabled, status } = req.body
    const updated = await db.one(
      `UPDATE waitlists
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           product_url = COALESCE($3, product_url),
           referral_enabled = COALESCE($4, referral_enabled),
           status = COALESCE($5, status),
           updated_at = NOW()
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [name || null, description || null, product_url || null,
       referral_enabled !== undefined ? referral_enabled : null,
       status || null, req.params.id, req.user.id]
    )
    res.json({ waitlist: updated })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/waitlists/:id — delete a waitlist
router.delete('/waitlists/:id', authenticate, async (req, res, next) => {
  try {
    const deleted = await db.oneOrNone(
      'DELETE FROM waitlists WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )
    if (!deleted) return res.status(404).json({ error: 'Waitlist not found' })
    res.status(204).end()
  } catch (err) {
    next(err)
  }
})

// GET /api/waitlists/:id/stats — stats for a single waitlist
router.get('/waitlists/:id/stats', authenticate, async (req, res, next) => {
  try {
    const waitlist = await db.oneOrNone(
      'SELECT id FROM waitlists WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!waitlist) return res.status(404).json({ error: 'Waitlist not found' })

    const [totalSubs, referrals, invited, avgPos] = await Promise.all([
      db.one('SELECT COUNT(*) FROM waitlist_subscribers WHERE waitlist_id = $1', [req.params.id]),
      db.one('SELECT COALESCE(SUM(referral_count),0) AS total FROM waitlist_subscribers WHERE waitlist_id = $1', [req.params.id]),
      db.one("SELECT COUNT(*) FROM waitlist_subscribers WHERE waitlist_id = $1 AND status = 'invited'", [req.params.id]),
      db.one('SELECT COALESCE(AVG(position),0) AS avg FROM waitlist_subscribers WHERE waitlist_id = $1', [req.params.id]),
    ])
    res.json({
      total_subscribers: parseInt(totalSubs.count),
      referral_count: parseInt(referrals.total),
      invited_count: parseInt(invited.count),
      avg_position: Math.round(parseFloat(avgPos.avg)),
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/waitlists/:id/subscribers — list subscribers for a specific waitlist
router.get('/waitlists/:id/subscribers', authenticate, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const waitlist = await db.oneOrNone(
      'SELECT id FROM waitlists WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!waitlist) return res.status(404).json({ error: 'Waitlist not found' })

    const subs = await db.any(
      `SELECT * FROM waitlist_subscribers WHERE waitlist_id = $1
       ORDER BY referral_count DESC, position ASC LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    )
    const total = await db.one(
      'SELECT COUNT(*) FROM waitlist_subscribers WHERE waitlist_id = $1',
      [req.params.id]
    )
    res.json({ subscribers: subs, total: parseInt(total.count) })
  } catch (err) {
    next(err)
  }
})

// POST /api/waitlists/:id/invite — invite top N subscribers from a waitlist
router.post('/waitlists/:id/invite', authenticate, async (req, res, next) => {
  try {
    const { count = 10 } = req.body
    const waitlist = await db.oneOrNone(
      'SELECT id FROM waitlists WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!waitlist) return res.status(404).json({ error: 'Waitlist not found' })

    const invited = await db.any(
      `UPDATE waitlist_subscribers SET status = 'invited', invited_at = NOW()
       WHERE id IN (
         SELECT id FROM waitlist_subscribers WHERE waitlist_id = $1 AND status = 'waiting'
         ORDER BY referral_count DESC, position ASC LIMIT $2
       ) RETURNING *`,
      [req.params.id, count]
    )
    res.json({ invited: invited.length, subscribers: invited })
  } catch (err) {
    next(err)
  }
})

// ─── Public join endpoint ──────────────────────────────────────────────────────

// POST /api/waitlists/:slug/join — public join (no auth required)
router.post('/waitlists/:slug/join', async (req, res, next) => {
  try {
    const { email, referral_code } = req.body
    if (!email) return res.status(400).json({ error: 'email is required' })

    const waitlist = await db.oneOrNone('SELECT * FROM waitlists WHERE slug = $1', [req.params.slug])
    if (!waitlist) return res.status(404).json({ error: 'Waitlist not found' })
    if (waitlist.status !== 'active') return res.status(400).json({ error: 'This waitlist is not accepting signups' })

    // Check for duplicate email
    const existing = await db.oneOrNone(
      'SELECT id FROM waitlist_subscribers WHERE waitlist_id = $1 AND email = $2',
      [waitlist.id, email.toLowerCase()]
    )
    if (existing) return res.status(409).json({ error: 'You are already on this waitlist' })

    // Get position
    const count = await db.one('SELECT COUNT(*) FROM waitlist_subscribers WHERE waitlist_id = $1', [waitlist.id])
    const position = parseInt(count.count) + 1

    // Check referrer
    let referred_by = null
    if (referral_code) {
      const referrer = await db.oneOrNone('SELECT id FROM waitlist_subscribers WHERE referral_code = $1', [referral_code])
      referred_by = referrer?.id || null
    }

    const myCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const subscriber = await db.one(
      `INSERT INTO waitlist_subscribers (waitlist_id, email, position, referral_code, referred_by, priority, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'normal', 'waiting', NOW()) RETURNING *`,
      [waitlist.id, email.toLowerCase(), position, myCode, referred_by]
    )

    if (referred_by) {
      await db.none(
        'UPDATE waitlist_subscribers SET referral_count = referral_count + 1 WHERE id = $1',
        [referred_by]
      )
    }

    res.status(201).json({ subscriber, position, referral_code: myCode })
  } catch (err) {
    next(err)
  }
})

module.exports = router
