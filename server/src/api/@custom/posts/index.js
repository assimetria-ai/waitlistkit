/**
 * @custom Posts API — CRUD for content posts with calendar/scheduling support
 */
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')

router.use(authenticate)

// GET /api/posts — list posts for calendar (with date range + status filter)
router.get('/api/posts', async (req, res) => {
  try {
    const userId = req.user.id
    const { start, end, status } = req.query
    
    let query = `
      SELECT id, content, status, scheduled_for, published_at, 
             created_at, updated_at, schedule_id
      FROM posts 
      WHERE user_id = $1
    `
    const params = [userId]
    let paramIdx = 2
    
    if (start) {
      query += ` AND (scheduled_for >= $${paramIdx} OR (scheduled_for IS NULL AND created_at >= $${paramIdx}))`
      params.push(start)
      paramIdx++
    }
    if (end) {
      query += ` AND (scheduled_for <= $${paramIdx} OR (scheduled_for IS NULL AND created_at <= $${paramIdx}))`
      params.push(end)
      paramIdx++
    }
    if (status && status !== 'all') {
      query += ` AND status = $${paramIdx}`
      params.push(status)
      paramIdx++
    }
    
    query += ' ORDER BY COALESCE(scheduled_for, created_at) ASC'
    
    const db = req.app.get('db')
    const posts = await db.any(query, params)
    res.json({ posts })
  } catch (err) {
    console.error('[posts] GET /api/posts error:', err.message)
    res.status(500).json({ error: 'Failed to fetch posts' })
  }
})

// GET /api/posts/:id — single post
router.get('/api/posts/:id', async (req, res) => {
  try {
    const db = req.app.get('db')
    const post = await db.oneOrNone(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json({ post })
  } catch (err) {
    console.error('[posts] GET /api/posts/:id error:', err.message)
    res.status(500).json({ error: 'Failed to fetch post' })
  }
})

// POST /api/posts — create post
router.post('/api/posts', async (req, res) => {
  try {
    const { content, status = 'draft', scheduled_for, schedule_id } = req.body
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }
    
    const db = req.app.get('db')
    const post = await db.one(
      `INSERT INTO posts (user_id, content, status, scheduled_for, schedule_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, content.trim(), status, scheduled_for || null, schedule_id || null]
    )
    res.status(201).json({ post })
  } catch (err) {
    console.error('[posts] POST /api/posts error:', err.message)
    res.status(500).json({ error: 'Failed to create post' })
  }
})

// PATCH /api/posts/:id — update post (content, status, scheduled_for)
router.patch('/api/posts/:id', async (req, res) => {
  try {
    const db = req.app.get('db')
    const existing = await db.oneOrNone(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!existing) return res.status(404).json({ error: 'Post not found' })
    
    const { content, status, scheduled_for, schedule_id } = req.body
    const updates = []
    const params = []
    let idx = 1
    
    if (content !== undefined) {
      updates.push(`content = $${idx}`)
      params.push(content.trim())
      idx++
    }
    if (status !== undefined) {
      updates.push(`status = $${idx}`)
      params.push(status)
      idx++
    }
    if (scheduled_for !== undefined) {
      updates.push(`scheduled_for = $${idx}`)
      params.push(scheduled_for)
      idx++
    }
    if (schedule_id !== undefined) {
      updates.push(`schedule_id = $${idx}`)
      params.push(schedule_id)
      idx++
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }
    
    updates.push(`updated_at = now()`)
    params.push(req.params.id)
    params.push(req.user.id)
    
    const post = await db.one(
      `UPDATE posts SET ${updates.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      params
    )
    res.json({ post })
  } catch (err) {
    console.error('[posts] PATCH /api/posts/:id error:', err.message)
    res.status(500).json({ error: 'Failed to update post' })
  }
})

// DELETE /api/posts/:id
router.delete('/api/posts/:id', async (req, res) => {
  try {
    const db = req.app.get('db')
    const result = await db.result(
      'DELETE FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Post not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('[posts] DELETE /api/posts/:id error:', err.message)
    res.status(500).json({ error: 'Failed to delete post' })
  }
})

// POST /api/posts/:id/publish — immediately publish a post (skip schedule)
router.post('/api/posts/:id/publish', async (req, res) => {
  try {
    const db = req.app.get('db')
    const post = await db.oneOrNone(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!post) return res.status(404).json({ error: 'Post not found' })
    if (post.status === 'published') return res.status(400).json({ error: 'Post already published' })

    // Set scheduled_for to now so the scheduler picks it up immediately
    const updated = await db.one(
      `UPDATE posts SET status = 'scheduled', scheduled_for = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    )
    res.json({ post: updated, message: 'Post queued for immediate publishing' })
  } catch (err) {
    console.error('[posts] POST /api/posts/:id/publish error:', err.message)
    res.status(500).json({ error: 'Failed to queue post for publishing' })
  }
})

// GET /api/posts/queue/stats — queue monitoring stats
router.get('/api/posts/queue/stats', async (req, res) => {
  try {
    const db = req.app.get('db')
    const stats = await db.one(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'scheduled') AS scheduled_count,
        COUNT(*) FILTER (WHERE status = 'publishing') AS publishing_count,
        COUNT(*) FILTER (WHERE status = 'published') AS published_count,
        COUNT(*) FILTER (WHERE status = 'failed' AND retry_count < COALESCE(max_retries, 3)) AS retryable_count,
        COUNT(*) FILTER (WHERE status = 'failed' AND retry_count >= COALESCE(max_retries, 3)) AS permanently_failed_count,
        MIN(scheduled_for) FILTER (WHERE status = 'scheduled') AS next_scheduled
      FROM posts
      WHERE user_id = $1
    `, [req.user.id])
    res.json({ stats })
  } catch (err) {
    console.error('[posts] GET /api/posts/queue/stats error:', err.message)
    res.status(500).json({ error: 'Failed to fetch queue stats' })
  }
})

// POST /api/posts/:id/retry — manually retry a failed post
router.post('/api/posts/:id/retry', async (req, res) => {
  try {
    const db = req.app.get('db')
    const post = await db.oneOrNone(
      'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!post) return res.status(404).json({ error: 'Post not found' })
    if (post.status !== 'failed') return res.status(400).json({ error: 'Only failed posts can be retried' })

    const updated = await db.one(
      `UPDATE posts SET status = 'scheduled', retry_count = 0, last_error = NULL, 
       scheduled_for = now(), updated_at = now()
       WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    )
    res.json({ post: updated, message: 'Post queued for retry' })
  } catch (err) {
    console.error('[posts] POST /api/posts/:id/retry error:', err.message)
    res.status(500).json({ error: 'Failed to retry post' })
  }
})

// PATCH /api/posts/:id/reschedule — drag-and-drop reschedule
router.patch('/api/posts/:id/reschedule', async (req, res) => {
  try {
    const { scheduled_for } = req.body
    if (!scheduled_for) {
      return res.status(400).json({ error: 'scheduled_for is required' })
    }
    
    const db = req.app.get('db')
    const post = await db.oneOrNone(
      `UPDATE posts SET scheduled_for = $1, status = 'scheduled', updated_at = now()
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [scheduled_for, req.params.id, req.user.id]
    )
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json({ post })
  } catch (err) {
    console.error('[posts] PATCH /api/posts/:id/reschedule error:', err.message)
    res.status(500).json({ error: 'Failed to reschedule post' })
  }
})

module.exports = router
