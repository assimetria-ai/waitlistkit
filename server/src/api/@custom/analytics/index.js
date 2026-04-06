/**
 * @custom Analytics API — Dashboard stats, engagement metrics, trends, and performance
 * Queries post_metrics and analytics_daily tables.
 */
const express = require('express')
const router = express.Router()
const { authenticate } = require('../../../lib/@system/Helpers/auth')

router.use(authenticate)

/**
 * GET /api/analytics/overview
 * Dashboard stats: total posts, total impressions, total engagements,
 * average engagement rate, follower growth, top performing post.
 */
router.get('/api/analytics/overview', async (req, res) => {
  try {
    const db = req.app.get('db')
    const userId = req.user.id

    // Aggregate post metrics for user's posts
    const postStats = await db.oneOrNone(`
      SELECT
        COUNT(DISTINCT p.id) AS total_posts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'published') AS published_posts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'scheduled') AS scheduled_posts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'draft') AS draft_posts,
        COALESCE(SUM(pm.impressions), 0) AS total_impressions,
        COALESCE(SUM(pm.likes), 0) AS total_likes,
        COALESCE(SUM(pm.comments), 0) AS total_comments,
        COALESCE(SUM(pm.shares), 0) AS total_shares,
        COALESCE(SUM(pm.clicks), 0) AS total_clicks,
        COALESCE(AVG(pm.engagement_rate), 0) AS avg_engagement_rate
      FROM posts p
      LEFT JOIN post_metrics pm ON pm.post_id = p.id
      WHERE p.user_id = $1
    `, [userId])

    // Follower growth (last 30 days from analytics_daily)
    const followerGrowth = await db.oneOrNone(`
      SELECT
        COALESCE(SUM(followers_gained), 0) AS followers_gained,
        COALESCE(SUM(followers_lost), 0) AS followers_lost,
        COALESCE(SUM(followers_gained) - SUM(followers_lost), 0) AS net_followers
      FROM analytics_daily
      WHERE user_id = $1
        AND date >= CURRENT_DATE - INTERVAL '30 days'
    `, [userId])

    // Top performing post (by engagement rate)
    const topPost = await db.oneOrNone(`
      SELECT p.id, p.content, p.published_at,
             pm.impressions, pm.likes, pm.comments, pm.shares, pm.engagement_rate
      FROM posts p
      JOIN post_metrics pm ON pm.post_id = p.id
      WHERE p.user_id = $1 AND p.status = 'published'
      ORDER BY pm.engagement_rate DESC
      LIMIT 1
    `, [userId])

    res.json({
      overview: {
        posts: {
          total: parseInt(postStats?.total_posts || 0),
          published: parseInt(postStats?.published_posts || 0),
          scheduled: parseInt(postStats?.scheduled_posts || 0),
          drafts: parseInt(postStats?.draft_posts || 0)
        },
        engagement: {
          total_impressions: parseInt(postStats?.total_impressions || 0),
          total_likes: parseInt(postStats?.total_likes || 0),
          total_comments: parseInt(postStats?.total_comments || 0),
          total_shares: parseInt(postStats?.total_shares || 0),
          total_clicks: parseInt(postStats?.total_clicks || 0),
          avg_engagement_rate: parseFloat(postStats?.avg_engagement_rate || 0)
        },
        followers: {
          gained_30d: parseInt(followerGrowth?.followers_gained || 0),
          lost_30d: parseInt(followerGrowth?.followers_lost || 0),
          net_30d: parseInt(followerGrowth?.net_followers || 0)
        },
        top_post: topPost || null
      }
    })
  } catch (err) {
    console.error('[analytics] GET /api/analytics/overview error:', err.message)
    res.status(500).json({ error: 'Failed to fetch analytics overview' })
  }
})

/**
 * GET /api/analytics/engagement
 * Engagement metrics with date range filtering.
 * Query params: start (ISO date), end (ISO date)
 */
router.get('/api/analytics/engagement', async (req, res) => {
  try {
    const db = req.app.get('db')
    const userId = req.user.id
    const { start, end } = req.query

    let query = `
      SELECT p.id AS post_id, p.content, p.published_at,
             pm.impressions, pm.likes, pm.comments, pm.shares,
             pm.clicks, pm.saves, pm.reposts, pm.video_views,
             pm.engagement_rate, pm.fetched_at
      FROM posts p
      JOIN post_metrics pm ON pm.post_id = p.id
      WHERE p.user_id = $1 AND p.status = 'published'
    `
    const params = [userId]
    let paramIdx = 2

    if (start) {
      query += ` AND p.published_at >= $${paramIdx}`
      params.push(start)
      paramIdx++
    }
    if (end) {
      query += ` AND p.published_at <= $${paramIdx}`
      params.push(end)
      paramIdx++
    }

    query += ' ORDER BY p.published_at DESC'

    const metrics = await db.any(query, params)

    // Compute summary
    const summary = {
      total_posts: metrics.length,
      total_impressions: metrics.reduce((s, m) => s + (parseInt(m.impressions) || 0), 0),
      total_likes: metrics.reduce((s, m) => s + (parseInt(m.likes) || 0), 0),
      total_comments: metrics.reduce((s, m) => s + (parseInt(m.comments) || 0), 0),
      total_shares: metrics.reduce((s, m) => s + (parseInt(m.shares) || 0), 0),
      total_clicks: metrics.reduce((s, m) => s + (parseInt(m.clicks) || 0), 0),
      avg_engagement_rate: metrics.length > 0
        ? metrics.reduce((s, m) => s + parseFloat(m.engagement_rate || 0), 0) / metrics.length
        : 0
    }

    res.json({ metrics, summary })
  } catch (err) {
    console.error('[analytics] GET /api/analytics/engagement error:', err.message)
    res.status(500).json({ error: 'Failed to fetch engagement metrics' })
  }
})

