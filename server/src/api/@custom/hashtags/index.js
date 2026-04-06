/**
 * @custom Hashtag Research API
 * - Browse/search hashtags by industry/topic
 * - View reach, engagement, trending status
 * - Get hashtag suggestions for a post topic
 * - Save hashtag sets
 * - Track hashtag performance over time
 */
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')

// ─── Seed data for LinkedIn hashtag research ─────────────────────
const SEED_HASHTAGS = [
  { tag: 'leadership', industry: 'Management', topic: 'Leadership', reach: 28500000, engagement_rate: 3.2, trending: true, post_count: 1450000 },
  { tag: 'marketing', industry: 'Marketing', topic: 'General Marketing', reach: 22000000, engagement_rate: 2.8, trending: false, post_count: 980000 },
  { tag: 'ai', industry: 'Technology', topic: 'Artificial Intelligence', reach: 35000000, engagement_rate: 4.1, trending: true, post_count: 2100000 },
  { tag: 'personalbranding', industry: 'Career', topic: 'Personal Branding', reach: 18000000, engagement_rate: 3.8, trending: true, post_count: 720000 },
  { tag: 'startups', industry: 'Entrepreneurship', topic: 'Startups', reach: 15000000, engagement_rate: 3.5, trending: false, post_count: 640000 },
  { tag: 'productivity', industry: 'Career', topic: 'Productivity', reach: 12000000, engagement_rate: 3.1, trending: false, post_count: 580000 },
  { tag: 'innovation', industry: 'Technology', topic: 'Innovation', reach: 20000000, engagement_rate: 2.9, trending: false, post_count: 890000 },
  { tag: 'saas', industry: 'Technology', topic: 'SaaS', reach: 8500000, engagement_rate: 3.7, trending: true, post_count: 320000 },
  { tag: 'contentmarketing', industry: 'Marketing', topic: 'Content Marketing', reach: 9800000, engagement_rate: 3.4, trending: false, post_count: 410000 },
  { tag: 'remotework', industry: 'Career', topic: 'Remote Work', reach: 14000000, engagement_rate: 3.3, trending: false, post_count: 620000 },
  { tag: 'entrepreneurship', industry: 'Entrepreneurship', topic: 'General', reach: 25000000, engagement_rate: 3.0, trending: false, post_count: 1100000 },
  { tag: 'hiring', industry: 'HR', topic: 'Recruitment', reach: 11000000, engagement_rate: 2.6, trending: false, post_count: 530000 },
  { tag: 'machinelearning', industry: 'Technology', topic: 'Machine Learning', reach: 16000000, engagement_rate: 3.9, trending: true, post_count: 680000 },
  { tag: 'sales', industry: 'Sales', topic: 'Sales Strategy', reach: 13000000, engagement_rate: 2.7, trending: false, post_count: 570000 },
  { tag: 'growth', industry: 'Marketing', topic: 'Growth', reach: 10000000, engagement_rate: 3.2, trending: false, post_count: 440000 },
  { tag: 'linkedin', industry: 'Social Media', topic: 'LinkedIn Tips', reach: 19000000, engagement_rate: 4.5, trending: true, post_count: 850000 },
  { tag: 'digitalmarketing', industry: 'Marketing', topic: 'Digital Marketing', reach: 17000000, engagement_rate: 2.5, trending: false, post_count: 760000 },
  { tag: 'futureofwork', industry: 'Career', topic: 'Future of Work', reach: 8000000, engagement_rate: 3.6, trending: true, post_count: 290000 },
  { tag: 'branding', industry: 'Marketing', topic: 'Branding', reach: 11500000, engagement_rate: 3.0, trending: false, post_count: 490000 },
  { tag: 'networking', industry: 'Career', topic: 'Networking', reach: 9500000, engagement_rate: 2.9, trending: false, post_count: 380000 },
  { tag: 'data', industry: 'Technology', topic: 'Data Science', reach: 14500000, engagement_rate: 3.3, trending: false, post_count: 610000 },
  { tag: 'customerexperience', industry: 'Sales', topic: 'Customer Experience', reach: 7500000, engagement_rate: 3.1, trending: false, post_count: 280000 },
  { tag: 'sustainability', industry: 'General', topic: 'Sustainability', reach: 10500000, engagement_rate: 2.8, trending: true, post_count: 420000 },
  { tag: 'venturecapital', industry: 'Finance', topic: 'VC', reach: 6000000, engagement_rate: 3.4, trending: false, post_count: 210000 },
  { tag: 'mindset', industry: 'Career', topic: 'Mindset', reach: 13500000, engagement_rate: 3.6, trending: false, post_count: 590000 },
  { tag: 'linkedintips', industry: 'Social Media', topic: 'LinkedIn Tips', reach: 8200000, engagement_rate: 4.2, trending: true, post_count: 310000 },
  { tag: 'founders', industry: 'Entrepreneurship', topic: 'Founders', reach: 7200000, engagement_rate: 3.5, trending: false, post_count: 260000 },
  { tag: 'socialmedia', industry: 'Marketing', topic: 'Social Media', reach: 16500000, engagement_rate: 2.4, trending: false, post_count: 710000 },
  { tag: 'blockchain', industry: 'Technology', topic: 'Blockchain', reach: 9000000, engagement_rate: 2.6, trending: false, post_count: 340000 },
  { tag: 'storytelling', industry: 'Marketing', topic: 'Storytelling', reach: 7800000, engagement_rate: 3.8, trending: true, post_count: 270000 },
  { tag: 'careeradvice', industry: 'Career', topic: 'Career Advice', reach: 11200000, engagement_rate: 3.1, trending: false, post_count: 470000 },
  { tag: 'b2b', industry: 'Sales', topic: 'B2B', reach: 7000000, engagement_rate: 2.9, trending: false, post_count: 250000 },
  { tag: 'generativeai', industry: 'Technology', topic: 'Generative AI', reach: 12000000, engagement_rate: 4.3, trending: true, post_count: 480000 },
  { tag: 'management', industry: 'Management', topic: 'Management', reach: 14000000, engagement_rate: 2.7, trending: false, post_count: 600000 },
  { tag: 'designthinking', industry: 'Design', topic: 'Design Thinking', reach: 5500000, engagement_rate: 3.2, trending: false, post_count: 190000 },
  { tag: 'ecommerce', industry: 'Retail', topic: 'E-commerce', reach: 8800000, engagement_rate: 2.8, trending: false, post_count: 330000 },
  { tag: 'motivation', industry: 'Career', topic: 'Motivation', reach: 15500000, engagement_rate: 3.0, trending: false, post_count: 660000 },
  { tag: 'agile', industry: 'Technology', topic: 'Agile', reach: 6500000, engagement_rate: 2.9, trending: false, post_count: 230000 },
  { tag: 'seo', industry: 'Marketing', topic: 'SEO', reach: 8300000, engagement_rate: 2.6, trending: false, post_count: 310000 },
  { tag: 'recruiting', industry: 'HR', topic: 'Recruiting', reach: 9200000, engagement_rate: 2.5, trending: false, post_count: 370000 },
]

