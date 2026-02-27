const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const db = require('../../../lib/@system/PostgreSQL')

// GET /api/waitlist — list waitlists owned by user
router.get('/waitlist', authenticate, async (req, res, next) => {
  try {
    const waitlists = await db.any(
      'SELECT * FROM waitlists WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    )
    res.json({ waitlists })
  } catch (err) {
    next(err)
  }
})

// POST /api/waitlist — create a waitlist
router.post('/waitlist', authenticate, async (req, res, next) => {
  try {
    const { name, description, product_url, referral_enabled } = req.body
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
    const waitlist = await db.one(
      `INSERT INTO waitlists (user_id, name, slug, description, product_url, referral_enabled, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW()) RETURNING *`,
      [req.user.id, name, slug, description, product_url, referral_enabled ?? true]
    )
    res.status(201).json({ waitlist })
  } catch (err) {
    next(err)
  }
})

// POST /api/waitlist/:slug/join — public join endpoint
router.post('/waitlist/:slug/join', async (req, res, next) => {
  try {
    const { email, referral_code } = req.body
    const waitlist = await db.oneOrNone('SELECT * FROM waitlists WHERE slug = $1', [req.params.slug])
    if (!waitlist) return res.status(404).json({ error: 'Waitlist not found' })

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
      `INSERT INTO waitlist_subscribers (waitlist_id, email, position, referral_code, referred_by, priority, created_at)
       VALUES ($1, $2, $3, $4, $5, 'normal', NOW()) RETURNING *`,
      [waitlist.id, email, position, myCode, referred_by]
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

// GET /api/waitlist/:id/subscribers — list subscribers
router.get('/waitlist/:id/subscribers', authenticate, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query
    const subs = await db.any(
      `SELECT * FROM waitlist_subscribers WHERE waitlist_id = $1
       ORDER BY referral_count DESC, position ASC LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    )
    const total = await db.one('SELECT COUNT(*) FROM waitlist_subscribers WHERE waitlist_id = $1', [req.params.id])
    res.json({ subscribers: subs, total: parseInt(total.count) })
  } catch (err) {
    next(err)
  }
})

// POST /api/waitlist/:id/invite — invite top N subscribers
router.post('/waitlist/:id/invite', authenticate, async (req, res, next) => {
  try {
    const { count = 10 } = req.body
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

// GET /api/waitlist/stats — dashboard stats
router.get('/waitlist/stats', authenticate, async (req, res, next) => {
  try {
    const totalSubs = await db.one(
      `SELECT COUNT(*) FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE w.user_id = $1`, [req.user.id]
    )
    const referrals = await db.one(
      `SELECT COALESCE(SUM(s.referral_count),0) as total FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE w.user_id = $1`, [req.user.id]
    )
    const invited = await db.one(
      `SELECT COUNT(*) FROM waitlist_subscribers s
       JOIN waitlists w ON s.waitlist_id = w.id WHERE w.user_id = $1 AND s.status = 'invited'`, [req.user.id]
    )
    res.json({
      total_subscribers: parseInt(totalSubs.count),
      total_referrals: parseInt(referrals.total),
      avg_position: 0,
      invited: parseInt(invited.count),
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