/**
 * GET /api/analytics/engagement/trends
 * Engagement trends over time (daily aggregation).
 * Query params: start (ISO date), end (ISO date), interval ('day'|'week'|'month', default 'day')
 */
router.get('/api/analytics/engagement/trends', async (req, res) => {
  try {
    const db = req.app.get('db')
    const userId = req.user.id
    const { start, end, interval = 'day' } = req.query

    // Validate interval
    const validIntervals = ['day', 'week', 'month']
    const truncInterval = validIntervals.includes(interval) ? interval : 'day'

    let query = `
      SELECT
        date_trunc($1, p.published_at)::date AS period,
        COUNT(p.id) AS posts_count,
        COALESCE(SUM(pm.impressions), 0) AS impressions,
        COALESCE(SUM(pm.likes), 0) AS likes,
        COALESCE(SUM(pm.comments), 0) AS comments,
        COALESCE(SUM(pm.shares), 0) AS shares,
        COALESCE(SUM(pm.clicks), 0) AS clicks,
        COALESCE(AVG(pm.engagement_rate), 0) AS avg_engagement_rate
      FROM posts p
      JOIN post_metrics pm ON pm.post_id = p.id
      WHERE p.user_id = $2 AND p.status = 'published'
    `
    const params = [truncInterval, userId]
    let paramIdx = 3

    if (start) {
      query += ` AND p.published_at >= $${paramIdx}`
      params.push(start)
      paramIdx++
    }
    if (end) {
      query += ` AND p.published_at <= $${paramIdx}`
      params.push(end)
      paramIdx++
    }

    query += ` GROUP BY period ORDER BY period ASC`

    const trends = await db.any(query, params)

    // Also include analytics_daily data for follower/profile trends
    let dailyQuery = `
      SELECT
        date_trunc($1, date)::date AS period,
        COALESCE(SUM(impressions), 0) AS account_impressions,
        COALESCE(SUM(engagements), 0) AS account_engagements,
        COALESCE(SUM(followers_gained), 0) AS followers_gained,
        COALESCE(SUM(followers_lost), 0) AS followers_lost,
        COALESCE(SUM(profile_views), 0) AS profile_views,
        COALESCE(SUM(posts_published), 0) AS posts_published
      FROM analytics_daily
      WHERE user_id = $2
    `
    const dailyParams = [truncInterval, userId]
    let dailyIdx = 3

    if (start) {
      dailyQuery += ` AND date >= $${dailyIdx}`
      dailyParams.push(start)
      dailyIdx++
    }
    if (end) {
      dailyQuery += ` AND date <= $${dailyIdx}`
      dailyParams.push(end)
      dailyIdx++
    }

    dailyQuery += ` GROUP BY period ORDER BY period ASC`

    const accountTrends = await db.any(dailyQuery, dailyParams)

    res.json({ trends, account_trends: accountTrends, interval: truncInterval })
  } catch (err) {
    console.error('[analytics] GET /api/analytics/engagement/trends error:', err.message)
    res.status(500).json({ error: 'Failed to fetch engagement trends' })
  }
})

/**
 * GET /api/analytics/performance
 * Post performance ranking: best/worst performing posts by engagement metrics.
 * Query params: sort_by ('engagement_rate'|'impressions'|'likes'|'comments'), 
 *               order ('asc'|'desc', default 'desc'), limit (default 10)
 */
router.get('/api/analytics/performance', async (req, res) => {
  try {
    const db = req.app.get('db')
    const userId = req.user.id
    const { sort_by = 'engagement_rate', order = 'desc', limit = 10 } = req.query

    // Whitelist sort columns to prevent SQL injection
    const validSortColumns = ['engagement_rate', 'impressions', 'likes', 'comments', 'shares', 'clicks']
    const sortCol = validSortColumns.includes(sort_by) ? sort_by : 'engagement_rate'
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC'
    const resultLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100)

    const posts = await db.any(`
      SELECT p.id, p.content, p.published_at, p.status,
             pm.impressions, pm.likes, pm.comments, pm.shares,
             pm.clicks, pm.saves, pm.reposts, pm.video_views,
             pm.engagement_rate, pm.fetched_at
      FROM posts p
      JOIN post_metrics pm ON pm.post_id = p.id
      WHERE p.user_id = $1 AND p.status = 'published'
      ORDER BY pm.${sortCol} ${sortOrder}
      LIMIT $2
    `, [userId, resultLimit])

    // Optimal posting time analysis (hour of day with best avg engagement)
    const optimalTimes = await db.any(`
      SELECT
        EXTRACT(HOUR FROM p.published_at) AS hour_of_day,
        EXTRACT(DOW FROM p.published_at) AS day_of_week,
        COUNT(*) AS post_count,
        COALESCE(AVG(pm.engagement_rate), 0) AS avg_engagement_rate,
        COALESCE(AVG(pm.impressions), 0) AS avg_impressions
      FROM posts p
      JOIN post_metrics pm ON pm.post_id = p.id
      WHERE p.user_id = $1 AND p.status = 'published' AND p.published_at IS NOT NULL
      GROUP BY hour_of_day, day_of_week
      HAVING COUNT(*) >= 1
      ORDER BY avg_engagement_rate DESC
      LIMIT 10
    `, [userId])

    res.json({
      posts,
      optimal_times: optimalTimes,
      sort: { column: sortCol, order: sortOrder },
      total: posts.length
    })
  } catch (err) {
    console.error('[analytics] GET /api/analytics/performance error:', err.message)
    res.status(500).json({ error: 'Failed to fetch performance data' })
  }
})

module.exports = router