// ─── Helper: seed hashtags if table is empty ──────────────────────
async function ensureSeeded(db) {
  const count = await db.one('SELECT COUNT(*) AS cnt FROM hashtags')
  if (parseInt(count.cnt, 10) > 0) return
  for (const h of SEED_HASHTAGS) {
    await db.none(
      `INSERT INTO hashtags (tag, industry, topic, reach, engagement_rate, trending, post_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (tag) DO NOTHING`,
      [h.tag, h.industry, h.topic, h.reach, h.engagement_rate, h.trending, h.post_count]
    )
  }
}

// ═══════════════════════════════════════════════════════════════════
// PUBLIC endpoints (no auth, for browsing hashtag data)
// ═══════════════════════════════════════════════════════════════════

// GET /api/hashtags — browse/search hashtags
router.get('/api/hashtags', async (req, res) => {
  try {
    const db = req.app.get('db')
    await ensureSeeded(db)

    const { q, industry, topic, trending, sort = 'reach', order = 'desc', limit = 50, offset = 0 } = req.query

    let query = 'SELECT * FROM hashtags WHERE 1=1'
    const params = []
    let idx = 1

    if (q) {
      query += ` AND (tag ILIKE $${idx} OR industry ILIKE $${idx} OR topic ILIKE $${idx})`
      params.push(`%${q}%`)
      idx++
    }
    if (industry) {
      query += ` AND industry = $${idx}`
      params.push(industry)
      idx++
    }
    if (topic) {
      query += ` AND topic = $${idx}`
      params.push(topic)
      idx++
    }
    if (trending === 'true') {
      query += ' AND trending = true'
    }

    // Count for pagination
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) AS total')
    const countResult = await db.one(countQuery, params)

    // Sorting
    const allowedSort = ['reach', 'engagement_rate', 'post_count', 'tag', 'created_at']
    const sortCol = allowedSort.includes(sort) ? sort : 'reach'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
    query += ` ORDER BY ${sortCol} ${sortOrder}`

    query += ` LIMIT $${idx} OFFSET $${idx + 1}`
    params.push(parseInt(limit, 10), parseInt(offset, 10))

    const hashtags = await db.any(query, params)

    // Get distinct industries and topics for filters
    const industries = await db.any('SELECT DISTINCT industry FROM hashtags WHERE industry IS NOT NULL ORDER BY industry')
    const topics = await db.any('SELECT DISTINCT topic FROM hashtags WHERE topic IS NOT NULL ORDER BY topic')

    res.json({
      hashtags,
      total: parseInt(countResult.total, 10),
      industries: industries.map(r => r.industry),
      topics: topics.map(r => r.topic),
    })
  } catch (err) {
    console.error('[hashtags] GET /api/hashtags error:', err.message)
    res.status(500).json({ error: 'Failed to fetch hashtags' })
  }
})

