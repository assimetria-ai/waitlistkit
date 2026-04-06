/**
 * @custom GraphQL Resolvers for Taplio Alt
 * Uses the same DB connection pool as REST endpoints.
 */
const { GraphQLError } = require('graphql')

/**
 * Helper: Ensure the request has an authenticated user.
 * Throws GraphQL AuthenticationError if not.
 */
function requireAuth(context) {
  if (!context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
  return context.user
}

const resolvers = {
  // ── Custom scalar ────────────────────────────────────────────────────────
  DateTime: {
    __serialize(value) {
      if (value instanceof Date) return value.toISOString()
      return value ? new Date(value).toISOString() : null
    },
    __parseValue(value) {
      return new Date(value)
    },
    __parseLiteral(ast) {
      if (ast.kind === 'StringValue') return new Date(ast.value)
      return null
    },
  },

  // ── Queries ──────────────────────────────────────────────────────────────
  Query: {
    me: async (_parent, _args, context) => {
      const user = requireAuth(context)
      return context.db.oneOrNone('SELECT * FROM users WHERE id = $1', [user.id])
    },

    posts: async (_parent, { filter = {}, pagination = {} }, context) => {
      const user = requireAuth(context)
      const { status, start, end } = filter
      const { limit = 50, offset = 0 } = pagination

      let query = 'SELECT * FROM posts WHERE user_id = $1'
      const params = [user.id]
      let idx = 2

      if (status) {
        query += ` AND status = $${idx}`
        params.push(status)
        idx++
      }
      if (start) {
        query += ` AND COALESCE(scheduled_for, created_at) >= $${idx}`
        params.push(start)
        idx++
      }
      if (end) {
        query += ` AND COALESCE(scheduled_for, created_at) <= $${idx}`
        params.push(end)
        idx++
      }

      // Get total count
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)::int AS total')
      const { total } = await context.db.one(countQuery, params)

      query += ` ORDER BY COALESCE(scheduled_for, created_at) DESC LIMIT $${idx} OFFSET $${idx + 1}`
      params.push(limit, offset)

      const posts = await context.db.any(query, params)
      return {
        posts,
        total,
        hasMore: offset + posts.length < total,
      }
    },

    post: async (_parent, { id }, context) => {
      const user = requireAuth(context)
      return context.db.oneOrNone(
        'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
        [id, user.id]
      )
    },

    queueStats: async (_parent, _args, context) => {
      const user = requireAuth(context)
      return context.db.one(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled_count,
           COUNT(*) FILTER (WHERE status = 'publishing')::int AS publishing_count,
           COUNT(*) FILTER (WHERE status = 'published')::int AS published_count,
           COUNT(*) FILTER (WHERE status = 'failed' AND retry_count < COALESCE(max_retries, 3))::int AS retryable_count,
           COUNT(*) FILTER (WHERE status = 'failed' AND retry_count >= COALESCE(max_retries, 3))::int AS permanently_failed_count,
           MIN(scheduled_for) FILTER (WHERE status = 'scheduled') AS next_scheduled
         FROM posts
         WHERE user_id = $1`,
        [user.id]
      )
    },

    postAnalytics: async (_parent, _args, context) => {
      const user = requireAuth(context)
      const stats = await context.db.one(
        `SELECT
           COUNT(*)::int AS total_posts,
           COUNT(*) FILTER (WHERE status = 'published')::int AS published_count,
           COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled_count,
           COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_count,
           COUNT(*) FILTER (WHERE status = 'failed')::int AS failed_count,
           ROUND(
             COUNT(*) FILTER (WHERE status = 'published' AND published_at >= now() - interval '28 days')::numeric / 4.0,
             1
           )::float AS avg_posts_per_week
         FROM posts
         WHERE user_id = $1`,
        [user.id]
      )

      // Calculate publishing streak (consecutive days with at least one published post)
      const streakRows = await context.db.any(
        `SELECT DISTINCT published_at::date AS pub_date
         FROM posts
         WHERE user_id = $1 AND status = 'published' AND published_at IS NOT NULL
         ORDER BY pub_date DESC`,
        [user.id]
      )

      let streak = 0
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      for (let i = 0; i < streakRows.length; i++) {
        const expectedDate = new Date(today)
        expectedDate.setDate(expectedDate.getDate() - i)
        const pubDate = new Date(streakRows[i].pub_date)
        pubDate.setHours(0, 0, 0, 0)

        if (pubDate.getTime() === expectedDate.getTime()) {
          streak++
        } else {
          break
        }
      }

      return { ...stats, publishing_streak: streak }
    },

    dailyPostCounts: async (_parent, { days = 30 }, context) => {
      const user = requireAuth(context)
      return context.db.any(
        `SELECT
           d::date::text AS date,
           COUNT(p.id)::int AS count
         FROM generate_series(
           (now() - ($2 || ' days')::interval)::date,
           now()::date,
           '1 day'
         ) AS d
         LEFT JOIN posts p ON p.published_at::date = d::date
           AND p.user_id = $1
           AND p.status = 'published'
         GROUP BY d::date
         ORDER BY d::date ASC`,
        [user.id, days]
      )
    },

    statusBreakdown: async (_parent, _args, context) => {
      const user = requireAuth(context)
      return context.db.any(
        `SELECT status, COUNT(*)::int AS count
         FROM posts
         WHERE user_id = $1
         GROUP BY status
         ORDER BY count DESC`,
        [user.id]
      )
    },
  },

  // ── Mutations ────────────────────────────────────────────────────────────
  Mutation: {
    createPost: async (_parent, { input }, context) => {
      const user = requireAuth(context)
      const { content, status = 'draft', scheduled_for, schedule_id } = input

      if (!content || !content.trim()) {
        throw new GraphQLError('Content is required', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      const post = await context.db.one(
        `INSERT INTO posts (user_id, content, status, scheduled_for, schedule_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [user.id, content.trim(), status, scheduled_for || null, schedule_id || null]
      )

      // Publish subscription event
      if (context.pubsub) {
        context.pubsub.publish('POST_STATUS_CHANGED', { postStatusChanged: post })
      }

      return post
    },

    updatePost: async (_parent, { id, input }, context) => {
      const user = requireAuth(context)

      const existing = await context.db.oneOrNone(
        'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
        [id, user.id]
      )
      if (!existing) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      const { content, status, scheduled_for, schedule_id } = input
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
        throw new GraphQLError('No fields to update', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      updates.push('updated_at = now()')
      params.push(id, user.id)

      const post = await context.db.one(
        `UPDATE posts SET ${updates.join(', ')} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
        params
      )

      if (context.pubsub) {
        context.pubsub.publish('POST_STATUS_CHANGED', { postStatusChanged: post })
      }

      return post
    },

    deletePost: async (_parent, { id }, context) => {
      const user = requireAuth(context)
      const result = await context.db.result(
        'DELETE FROM posts WHERE id = $1 AND user_id = $2',
        [id, user.id]
      )
      if (result.rowCount === 0) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }
      return true
    },

    publishPost: async (_parent, { id }, context) => {
      const user = requireAuth(context)
      const post = await context.db.oneOrNone(
        'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
        [id, user.id]
      )
      if (!post) {
        throw new GraphQLError('Post not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }
      if (post.status === 'published') {
        throw new GraphQLError('Post already published', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      const updated = await context.db.one(
        `UPDATE posts SET status = 'scheduled', scheduled_for = now(), updated_at = now()
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, user.id]
      )

      if (context.pubsub) {
        context.pubsub.publish('POST_STATUS_CHANGED', { postStatusChanged: updated })
      }

      return updated
    },

    retryPost: async (_parent, { id }, context) => {
      const user = requireAuth(context)
      const post = await context.db.oneOrNone(
        'SELECT * FROM posts WHERE id = $1 AND user_id = $2',
        [id, user.id]
      )
      if (!post) {
        throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } })
      }
      if (post.status !== 'failed') {
        throw new GraphQLError('Only failed posts can be retried', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      }

      const updated = await context.db.one(
        `UPDATE posts SET status = 'scheduled', retry_count = 0, last_error = NULL,
         scheduled_for = now(), updated_at = now()
         WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, user.id]
      )

      if (context.pubsub) {
        context.pubsub.publish('POST_STATUS_CHANGED', { postStatusChanged: updated })
      }

      return updated
    },

    reschedulePost: async (_parent, { id, scheduled_for }, context) => {
      const user = requireAuth(context)
      const post = await context.db.oneOrNone(
        `UPDATE posts SET scheduled_for = $1, status = 'scheduled', updated_at = now()
         WHERE id = $2 AND user_id = $3 RETURNING *`,
        [scheduled_for, id, user.id]
      )
      if (!post) {
        throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } })
      }

      if (context.pubsub) {
        context.pubsub.publish('POST_STATUS_CHANGED', { postStatusChanged: post })
      }

      return post
    },
  },

  // ── Subscriptions ────────────────────────────────────────────────────────
  Subscription: {
    postStatusChanged: {
      subscribe: (_parent, { userId }, context) => {
        if (!context.pubsub) {
          throw new GraphQLError('Subscriptions not available')
        }
        return context.pubsub.asyncIterator(['POST_STATUS_CHANGED'])
      },
      resolve: (payload, { userId }) => {
        // Filter by userId if provided
        if (userId && payload.postStatusChanged.user_id !== parseInt(userId)) {
          return undefined
        }
        return payload.postStatusChanged
      },
    },

    queueStatsUpdated: {
      subscribe: (_parent, _args, context) => {
        if (!context.pubsub) {
          throw new GraphQLError('Subscriptions not available')
        }
        return context.pubsub.asyncIterator(['QUEUE_STATS_UPDATED'])
      },
    },
  },

  // ── Field Resolvers ──────────────────────────────────────────────────────
  Post: {
    user: async (post, _args, context) => {
      if (!post.user_id) return null
      return context.db.oneOrNone(
        'SELECT id, email, name, role, avatar_url, bio, is_active, last_login_at, created_at, updated_at FROM users WHERE id = $1',
        [post.user_id]
      )
    },
  },
}

module.exports = resolvers
