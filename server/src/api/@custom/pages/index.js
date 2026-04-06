const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')
const db = require('../../../lib/@system/PostgreSQL')

const VALID_STATUSES = ['draft', 'published', 'archived']

// GET /api/pages — list pages
router.get('/pages', authenticate, async (req, res, next) => {
  try {
    const pages = await db.any(
      'SELECT * FROM pages WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.user.id]
    )
    res.json({ pages })
  } catch (err) {
    next(err)
  }
})

// GET /api/pages/stats — dashboard stats (must be before /pages/:id)
router.get('/pages/stats', authenticate, async (req, res, next) => {
  try {
    const total = await db.one('SELECT COUNT(*) FROM pages WHERE user_id = $1', [req.user.id])
    const published = await db.one("SELECT COUNT(*) FROM pages WHERE user_id = $1 AND status = 'published'", [req.user.id])
    res.json({
      total_pages: parseInt(total.count),
      published_pages: parseInt(published.count),
      total_visitors: 0,
      conversion_rate: 0,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/pages/:id — get single page
router.get('/pages/:id', authenticate, async (req, res, next) => {
  try {
    const page = await db.oneOrNone(
      'SELECT * FROM pages WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!page) {
      return res.status(404).json({ error: 'Page not found' })
    }
    res.json({ page })
  } catch (err) {
    next(err)
  }
})

// POST /api/pages — create a new page
router.post('/pages', authenticate, async (req, res, next) => {
  try {
    const { name, template_id, blocks } = req.body || {}
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' })
    }
    const safeName = name.trim().slice(0, 200)
    const slug = safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    const safeBlocks = Array.isArray(blocks) ? blocks : []
    const page = await db.one(
      `INSERT INTO pages (user_id, name, slug, template_id, blocks, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'draft', NOW(), NOW()) RETURNING *`,
      [req.user.id, safeName, slug, template_id || null, JSON.stringify(safeBlocks)]
    )
    res.status(201).json({ page })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/pages/:id — update a page
router.patch('/pages/:id', authenticate, async (req, res, next) => {
  try {
    const { name, blocks, status } = req.body || {}
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ error: 'name must be a non-empty string' })
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` })
    }
    const safeName   = name ? name.trim().slice(0, 200) : null
    const safeBlocks = blocks !== undefined ? (Array.isArray(blocks) ? JSON.stringify(blocks) : null) : null
    const page = await db.one(
      `UPDATE pages SET name = COALESCE($1, name), blocks = COALESCE($2, blocks),
       status = COALESCE($3, status), updated_at = NOW()
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [safeName, safeBlocks, status || null, req.params.id, req.user.id]
    )
    res.json({ page })
  } catch (err) {
    next(err)
  }
})

// POST /api/pages/:id/publish — publish a page
router.post('/pages/:id/publish', authenticate, async (req, res, next) => {
  try {
    const page = await db.one(
      `UPDATE pages SET status = 'published', published_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    )
    res.json({ page })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/pages/:id — delete a page
router.delete('/pages/:id', authenticate, async (req, res, next) => {
  try {
    await db.none('DELETE FROM pages WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id])
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