// GET /api/hashtags/trending — trending hashtags
router.get('/api/hashtags/trending', async (req, res) => {
  try {
    const db = req.app.get('db')
    await ensureSeeded(db)
    const hashtags = await db.any(
      'SELECT * FROM hashtags WHERE trending = true ORDER BY reach DESC LIMIT 20'
    )
    res.json({ hashtags })
  } catch (err) {
    console.error('[hashtags] GET /api/hashtags/trending error:', err.message)
    res.status(500).json({ error: 'Failed to fetch trending hashtags' })
  }
})

// GET /api/hashtags/suggest — suggest hashtags for a topic/keyword
router.get('/api/hashtags/suggest', async (req, res) => {
  try {
    const { topic: keyword } = req.query
    if (!keyword) return res.status(400).json({ error: 'topic query param is required' })

    const db = req.app.get('db')
    await ensureSeeded(db)

    const hashtags = await db.any(
      `SELECT * FROM hashtags
       WHERE tag ILIKE $1 OR topic ILIKE $1 OR industry ILIKE $1
       ORDER BY engagement_rate DESC, reach DESC
       LIMIT 15`,
      [`%${keyword}%`]
    )
    res.json({ hashtags, keyword })
  } catch (err) {
    console.error('[hashtags] GET /api/hashtags/suggest error:', err.message)
    res.status(500).json({ error: 'Failed to suggest hashtags' })
  }
})

// GET /api/hashtags/industries — list all industries
router.get('/api/hashtags/industries', async (req, res) => {
  try {
    const db = req.app.get('db')
    await ensureSeeded(db)
    const rows = await db.any(
      `SELECT industry, COUNT(*) AS count, AVG(engagement_rate) AS avg_engagement, SUM(reach) AS total_reach
       FROM hashtags WHERE industry IS NOT NULL
       GROUP BY industry ORDER BY total_reach DESC`
    )
    res.json({ industries: rows })
  } catch (err) {
    console.error('[hashtags] GET /api/hashtags/industries error:', err.message)
    res.status(500).json({ error: 'Failed to fetch industries' })
  }
})

// ═══════════════════════════════════════════════════════════════════
// AUTH-REQUIRED endpoints (hashtag sets + performance)
// ═══════════════════════════════════════════════════════════════════

router.use(authenticate)

// ─── Hashtag Sets ─────────────────────────────────────────────────

// GET /api/hashtag-sets — list user's saved sets
router.get('/api/hashtag-sets', async (req, res) => {
  try {
    const db = req.app.get('db')
    const sets = await db.any(
      `SELECT hs.*, 
              (SELECT COUNT(*) FROM hashtag_set_items hsi WHERE hsi.hashtag_set_id = hs.id) AS hashtag_count
       FROM hashtag_sets hs
       WHERE hs.user_id = $1
       ORDER BY hs.updated_at DESC`,
      [req.user.id]
    )
    res.json({ sets })
  } catch (err) {
    console.error('[hashtags] GET /api/hashtag-sets error:', err.message)
    res.status(500).json({ error: 'Failed to fetch hashtag sets' })
  }
})

// GET /api/hashtag-sets/:id — get set with hashtags
router.get('/api/hashtag-sets/:id', async (req, res) => {
  try {
    const db = req.app.get('db')
    const set = await db.oneOrNone(
      'SELECT * FROM hashtag_sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!set) return res.status(404).json({ error: 'Set not found' })

    const hashtags = await db.any(
      `SELECT h.*, hsi.added_at
       FROM hashtag_set_items hsi
       JOIN hashtags h ON h.id = hsi.hashtag_id
       WHERE hsi.hashtag_set_id = $1
       ORDER BY hsi.added_at DESC`,
      [set.id]
    )
    res.json({ set: { ...set, hashtags } })
  } catch (err) {
    console.error('[hashtags] GET /api/hashtag-sets/:id error:', err.message)
    res.status(500).json({ error: 'Failed to fetch hashtag set' })
  }
})

// POST /api/hashtag-sets — create a new set
router.post('/api/hashtag-sets', async (req, res) => {
  try {
    const { name, description, hashtag_ids = [] } = req.body
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' })

    const db = req.app.get('db')
    const set = await db.one(
      `INSERT INTO hashtag_sets (user_id, name, description)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, name.trim(), description || null]
    )

    // Add hashtags to set
    if (hashtag_ids.length > 0) {
      for (const hid of hashtag_ids) {
        await db.none(
          `INSERT INTO hashtag_set_items (hashtag_set_id, hashtag_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [set.id, hid]
        )
      }
    }

    res.status(201).json({ set })
  } catch (err) {
    console.error('[hashtags] POST /api/hashtag-sets error:', err.message)
    res.status(500).json({ error: 'Failed to create hashtag set' })
  }
})

// PATCH /api/hashtag-sets/:id — update set name/description
router.patch('/api/hashtag-sets/:id', async (req, res) => {
  try {
    const { name, description } = req.body
    const db = req.app.get('db')
    const existing = await db.oneOrNone(
      'SELECT * FROM hashtag_sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!existing) return res.status(404).json({ error: 'Set not found' })

    const updates = []
    const params = []
    let idx = 1

    if (name !== undefined) { updates.push(`name = $${idx}`); params.push(name.trim()); idx++ }
    if (description !== undefined) { updates.push(`description = $${idx}`); params.push(description); idx++ }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

    updates.push('updated_at = now()')
    params.push(req.params.id, req.user.id)

    const set = await db.one(
      `UPDATE hashtag_sets SET ${updates.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
      params
    )
    res.json({ set })
  } catch (err) {
    console.error('[hashtags] PATCH /api/hashtag-sets/:id error:', err.message)
    res.status(500).json({ error: 'Failed to update hashtag set' })
  }
})

// DELETE /api/hashtag-sets/:id
router.delete('/api/hashtag-sets/:id', async (req, res) => {
  try {
    const db = req.app.get('db')
    const result = await db.result(
      'DELETE FROM hashtag_sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (result.rowCount === 0) return res.status(404).json({ error: 'Set not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('[hashtags] DELETE /api/hashtag-sets/:id error:', err.message)
    res.status(500).json({ error: 'Failed to delete hashtag set' })
  }
})

// POST /api/hashtag-sets/:id/hashtags — add hashtag(s) to a set
router.post('/api/hashtag-sets/:id/hashtags', async (req, res) => {
  try {
    const { hashtag_ids } = req.body
    if (!Array.isArray(hashtag_ids) || hashtag_ids.length === 0) {
      return res.status(400).json({ error: 'hashtag_ids array is required' })
    }

    const db = req.app.get('db')
    const set = await db.oneOrNone(
      'SELECT * FROM hashtag_sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!set) return res.status(404).json({ error: 'Set not found' })

    for (const hid of hashtag_ids) {
      await db.none(
        `INSERT INTO hashtag_set_items (hashtag_set_id, hashtag_id)
         VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [set.id, hid]
      )
    }

    await db.none('UPDATE hashtag_sets SET updated_at = now() WHERE id = $1', [set.id])
    res.json({ success: true })
  } catch (err) {
    console.error('[hashtags] POST /api/hashtag-sets/:id/hashtags error:', err.message)
    res.status(500).json({ error: 'Failed to add hashtags to set' })
  }
})

// DELETE /api/hashtag-sets/:id/hashtags/:hashtagId — remove hashtag from set
router.delete('/api/hashtag-sets/:id/hashtags/:hashtagId', async (req, res) => {
  try {
    const db = req.app.get('db')
    const set = await db.oneOrNone(
      'SELECT * FROM hashtag_sets WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (!set) return res.status(404).json({ error: 'Set not found' })

    await db.none(
      'DELETE FROM hashtag_set_items WHERE hashtag_set_id = $1 AND hashtag_id = $2',
      [set.id, req.params.hashtagId]
    )
    await db.none('UPDATE hashtag_sets SET updated_at = now() WHERE id = $1', [set.id])
    res.json({ success: true })
  } catch (err) {
    console.error('[hashtags] DELETE /api/hashtag-sets/:id/hashtags/:hashtagId error:', err.message)
    res.status(500).json({ error: 'Failed to remove hashtag from set' })
  }
})

// ─── Hashtag Performance ──────────────────────────────────────────

// GET /api/hashtag-performance — user's hashtag performance data
router.get('/api/hashtag-performance', async (req, res) => {
  try {
    const db = req.app.get('db')
    const { hashtag_id, days = 30 } = req.query

    let query = `
      SELECT hp.*, h.tag, h.industry, h.topic
      FROM hashtag_performance hp
      JOIN hashtags h ON h.id = hp.hashtag_id
      WHERE hp.user_id = $1 AND hp.tracked_at >= now() - interval '${parseInt(days, 10)} days'
    `
    const params = [req.user.id]
    let idx = 2

    if (hashtag_id) {
      query += ` AND hp.hashtag_id = $${idx}`
      params.push(parseInt(hashtag_id, 10))
      idx++
    }

    query += ' ORDER BY hp.tracked_at DESC'

    const performance = await db.any(query, params)

    // Aggregate stats
    const stats = await db.any(
      `SELECT h.tag, h.id AS hashtag_id,
              COUNT(*) AS uses,
              SUM(hp.impressions) AS total_impressions,
              SUM(hp.engagements) AS total_engagements,
              ROUND(AVG(CASE WHEN hp.impressions > 0 THEN hp.engagements::numeric / hp.impressions * 100 ELSE 0 END), 2) AS avg_engagement_rate
       FROM hashtag_performance hp
       JOIN hashtags h ON h.id = hp.hashtag_id
       WHERE hp.user_id = $1 AND hp.tracked_at >= now() - interval '${parseInt(days, 10)} days'
       GROUP BY h.id, h.tag
       ORDER BY total_impressions DESC`,
      [req.user.id]
    )

    res.json({ performance, stats })
  } catch (err) {
    console.error('[hashtags] GET /api/hashtag-performance error:', err.message)
    res.status(500).json({ error: 'Failed to fetch hashtag performance' })
  }
})

// POST /api/hashtag-performance — track hashtag usage
router.post('/api/hashtag-performance', async (req, res) => {
  try {
    const { hashtag_id, post_id, impressions = 0, engagements = 0 } = req.body
    if (!hashtag_id) return res.status(400).json({ error: 'hashtag_id is required' })

    const db = req.app.get('db')
    const record = await db.one(
      `INSERT INTO hashtag_performance (user_id, hashtag_id, post_id, impressions, engagements)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, hashtag_id, post_id || null, impressions, engagements]
    )
    res.status(201).json({ record })
  } catch (err) {
    console.error('[hashtags] POST /api/hashtag-performance error:', err.message)
    res.status(500).json({ error: 'Failed to track hashtag performance' })
  }
})

module.exports = router
